# 🔄 Reiniciar el back tras reabrir el sandbox

**Cuándo usar esto:** abrís el sandbox, el **front anda** pero el back tira **502 Bad Gateway**.
Pasa porque la infra (EC2 / NAT / ALB / API Gateway) sigue viva, pero **PM2 no relevanta el back** al reiniciar la EC2 → nada escucha en el 3000 → 502.

> Requisito: en **MongoDB Atlas → Network Access** tener `0.0.0.0/0` (así no hay que actualizar la IP del NAT cada vez).

---

## Pasos (en CloudShell)

### 1. Entrar a la EC2 por SSM
```bash
aws ssm start-session --target i-063e70d85e85a85de
```

### 2. Pasar al usuario ubuntu y ver el estado
```bash
sudo su - ubuntu
pm2 status
curl -s http://localhost:3000/stock; echo ""
pm2 logs backend --lines 20 --nostream
```
Si `pm2 status` está **vacío** y el `curl` no devuelve nada → el back está caído (es el caso esperado).

### 3. Verificar que el código y el `.env` siguen ahí
```bash
ls -la ~/tpGrupoFrontBack/backEnd/index.js ~/tpGrupoFrontBack/backEnd/.env
```
(tienen que existir los dos)

### 4. Arrancar el back
```bash
cd ~/tpGrupoFrontBack/backEnd
pm2 start index.js --name backend
pm2 save
sleep 4
pm2 logs backend --lines 15 --nostream
```

En los logs tenés que ver:
```
MongoDB conectado ✅
Servidor escuchando en http://localhost:3000
```

---

## Verificar que quedó arriba
```bash
curl -s http://localhost:3000/stock; echo ""
```
Devuelve `{"message":"Token no provisto"}` → el back vive. Esperá ~30 seg y el target del ALB pasa a **healthy**; el 502 desaparece.

---

> **Datos fijos de este stack**
> - Instancia EC2: `i-063e70d85e85a85de`
> - API Gateway (back): `https://8eot5z7xp8.execute-api.us-east-1.amazonaws.com`
> - Front (Amplify): `https://staging.d29bit1mgato79.amplifyapp.com`
>
> ⚠️ Si el lab **borró la EC2** (no aparece en `describe-instances`), esto NO alcanza: hay que relanzar la EC2 y reinstalar el back (ver `GUIA-AWS.md`).
