#!/bin/bash
# Create Kafka topic(s) manually

set -e

# Default values
KAFKA_NAMESPACE="${KAFKA_NAMESPACE:-resource}"
KAFKA_RELEASE_NAME="${KAFKA_RELEASE_NAME:-kafka}"
KAFKA_BROKER_POD="${KAFKA_BROKER_POD:-}"
KAFKA_BOOTSTRAP_SERVER="${KAFKA_BOOTSTRAP_SERVER:-${KAFKA_RELEASE_NAME}.${KAFKA_NAMESPACE}.svc.cluster.local:9092}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Find broker pod if not specified
if [[ -z "${KAFKA_BROKER_POD}" ]]; then
    KAFKA_BROKER_POD=$(kubectl -n "${KAFKA_NAMESPACE}" get pod -l "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME},app.kubernetes.io/component=broker" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
fi

if [[ -z "${KAFKA_BROKER_POD}" ]]; then
    log_error "Kafka broker pod not found in namespace ${KAFKA_NAMESPACE}"
    exit 1
fi

log_info "Using Kafka broker pod: ${KAFKA_BROKER_POD}"

# Check if SASL is enabled
KAFKA_AUTH_ENABLED="${KAFKA_AUTH_ENABLED:-true}"
KAFKA_CLIENT_USER="${KAFKA_CLIENT_USER:-kafkauser}"
KAFKA_SASL_SECRET_NAME="${KAFKA_SASL_SECRET_NAME:-${KAFKA_RELEASE_NAME}-sasl}"

# Get Kafka client password if SASL is enabled
KAFKA_CLIENT_PASSWORD=""
if [[ "${KAFKA_AUTH_ENABLED}" == "true" ]]; then
    KAFKA_CLIENT_PASSWORD=$(kubectl -n "${KAFKA_NAMESPACE}" get secret "${KAFKA_SASL_SECRET_NAME}" -o jsonpath='{.data.client-passwords}' 2>/dev/null | base64 -d 2>/dev/null | cut -d',' -f1 || echo "")
fi

# Function to create a topic
create_topic() {
    local topic_name="$1"
    local partitions="${2:-1}"
    local replication_factor="${3:-1}"
    
    log_info "Creating topic: ${topic_name} (partitions=${partitions}, replication-factor=${replication_factor})"
    
    local kafka_cmd_args=()
    if [[ "${KAFKA_AUTH_ENABLED}" == "true" && -n "${KAFKA_CLIENT_PASSWORD}" ]]; then
        kafka_cmd_args+=(
            --bootstrap-server "${KAFKA_BOOTSTRAP_SERVER}"
            --command-config /dev/stdin
            --topic "${topic_name}"
            --create
            --partitions "${partitions}"
            --replication-factor "${replication_factor}"
        )
        
        # Create SASL config for kafka-topics.sh
        kubectl -n "${KAFKA_NAMESPACE}" exec "${KAFKA_BROKER_POD}" -- bash -c "cat > /tmp/client.properties <<EOF
security.protocol=SASL_PLAINTEXT
sasl.mechanism=PLAIN
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username=\"${KAFKA_CLIENT_USER}\" password=\"${KAFKA_CLIENT_PASSWORD}\";
EOF
/opt/bitnami/kafka/bin/kafka-topics.sh ${kafka_cmd_args[*]} < /tmp/client.properties" 2>&1
    else
        kafka_cmd_args+=(
            --bootstrap-server "${KAFKA_BOOTSTRAP_SERVER}"
            --topic "${topic_name}"
            --create
            --partitions "${partitions}"
            --replication-factor "${replication_factor}"
        )
        
        kubectl -n "${KAFKA_NAMESPACE}" exec "${KAFKA_BROKER_POD}" -- /opt/bitnami/kafka/bin/kafka-topics.sh "${kafka_cmd_args[@]}" 2>&1
    fi
}

# Function to list all topics
list_topics() {
    log_info "Listing all topics..."
    
    local kafka_cmd_args=()
    if [[ "${KAFKA_AUTH_ENABLED}" == "true" && -n "${KAFKA_CLIENT_PASSWORD}" ]]; then
        kafka_cmd_args+=(
            --bootstrap-server "${KAFKA_BOOTSTRAP_SERVER}"
            --command-config /dev/stdin
            --list
        )
        
        kubectl -n "${KAFKA_NAMESPACE}" exec "${KAFKA_BROKER_POD}" -- bash -c "cat > /tmp/client.properties <<EOF
security.protocol=SASL_PLAINTEXT
sasl.mechanism=PLAIN
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username=\"${KAFKA_CLIENT_USER}\" password=\"${KAFKA_CLIENT_PASSWORD}\";
EOF
/opt/bitnami/kafka/bin/kafka-topics.sh ${kafka_cmd_args[*]} < /tmp/client.properties" 2>&1
    else
        kafka_cmd_args+=(
            --bootstrap-server "${KAFKA_BOOTSTRAP_SERVER}"
            --list
        )
        
        kubectl -n "${KAFKA_NAMESPACE}" exec "${KAFKA_BROKER_POD}" -- /opt/bitnami/kafka/bin/kafka-topics.sh "${kafka_cmd_args[@]}" 2>&1
    fi
}

# Main logic
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <topic_name> [partitions] [replication-factor]"
    echo "       $0 list  # List all topics"
    echo ""
    echo "Examples:"
    echo "  $0 thirdparty_message_plugin.message.push"
    echo "  $0 thirdparty_message_plugin.message.push 3 1"
    echo "  $0 list"
    exit 1
fi

if [[ "$1" == "list" ]]; then
    list_topics
else
    topic_name="$1"
    partitions="${2:-1}"
    replication_factor="${3:-1}"
    
    create_topic "${topic_name}" "${partitions}" "${replication_factor}"
    
    if [[ $? -eq 0 ]]; then
        log_info "Topic '${topic_name}' created successfully!"
    else
        log_error "Failed to create topic '${topic_name}'"
        exit 1
    fi
fi
