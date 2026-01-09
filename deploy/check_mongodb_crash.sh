#!/bin/bash
# Quick MongoDB crash check script

NAMESPACE="${1:-resource}"
POD_NAME="${2:-mongodb-mongodb-0}"

echo "=== MongoDB Pod Crash Analysis ==="
echo ""

echo "1. Pod Status:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o wide
echo ""

echo "2. Container Exit Code:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}' 2>/dev/null || echo "No exit code yet"
echo ""

echo "3. Container Exit Reason:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}' 2>/dev/null || echo "No reason yet"
echo ""

echo "4. Container Exit Message:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.message}' 2>/dev/null || echo "No message"
echo ""

echo "5. Pod Events (last 20 lines):"
kubectl -n "${NAMESPACE}" describe pod "${POD_NAME}" 2>&1 | grep -A 30 "Events:" | tail -20
echo ""

echo "6. StatefulSet Args:"
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null | tr ' ' '\n' | head -20
echo ""

echo "7. Try to see if container can start (check previous logs):"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c mongodb --previous --tail=50 2>&1 || echo "No previous logs"
echo ""

echo "8. Check ConfigMap exists:"
kubectl -n "${NAMESPACE}" get configmap "${POD_NAME%-*}-mongodb" 2>&1
echo ""

echo "9. Check Secret exists:"
kubectl -n "${NAMESPACE}" get secret mongodb-secret 2>&1
echo ""

echo "=== Analysis Complete ==="
