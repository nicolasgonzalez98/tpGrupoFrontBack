#!/usr/bin/env bash
# =============================================================================
#  dynamo-create-tables.sh  —  Crea las tablas de DynamoDB del proyecto.
#
#  Tablas: Cervezas, Pedidos, Usuarios
#  Clave de partición: `_id` (String)  ·  Facturación: PAY_PER_REQUEST (sin costo por hora)
#
#  Se corre UNA vez (las tablas persisten entre sesiones del lab, no se borran
#  al reiniciar la EC2). Uso (en CloudShell):  bash dynamo-create-tables.sh
# =============================================================================
set -uo pipefail
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""

for T in Cervezas Pedidos Usuarios; do
  if aws dynamodb describe-table --table-name "$T" >/dev/null 2>&1; then
    echo "==> $T ya existe, salteo."
  else
    echo "==> Creando tabla $T..."
    aws dynamodb create-table \
      --table-name "$T" \
      --attribute-definitions AttributeName=_id,AttributeType=S \
      --key-schema AttributeName=_id,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST >/dev/null
  fi
done

echo "==> Esperando a que las tablas estén ACTIVE..."
for T in Cervezas Pedidos Usuarios; do
  aws dynamodb wait table-exists --table-name "$T"
  echo "    $T OK"
done

echo "✅ Tablas listas."
aws dynamodb list-tables --query 'TableNames' --output text
