#!/usr/bin/env bash
# =============================================================================
#  aws-apagar.sh  —  Apaga TODO lo que cobra por hora.
#
#  Borra API Gateway + ALB + Target Group + NAT Gateway, libera la Elastic IP
#  y DETIENE (stop) la EC2 (conserva el back instalado).
#
#  Re-descubre los recursos por nombre/tag, así funciona aunque se haya perdido
#  el archivo ~/cervezas-ids.sh.
#
#  Uso (en AWS CloudShell):   bash aws-apagar.sh
# =============================================================================
set -uo pipefail
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""
TAG=cervezas

ok() { [ -n "$1" ] && [ "$1" != "None" ]; }

echo "==> Buscando recursos del proyecto '$TAG'..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$TAG-vpc" --query 'Vpcs[0].VpcId' --output text)

# --- API Gateway ---
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='cervezas-api'].ApiId | [0]" --output text)
if ok "$API_ID"; then
  echo "==> Borrando API Gateway $API_ID"
  aws apigatewayv2 delete-api --api-id "$API_ID"
fi

# --- ALB ---
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$TAG-alb" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)
if ok "$ALB_ARN"; then
  echo "==> Borrando ALB"
  aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN"
  sleep 30
fi

# --- Target Group ---
TG_ARN=$(aws elbv2 describe-target-groups --names "$TAG-tg" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null)
if ok "$TG_ARN"; then
  echo "==> Borrando Target Group"
  aws elbv2 delete-target-group --target-group-arn "$TG_ARN"
fi

# --- NAT Gateway (+ liberar su Elastic IP) ---
NAT_ID=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available,pending" \
  --query 'NatGateways[0].NatGatewayId' --output text)
if ok "$NAT_ID"; then
  EIP_ALLOC=$(aws ec2 describe-nat-gateways --nat-gateway-ids "$NAT_ID" \
    --query 'NatGateways[0].NatGatewayAddresses[0].AllocationId' --output text)
  echo "==> Borrando NAT Gateway $NAT_ID (esto frena el gasto grande)"
  aws ec2 delete-nat-gateway --nat-gateway-id "$NAT_ID"
  echo "    esperando a que se borre..."
  aws ec2 wait nat-gateway-deleted --nat-gateway-ids "$NAT_ID"
  if ok "$EIP_ALLOC"; then
    echo "==> Liberando Elastic IP $EIP_ALLOC"
    aws ec2 release-address --allocation-id "$EIP_ALLOC"
  fi
fi

# --- EC2 -> detener (no terminar) ---
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$TAG-backend" \
  "Name=instance-state-name,Values=running,pending" --query 'Reservations[0].Instances[0].InstanceId' --output text)
if ok "$INSTANCE_ID"; then
  echo "==> Deteniendo EC2 $INSTANCE_ID"
  aws ec2 stop-instances --instance-ids "$INSTANCE_ID" >/dev/null
fi

echo "=================================================="
echo "✅ APAGADO. Nada cobra por hora."
echo "   (Queda solo el disco EBS de la EC2 detenida: centavos/mes.)"
echo "=================================================="
