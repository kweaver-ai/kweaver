#!/bin/bash
# MongoDB Replica Set Verification Script

set -e

NAMESPACE="${1:-resource}"
POD_NAME="${2:-mongodb-mongodb-0}"
MONGODB_USER="${3:-admin}"

echo "=== MongoDB Replica Set Verification ==="
echo ""

# Get MongoDB password from secret
MONGODB_PASSWORD=$(kubectl -n "${NAMESPACE}" get secret mongodb-secret -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [[ -z "${MONGODB_PASSWORD}" ]]; then
    echo "⚠️  Warning: Could not get MongoDB password from secret"
    echo "   You may need to provide password manually"
    MONGODB_PASSWORD=""
fi

echo "1. Checking StatefulSet configuration..."
echo "   Replica Set Enabled:"
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null | grep -q "replSet" && echo "   ✅ Replica set is enabled in StatefulSet" || echo "   ❌ Replica set is NOT enabled in StatefulSet"
echo ""

echo "2. Checking MongoDB startup arguments..."
kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null | tr ' ' '\n' | grep -E "(replSet|keyFile)" || echo "   No replica set arguments found"
echo ""

echo "3. Checking if Pod is running..."
POD_STATUS=$(kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
if [[ "${POD_STATUS}" == "Running" ]]; then
    echo "   ✅ Pod is Running"
else
    echo "   ❌ Pod status: ${POD_STATUS}"
    echo "   Please wait for Pod to be Running before verifying replica set"
    exit 1
fi
echo ""

echo "4. Detecting MongoDB shell tool..."
MONGO_TOOL=""
if kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- mongosh --version >/dev/null 2>&1; then
    MONGO_TOOL="mongosh"
    echo "   ✅ Using mongosh"
elif kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- mongo --version >/dev/null 2>&1; then
    MONGO_TOOL="mongo"
    echo "   ✅ Using mongo"
else
    echo "   ❌ Neither mongosh nor mongo found"
    exit 1
fi
echo ""

echo "5. Checking replica set status..."
if [[ -n "${MONGODB_PASSWORD}" ]]; then
    RS_STATUS=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        -u "${MONGODB_USER}" \
        -p "${MONGODB_PASSWORD}" \
        --authenticationDatabase admin \
        --eval "try { var s = rs.status(); print('REPLICA_SET_ACTIVE'); print(JSON.stringify(s, null, 2)); } catch(e) { if (e.message && e.message.indexOf('not yet been initialized') !== -1) { print('NOT_INITIALIZED'); } else { print('ERROR: ' + e.message); } }" 2>/dev/null || echo "CONNECTION_ERROR")
else
    echo "   ⚠️  Password not available, trying without authentication..."
    RS_STATUS=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        --eval "try { var s = rs.status(); print('REPLICA_SET_ACTIVE'); print(JSON.stringify(s, null, 2)); } catch(e) { if (e.message && e.message.indexOf('not yet been initialized') !== -1) { print('NOT_INITIALIZED'); } else { print('ERROR: ' + e.message); } }" 2>/dev/null || echo "CONNECTION_ERROR")
fi

if [[ "${RS_STATUS}" == *"REPLICA_SET_ACTIVE"* ]]; then
    echo "   ✅ Replica set is ACTIVE and initialized"
    echo ""
    echo "   Replica Set Details:"
    echo "${RS_STATUS}" | grep -A 50 "REPLICA_SET_ACTIVE" | tail -n +2 | head -30
elif [[ "${RS_STATUS}" == *"NOT_INITIALIZED"* ]]; then
    echo "   ⚠️  Replica set is enabled but NOT YET INITIALIZED"
    echo "   Run: ./init_infra.sh mongodb init (will auto-initialize)"
elif [[ "${RS_STATUS}" == *"CONNECTION_ERROR"* ]]; then
    echo "   ❌ Could not connect to MongoDB"
    echo "   Please check if MongoDB is running and accessible"
else
    echo "   ❌ Error checking replica set status:"
    echo "${RS_STATUS}"
fi
echo ""

echo "6. Checking replica set configuration..."
if [[ -n "${MONGODB_PASSWORD}" ]]; then
    RS_CONFIG=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        -u "${MONGODB_USER}" \
        -p "${MONGODB_PASSWORD}" \
        --authenticationDatabase admin \
        --eval "try { var c = rs.conf(); print('CONFIG_FOUND'); print(JSON.stringify(c, null, 2)); } catch(e) { print('NO_CONFIG: ' + e.message); }" 2>/dev/null || echo "ERROR")
else
    RS_CONFIG=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        --eval "try { var c = rs.conf(); print('CONFIG_FOUND'); print(JSON.stringify(c, null, 2)); } catch(e) { print('NO_CONFIG: ' + e.message); }" 2>/dev/null || echo "ERROR")
fi

if [[ "${RS_CONFIG}" == *"CONFIG_FOUND"* ]]; then
    echo "   ✅ Replica set configuration found:"
    echo "${RS_CONFIG}" | grep -A 30 "CONFIG_FOUND" | tail -n +2 | head -20
else
    echo "   ⚠️  No replica set configuration found (may not be initialized yet)"
fi
echo ""

echo "7. Checking MongoDB connection string format..."
echo "   For replica set mode, connection string should include:"
echo "   - replicaSet=<replica_set_name>"
echo "   - authSource=anyshare (or admin)"
echo ""
echo "   Example:"
echo "   mongodb://admin:password@mongodb.resource.svc.cluster.local:28000/anyshare?authSource=anyshare&replicaSet=rs0"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "Summary:"
if [[ "${RS_STATUS}" == *"REPLICA_SET_ACTIVE"* ]]; then
    echo "✅ MongoDB is running in REPLICA SET mode and is ACTIVE"
elif [[ "${RS_STATUS}" == *"NOT_INITIALIZED"* ]]; then
    echo "⚠️  MongoDB is configured for replica set but NOT INITIALIZED"
    echo "   Run: ./init_infra.sh mongodb init (will auto-initialize)"
else
    echo "❌ Could not verify replica set status"
fi
