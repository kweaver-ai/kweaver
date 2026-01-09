#!/bin/bash
# Enable auto.create.topics.enable for an existing Kafka installation

set -e

# Default values (can be overridden by environment variables)
KAFKA_NAMESPACE="${KAFKA_NAMESPACE:-resource}"
KAFKA_RELEASE_NAME="${KAFKA_RELEASE_NAME:-kafka}"
KAFKA_AUTO_CREATE_TOPICS_ENABLE="${KAFKA_AUTO_CREATE_TOPICS_ENABLE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Helm is installed
if ! command -v helm >/dev/null 2>&1; then
    log_error "Helm is required. Please install Helm first."
    exit 1
fi

# Check if Kafka release exists
if ! helm status "${KAFKA_RELEASE_NAME}" -n "${KAFKA_NAMESPACE}" >/dev/null 2>&1; then
    log_error "Kafka release '${KAFKA_RELEASE_NAME}' not found in namespace '${KAFKA_NAMESPACE}'"
    exit 1
fi

log_info "Found Kafka release: ${KAFKA_RELEASE_NAME} in namespace ${KAFKA_NAMESPACE}"

# Convert boolean to string for Kafka server.properties
auto_create_topics_value="true"
if [[ "${KAFKA_AUTO_CREATE_TOPICS_ENABLE}" != "true" ]]; then
    auto_create_topics_value="false"
fi

log_info "Setting auto.create.topics.enable=${auto_create_topics_value}"

# Get current chart reference
chart_ref=$(helm get notes "${KAFKA_RELEASE_NAME}" -n "${KAFKA_NAMESPACE}" 2>/dev/null | grep -oP 'chart:\s*\K[^\s]+' | head -1 || echo "bitnami/kafka")
log_info "Using chart: ${chart_ref}"

# Get current values and create a temporary values file
log_info "Getting current Helm values..."
helm get values "${KAFKA_RELEASE_NAME}" -n "${KAFKA_NAMESPACE}" -o yaml > /tmp/kafka-current-values.yaml 2>/dev/null || {
    log_warn "Could not get current values, creating new configuration"
    echo "overrideConfiguration: {}" > /tmp/kafka-current-values.yaml
}

# Create update values file
log_info "Creating update values file..."
cat > /tmp/kafka-update-values.yaml <<EOF
overrideConfiguration:
  "auto.create.topics.enable": "${auto_create_topics_value}"
EOF

# Perform Helm upgrade using values file
log_info "Updating Kafka configuration via Helm upgrade..."
log_info "This will restart Kafka pods to apply the new configuration..."

if helm upgrade "${KAFKA_RELEASE_NAME}" "${chart_ref}" \
    -n "${KAFKA_NAMESPACE}" \
    --reuse-values \
    -f /tmp/kafka-update-values.yaml \
    --wait --timeout=600s 2>&1; then
    log_info "Kafka configuration updated successfully!"
else
    log_error "Helm upgrade failed. Attempting alternative method with --set..."
    
    # Alternative: use --set (escape dots in key name)
    if helm upgrade "${KAFKA_RELEASE_NAME}" "${chart_ref}" \
        -n "${KAFKA_NAMESPACE}" \
        --reuse-values \
        --set "overrideConfiguration.auto\.create\.topics\.enable=${auto_create_topics_value}" \
        --wait --timeout=600s 2>&1; then
        log_info "Kafka configuration updated successfully using --set method!"
    else
        log_error "Both methods failed. Please check the error messages above."
        log_info "You can try manually:"
        log_info "  helm upgrade ${KAFKA_RELEASE_NAME} ${chart_ref} -n ${KAFKA_NAMESPACE} --reuse-values -f /tmp/kafka-update-values.yaml"
        exit 1
    fi
fi

# Cleanup
rm -f /tmp/kafka-current-values.yaml /tmp/kafka-update-values.yaml 2>/dev/null || true

# Wait a bit for pods to restart
log_info "Waiting for Kafka pods to restart..."
sleep 10

# Verify the configuration
log_info "Verifying configuration..."
broker_pod=$(kubectl -n "${KAFKA_NAMESPACE}" get pod -l "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME},app.kubernetes.io/component=broker" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [[ -n "${broker_pod}" ]]; then
    log_info "Checking server.properties in broker pod: ${broker_pod}"
    if kubectl -n "${KAFKA_NAMESPACE}" exec "${broker_pod}" -- cat /opt/bitnami/kafka/config/server.properties 2>/dev/null | grep -q "auto.create.topics.enable"; then
        log_info "Configuration found:"
        kubectl -n "${KAFKA_NAMESPACE}" exec "${broker_pod}" -- cat /opt/bitnami/kafka/config/server.properties 2>/dev/null | grep "auto.create.topics.enable"
    else
        log_warn "Could not find auto.create.topics.enable in server.properties"
        log_info "This might be normal if the configuration is set via overrideConfiguration"
    fi
else
    log_warn "Could not find broker pod to verify configuration"
fi

log_info "Done! Kafka auto.create.topics.enable is now set to ${auto_create_topics_value}"
log_info "Kafka pods have been restarted to apply the new configuration."
