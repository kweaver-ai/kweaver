#!/bin/bash
# Query MongoDB automation database - list all collections with statistics

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCE_NAMESPACE="${RESOURCE_NAMESPACE:-resource}"
MONGODB_NAMESPACE="${MONGODB_NAMESPACE:-${RESOURCE_NAMESPACE}}"
MONGODB_RELEASE_NAME="${MONGODB_RELEASE_NAME:-mongodb}"
MONGODB_SECRET_NAME="${MONGODB_SECRET_NAME:-mongodb-secret}"
MONGODB_SECRET_USERNAME="${MONGODB_SECRET_USERNAME:-admin}"

# Get MongoDB password from secret
MONGODB_PASSWORD=""
if kubectl -n "${MONGODB_NAMESPACE}" get secret "${MONGODB_SECRET_NAME}" >/dev/null 2>&1; then
    MONGODB_PASSWORD=$(kubectl -n "${MONGODB_NAMESPACE}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
fi

if [[ -z "${MONGODB_PASSWORD}" ]]; then
    echo "ERROR: Could not retrieve MongoDB password from secret ${MONGODB_SECRET_NAME}"
    exit 1
fi

# MongoDB connection info
MONGODB_HOST="${MONGODB_RELEASE_NAME}.${MONGODB_NAMESPACE}.svc.cluster.local"
MONGODB_PORT="28000"
MONGODB_USER="${MONGODB_SECRET_USERNAME}"
MONGODB_DB="automation"
MONGODB_AUTH_SOURCE="anyshare"

echo "=========================================="
echo "MongoDB Automation Database Statistics"
echo "=========================================="
echo "Host: ${MONGODB_HOST}:${MONGODB_PORT}"
echo "Database: ${MONGODB_DB}"
echo "User: ${MONGODB_USER}"
echo "Auth Source: ${MONGODB_AUTH_SOURCE}"
echo "=========================================="
echo ""

# Check if MongoDB pod exists
MONGODB_POD=$(kubectl -n "${MONGODB_NAMESPACE}" get pod -l "app=${MONGODB_RELEASE_NAME}-mongodb" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [[ -z "${MONGODB_POD}" ]]; then
    echo "ERROR: MongoDB pod not found in namespace ${MONGODB_NAMESPACE}"
    exit 1
fi

echo "Using MongoDB pod: ${MONGODB_POD}"
echo ""

# Try mongosh first (MongoDB 4.4+), fallback to mongo
MONGO_CMD=""
if kubectl -n "${MONGODB_NAMESPACE}" exec "${MONGODB_POD}" -c mongodb -- which mongosh >/dev/null 2>&1; then
    MONGO_CMD="mongosh"
elif kubectl -n "${MONGODB_NAMESPACE}" exec "${MONGODB_POD}" -c mongodb -- which mongo >/dev/null 2>&1; then
    MONGO_CMD="mongo"
else
    echo "ERROR: Neither mongosh nor mongo command found in MongoDB pod"
    exit 1
fi

echo "Using MongoDB client: ${MONGO_CMD}"
echo ""

# Use MongoDB's built-in commands for simpler execution
# Method 1: Simple one-liner to list collections and their document counts
echo "Method 1: Quick collection list with document counts"
echo "=========================================="
kubectl -n "${MONGODB_NAMESPACE}" exec "${MONGODB_POD}" -c mongodb -- ${MONGO_CMD} \
    --host localhost \
    --port "${MONGODB_PORT}" \
    --username "${MONGODB_USER}" \
    --password "${MONGODB_PASSWORD}" \
    --authenticationDatabase "${MONGODB_AUTH_SOURCE}" \
    --quiet \
    "${MONGODB_DB}" \
    --eval "db.getCollectionNames().forEach(function(c) { print(c + ': ' + db.getCollection(c).count()); })" 2>/dev/null

echo ""
echo "=========================================="
echo "Method 2: Detailed statistics for each collection"
echo "=========================================="
echo ""

# Method 2: Detailed stats using db.collection.stats()
kubectl -n "${MONGODB_NAMESPACE}" exec "${MONGODB_POD}" -c mongodb -- ${MONGO_CMD} \
    --host localhost \
    --port "${MONGODB_PORT}" \
    --username "${MONGODB_USER}" \
    --password "${MONGODB_PASSWORD}" \
    --authenticationDatabase "${MONGODB_AUTH_SOURCE}" \
    --quiet \
    "${MONGODB_DB}" \
    --eval "db.getCollectionNames().forEach(function(c) { var s = db.getCollection(c).stats(); print('Collection: ' + c); print('  Documents: ' + s.count); print('  Size: ' + (s.size/1024/1024).toFixed(2) + ' MB'); print('  Storage: ' + (s.storageSize/1024/1024).toFixed(2) + ' MB'); print(''); })" 2>/dev/null

echo "=========================================="
echo "Method 3: Database-level summary"
echo "=========================================="
kubectl -n "${MONGODB_NAMESPACE}" exec "${MONGODB_POD}" -c mongodb -- ${MONGO_CMD} \
    --host localhost \
    --port "${MONGODB_PORT}" \
    --username "${MONGODB_USER}" \
    --password "${MONGODB_PASSWORD}" \
    --authenticationDatabase "${MONGODB_AUTH_SOURCE}" \
    --quiet \
    "${MONGODB_DB}" \
    --eval "var s = db.stats(); print('Total Collections: ' + s.collections); print('Total Documents: ' + s.objects); print('Data Size: ' + (s.dataSize/1024/1024).toFixed(2) + ' MB'); print('Storage Size: ' + (s.storageSize/1024/1024).toFixed(2) + ' MB'); print('Index Size: ' + (s.indexSize/1024/1024).toFixed(2) + ' MB');" 2>/dev/null

echo ""
echo "Query completed successfully!"
