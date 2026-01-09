#!/bin/bash
# Fix Redis password to adp@redis123

set -e

NAMESPACE="${1:-resource}"
SECRET_NAME="redis-proton-redis-secret"
NEW_PASSWORD="adp@redis123"

echo "=== Fixing Redis Password ==="
echo "Namespace: ${NAMESPACE}"
echo "Secret: ${SECRET_NAME}"
echo "New Password: ${NEW_PASSWORD}"
echo ""

# Check if secret exists
if ! kubectl -n "${NAMESPACE}" get secret "${SECRET_NAME}" >/dev/null 2>&1; then
    echo "Error: Secret ${SECRET_NAME} not found in namespace ${NAMESPACE}"
    exit 1
fi

# Encode password to base64
PASSWORD_B64=$(echo -n "${NEW_PASSWORD}" | base64 | tr -d '\n')

# Update secret
echo "Updating secret ${SECRET_NAME}..."
kubectl -n "${NAMESPACE}" patch secret "${SECRET_NAME}" --type merge \
  -p "{\"data\":{\"password\":\"${PASSWORD_B64}\",\"nonEncrpt-password\":\"${PASSWORD_B64}\",\"monitor-password\":\"${PASSWORD_B64}\",\"sentinel-password\":\"${PASSWORD_B64}\"}}"

echo "Secret updated successfully!"
echo ""

# Get Redis Pod names
echo "Restarting Redis Pods to apply new password..."
PODS=$(kubectl -n "${NAMESPACE}" get pods -l app=redis-proton-redis -o jsonpath='{.items[*].metadata.name}')

if [[ -z "${PODS}" ]]; then
    echo "Warning: No Redis pods found"
    exit 1
fi

for pod in ${PODS}; do
    echo "Deleting pod ${pod}..."
    kubectl -n "${NAMESPACE}" delete pod "${pod}" --grace-period=30
done

echo ""
echo "Waiting for pods to be ready..."
kubectl -n "${NAMESPACE}" wait --for=condition=ready pod -l app=redis-proton-redis --timeout=300s

echo ""
echo "✓ Redis password updated and pods restarted!"
echo ""
echo "Verify password:"
echo "  kubectl -n ${NAMESPACE} get secret ${SECRET_NAME} -o jsonpath='{.data.nonEncrpt-password}' | base64 -d"
echo ""
