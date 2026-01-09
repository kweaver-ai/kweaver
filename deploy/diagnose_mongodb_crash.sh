#!/bin/bash
# MongoDB Crash Diagnostic Script

set -e

NAMESPACE="${1:-resource}"
POD_NAME="${2:-mongodb-mongodb-0}"

echo "=== MongoDB Pod Diagnostic Information ==="
echo ""

echo "1. Pod Status:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o wide
echo ""

echo "2. Pod Events:"
kubectl -n "${NAMESPACE}" describe pod "${POD_NAME}" | grep -A 50 "Events:" || echo "No events found"
echo ""

echo "3. Container Status:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[*]}' | jq -r '.' 2>/dev/null || kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[*]}'
echo ""

echo "4. Previous Container Logs (if any):"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c mongodb --previous --tail=100 2>&1 || echo "No previous logs"
echo ""

echo "5. Current Container Logs (if any):"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c mongodb --tail=100 2>&1 || echo "No current logs"
echo ""

echo "6. Init Container Logs:"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c fix-keyfile-permissions 2>&1 || echo "No init container logs"
echo ""

echo "7. Pod YAML (relevant sections):"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o yaml | grep -A 30 "containers:" | head -50
echo ""

echo "8. StatefulSet Configuration:"
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o yaml | grep -A 20 "args:" || echo "StatefulSet not found"
echo ""

echo "9. ConfigMap (mongodb.conf):"
kubectl -n "${NAMESPACE}" get configmap "${POD_NAME%-*}-mongodb" -o yaml 2>/dev/null | grep -A 50 "mongodb.conf:" || echo "ConfigMap not found"
echo ""

echo "10. Secret Check (keyfile exists?):"
kubectl -n "${NAMESPACE}" get secret mongodb-secret -o jsonpath='{.data.mongodb\.keyfile}' 2>/dev/null | base64 -d | wc -c 2>/dev/null && echo " bytes" || echo "Keyfile not found or empty"
echo ""

echo "11. Try to exec into container (if possible):"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ls -la /mongodb/config/ 2>&1 || echo "Cannot exec into container"
echo ""

echo "12. Try to exec into container (check keyfile):"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ls -la /mongodb/config/mongodb.keyfile 2>&1 || echo "Cannot access container or keyfile"
echo ""

echo "13. Try to exec into container (check config):"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- cat /mongodb/mongoconfig/mongodb.conf 2>&1 | head -20 || echo "Cannot access container or config"
echo ""

echo "14. Check data directory permissions:"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ls -ld /data/mongodb_data 2>&1 || echo "Cannot access container or data directory"
echo ""

echo "15. StatefulSet full args:"
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null | tr ' ' '\n' || echo "Cannot get StatefulSet args"
echo ""

echo "16. Check if container can start manually (test command):"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- which mongod 2>&1 || echo "Cannot exec or mongod not found"
echo ""

echo "=== Diagnostic Complete ==="
echo ""
echo "Next steps:"
echo "1. If container cannot start, check the exit code: kubectl -n ${NAMESPACE} get pod ${POD_NAME} -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'"
echo "2. Check previous container logs: kubectl -n ${NAMESPACE} logs ${POD_NAME} -c mongodb --previous"
echo "3. Describe pod for more details: kubectl -n ${NAMESPACE} describe pod ${POD_NAME}"
