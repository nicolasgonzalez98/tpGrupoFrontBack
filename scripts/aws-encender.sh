#!/usr/bin/env bash
# =============================================================================
#  aws-encender.sh  —  Vuelve a prender el stack.
#
#  Recrea NAT Gateway + ALB + API Gateway y ENCIENDE (start) la EC2.
#  Reusa la VPC / subnets / Security Groups / EC2 que NO se borraron
#  (los busca por nombre/tag).
#
#  Al final imprime:
#    - la URL nueva del API Gateway (va en frontReact/src/services/config.ts)
#    - la IP nueva del NAT (va en MongoDB Atlas -> Network Access)
#
#  Uso (en AWS CloudShell):   bash aws-encender.sh
# =============================================================================
set -euo pipefail
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""
TAG=cervezas

echo "==> Buscando recursos existentes..."
VPC_ID=$(aws ec2 describe-vpcs   --filters "Name=tag:Name,Values=$TAG-vpc"       --query 'Vpcs[0].VpcId'      --output text)
PUB1=$(aws ec2 describe-subnets   --filters "Name=tag:Name,Values=$TAG-public-1"  --query 'Subnets[0].SubnetId' --output text)
PUB2=$(aws ec2 describe-subnets   --filters "Name=tag:Name,Values=$TAG-public-2"  --query 'Subnets[0].SubnetId' --output text)
PRIV1=$(aws ec2 describe-subnets  --filters "Name=tag:Name,Values=$TAG-private-1" --query 'Subnets[0].SubnetId' --output text)
ALB_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$TAG-alb-sg" --query 'SecurityGroups[0].GroupId' --output text)
EC2_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$TAG-ec2-sg" --query 'SecurityGroups[0].GroupId' --output text)
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$TAG-backend" \
  "Name=instance-state-name,Values=stopped,stopping,running" --query 'Reservations[0].Instances[0].InstanceId' --output text)
RT_PRIV=$(aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=$PRIV1" \
  --query 'RouteTables[0].RouteTableId' --output text)

# --- Encender la EC2 ---
echo "==> Encendiendo EC2 $INSTANCE_ID"
aws ec2 start-instances --instance-ids "$INSTANCE_ID" >/dev/null

# --- NAT Gateway nuevo + ruta privada ---
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
NAT_ID=$(aws ec2 create-nat-gateway --subnet-id "$PUB1" --allocation-id "$EIP_ALLOC" --query 'NatGateway.NatGatewayId' --output text)
echo "==> Esperando NAT Gateway (1-2 min)..."
aws ec2 wait nat-gateway-available --nat-gateway-ids "$NAT_ID"
aws ec2 create-route  --route-table-id "$RT_PRIV" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "$NAT_ID" 2>/dev/null \
  || aws ec2 replace-route --route-table-id "$RT_PRIV" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "$NAT_ID"

# --- ALB nuevo (Target Group + ALB + listener) ---
TG_ARN=$(aws elbv2 create-target-group --name "$TAG-tg" --protocol HTTP --port 3000 --vpc-id "$VPC_ID" \
  --target-type instance --health-check-path / --matcher HttpCode=200-499 --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 register-targets --target-group-arn "$TG_ARN" --targets Id="$INSTANCE_ID"
ALB_ARN=$(aws elbv2 create-load-balancer --name "$TAG-alb" --type application --scheme internet-facing \
  --subnets "$PUB1" "$PUB2" --security-groups "$ALB_SG" --query 'LoadBalancers[0].LoadBalancerArn' --output text)
echo "==> Esperando ALB (2-3 min)..."
aws elbv2 wait load-balancer-available --load-balancer-arns "$ALB_ARN"
aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn="$TG_ARN" >/dev/null
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)

# --- API Gateway nuevo -> ALB ---
API_OUT=$(aws apigatewayv2 create-api --name cervezas-api --protocol-type HTTP --target "http://$ALB_DNS" \
  --query '[ApiId,ApiEndpoint]' --output text)
API_ID=$(echo "$API_OUT" | awk '{print $1}')
API_ENDPOINT=$(echo "$API_OUT" | awk '{print $2}')

# --- Guardar IDs nuevos ---
cat > ~/cervezas-ids.sh <<EOF
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""
export TAG=cervezas
export VPC_ID=$VPC_ID PUB1=$PUB1 PUB2=$PUB2 PRIV1=$PRIV1
export ALB_SG=$ALB_SG EC2_SG=$EC2_SG INSTANCE_ID=$INSTANCE_ID RT_PRIV=$RT_PRIV
export EIP_ALLOC=$EIP_ALLOC NAT_ID=$NAT_ID
export TG_ARN=$TG_ARN ALB_ARN=$ALB_ARN ALB_DNS=$ALB_DNS
export API_ID=$API_ID API_ENDPOINT=$API_ENDPOINT
EOF

NAT_IP=$(aws ec2 describe-addresses --allocation-ids "$EIP_ALLOC" --query 'Addresses[0].PublicIp' --output text)
echo "=================================================="
echo "✅ ENCENDIDO"
echo "  URL nueva del front (API Gateway): $API_ENDPOINT"
echo "  IP del NAT (para Atlas Network Access): $NAT_IP"
echo "=================================================="
echo "Pendiente:"
echo "  1) Atlas -> Network Access: agregar $NAT_IP (o usar 0.0.0.0/0)"
echo "  2) config.ts -> API_URL = '$API_ENDPOINT' ; npm run build ; drag-drop dist a Amplify"
echo "  3) Probar: curl -s $API_ENDPOINT/stock"
