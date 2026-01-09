#!/bin/bash
# Manual MongoDB Replica Set Initialization Script

set -e

NAMESPACE="${1:-resource}"
POD_NAME="${2:-mongodb-mongodb-0}"
MONGODB_USER="${3:-admin}"
REPLSET_NAME="${4:-rs0}"

echo "=== Manual MongoDB Replica Set Initialization ==="
echo ""

# Get MongoDB password from secret
MONGODB_PASSWORD=$(kubectl -n "${NAMESPACE}" get secret mongodb-secret -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [[ -z "${MONGODB_PASSWORD}" ]]; then
    echo "❌ Error: Could not get MongoDB password from secret"
    echo "   Please provide password manually:"
    echo "   Usage: $0 <namespace> <pod-name> <username> <replset-name> <password>"
    if [[ -n "$5" ]]; then
        MONGODB_PASSWORD="$5"
        echo "   Using provided password"
    else
        exit 1
    fi
fi

echo "Namespace: ${NAMESPACE}"
echo "Pod: ${POD_NAME}"
echo "User: ${MONGODB_USER}"
echo "Replica Set Name: ${REPLSET_NAME}"
echo ""

# Check if Pod is running
POD_STATUS=$(kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
if [[ "${POD_STATUS}" != "Running" ]]; then
    echo "❌ Error: Pod is not Running (status: ${POD_STATUS})"
    exit 1
fi

# Detect MongoDB shell tool
MONGO_TOOL=""
if kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- mongosh --version >/dev/null 2>&1; then
    MONGO_TOOL="mongosh"
    echo "✅ Using mongosh"
elif kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- mongo --version >/dev/null 2>&1; then
    MONGO_TOOL="mongo"
    echo "✅ Using mongo"
else
    echo "❌ Error: Neither mongosh nor mongo found"
    exit 1
fi

# Get replica count from StatefulSet
REPLICAS=$(kubectl -n "${NAMESPACE}" get statefulset "${POD_NAME%-*}" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
echo "Replicas: ${REPLICAS}"
echo ""

# Check current status
echo "Step 1: Checking current replica set status..."
CURRENT_STATUS_OUTPUT=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
    --quiet \
    --port 28000 \
    -u "${MONGODB_USER}" \
    -p "${MONGODB_PASSWORD}" \
    --authenticationDatabase admin \
    --eval "try { var s = rs.status(); if (s && s.set && s.ok === 1) { print('ALREADY_INITIALIZED'); } else { print('NOT_INITIALIZED'); } } catch(e) { if (e.code === 94 || e.codeName === 'NotYetInitialized' || (e.message && (e.message.indexOf('not yet been initialized') !== -1 || e.message.indexOf('no replset config') !== -1))) { print('NOT_INITIALIZED'); } else { print('ERROR: ' + e.message); } }" 2>/dev/null || echo "ERROR")

# Also get raw status output for checking
RAW_STATUS=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
    --quiet \
    --port 28000 \
    -u "${MONGODB_USER}" \
    -p "${MONGODB_PASSWORD}" \
    --authenticationDatabase admin \
    --eval "rs.status()" 2>&1 || echo "ERROR")

# Check for initialization status
if [[ "${CURRENT_STATUS_OUTPUT}" == *"ALREADY_INITIALIZED"* ]]; then
    echo "✅ Replica set is already initialized!"
    echo ""
    echo "Current status:"
    echo "${RAW_STATUS}" | head -30
    exit 0
elif [[ "${CURRENT_STATUS_OUTPUT}" == *"NOT_INITIALIZED"* ]] || \
     [[ "${RAW_STATUS}" == *"NotYetInitialized"* ]] || \
     [[ "${RAW_STATUS}" == *"no replset config"* ]] || \
     echo "${RAW_STATUS}" | grep -q '"code" : 94'; then
    echo "✅ Replica set is not initialized, proceeding with initialization..."
elif [[ "${CURRENT_STATUS_OUTPUT}" == *"ERROR"* ]] && [[ "${RAW_STATUS}" == *"ERROR"* ]]; then
    echo "❌ Error checking status:"
    echo "${RAW_STATUS}"
    exit 1
else
    # If we get here, check the raw output for error code 94
    if echo "${RAW_STATUS}" | grep -q '"code" : 94\|"codeName" : "NotYetInitialized"'; then
        echo "✅ Replica set is not initialized (detected error code 94), proceeding with initialization..."
    else
        echo "⚠️  Unexpected status output, but proceeding with initialization..."
        echo "Status check output: ${CURRENT_STATUS_OUTPUT}"
        echo "Raw status: ${RAW_STATUS}"
    fi
fi

echo "✅ Replica set is not initialized, proceeding with initialization..."
echo ""

# Build members array
echo "Step 2: Building replica set members configuration..."
SERVICE_NAME="${POD_NAME%-*}"
MEMBERS_JS=""

if [[ "${REPLICAS}" -eq 1 ]]; then
    # Single-node replica set
    MEMBER_HOST="${SERVICE_NAME}-0.${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local:28000"
    MEMBERS_JS="{ _id: 0, host: \"${MEMBER_HOST}\" }"
    echo "Single-node replica set: ${MEMBER_HOST}"
else
    # Multi-node replica set
    i=0
    while [[ $i -lt $REPLICAS ]]; do
        MEMBER_HOST="${SERVICE_NAME}-${i}.${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local:28000"
        if [[ $i -eq 0 ]]; then
            MEMBERS_JS="{ _id: ${i}, host: \"${MEMBER_HOST}\", priority: 2 }"
        else
            MEMBERS_JS="${MEMBERS_JS}, { _id: ${i}, host: \"${MEMBER_HOST}\", priority: 1 }"
        fi
        echo "Member ${i}: ${MEMBER_HOST}"
        i=$((i + 1))
    done
fi
echo ""

# Initialize replica set
echo "Step 3: Initializing replica set..."
INIT_RESULT=$(kubectl -n "${NAMESPACE}" exec -i "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
    --quiet \
    --port 28000 \
    -u "${MONGODB_USER}" \
    -p "${MONGODB_PASSWORD}" \
    --authenticationDatabase admin <<EOF
try {
    var cfg = {
        _id: "${REPLSET_NAME}",
        members: [${MEMBERS_JS}]
    };
    var result = rs.initiate(cfg);
    print("INIT_SUCCESS");
    print(JSON.stringify(result, null, 2));
} catch(e) {
    if (e.message && (e.message.indexOf("already initialized") !== -1 || e.message.indexOf("already been initiated") !== -1)) {
        print("ALREADY_INITIALIZED");
    } else {
        print("INIT_ERROR: " + e.message);
        throw e;
    }
}
EOF
2>&1)

if [[ "${INIT_RESULT}" == *"INIT_SUCCESS"* ]] || [[ "${INIT_RESULT}" == *"ALREADY_INITIALIZED"* ]]; then
    echo "✅ Replica set initialization command executed successfully"
    echo ""
    echo "Initialization result:"
    echo "${INIT_RESULT}" | grep -A 10 "INIT_SUCCESS\|ALREADY_INITIALIZED" | head -15
else
    echo "❌ Replica set initialization failed:"
    echo "${INIT_RESULT}"
    exit 1
fi

echo ""
echo "Step 4: Waiting for replica set to stabilize (this may take 30-60 seconds)..."
sleep 5

# Verify replica set status
VERIFY_ATTEMPTS=0
MAX_VERIFY_ATTEMPTS=30
VERIFIED=false

while [[ $VERIFY_ATTEMPTS -lt $MAX_VERIFY_ATTEMPTS ]]; do
    sleep 2
    STATUS_CHECK=$(kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        -u "${MONGODB_USER}" \
        -p "${MONGODB_PASSWORD}" \
        --authenticationDatabase admin \
        --eval "try { var s = rs.status(); if (s && s.members && s.members.length > 0) { print('OK'); } else { print('PENDING'); } } catch(e) { print('PENDING: ' + e.message); }" 2>/dev/null | grep -E "OK|PENDING" || echo "PENDING")
    
    if [[ "${STATUS_CHECK}" == *"OK"* ]]; then
        VERIFIED=true
        break
    fi
    
    VERIFY_ATTEMPTS=$((VERIFY_ATTEMPTS + 1))
    if [[ $((VERIFY_ATTEMPTS % 5)) -eq 0 ]]; then
        echo "   Waiting... (attempt ${VERIFY_ATTEMPTS}/${MAX_VERIFY_ATTEMPTS})"
    fi
done

echo ""
if [[ "${VERIFIED}" == "true" ]]; then
    echo "✅ Replica set initialized and verified successfully!"
    echo ""
    echo "Final replica set status:"
    kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -c mongodb -- ${MONGO_TOOL} \
        --quiet \
        --port 28000 \
        -u "${MONGODB_USER}" \
        -p "${MONGODB_PASSWORD}" \
        --authenticationDatabase admin \
        --eval "rs.status()" 2>/dev/null | head -40
else
    echo "⚠️  Replica set initialization command executed, but status verification timed out."
    echo "   The replica set may still be initializing. Please check manually:"
    echo "   kubectl -n ${NAMESPACE} exec ${POD_NAME} -c mongodb -- ${MONGO_TOOL} --port 28000 -u ${MONGODB_USER} -p '***' --authenticationDatabase admin --eval 'rs.status()'"
fi

echo ""
echo "=== Initialization Complete ==="
