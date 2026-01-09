#!/bin/bash
# MongoDB crash fix script

set -e

NAMESPACE="${1:-resource}"
POD_NAME="${2:-mongodb-mongodb-0}"

echo "=== MongoDB Crash Fix Script ==="
echo ""

echo "Step 1: Checking current status..."
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" 2>&1 || echo "Pod not found"
echo ""

echo "Step 2: Getting exit code..."
EXIT_CODE=$(kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}' 2>/dev/null || echo "N/A")
echo "Exit code: ${EXIT_CODE}"
echo ""

echo "Step 3: Getting exit reason..."
EXIT_REASON=$(kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}' 2>/dev/null || echo "N/A")
echo "Exit reason: ${EXIT_REASON}"
echo ""

echo "Step 4: Checking previous logs..."
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c mongodb --previous --tail=100 2>&1 | head -50 || echo "No previous logs"
echo ""

echo "Step 5: Checking Pod events..."
kubectl -n "${NAMESPACE}" describe pod "${POD_NAME}" 2>&1 | grep -A 20 "Events:" | tail -15
echo ""

echo "Step 6: Checking StatefulSet configuration..."
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o yaml | grep -A 10 "args:" | head -15
echo ""

echo "=== Diagnostic Information Collected ==="
echo ""
echo "Common issues and fixes:"
echo "1. If exit code is 1 or 2: Check MongoDB configuration or data directory"
echo "2. If exit code is 137: Out of memory (OOMKilled)"
echo "3. If exit code is 255: Container startup error"
echo ""
echo "To fix:"
echo "1. Delete PVC and restart: kubectl -n ${NAMESPACE} delete pvc -l app=${POD_NAME%-*}-mongodb"
echo "2. Delete Pod: kubectl -n ${NAMESPACE} delete pod ${POD_NAME}"
echo "3. Wait for StatefulSet to recreate: kubectl -n ${NAMESPACE} get pod -w"
echo ""
