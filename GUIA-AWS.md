# 🍺 Deploy en AWS — Cómo lo hicimos (paso a paso real)

Registro del despliegue del proyecto de cervezas en AWS, **tal como lo hicimos**, con los comandos reales y los problemas que fuimos resolviendo en el camino.

## Arquitectura final

```
Cliente → Amplify (HTTPS) → API Gateway (HTTPS) → ALB (subnet pública) → EC2 (subnet privada) → MongoDB Atlas
```

> **Nota clave:** el diagrama original tenía **CloudFront** para el HTTPS, pero la cuenta **AWS Academy Learner Lab bloquea CloudFront** (`AccessDenied`). Lo reemplazamos por **API Gateway**, que también da HTTPS gratis sin dominio y está permitido en el lab.

## Entorno / decisiones

- **Cuenta:** AWS Academy **Learner Lab** (rol `voclabs`), región **us-east-1**.
- **Todo por línea de comandos** desde **AWS CloudShell** (terminal del navegador): ya trae el AWS CLI y usa las credenciales de la sesión, sin instalar ni configurar nada.
- **Base de datos:** mantuvimos **MongoDB Atlas** (no migramos a DynamoDB → cero reescritura de código).
- **IAM:** en Learner Lab no se pueden crear roles, así que la EC2 usa el perfil pre-existente **`LabInstanceProfile`** (para entrar por SSM).

> 💸 **Costo:** el **NAT Gateway** (~$1/día) y el **ALB** (~$0.5/día) cobran por hora y **no se apagan, se borran**. Ver el **Teardown** al final para no gastar el saldo.

---

## Fase 0 — Abrir CloudShell

1. Consola AWS → arriba a la derecha, ícono de terminal `>_`.
2. Verificar identidad y región:
```bash
aws sts get-caller-identity && aws configure get region
```

---

## Fase 1 — Red (VPC + subnets + NAT)

Pegado en CloudShell. Crea VPC, Internet Gateway, 2 subnets públicas + 2 privadas, NAT Gateway y route tables, y **guarda todos los IDs** en `~/cervezas-ids.sh`.

```bash
export AWS_DEFAULT_REGION=us-east-1
REGION=us-east-1
TAG=cervezas
set -e

# VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$TAG-vpc},{Key=Project,Value=$TAG}]" \
  --query 'Vpc.VpcId' --output text)
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

# Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$TAG-igw},{Key=Project,Value=$TAG}]" \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Subnets (2 públicas + 2 privadas)
PUB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${REGION}a \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$TAG-public-1}]" --query 'Subnet.SubnetId' --output text)
PUB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${REGION}b \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$TAG-public-2}]" --query 'Subnet.SubnetId' --output text)
PRIV1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone ${REGION}a \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$TAG-private-1}]" --query 'Subnet.SubnetId' --output text)
PRIV2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 --availability-zone ${REGION}b \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$TAG-private-2}]" --query 'Subnet.SubnetId' --output text)
aws ec2 modify-subnet-attribute --subnet-id $PUB1 --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUB2 --map-public-ip-on-launch

# NAT Gateway (Elastic IP + NAT en la pública 1)
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
NAT_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB1 --allocation-id $EIP_ALLOC \
  --query 'NatGateway.NatGatewayId' --output text)
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_ID

# Route tables: pública → IGW, privada → NAT
RT_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RT_PUB --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RT_PUB --subnet-id $PUB1
aws ec2 associate-route-table --route-table-id $RT_PUB --subnet-id $PUB2

RT_PRIV=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RT_PRIV --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_ID
aws ec2 associate-route-table --route-table-id $RT_PRIV --subnet-id $PRIV1
aws ec2 associate-route-table --route-table-id $RT_PRIV --subnet-id $PRIV2

# Guardar IDs
cat > ~/cervezas-ids.sh <<EOF
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""
export REGION=us-east-1
export TAG=cervezas
export VPC_ID=$VPC_ID
export IGW_ID=$IGW_ID
export PUB1=$PUB1
export PUB2=$PUB2
export PRIV1=$PRIV1
export PRIV2=$PRIV2
export EIP_ALLOC=$EIP_ALLOC
export NAT_ID=$NAT_ID
export RT_PUB=$RT_PUB
export RT_PRIV=$RT_PRIV
EOF
echo "✅ FASE 1 OK"; cat ~/cervezas-ids.sh
```

---

## Fase 2 — Security Groups

```bash
source ~/cervezas-ids.sh

# SG del ALB: HTTP 80 desde internet
ALB_SG=$(aws ec2 create-security-group --group-name $TAG-alb-sg \
  --description "SG del ALB cervezas" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0

# SG de la EC2: puerto 3000 SOLO desde el SG del ALB
EC2_SG=$(aws ec2 create-security-group --group-name $TAG-ec2-sg \
  --description "SG de la EC2 backend cervezas" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 3000 --source-group $ALB_SG

echo "export ALB_SG=$ALB_SG" >> ~/cervezas-ids.sh
echo "export EC2_SG=$EC2_SG" >> ~/cervezas-ids.sh
echo "✅ FASE 2 OK -> ALB_SG=$ALB_SG  EC2_SG=$EC2_SG"
```

---

## Fase 3 — EC2 en subnet privada + el back

### 3A — Lanzar la instancia (CloudShell)

```bash
source ~/cervezas-ids.sh

# AMI oficial Ubuntu 24.04
AMI_ID=$(aws ssm get-parameters \
  --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --query 'Parameters[0].Value' --output text)

# Lanzar en subnet privada, con LabInstanceProfile (para SSM) y sin IP pública
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID --instance-type t3.micro \
  --subnet-id $PRIV1 --security-group-ids $EC2_SG \
  --iam-instance-profile Name=LabInstanceProfile \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$TAG-backend}]" \
  --query 'Instances[0].InstanceId' --output text)
echo "export AMI_ID=$AMI_ID" >> ~/cervezas-ids.sh
echo "export INSTANCE_ID=$INSTANCE_ID" >> ~/cervezas-ids.sh

aws ec2 wait instance-running --instance-ids $INSTANCE_ID
# Esperar a que aparezca en SSM
for i in $(seq 1 24); do
  STATUS=$(aws ssm describe-instance-information --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null)
  [ "$STATUS" = "Online" ] && { echo "✅ SSM ONLINE ($INSTANCE_ID)"; break; }
  echo "  ...esperando SSM ($STATUS)"; sleep 15
done
```

### 3B — Habilitar la IP del NAT en MongoDB Atlas

```bash
aws ec2 describe-addresses --allocation-ids $EIP_ALLOC --query 'Addresses[0].PublicIp' --output text
```
→ Agregar esa IP en **MongoDB Atlas → Network Access** (o `0.0.0.0/0`). **Sin esto el back no conecta.**

### 3C — Entrar a la EC2 y montar el back

```bash
aws ssm start-session --target $INSTANCE_ID   # entra como ssm-user
sudo su - ubuntu                              # pasar al usuario ubuntu (clave: ver problema #3)
```
Ya como `ubuntu`, **de a una línea** (ver problema #2):
```bash
sudo apt-get update -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs git && sudo npm install -g pm2
cd ~ && git clone https://github.com/nicolasgonzalez98/tpGrupoFrontBack.git
cd ~/tpGrupoFrontBack/backEnd && npm install
```
Crear el `.env`:
```bash
nano .env
```
```env
PORT=3000
DB_USER=usuario_atlas
DB_PASSWORD=password_atlas
JWT_SECRET=clave_larga_aleatoria
```
Levantar con PM2 y probar localmente:
```bash
pm2 start index.js --name backend
pm2 save
pm2 startup            # ejecutar el comando "sudo env PATH=..." que imprime
curl http://localhost:3000/stock   # => {"message":"Token no provisto"} = OK
```

---

## Fase 4 — Application Load Balancer (CloudShell)

```bash
source ~/cervezas-ids.sh

# Target Group → EC2 puerto 3000 (health check tolerante: 401 cuenta como sano)
TG_ARN=$(aws elbv2 create-target-group --name $TAG-tg --protocol HTTP --port 3000 \
  --vpc-id $VPC_ID --target-type instance --health-check-path / --matcher HttpCode=200-499 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 register-targets --target-group-arn $TG_ARN --targets Id=$INSTANCE_ID

# ALB en las 2 subnets públicas
ALB_ARN=$(aws elbv2 create-load-balancer --name $TAG-alb --type application \
  --scheme internet-facing --ip-address-type ipv4 \
  --subnets $PUB1 $PUB2 --security-groups $ALB_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
aws elbv2 wait load-balancer-available --load-balancer-arns $ALB_ARN

# Listener HTTP 80 → Target Group
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text)
echo "export TG_ARN=$TG_ARN" >> ~/cervezas-ids.sh
echo "export ALB_ARN=$ALB_ARN" >> ~/cervezas-ids.sh
echo "export ALB_DNS=$ALB_DNS" >> ~/cervezas-ids.sh

sleep 40
curl -s http://$ALB_DNS/stock; echo ""   # => {"message":"Token no provisto"} = ALB→EC2 OK
```

---

## Fase 5 — HTTPS con API Gateway

> ❌ **Primero intentamos CloudFront y falló:** `AccessDenied ... cloudfront:CreateDistribution`. El Learner Lab no lo permite. Usamos **API Gateway** en su lugar.

```bash
source ~/cervezas-ids.sh

# HTTP API con ruta catch-all que reenvía TODO al ALB (HTTP_PROXY)
API_OUT=$(aws apigatewayv2 create-api --name cervezas-api --protocol-type HTTP \
  --target http://$ALB_DNS --query '[ApiId,ApiEndpoint]' --output text)
API_ID=$(echo $API_OUT | awk '{print $1}')
API_ENDPOINT=$(echo $API_OUT | awk '{print $2}')
echo "export API_ID=$API_ID" >> ~/cervezas-ids.sh
echo "export API_ENDPOINT=$API_ENDPOINT" >> ~/cervezas-ids.sh

curl -s $API_ENDPOINT/stock; echo ""   # => {"message":"Token no provisto"} por HTTPS = OK
```

Resultado: `https://xxxxxx.execute-api.us-east-1.amazonaws.com` → **este es el endpoint HTTPS que usa el front.**

---

## Fase 6 — Conectar el front

### 6A — Front apuntando al API Gateway
En `frontReact/src/services/config.ts`:
```ts
export const API_URL = 'https://xxxxxx.execute-api.us-east-1.amazonaws.com';
```

### 6B — CORS en el back
En `backEnd/index.js` (editado directo en la EC2 con `nano` + `pm2 restart backend`).
Usamos un **patrón** que acepta cualquier dominio de Amplify (ver problema #8):
```js
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^https:\/\/[a-z0-9.-]+\.amplifyapp\.com$/] }));
```

### 6C — Compilar y subir a Amplify
```bash
cd frontReact
npm run build          # genera dist/
```
Subir la carpeta **`dist`** a Amplify por **drag-and-drop**. Probar el login → ✅

---

## 🐞 Problemas que tuvimos y cómo los resolvimos

| # | Síntoma | Causa | Solución |
|---|---------|-------|----------|
| 1 | "Apareció un editor de texto" tras un comando | El AWS CLI v2 abre la salida en el visor `less` | Salir con **`q`**; desactivarlo con `export AWS_PAGER=""` |
| 2 | Al pegar un bloque grande en SSM, solo corría la 1ª línea | La terminal SSM se traga líneas al pegar varias juntas | Pegar **de a una línea** |
| 3 | `Permission denied` / `can't cd` a `/home/ubuntu` | La sesión SSM entra como `ssm-user`, sin acceso a esa carpeta | `sudo su - ubuntu` y trabajar como `ubuntu` |
| 4 | El `git clone` no dejaba carpeta | Repo privado pedía credenciales | Clonar con token: `https://TOKEN@github.com/...` (o repo público) |
| 5 | `git push` → "Password authentication is not supported" | GitHub ya no acepta contraseña | Usar **Personal Access Token** (o editar el back directo en la EC2) |
| 6 | `npm run build` → "Cannot find native binding" (`@tailwindcss/oxide`) | Node 18 local; Tailwind v4 exige Node ≥ 20, npm saltea el binding nativo | `npm install @tailwindcss/oxide-win32-x64-msvc@4.3.1 --no-save` (ideal: actualizar a Node 20+) |
| 7 | `cloudfront:CreateDistribution` → `AccessDenied` | Learner Lab bloquea CloudFront | Usar **API Gateway** para el HTTPS |
| 8 | Login: `No 'Access-Control-Allow-Origin' header` (CORS) | El dominio de Amplify cambió de ID al redeployar; el CORS apuntaba al viejo | CORS con patrón `*.amplifyapp.com` (acepta cualquier dominio de Amplify) |

---

## 🔁 Scripts: apagar y encender (lo más cómodo)

En la carpeta [`scripts/`](scripts/) dejamos dos scripts que automatizan el ciclo de ahorro:

| Script | Qué hace |
|--------|----------|
| [`scripts/aws-apagar.sh`](scripts/aws-apagar.sh) | Borra **API Gateway + ALB + NAT Gateway**, libera la Elastic IP y **detiene** la EC2. Deja el gasto por hora en cero. |
| [`scripts/aws-encender.sh`](scripts/aws-encender.sh) | **Recrea** NAT + ALB + API Gateway y **enciende** la EC2. Al final imprime la **URL nueva** del API Gateway y la **IP nueva** del NAT. |

Ambos **re-descubren** los recursos por nombre/tag, así que funcionan aunque se haya perdido `~/cervezas-ids.sh`.

### Cómo usarlos en CloudShell
1. Subí los scripts a CloudShell: botón **Actions → Upload file** (o pegá su contenido en un archivo con `nano`).
2. Ejecutá:
```bash
bash aws-apagar.sh      # al terminar de trabajar
bash aws-encender.sh    # al volver
```

### ⚠️ Al ENCENDER, siempre hay 3 pendientes
Como `aws-apagar.sh` borra el ALB y el API Gateway, al recrearlos **cambian las URLs**. Por eso, después de `aws-encender.sh`:
1. **Atlas → Network Access:** agregar la **IP del NAT** que imprime (o usar `0.0.0.0/0`).
2. **`frontReact/src/services/config.ts`:** poner la **URL nueva** del API Gateway → `npm run build` → drag-drop del `dist` a Amplify.
3. **Probar:** `curl -s <URL_API>/stock`.

### ✅ Verificar que quedó todo apagado
```bash
export AWS_DEFAULT_REGION=us-east-1; export AWS_PAGER=""
aws ec2 describe-nat-gateways --filter "Name=state,Values=available,pending" --query 'NatGateways[].NatGatewayId' --output text   # vacío = OK
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName' --output text                                       # vacío = OK
aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text                                                          # vacío = OK
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name]' --output text                            # stopped/terminated
```

---

## 🧨 Teardown manual — borrar para no gastar

Cuando no se trabaja, borrar lo que cobra por hora. Pegado en CloudShell:

```bash
source ~/cervezas-ids.sh

# 1) API Gateway
aws apigatewayv2 delete-api --api-id $API_ID

# 2) ALB + Target Group
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
sleep 30
aws elbv2 delete-target-group --target-group-arn $TG_ARN

# 3) NAT Gateway (¡el que más cobra!) + liberar Elastic IP
aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
aws ec2 release-address --allocation-id $EIP_ALLOC

# 4) Terminar la EC2
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID

echo "✅ Recursos que cobran por hora borrados."
```

> **Mínimo para frenar el gasto:** alcanza con borrar **API Gateway + ALB + NAT** y **detener** (stop) la EC2.
> **Limpieza total opcional:** borrar también subnets, route tables, IGW (detach + delete) y la VPC.
> ⚠️ Al recrear, el **API Gateway y el ALB cambian de URL** → hay que actualizar `config.ts` y recompilar el front.

---

_Hecho en AWS Academy Learner Lab · región us-east-1 · todo por CloudShell (CLI)._
