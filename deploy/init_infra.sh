#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_DIR="${CONF_DIR:-${SCRIPT_DIR}/conf}"
CONFIG_YAML_PATH="${CONFIG_YAML_PATH:-${CONF_DIR}/config.yaml}"

# Source all service libraries
source "${SCRIPT_DIR}/scripts/lib/common.sh"
source "${SCRIPT_DIR}/scripts/services/config.sh"
source "${SCRIPT_DIR}/scripts/services/k8s.sh"
source "${SCRIPT_DIR}/scripts/services/storage.sh"
source "${SCRIPT_DIR}/scripts/services/mariadb.sh"
source "${SCRIPT_DIR}/scripts/services/redis.sh"
source "${SCRIPT_DIR}/scripts/services/kafka.sh"
source "${SCRIPT_DIR}/scripts/services/zookeeper.sh"
source "${SCRIPT_DIR}/scripts/services/mongodb.sh"
source "${SCRIPT_DIR}/scripts/services/ingress_nginx.sh"
source "${SCRIPT_DIR}/scripts/services/opensearch.sh"
source "${SCRIPT_DIR}/scripts/services/studio.sh"
source "${SCRIPT_DIR}/scripts/services/ontology.sh"
source "${SCRIPT_DIR}/scripts/services/agentoperator.sh"
source "${SCRIPT_DIR}/scripts/services/dataagent.sh"
source "${SCRIPT_DIR}/scripts/services/flowautomation.sh"
source "${SCRIPT_DIR}/scripts/services/isf.sh"

usage() {
    echo "Kubernetes Infrastructure Initialization Script"
    echo ""
    echo "Usage: $0 <module> [action]"
    echo ""
    echo "Modules and Actions:"
    echo "  k8s init                      Initialize K8s master node with CNI and DNS"
    echo "  k8s reset                     Reset Kubernetes cluster state (kubeadm reset -f + cleanup)"
    echo "  k8s status                    Show cluster status"
    echo "  mariadb init                  Install single-node MariaDB 11"
    echo "  mariadb uninstall             Uninstall MariaDB (optionally purge PVC)"
    echo "  redis init                    Install single-node Redis 7"
    echo "  redis uninstall               Uninstall Redis (PVCs will be deleted by default)"
    echo "  kafka init                    Install single-node Kafka"
    echo "  kafka uninstall               Uninstall Kafka (PVCs will be deleted by default)"
    echo "  opensearch init               Install single-node OpenSearch"
    echo "  opensearch uninstall          Uninstall OpenSearch (optionally purge PVC)"
    echo "  mongodb init                  Install MongoDB"
    echo "  mongodb uninstall             Uninstall MongoDB (PVCs will be deleted)"
    echo "  zookeeper init                Install single-node Zookeeper"
    echo "  zookeeper uninstall           Uninstall Zookeeper (PVCs will be deleted by default)"
    echo "  ingress-nginx init            Install ingress-nginx-controller"
    echo "  ingress-nginx uninstall       Uninstall ingress-nginx-controller"
    echo "  studio init                   Install Studio services (deploy-web, studio-web, etc.)"
    echo "  studio uninstall              Uninstall Studio services"
    echo "  studio status                 Show Studio services status"
    echo "  ontology init                 Install Ontology services (ontology-manager, vega-web, etc.)"
    echo "  ontology uninstall            Uninstall Ontology services"
    echo "  ontology status               Show Ontology services status"
    echo "  agent_operator init           Install Agent Operator services (agent-operator-app, operator-web, etc.)"
    echo "  agent_operator uninstall      Uninstall Agent Operator services"
    echo "  agent_operator status         Show Agent Operator services status"
    echo "  dataagent init                Install DataAgent services (data-retrieval, etc.)"
    echo "  dataagent uninstall           Uninstall DataAgent services"
    echo "  dataagent status              Show DataAgent services status"
    echo "  flowautomation init           Install FlowAutomation services (flow-web, flow-automation, etc.)"
    echo "  flowautomation uninstall      Uninstall FlowAutomation services"
    echo "  flowautomation status         Show FlowAutomation services status"
    echo "  isf init                      Install ISF services (informationsecurityfabric, hydra, sharemgnt, etc.)"
    echo "  isf uninstall                 Uninstall ISF services"
    echo "  isf status                    Show ISF services status"
    echo "  config generate               Generate/update conf/config.yaml"
    echo "  all init                      Run full initialization (k8s + mariadb + redis + ingress-nginx)"
    echo ""
    echo "Configuration Variables (set before running script):"
    echo "  CONF_DIR                      Local vendored manifests/scripts dir (default: ${SCRIPT_DIR}/conf)"
    echo "  POD_CIDR                      Pod network CIDR (default: 192.169.0.0/16)"
    echo "  SERVICE_CIDR                  Service network CIDR (default: 10.96.0.0/12)"
    echo "  API_SERVER_ADVERTISE_ADDRESS  API server advertise address (default: auto-detect)"
    echo "  IMAGE_REPOSITORY              Kubernetes image repository (default: registry.aliyuncs.com/google_containers)"
    echo "  FLANNEL_IMAGE_REPO            Flannel image repository (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/)"
    echo "  FLANNEL_MANIFEST_PATH         Local Flannel manifest path (default: \${CONF_DIR}/kube-flannel.yml)"
    echo "  FLANNEL_MANIFEST_URL          Flannel manifest URL fallback"
    echo "  DOCKER_IO_MIRROR_PREFIX       Docker Hub mirror prefix (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/)"
    echo "  AUTO_GENERATE_CONFIG          Auto generate \${CONF_DIR}/config.yaml after installs (default: true)"
    echo "  CONFIG_YAML_PATH              Config file output path (default: \${CONF_DIR}/config.yaml)"
    echo "  LOCAL_CHARTS_DIR              Local Helm charts dir (default: ${SCRIPT_DIR}/charts/bitnami)"
    echo "  LOCAL_INGRESS_NGINX_CHARTS_DIR Local ingress-nginx chart dir (default: ${SCRIPT_DIR}/charts/ingress-nginx)"
    echo "  LOCAL_OPENSEARCH_CHARTS_DIR   Local OpenSearch charts dir (default: ${SCRIPT_DIR}/charts/opensearch)"
    echo "  HELM_INSTALL_SCRIPT_PATH      Local Helm install script path (default: \${CONF_DIR}/get-helm-3)"
    echo "  HELM_INSTALL_SCRIPT_URL       Helm install script URL fallback"
    echo "  LOCALPV_PROVISIONER_IMAGE     local-path-provisioner image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/rancher/local-path-provisioner:v0.0.32)"
    echo "  LOCALPV_HELPER_IMAGE          local-path helper image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/busybox:1.36.1)"
    echo "  LOCALPV_MANIFEST_PATH         Local local-path-provisioner manifest path (default: \${CONF_DIR}/local-path-storage.yaml)"
    echo "  LOCALPV_MANIFEST_URL          local-path-provisioner manifest URL fallback"
    echo "  LOCALPV_BASE_PATH             local-path data base path on node (default: /opt/local-path-provisioner)"
    echo "  LOCALPV_SET_DEFAULT           Set local-path as default StorageClass (default: true)"
    echo "  AUTO_INSTALL_LOCALPV          Auto install local-path when no StorageClass (default: true)"
    echo "  RESOURCE_NAMESPACE            Default namespace for data services (default: resource)"
    echo "  MARIADB_NAMESPACE             MariaDB namespace (default: \${RESOURCE_NAMESPACE})"
    echo "  MARIADB_VERSION               MariaDB version (default: 11.4)"
    echo "  MARIADB_IMAGE                 MariaDB image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/bitnami/mariadb:11.4.7-debian-12-r2)"
    echo "  MARIADB_CHART_VERSION         Bitnami MariaDB chart version (default: 20.0.0)"
    echo "  MARIADB_CHART_TGZ             Local MariaDB chart tgz (default: \${LOCAL_CHARTS_DIR}/mariadb-\${MARIADB_CHART_VERSION}.tgz)"
    echo "  MARIADB_PERSISTENCE_ENABLED   Enable MariaDB persistence (default: true; auto-fallback to false if no StorageClass)"
    echo "  MARIADB_STORAGE_CLASS         MariaDB storageClass name (default: empty)"
    echo "  MARIADB_PURGE_PVC             Purge MariaDB PVC on uninstall (default: false)"
    echo "  MARIADB_ROOT_PASSWORD         MariaDB root password (default: mariadb-root-password)"
    echo "  MARIADB_DATABASE              MariaDB database name (default: adp)"
    echo "  MARIADB_USER                  MariaDB username (default: adp)"
    echo "  MARIADB_PASSWORD              MariaDB password (default: adp@123456)"
    echo "  MARIADB_STORAGE_SIZE          MariaDB storage size (default: 10Gi)"
    echo "  MARIADB_MAX_CONNECTIONS       MariaDB max_connections parameter (default: 5000)"
    echo "  REDIS_NAMESPACE               Redis namespace (default: \${RESOURCE_NAMESPACE})"
    echo "  REDIS_VERSION                 Redis version (default: 7.4)"
    echo "  REDIS_CHART_VERSION           Bitnami Redis chart version (default: 20.3.0)"
    echo "  REDIS_CHART_TGZ               Local Redis chart tgz (default: \${LOCAL_CHARTS_DIR}/redis-\${REDIS_CHART_VERSION}.tgz)"
    echo "  REDIS_USE_LOCAL_CHART         Use local Redis chart from scripts/charts/redis (default: false)"
    echo "  REDIS_LOCAL_CHART_DIR         Local Redis chart directory (default: \${SCRIPT_DIR}/charts/redis)"
    echo "  REDIS_ARCHITECTURE            Redis architecture: standalone or sentinel (default: standalone)"
    echo "  REDIS_IMAGE                   Redis image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/redis:8.4.0-alpine; if not Bitnami, deploy via manifest)"
    echo "  REDIS_IMAGE_REGISTRY          Redis image registry (default: empty, will try to get from config.yaml)"
    echo "  REDIS_IMAGE_REPOSITORY        Redis image repository (default: proton/proton-redis)"
    echo "  REDIS_IMAGE_TAG               Redis image tag (default: 1.11.2-20251029.2.169ac3c0)"
    echo "  REDIS_PERSISTENCE_ENABLED     Enable Redis persistence (default: true; auto-fallback to false if no StorageClass)"
    echo "  REDIS_STORAGE_CLASS           Redis storageClass name (default: empty)"
    echo "  REDIS_PURGE_PVC               Purge Redis PVC on uninstall (default: true; set false to retain data)"
    echo "  REDIS_PASSWORD                Redis password (default: redis-password)"
    echo "  REDIS_STORAGE_SIZE            Redis storage size (default: 5Gi)"
    echo "  REDIS_MASTER_GROUP_NAME       Redis master group name for sentinel mode (default: mymaster)"
    echo "  REDIS_REPLICA_COUNT           Redis replica count for sentinel mode (default: 3)"
    echo "  REDIS_SENTINEL_QUORUM         Redis sentinel quorum (default: 2)"
    echo "  KAFKA_NAMESPACE               Kafka namespace (default: \${RESOURCE_NAMESPACE})"
    echo "  KAFKA_RELEASE_NAME            Kafka Helm release name (default: kafka)"
    echo "  KAFKA_CHART_VERSION           Bitnami Kafka chart version (default: 32.4.3)"
    echo "  KAFKA_CHART_TGZ               Local Kafka chart tgz (default: \${LOCAL_CHARTS_DIR}/kafka-\${KAFKA_CHART_VERSION}.tgz)"
    echo "  KAFKA_IMAGE                   Kafka image (default: swr.cn-east-3.myhuaweicloud.com/kweaver-ai/bitnami/kafka:3.9.0-debian-12-r10)"
    echo "  KAFKA_HELM_TIMEOUT            Helm wait timeout for Kafka install/upgrade (default: 1800s)"
    echo "  KAFKA_HELM_ATOMIC             Helm atomic install for Kafka (default: false; set true to auto-rollback on failure)"
    echo "  KAFKA_READY_TIMEOUT           Post-install wait for Kafka pods Ready (default: 600s)"
    echo "  KAFKA_HEAP_OPTS               Kafka heap opts (default: -Xms256m -Xmx256m)"
    echo "  KAFKA_MEMORY_REQUEST          Kafka memory request (default: 256Mi)"
    echo "  KAFKA_MEMORY_LIMIT            Kafka memory limit (default: 512Mi)"
    echo "  KAFKA_PERSISTENCE_ENABLED     Enable Kafka persistence (default: true; auto-fallback to false if no StorageClass)"
    echo "  KAFKA_STORAGE_CLASS           Kafka storageClass name (default: empty)"
    echo "  KAFKA_STORAGE_SIZE            Kafka storage size (default: 8Gi)"
    echo "  KAFKA_PURGE_PVC               Purge Kafka PVC on uninstall (default: true; set false to retain data)"
    echo "  KAFKA_PROTOCOL                Kafka listener protocol (default: PLAINTEXT)"
    echo "  KAFKA_REPLICAS                Kafka controller replicas (default: 1; single node)"
    echo "  KAFKA_AUTO_CREATE_TOPICS_ENABLE Enable auto-creation of topics (default: true)"
    echo "  OPENSEARCH_NAMESPACE          OpenSearch namespace (default: \${RESOURCE_NAMESPACE})"
    echo "  OPENSEARCH_RELEASE_NAME       OpenSearch Helm release name (default: opensearch)"
    echo "  OPENSEARCH_CLUSTER_NAME       OpenSearch clusterName (default: opensearch-cluster)"
    echo "  OPENSEARCH_NODE_GROUP         OpenSearch nodeGroup (default: master)"
    echo "  OPENSEARCH_CHART_VERSION      OpenSearch chart version (default: 3.4.0)"
    echo "  OPENSEARCH_CHART_TGZ          Local OpenSearch chart tgz (default: \${LOCAL_OPENSEARCH_CHARTS_DIR}/opensearch-\${OPENSEARCH_CHART_VERSION}.tgz)"
    echo "  OPENSEARCH_IMAGE              OpenSearch image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/opensearchproject/opensearch:3.4.0)"
    echo "  OPENSEARCH_INIT_IMAGE         OpenSearch init (busybox) image (default: \${LOCALPV_HELPER_IMAGE})"
    echo "  OPENSEARCH_JAVA_OPTS          OpenSearch JVM opts (default: -Xms512m -Xmx512m -XX:MaxDirectMemorySize=128m)"
    echo "  OPENSEARCH_MEMORY_REQUEST     OpenSearch memory request (default: 512Mi)"
    echo "  OPENSEARCH_MEMORY_LIMIT       OpenSearch memory limit (default: 2048Mi, increased for plugin installation)"
    echo "  OPENSEARCH_PROTOCOL           OpenSearch protocol in config.yaml (default: http; set https to enable security)"
    echo "  OPENSEARCH_DISABLE_SECURITY   Disable opensearch-security plugin (default: auto; true when OPENSEARCH_PROTOCOL=http)"
    echo "  OPENSEARCH_SINGLE_NODE        OpenSearch single node mode (default: true)"
    echo "  OPENSEARCH_PERSISTENCE_ENABLED Enable OpenSearch persistence (default: true; auto-fallback to false if no StorageClass)"
    echo "  OPENSEARCH_STORAGE_CLASS      OpenSearch storageClass name (default: empty)"
    echo "  OPENSEARCH_STORAGE_SIZE       OpenSearch storage size (default: 8Gi)"
    echo "  OPENSEARCH_PURGE_PVC          Purge OpenSearch PVC on uninstall (default: false)"
    echo "  OPENSEARCH_INITIAL_ADMIN_PASSWORD OpenSearch admin password (default: OpenSearch@123456)"
    echo "  OPENSEARCH_SYSCTL_INIT_ENABLED Enable sysctl initContainer (default: true)"
    echo "  OPENSEARCH_SYSCTL_VM_MAX_MAP_COUNT vm.max_map_count value (default: 262144)"
    echo "  LOCAL_ZOOKEEPER_CHARTS_DIR     Local Zookeeper charts dir (default: \${SCRIPT_DIR}/charts/zookeeper)"
    echo "  ZOOKEEPER_NAMESPACE            Zookeeper namespace (default: \${RESOURCE_NAMESPACE})"
    echo "  ZOOKEEPER_RELEASE_NAME         Zookeeper Helm release name (default: zookeeper)"
    echo "  ZOOKEEPER_CHART_REF            Zookeeper chart reference (default: local chart path; set to 'dip/zookeeper' for remote repo)"
    echo "  ZOOKEEPER_CHART_VERSION        Zookeeper chart version (--version flag, e.g., '0.0.0-feature-800792')"
    echo "  ZOOKEEPER_CHART_DEVEL          Use --devel flag for development versions (default: false)"
    echo "  ZOOKEEPER_VALUES_FILE          Additional values file path (e.g., 'conf/config.yaml')"
    echo "  ZOOKEEPER_EXTRA_SET_VALUES     Additional --set values (space-separated, e.g., 'image.registry=xxx key2=value2')"
    echo "  ZOOKEEPER_REPLICAS             Zookeeper replicas (default: 1; single node)"
    echo "  ZOOKEEPER_IMAGE_REGISTRY       Zookeeper image registry (default: acr.aishu.cn)"
    echo "  ZOOKEEPER_IMAGE_REPOSITORY     Zookeeper image repository (default: proton/proton-zookeeper)"
    echo "  ZOOKEEPER_IMAGE_TAG            Zookeeper image tag (default: 5.6.0-20250625.2.138fb9)"
    echo "  ZOOKEEPER_EXPORTER_IMAGE_REPOSITORY Zookeeper exporter image repository (default: proton/proton-zookeeper-exporter)"
    echo "  ZOOKEEPER_EXPORTER_IMAGE_TAG   Zookeeper exporter image tag (default: 5.6.0-20250625.2.138fb9)"
    echo "  ZOOKEEPER_SERVICE_PORT         Zookeeper service port (default: 2181)"
    echo "  ZOOKEEPER_EXPORTER_PORT        Zookeeper exporter port (default: 9101)"
    echo "  ZOOKEEPER_JMX_EXPORTER_PORT    Zookeeper JMX exporter port (default: 9995)"
    echo "  ZOOKEEPER_STORAGE_CLASS        Zookeeper storageClass name (default: empty)"
    echo "  ZOOKEEPER_STORAGE_SIZE         Zookeeper storage size (default: 1Gi)"
    echo "  ZOOKEEPER_PURGE_PVC            Purge Zookeeper PVC on uninstall (default: true; set false to retain data)"
    echo "  ZOOKEEPER_RESOURCES_REQUESTS_CPU Zookeeper CPU request (default: 500m)"
    echo "  ZOOKEEPER_RESOURCES_REQUESTS_MEMORY Zookeeper memory request (default: 1Gi)"
    echo "  ZOOKEEPER_RESOURCES_LIMITS_CPU Zookeeper CPU limit (default: 1000m)"
    echo "  ZOOKEEPER_RESOURCES_LIMITS_MEMORY Zookeeper memory limit (default: 2Gi)"
    echo "  ZOOKEEPER_JVMFLAGS             Zookeeper JVM flags (default: -Xms500m -Xmx500m)"
    echo "  ZOOKEEPER_SASL_ENABLED         Enable Zookeeper SASL authentication (default: true)"
    echo "  ZOOKEEPER_SASL_USER            Zookeeper SASL username (default: kafka)"
    echo "  ZOOKEEPER_SASL_PASSWORD        Zookeeper SASL password"
    echo "  INGRESS_NGINX_HOSTNETWORK     Use hostNetwork for ingress controller (default: true)"
    echo "  INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED Enable ingress admission webhook (default: false)"
    echo "  INGRESS_NGINX_HTTP_PORT       Ingress-nginx HTTP NodePort (used when INGRESS_NGINX_HOSTNETWORK=false; default: 30080)"
    echo "  INGRESS_NGINX_HTTPS_PORT      Ingress-nginx HTTPS NodePort (used when INGRESS_NGINX_HOSTNETWORK=false; default: 30443)"
    echo "  INGRESS_NGINX_CLASS           IngressClass name (default: nginx)"
    echo "  INGRESS_NGINX_CONTROLLER_IMAGE ingress-nginx controller image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/registry.k8s.io/ingress-nginx/controller:v1.14.1)"
    echo "  INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE webhook certgen image (default: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.1)"
    echo "  INGRESS_NGINX_CHART_VERSION   ingress-nginx chart version (default: 4.13.1)"
    echo "  INGRESS_NGINX_CHART_TGZ       Local ingress-nginx chart tgz (default: \${LOCAL_INGRESS_NGINX_CHARTS_DIR}/ingress-nginx-\${INGRESS_NGINX_CHART_VERSION}.tgz)"
    echo "  AUTO_INSTALL_INGRESS_NGINX    Auto install ingress-nginx during k8s init (default: true)"
    echo ""
    echo "Examples:"
    echo "  $0 k8s init                   # Initialize K8s master node with default settings"
    echo "  $0 k8s reset                  # Reset cluster state before re-init"
    echo "  $0 k8s status                 # Show cluster status"
    echo "  POD_CIDR=10.0.0.0/16 $0 k8s init  # Initialize with custom POD_CIDR"
    echo "  $0 mariadb init               # Install MariaDB"
    echo "  $0 mariadb uninstall          # Uninstall MariaDB"
    echo "  $0 mariadb uninstall --delete-data  # Uninstall MariaDB and delete PVC (data loss!)"
    echo "  MARIADB_PURGE_PVC=true $0 mariadb uninstall  # Same as --delete-data (data loss!)"
    echo "  $0 redis init                 # Install Redis"
    echo "  $0 redis uninstall            # Uninstall Redis"
    echo "  $0 redis uninstall                         # Uninstall Redis (PVCs deleted by default)"
    echo "  REDIS_PURGE_PVC=false $0 redis uninstall   # Uninstall Redis but keep PVCs"
    echo "  $0 kafka init                 # Install Kafka"
    echo "  $0 kafka uninstall                         # Uninstall Kafka (PVCs deleted by default)"
    echo "  KAFKA_PURGE_PVC=false $0 kafka uninstall   # Uninstall Kafka but keep PVCs"
    echo "  $0 opensearch init            # Install OpenSearch"
    echo "  $0 opensearch uninstall       # Uninstall OpenSearch"
    echo "  OPENSEARCH_PURGE_PVC=true $0 opensearch uninstall  # Uninstall OpenSearch and delete PVC (data loss!)"
    echo "  $0 mongodb init               # Install MongoDB"
    echo "  $0 mongodb uninstall          # Uninstall MongoDB (PVCs will be deleted)"
    echo "  $0 zookeeper init             # Install Zookeeper"
    echo "  $0 zookeeper uninstall        # Uninstall Zookeeper (PVCs deleted by default)"
    echo "  ZOOKEEPER_PURGE_PVC=false $0 zookeeper uninstall  # Uninstall Zookeeper but keep PVCs"
    echo "  # Install from remote repo with version and devel:"
    echo "  ZOOKEEPER_CHART_REF=dip/zookeeper ZOOKEEPER_CHART_VERSION=0.0.0-feature-800792 ZOOKEEPER_CHART_DEVEL=true $0 zookeeper init"
    echo "  # Install with additional values file and --set:"
    echo "  ZOOKEEPER_VALUES_FILE=conf/config.yaml ZOOKEEPER_EXTRA_SET_VALUES='image.registry=swr.cn-east-3.myhuaweicloud.com/kweaver-ai' $0 zookeeper init"
    echo "  $0 ingress-nginx init         # Install ingress-nginx-controller"
    echo "  $0 ingress-nginx uninstall    # Uninstall ingress-nginx-controller"
    echo "  $0 config generate            # Generate/update conf/config.yaml"
    echo "  $0 all init                   # Full initialization with all components"
}


# Interactive menu for component selection
interactive_menu() {
    # Component definitions: name, description, function
    declare -a components=(
        "K8S:Initialize Single-Node Kubernetes cluster with scheduling enabled (kubeadm init, CNI, DNS):install_k8s_cluster"
        "LOCALPV:Install local-path-provisioner (storage):install_localpv"
        "MARIADB:Install MariaDB database:install_mariadb"
        "REDIS:Install Redis cache:install_redis"
        "KAFKA:Install Kafka message queue:install_kafka"
        "OPENSEARCH:Install OpenSearch search engine:install_opensearch"
        "MONGODB:Install MongoDB database:install_mongodb"
        "ZOOKEEPER:Install Zookeeper coordination service:install_zookeeper"
        "INGRESS_NGINX:Install ingress-nginx controller:install_ingress_nginx"
    )
    
    # Selection state (1=selected, 0=unselected), default all selected
    declare -a selected=()
    local total=${#components[@]}
    for ((i=0; i<total; i++)); do
        selected[$i]=1
    done
    local current=0
    
    # Helper function to install k8s cluster
    install_k8s_cluster() {
        check_root
        # Pre-install dependencies (containerd, k8s, helm) before k8s init
        log_info "Pre-installing dependencies..."
        detect_package_manager
        install_containerd
        install_kubernetes
        install_helm
        
        check_prerequisites
        init_k8s_master
        allow_master_scheduling
        install_cni
        wait_for_dns
        
        if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                install_localpv
            fi
        fi
    }
    
    # Clear screen and show menu
    show_menu() {
        clear
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║${NC}  ${YELLOW}Kubernetes Infrastructure Installation - Component Selection${NC}  ${GREEN}║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  ${YELLOW}Use arrow keys to navigate, SPACE to toggle, ENTER to confirm${NC}"
        echo ""
        
        for i in "${!components[@]}"; do
            local comp_info="${components[$i]}"
            local comp_name="${comp_info%%:*}"
            local comp_desc="${comp_info#*:}"
            comp_desc="${comp_desc%%:*}"
            
            if [[ $i -eq $current ]]; then
                echo -ne "${GREEN}▶${NC} "
            else
                echo -ne "  "
            fi
            
            if [[ ${selected[$i]} -eq 1 ]]; then
                echo -ne "${GREEN}[✓]${NC} "
            else
                echo -ne "${RED}[ ]${NC} "
            fi
            
            echo -e "${comp_name}: ${comp_desc}"
        done
        
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║${NC}  ${YELLOW}Controls: ↑↓ Navigate  SPACE Toggle  ENTER Confirm  Q Quit${NC}  ${GREEN}║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    }
    
    # Read single character with proper error handling
    read_char() {
        local char
        local next_char
        
        # Read first character (escape sequence starts with \x1b)
        # Use -s to suppress echo, -n 1 to read one character, -r to not interpret backslashes
        # Redirect stderr to /dev/null to avoid cluttering UI on signal interrupts
        if ! IFS= read -rsn1 char 2>/dev/null; then
            echo "ERROR"
            return 0
        fi
        
        # Check for escape sequence (arrow keys)
        if [[ "$char" == $'\x1b' ]]; then
            # Read next character with timeout (should be '[')
            if IFS= read -rsn1 -t 0.1 next_char 2>/dev/null; then
                if [[ "$next_char" == "[" ]]; then
                    # Read the actual key code
                    if IFS= read -rsn1 -t 0.1 next_char 2>/dev/null; then
                        case "$next_char" in
                            A) 
                                echo "UP"
                                return 0
                                ;;
                            B) 
                                echo "DOWN"
                                return 0
                                ;;
                            *)
                                # Unknown escape sequence, ignore
                                echo "UNKNOWN"
                                return 0
                                ;;
                        esac
                    else
                        # Timeout reading key code
                        echo "UNKNOWN"
                        return 0
                    fi
                else
                    # Not '[' after ESC, might be ESC key or other sequence
                    echo "UNKNOWN"
                    return 0
                fi
            else
                # Timeout reading after ESC, might be ESC key
                echo "UNKNOWN"
                return 0
            fi
        fi
        
        # Handle regular characters
        case "$char" in
            " ") 
                echo "SPACE"
                return 0
                ;;
            ""|$'\n'|$'\r') 
                echo "ENTER"
                return 0
                ;;
            q|Q) 
                echo "QUIT"
                return 0
                ;;
            *) 
                # Ignore other characters
                echo "UNKNOWN"
                return 0
                ;;
        esac
    }
    
    # Main menu loop
    while true; do
        show_menu
        
        local key
        key=$(read_char) || key=""
        
        # Ignore empty keys, unknown characters or failed reads
        if [[ -z "$key" || "$key" == "UNKNOWN" || "$key" == "ERROR" ]]; then
            continue
        fi
        
        case "$key" in
            UP)
                if [[ $current -gt 0 ]]; then
                    current=$((current - 1))
                fi
                ;;
            DOWN)
                if [[ $current -lt $((total - 1)) ]]; then
                    current=$((current + 1))
                fi
                ;;
            SPACE)
                if [[ ${selected[$current]} -eq 1 ]]; then
                    selected[$current]=0
                else
                    selected[$current]=1
                fi
                ;;
            ENTER)
                # Check if at least one component is selected
                local has_selection=0
                for sel in "${selected[@]}"; do
                    if [[ $sel -eq 1 ]]; then
                        has_selection=1
                        break
                    fi
                done
                
                if [[ $has_selection -eq 0 ]]; then
                    echo -e "\n${RED}Error: Please select at least one component!${NC}"
                    sleep 2
                    continue
                fi
                
                # Show confirmation
                clear
                echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
                echo -e "${GREEN}║${NC}  ${YELLOW}Installation Summary${NC}                                              ${GREEN}║${NC}"
                echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
                echo ""
                echo -e "${YELLOW}Selected components:${NC}"
                for i in "${!components[@]}"; do
                    if [[ ${selected[$i]} -eq 1 ]]; then
                        local comp_info="${components[$i]}"
                        local comp_name="${comp_info%%:*}"
                        echo -e "  ${GREEN}✓${NC} ${comp_name}"
                    fi
                done
                echo ""
                echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
                echo -e "${RED}║${NC}  ${YELLOW}⚠ IMPORTANT NOTICE${NC}                                                  ${RED}║${NC}"
                echo -e "${RED}║${NC}                                                                  ${RED}║${NC}"
                echo -e "${RED}║${NC}  Please ensure you have configured valid yum/dnf repository${NC}  ${RED}║${NC}"
                echo -e "${RED}║${NC}  sources to install required packages (tar, curl, etc.)${NC}      ${RED}║${NC}"
                echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
                echo ""
                echo -e "${YELLOW}Proceed with installation? (y/n):${NC} "
                read -r confirm
                if [[ "$confirm" =~ ^[Yy]$ ]]; then
                    break
                else
                    continue
                fi
                ;;
            QUIT)
                echo -e "\n${YELLOW}Installation cancelled.${NC}"
                exit 0
                ;;
        esac
    done
    
    # Execute selected components in order
    clear
    log_info "Starting installation of selected components..."
    echo ""
    
    # Execute selected components in order
    for i in "${!components[@]}"; do
        if [[ ${selected[$i]} -eq 1 ]]; then
            local comp_info="${components[$i]}"
            local comp_func="${comp_info##*:}"
            local comp_name="${comp_info%%:*}"
            
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}Installing: ${comp_name}${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
            
            if [[ "$comp_func" == "install_k8s_cluster" ]]; then
                install_k8s_cluster
            elif [[ "$comp_func" == "install_localpv" ]]; then
                check_root
                install_localpv
            elif [[ "$comp_func" == "install_mariadb" ]]; then
                check_root
                install_mariadb
            elif [[ "$comp_func" == "install_redis" ]]; then
                check_root
                install_redis
            elif [[ "$comp_func" == "install_kafka" ]]; then
                check_root
                install_kafka
            elif [[ "$comp_func" == "install_opensearch" ]]; then
                check_root
                install_opensearch
            elif [[ "$comp_func" == "install_mongodb" ]]; then
                check_root
                install_mongodb
            elif [[ "$comp_func" == "install_zookeeper" ]]; then
                check_root
                install_zookeeper
            elif [[ "$comp_func" == "install_ingress_nginx" ]]; then
                check_root
                install_ingress_nginx
            fi
        fi
    done
    
    # Generate config if k8s is installed
    if kubectl cluster-info &>/dev/null; then
        if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
            generate_config_yaml
        fi
        show_status
    fi
    
    echo ""
    log_info "Installation completed!"
}


# Main function
main() {
    local module="${1:-}"
    local action="${2:-}"
    
    # If no arguments, show interactive menu
    if [[ -z "${module}" ]]; then
        interactive_menu
        return 0
    fi

    if [[ "${module}" == "config" ]]; then
        case "${action}" in
            generate)
                check_root
                generate_config_yaml
                ;;
            *)
                log_error "Unknown config action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi

    # Handle storage module
    if [[ "${module}" == "storage" ]]; then
        case "${action}" in
            init)
                check_root
                install_localpv
                ;;
            *)
                log_error "Unknown storage action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle k8s module
    if [[ "${module}" == "k8s" ]]; then
        case "${action}" in
            init)
                check_root
                # Pre-install dependencies (containerd, k8s, helm) before k8s init
                log_info "Pre-installing dependencies..."
                detect_package_manager
                install_containerd
                install_kubernetes
                install_helm
                
                check_prerequisites
                init_k8s_master
                allow_master_scheduling
                install_cni
                wait_for_dns

                if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                    if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                        install_localpv
                    fi
                fi

                if [[ "${AUTO_INSTALL_INGRESS_NGINX}" == "true" ]]; then
                    if ! command -v helm >/dev/null 2>&1; then
                        log_error "Helm is required to install ingress-nginx. Please run: $0 k8s init"
                        exit 1
                    fi
                    install_ingress_nginx
                fi

                if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
                    generate_config_yaml
                fi
                show_status
                ;;
            reset)
                reset_k8s
                ;;
            status)
                show_status
                ;;
            *)
                log_error "Unknown k8s action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle mariadb module
    if [[ "${module}" == "mariadb" ]]; then
        case "${action}" in
            init)
                check_root
                install_mariadb
                ;;
            uninstall)
                check_root
                shift 2
                uninstall_mariadb "$@"
                ;;
            *)
                log_error "Unknown mariadb action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle redis module
    if [[ "${module}" == "redis" ]]; then
        case "${action}" in
            init)
                check_root
                install_redis
                ;;
            uninstall)
                check_root
                uninstall_redis
                ;;
            *)
                log_error "Unknown redis action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi

    # Handle opensearch module
    if [[ "${module}" == "opensearch" ]]; then
        case "${action}" in
            init)
                check_root
                install_opensearch
                ;;
            uninstall)
                check_root
                uninstall_opensearch
                ;;
            *)
                log_error "Unknown opensearch action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi

    # Handle mongodb module
    if [[ "${module}" == "mongodb" ]]; then
        case "${action}" in
            init)
                check_root
                install_mongodb
                ;;
            uninstall)
                check_root
                uninstall_mongodb
                ;;
            *)
                log_error "Unknown mongodb action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi

    # Handle zookeeper module
    if [[ "${module}" == "zookeeper" ]]; then
        case "${action}" in
            init)
                check_root
                install_zookeeper
                ;;
            uninstall)
                check_root
                uninstall_zookeeper
                ;;
            *)
                log_error "Unknown zookeeper action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi

    # Handle kafka module
    if [[ "${module}" == "kafka" ]]; then
        case "${action}" in
            init)
                check_root
                install_kafka
                ;;
            uninstall)
                check_root
                uninstall_kafka
                ;;
            *)
                log_error "Unknown kafka action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle ingress-nginx module
    if [[ "${module}" == "ingress-nginx" ]]; then
        case "${action}" in
            init)
                check_root
                install_ingress_nginx
                ;;
            uninstall)
                check_root
                uninstall_ingress_nginx
                ;;
            *)
                log_error "Unknown ingress-nginx action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle studio module
    if [[ "${module}" == "studio" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_studio_args "init" "$@"
                install_studio
                ;;
            uninstall)
                shift 2
                parse_studio_args "uninstall" "$@"
                uninstall_studio
                ;;
            status)
                show_studio_status
                ;;
            *)
                log_error "Unknown studio action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle ontology module
    if [[ "${module}" == "ontology" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_ontology_args "init" "$@"
                install_ontology
                ;;
            uninstall)
                shift 2
                parse_ontology_args "uninstall" "$@"
                uninstall_ontology
                ;;
            status)
                show_ontology_status
                ;;
            *)
                log_error "Unknown ontology action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle agent_operator module (supports both agent_operator and agentoperator)
    if [[ "${module}" == "agent_operator" ]] || [[ "${module}" == "agentoperator" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_agentoperator_args "init" "$@"
                install_agentoperator
                ;;
            uninstall)
                shift 2
                parse_agentoperator_args "uninstall" "$@"
                uninstall_agentoperator
                ;;
            status)
                show_agentoperator_status
                ;;
            *)
                log_error "Unknown agentoperator action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle dataagent module
    if [[ "${module}" == "dataagent" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_dataagent_args "init" "$@"
                install_dataagent
                ;;
            uninstall)
                shift 2
                parse_dataagent_args "uninstall" "$@"
                uninstall_dataagent
                ;;
            status)
                show_dataagent_status
                ;;
            *)
                log_error "Unknown dataagent action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle flowautomation module
    if [[ "${module}" == "flowautomation" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_flowautomation_args "init" "$@"
                install_flowautomation
                ;;
            uninstall)
                shift 2
                parse_flowautomation_args "uninstall" "$@"
                uninstall_flowautomation
                ;;
            status)
                show_flowautomation_status
                ;;
            *)
                log_error "Unknown flowautomation action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle isf module
    if [[ "${module}" == "isf" ]]; then
        case "${action}" in
            init)
                shift 2
                parse_isf_args "init" "$@"
                install_isf
                ;;
            uninstall)
                shift 2
                parse_isf_args "uninstall" "$@"
                uninstall_isf
                ;;
            status)
                show_isf_status
                ;;
            *)
                log_error "Unknown isf action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Handle all module (full initialization)
    if [[ "${module}" == "all" ]]; then
        case "${action}" in
            init)
                check_root
                # Pre-install dependencies (containerd, k8s, helm) before k8s init
                log_info "Pre-installing dependencies..."
                detect_package_manager
                install_containerd
                install_kubernetes
                install_helm
                
                check_prerequisites
                init_k8s_master
                allow_master_scheduling
                install_cni
                wait_for_dns

                if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                    if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                        install_localpv
                    fi
                fi
                install_mariadb
                install_redis
                install_kafka
                install_zookeeper
                install_mongodb
                if [[ "${AUTO_INSTALL_INGRESS_NGINX}" == "true" ]]; then
                    install_ingress_nginx
                fi
                install_opensearch
                if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
                    generate_config_yaml
                fi
                show_status
                ;;
            *)
                log_error "Unknown all action: ${action}"
                usage
                exit 1
                ;;
        esac
        return 0
    fi
    
    # Unknown module
    usage
    exit 1
}

main "$@"
