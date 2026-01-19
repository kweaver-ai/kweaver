
# Ontology releases list (format: release_name:version, empty version means use default)
declare -a ONTOLOGY_RELEASES=(
    "ontology-manager:"
    "ontology-query:"
    "vega-web:"
    "data-connection:"
    "vega-gateway:"
    "vega-gateway-pro:"
    "vega-metadata:"
    "vega-hdfs:3.1.0-release"
    "vega-calculate:3.2.0-release"
    "mdl-data-model:"
    "mdl-uniquery:"
    "mdl-data-model-job:"
)

# Parse ontology command arguments
parse_ontology_args() {
    local action="$1"
    shift
    
    # Parse arguments to override defaults
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --version=*)
                HELM_CHART_VERSION="${1#*=}"
                shift
                ;;
            --version)
                HELM_CHART_VERSION="$2"
                shift 2
                ;;
            --helm_repo=*)
                HELM_CHART_REPO_URL="${1#*=}"
                shift
                ;;
            --helm_repo)
                HELM_CHART_REPO_URL="$2"
                shift 2
                ;;
            --helm_repo_name=*)
                HELM_CHART_REPO_NAME="${1#*=}"
                shift
                ;;
            --helm_repo_name)
                HELM_CHART_REPO_NAME="$2"
                shift 2
                ;;
            *)
                log_error "Unknown argument: $1"
                return 1
                ;;
        esac
    done
}

# Install Ontology services via Helm
install_ontology() {
    log_info "Installing Ontology services via Helm..."
    log_info "  Version: ${HELM_CHART_VERSION:-0.1.0}"
    log_info "  Helm Repo: ${HELM_CHART_REPO_NAME:-kweaver} -> ${HELM_CHART_REPO_URL:-https://kweaver-ai.github.io/helm-repo/}"

    # Get namespace from config.yaml
    local namespace=$(grep "^namespace:" "${CONFIG_YAML_PATH}" 2>/dev/null | head -1 | awk '{print $2}' | tr -d "'\"")
    namespace="${namespace:-kweaver-ai}"
    
    # Create namespace if not exists
    kubectl create namespace "${namespace}" 2>/dev/null || true
    
    # Add Helm repo
    log_info "Adding Helm repo: ${HELM_CHART_REPO_NAME} -> ${HELM_CHART_REPO_URL}"
    helm repo add --force-update "${HELM_CHART_REPO_NAME}" "${HELM_CHART_REPO_URL}"
    helm repo update
    
    log_info "Target namespace: ${namespace}"
    
    # Install each release
    for release_info in "${ONTOLOGY_RELEASES[@]}"; do
        local release_name="${release_info%%:*}"
        local release_version="${release_info##*:}"
        
        # Use default version if not specified
        if [[ -z "${release_version}" ]]; then
            release_version="${HELM_CHART_VERSION}"
        fi
        
        # Special handling for vega-calculate
        if [[ "${release_name}" == "vega-calculate" ]]; then
            install_vega_calculate "${release_name}" "${release_name}" "${namespace}" "${HELM_CHART_REPO_NAME}" "${release_version}"
        # Special handling for vega-hdfs - create temporary config with expanded storage configs
        elif [[ "${release_name}" == "vega-hdfs" ]]; then
            local temp_config="${SCRIPT_DIR}/conf/config.yaml.vega-hdfs.tmp"
            
            # Create temporary config file with expanded storage configurations
            log_info "Creating temporary config for vega-hdfs with expanded storage configurations..."
            cp "${CONFIG_YAML_PATH}" "${temp_config}"
            
            # Get the storage class name from config
            local storage_class=$(grep "^  storageClassName:" "${CONFIG_YAML_PATH}" 2>/dev/null | head -1 | awk '{print $2}' | tr -d "'\"")
            
            # Add expanded storage configurations for vega-hdfs
            cat >> "${temp_config}" << EOF

storage_namenode:
  storageClassName: "${storage_class}"

storage_slaves:
  storageClassName: "${storage_class}"

storage_datanode:
  storageClassName: "${storage_class}"
EOF
            
            log_info "Installing vega-hdfs with temporary config (without --wait to allow patch operations)..."
            install_ontology_release_no_wait "${release_name}" "${release_name}" "${namespace}" "${HELM_CHART_REPO_NAME}" "${release_version}" "${temp_config}"
            
            # Wait a moment for StatefulSets to be created
            sleep 2
            
            # Remove nodeSelector constraints from StatefulSets to allow scheduling on any node
            log_info "Removing nodeSelector constraints from vega-hdfs StatefulSets..."
            kubectl patch statefulset vega-namenode-master -n "${namespace}" --type='json' -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector"}]' 2>/dev/null || true
            kubectl patch statefulset vega-namenode-slave -n "${namespace}" --type='json' -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector"}]' 2>/dev/null || true
            kubectl patch statefulset vega-datanode -n "${namespace}" --type='json' -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector"}]' 2>/dev/null || true
            kubectl patch statefulset vega-journalnode -n "${namespace}" --type='json' -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector"}]' 2>/dev/null || true
            
            # Delete existing Pods to force StatefulSet to recreate them without nodeSelector
            log_info "Deleting existing vega-hdfs Pods to force recreation with updated StatefulSet..."
            kubectl delete pod -n "${namespace}" -l app=vega-namenode-master --grace-period=0 --force 2>/dev/null || true
            kubectl delete pod -n "${namespace}" -l app=vega-namenode-slave --grace-period=0 --force 2>/dev/null || true
            kubectl delete pod -n "${namespace}" -l app=vega-datanode --grace-period=0 --force 2>/dev/null || true
            kubectl delete pod -n "${namespace}" -l app=vega-journalnode --grace-period=0 --force 2>/dev/null || true
            
            # Wait for Pods to be recreated
            sleep 3
            
            log_info "vega-hdfs StatefulSets patched and Pods recreated, should now be able to schedule"
            
            # Clean up temporary config
            rm -f "${temp_config}"
            log_info "Cleaned up temporary config for vega-hdfs"
        else
            install_ontology_release "${release_name}" "${release_name}" "${namespace}" "${HELM_CHART_REPO_NAME}" "${release_version}"
        fi
    done
    
    log_info "Ontology services installation completed"
}

# Install a single Ontology release
install_ontology_release() {
    local release_name="$1"
    local chart_name="$2"
    local namespace="$3"
    local helm_repo_name="$4"
    local release_version="$5"
    local values_file="${6:-${SCRIPT_DIR}/conf/config.yaml}"
    
    log_info "Installing ${release_name}..."
    
    # Build Helm chart reference
    local chart_ref="${helm_repo_name}/${chart_name}"
    
    # Build Helm command
    local -a helm_args=(
        "upgrade" "--install" "${release_name}"
        "${chart_ref}"
        "--namespace" "${namespace}"
        "-f" "${values_file}"
        "--version" "${release_version}"
        "--devel"
        "--wait" "--timeout=600s"
    )
    
    # Execute Helm install/upgrade
    if helm "${helm_args[@]}"; then
        log_info "✓ ${release_name} installed successfully"
    else
        log_error "✗ Failed to install ${release_name}"
        return 1
    fi
}

# Install a single Ontology release without --wait (for releases that need post-install patching)
install_ontology_release_no_wait() {
    local release_name="$1"
    local chart_name="$2"
    local namespace="$3"
    local helm_repo_name="$4"
    local release_version="$5"
    local values_file="${6:-${SCRIPT_DIR}/conf/config.yaml}"
    
    log_info "Installing ${release_name}..."
    
    # Build Helm chart reference
    local chart_ref="${helm_repo_name}/${chart_name}"
    
    # Build Helm command (without --wait to allow immediate post-install operations)
    local -a helm_args=(
        "upgrade" "--install" "${release_name}"
        "${chart_ref}"
        "--namespace" "${namespace}"
        "-f" "${values_file}"
        "--version" "${release_version}"
        "--devel"
    )
    
    # Execute Helm install/upgrade
    if helm "${helm_args[@]}"; then
        log_info "✓ ${release_name} installed successfully"
    else
        log_error "✗ Failed to install ${release_name}"
        return 1
    fi
}

# Install vega-calculate with special configuration
install_vega_calculate() {
    local release_name="$1"
    local chart_name="$2"
    local namespace="$3"
    local helm_repo_name="$4"
    local release_version="$5"
    
    log_info "Installing ${release_name} (special configuration)..."
    
    # Build Helm chart reference
    local chart_ref="${helm_repo_name}/${chart_name}"
    
    # Extract Kafka configuration from config.yaml
    # Parse kafka host and port from config.yaml
    local kafka_host=$(grep -A 5 "^  kafka:" "${SCRIPT_DIR}/conf/config.yaml" | grep "host:" | head -1 | awk '{print $2}' | tr -d "'\"")
    local kafka_port=$(grep -A 5 "^  kafka:" "${SCRIPT_DIR}/conf/config.yaml" | grep "port:" | head -1 | awk '{print $2}' | tr -d "'\"")
    local kafka_user=$(grep -A 10 "^  kafka:" "${SCRIPT_DIR}/conf/config.yaml" | grep "username:" | head -1 | awk '{print $2}' | tr -d "'\"")
    local kafka_password=$(grep -A 10 "^  kafka:" "${SCRIPT_DIR}/conf/config.yaml" | grep "password:" | head -1 | awk '{print $2}' | tr -d "'\"")
    
    # Set defaults if not found
    kafka_host="${kafka_host:-kafka.resource}"
    kafka_port="${kafka_port:-9092}"
    kafka_user="${kafka_user:-kafkauser}"
    kafka_password="${kafka_password:-9lo0vt0V9JvRiAvWVO21hCde}"
    
    log_info "  Kafka Host: ${kafka_host}"
    log_info "  Kafka Port: ${kafka_port}"
    log_info "  Kafka User: ${kafka_user}"
    
    # Build Helm command with special values
    local -a helm_args=(
        "upgrade" "--install" "${release_name}"
        "${chart_ref}"
        "--namespace" "${namespace}"
        "--version" "${release_version}"
        "--devel"
        "--set" "namespace=${namespace}"
        "--set" "kafka.host=${kafka_host}"
        "--set" "kafka.port=${kafka_port}"
        "--set" "kafka.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username=\"${kafka_user}\" password=\"${kafka_password}\";"
        "--wait" "--timeout=600s"
    )
    
    # Execute Helm install/upgrade
    if helm "${helm_args[@]}"; then
        log_info "✓ ${release_name} installed successfully"
    else
        log_error "✗ Failed to install ${release_name}"
        return 1
    fi
}

# Uninstall Ontology services
uninstall_ontology() {
    log_info "Uninstalling Ontology services..."
    
    # Get namespace from config.yaml
    local namespace=$(grep "^namespace:" "${CONFIG_YAML_PATH}" 2>/dev/null | head -1 | awk '{print $2}' | tr -d "'\"")
    namespace="${namespace:-kweaver-ai}"
    
    # Uninstall in reverse order
    for ((i=${#ONTOLOGY_RELEASES[@]}-1; i>=0; i--)); do
        local release_info="${ONTOLOGY_RELEASES[$i]}"
        local release_name="${release_info%%:*}"
        log_info "Uninstalling ${release_name}..."
        if helm uninstall "${release_name}" -n "${namespace}" 2>/dev/null; then
            log_info "✓ ${release_name} uninstalled successfully"
        else
            log_warn "⚠ ${release_name} not found or already uninstalled"
        fi
    done
    
    log_info "Ontology services uninstallation completed"
}

# Show Ontology services status
show_ontology_status() {
    log_info "Ontology services status:"
    
    # Get namespace from config.yaml
    local namespace=$(grep "^namespace:" "${CONFIG_YAML_PATH}" 2>/dev/null | head -1 | awk '{print $2}' | tr -d "'\"")
    namespace="${namespace:-kweaver-ai}"
    
    log_info "Namespace: ${namespace}"
    log_info ""
    
    # Check each release
    for release_info in "${ONTOLOGY_RELEASES[@]}"; do
        local release_name="${release_info%%:*}"
        if helm status "${release_name}" -n "${namespace}" >/dev/null 2>&1; then
            local status=$(helm status "${release_name}" -n "${namespace}" -o json 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            log_info "  ✓ ${release_name}: ${status}"
        else
            log_info "  ✗ ${release_name}: not installed"
        fi
    done
}
