#!/bin/bash
set -e

# =============================================================================
# Kubernetes Infrastructure Initialization Script
# =============================================================================
# Features:
#   1. Initialize K8s master node with scheduling enabled
#   2. Auto-install CNI (Calico) and DNS (CoreDNS)
#   3. Install Helm 3
#   4. Install single-node MariaDB 11 via Helm
#   5. Install single-node Redis 7 via Helm
# =============================================================================

# =============================================================================
# Global Configuration Variables
# =============================================================================
# Script directory (used for local chart paths)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Local config/manifest directory (vendored files to avoid runtime fetching)
CONF_DIR="${CONF_DIR:-${SCRIPT_DIR}/conf}"

# Local Helm charts directory (optional; if local chart tgz exists, prefer it)
LOCAL_CHARTS_DIR="${LOCAL_CHARTS_DIR:-${SCRIPT_DIR}/charts/bitnami}"
LOCAL_INGRESS_NGINX_CHARTS_DIR="${LOCAL_INGRESS_NGINX_CHARTS_DIR:-${SCRIPT_DIR}/charts/ingress-nginx}"

# Default namespace for infrastructure components (MariaDB/Redis/Kafka/OpenSearch, etc.)
RESOURCE_NAMESPACE="${RESOURCE_NAMESPACE:-resource}"

# Generate/update application config file after installs
AUTO_GENERATE_CONFIG="${AUTO_GENERATE_CONFIG:-true}"
CONFIG_YAML_PATH="${CONFIG_YAML_PATH:-${CONF_DIR}/config.yaml}"

# Image registry prefix loaded from conf/config.yaml (image.registry) or env
IMAGE_REGISTRY="${IMAGE_REGISTRY:-}"

# Kubernetes Network Configuration
POD_CIDR="${POD_CIDR:-192.169.0.0/16}"
SERVICE_CIDR="${SERVICE_CIDR:-10.96.0.0/12}"

# Kubernetes API Server Configuration
API_SERVER_ADVERTISE_ADDRESS="${API_SERVER_ADVERTISE_ADDRESS:-}"

# Kubernetes Image Repository Configuration
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-registry.aliyuncs.com/google_containers}"

# Kubernetes yum repo (Aliyun mirror) for kubeadm/kubelet/kubectl/cri-tools
K8S_RPM_REPO_BASEURL="${K8S_RPM_REPO_BASEURL:-https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.28/rpm/}"
K8S_RPM_REPO_GPGKEY="${K8S_RPM_REPO_GPGKEY:-https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.28/rpm/repodata/repomd.xml.key}"

# Flannel CNI Image Repository Configuration
FLANNEL_IMAGE_REPO="${FLANNEL_IMAGE_REPO:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/}"
FLANNEL_MANIFEST_PATH="${FLANNEL_MANIFEST_PATH:-${CONF_DIR}/kube-flannel.yml}"
FLANNEL_MANIFEST_URL="${FLANNEL_MANIFEST_URL:-https://raw.githubusercontent.com/flannel-io/flannel/v0.25.5/Documentation/kube-flannel.yml}"


# Helm Configuration
HELM_REPO_BITNAMI="${HELM_REPO_BITNAMI:-https://charts.bitnami.com/bitnami}"
HELM_REPO_INGRESS_NGINX="${HELM_REPO_INGRESS_NGINX:-https://kubernetes.github.io/ingress-nginx}"
HELM_REPO_OPENSEARCH="${HELM_REPO_OPENSEARCH:-https://opensearch-project.github.io/helm-charts}"
HELM_INSTALL_SCRIPT_PATH="${HELM_INSTALL_SCRIPT_PATH:-${CONF_DIR}/get-helm-3}"
HELM_INSTALL_SCRIPT_URL="${HELM_INSTALL_SCRIPT_URL:-https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3}"
HELM_VERSION="${HELM_VERSION:-v3.19.0}"
HELM_TARBALL_BASEURL="${HELM_TARBALL_BASEURL:-https://repo.huaweicloud.com/helm/${HELM_VERSION}/}"

DOCKER_IO_MIRROR_PREFIX="${DOCKER_IO_MIRROR_PREFIX:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/}"
DOCKER_CE_REPO_URL="${DOCKER_CE_REPO_URL:-http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo}"
LOCALPV_PROVISIONER_IMAGE="${LOCALPV_PROVISIONER_IMAGE:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/rancher/local-path-provisioner:v0.0.32}"
LOCALPV_HELPER_IMAGE="${LOCALPV_HELPER_IMAGE:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/busybox:1.36.1}"
LOCALPV_MANIFEST_PATH="${LOCALPV_MANIFEST_PATH:-${CONF_DIR}/local-path-storage.yaml}"
LOCALPV_MANIFEST_URL="${LOCALPV_MANIFEST_URL:-https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.32/deploy/local-path-storage.yaml}"
LOCALPV_BASE_PATH="${LOCALPV_BASE_PATH:-/opt/local-path-provisioner}"
LOCALPV_SET_DEFAULT="${LOCALPV_SET_DEFAULT:-true}"
AUTO_INSTALL_LOCALPV="${AUTO_INSTALL_LOCALPV:-true}"

# MariaDB Configuration
MARIADB_NAMESPACE="${MARIADB_NAMESPACE:-${RESOURCE_NAMESPACE}}"
MARIADB_IMAGE="${MARIADB_IMAGE:-}"
MARIADB_IMAGE_REPOSITORY="${MARIADB_IMAGE_REPOSITORY:-mariadb}"
MARIADB_IMAGE_TAG="${MARIADB_IMAGE_TAG:-11.4.7}"
MARIADB_IMAGE_FALLBACK="${MARIADB_IMAGE_FALLBACK:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/bitnami/mariadb:11.4.7-debian-12-r2}"
MARIADB_VERSION="${MARIADB_VERSION:-11.4}"
MARIADB_CHART_VERSION="${MARIADB_CHART_VERSION:-20.0.0}"
MARIADB_CHART_TGZ="${MARIADB_CHART_TGZ:-${LOCAL_CHARTS_DIR}/mariadb-${MARIADB_CHART_VERSION}.tgz}"
MARIADB_PERSISTENCE_ENABLED="${MARIADB_PERSISTENCE_ENABLED:-true}"
MARIADB_STORAGE_CLASS="${MARIADB_STORAGE_CLASS:-}"
MARIADB_PURGE_PVC="${MARIADB_PURGE_PVC:-false}"
MARIADB_ROOT_PASSWORD="${MARIADB_ROOT_PASSWORD:-mariadb-root-password}"
MARIADB_DATABASE="${MARIADB_DATABASE:-adp}"
MARIADB_USER="${MARIADB_USER:-adp}"
MARIADB_PASSWORD="${MARIADB_PASSWORD:-adp@123456}"
MARIADB_STORAGE_SIZE="${MARIADB_STORAGE_SIZE:-10Gi}"
MARIADB_MAX_CONNECTIONS="${MARIADB_MAX_CONNECTIONS:-5000}"

# Redis Configuration
REDIS_NAMESPACE="${REDIS_NAMESPACE:-${RESOURCE_NAMESPACE}}"
REDIS_VERSION="${REDIS_VERSION:-7.4}"
REDIS_CHART_VERSION="${REDIS_CHART_VERSION:-20.3.0}"
REDIS_CHART_TGZ="${REDIS_CHART_TGZ:-${LOCAL_CHARTS_DIR}/redis-${REDIS_CHART_VERSION}.tgz}"
REDIS_USE_LOCAL_CHART="${REDIS_USE_LOCAL_CHART:-false}"
REDIS_LOCAL_CHART_DIR="${REDIS_LOCAL_CHART_DIR:-${SCRIPT_DIR}/charts/proton-redis}"
REDIS_ARCHITECTURE="${REDIS_ARCHITECTURE:-standalone}"  # standalone or sentinel
REDIS_IMAGE="${REDIS_IMAGE:-}"
REDIS_IMAGE_REGISTRY="${REDIS_IMAGE_REGISTRY:-}"
REDIS_IMAGE_REPOSITORY="${REDIS_IMAGE_REPOSITORY:-proton/proton-redis}"
REDIS_IMAGE_TAG="${REDIS_IMAGE_TAG:-1.11.2-20251029.2.169ac3c0}"
REDIS_IMAGE_FALLBACK="${REDIS_IMAGE_FALLBACK:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/redis:8.4.0-alpine}"
REDIS_PERSISTENCE_ENABLED="${REDIS_PERSISTENCE_ENABLED:-true}"
REDIS_STORAGE_CLASS="${REDIS_STORAGE_CLASS:-}"
REDIS_PURGE_PVC="${REDIS_PURGE_PVC:-true}"
REDIS_PASSWORD="${REDIS_PASSWORD:-adp@redis123}"
REDIS_STORAGE_SIZE="${REDIS_STORAGE_SIZE:-5Gi}"
REDIS_MASTER_GROUP_NAME="${REDIS_MASTER_GROUP_NAME:-mymaster}"
REDIS_REPLICA_COUNT="${REDIS_REPLICA_COUNT:-1}"
REDIS_SENTINEL_QUORUM="${REDIS_SENTINEL_QUORUM:-1}"

# Kafka Configuration
KAFKA_NAMESPACE="${KAFKA_NAMESPACE:-${RESOURCE_NAMESPACE}}"
KAFKA_RELEASE_NAME="${KAFKA_RELEASE_NAME:-kafka}"
KAFKA_CHART_VERSION="${KAFKA_CHART_VERSION:-32.4.3}"
KAFKA_CHART_TGZ="${KAFKA_CHART_TGZ:-${LOCAL_CHARTS_DIR}/kafka-${KAFKA_CHART_VERSION}.tgz}"
# NOTE: Bitnami Kafka chart expects Bitnami Kafka images (/opt/bitnami/kafka/*).
# NOTE: Kafka 4.0 drops support for some older client protocol versions. Some apps (e.g. older Go clients)
# may still send JoinGroup v1 and will fail with:
#   UnsupportedVersionException: Received request for api with key 11 (JoinGroup) and unsupported version 1
# Default to a Kafka 3.x image for broader client compatibility; you can override via KAFKA_IMAGE/KAFKA_IMAGE_TAG.
# Use an SWR mirror by default to improve pull reliability in restricted networks.
KAFKA_IMAGE="${KAFKA_IMAGE:-swr.cn-east-3.myhuaweicloud.com/kweaver-ai/bitnami/kafka:3.9.0-debian-12-r10}"
KAFKA_IMAGE_REPOSITORY="${KAFKA_IMAGE_REPOSITORY:-bitnami/kafka}"
KAFKA_IMAGE_TAG="${KAFKA_IMAGE_TAG:-3.9.0-debian-12-r10}"
KAFKA_IMAGE_FALLBACK="${KAFKA_IMAGE_FALLBACK:-swr.cn-east-3.myhuaweicloud.com/kweaver-ai/bitnami/kafka:3.9.0-debian-12-r10}"
KAFKA_HELM_TIMEOUT="${KAFKA_HELM_TIMEOUT:-1800s}"
# NOTE: --atomic will auto-uninstall on failure, which makes debugging hard. Default to false.
KAFKA_HELM_ATOMIC="${KAFKA_HELM_ATOMIC:-false}"
KAFKA_READY_TIMEOUT="${KAFKA_READY_TIMEOUT:-600s}"
KAFKA_HEAP_OPTS="${KAFKA_HEAP_OPTS:--Xms256m -Xmx256m}"
KAFKA_MEMORY_REQUEST="${KAFKA_MEMORY_REQUEST:-256Mi}"
KAFKA_MEMORY_LIMIT="${KAFKA_MEMORY_LIMIT:-512Mi}"
KAFKA_PERSISTENCE_ENABLED="${KAFKA_PERSISTENCE_ENABLED:-true}"
KAFKA_STORAGE_CLASS="${KAFKA_STORAGE_CLASS:-}"
KAFKA_STORAGE_SIZE="${KAFKA_STORAGE_SIZE:-8Gi}"
# Delete Kafka PVCs by default on uninstall (set false to retain data)
KAFKA_PURGE_PVC="${KAFKA_PURGE_PVC:-true}"
KAFKA_AUTH_ENABLED="${KAFKA_AUTH_ENABLED:-true}"
KAFKA_PROTOCOL="${KAFKA_PROTOCOL:-SASL_PLAINTEXT}"
KAFKA_SASL_MECHANISM="${KAFKA_SASL_MECHANISM:-PLAIN}"
KAFKA_CLIENT_USER="${KAFKA_CLIENT_USER:-kafkauser}"
KAFKA_CLIENT_PASSWORD="${KAFKA_CLIENT_PASSWORD:-}"
KAFKA_INTERBROKER_USER="${KAFKA_INTERBROKER_USER:-inter_broker_user}"
KAFKA_INTERBROKER_PASSWORD="${KAFKA_INTERBROKER_PASSWORD:-}"
KAFKA_CONTROLLER_USER="${KAFKA_CONTROLLER_USER:-controller_user}"
KAFKA_CONTROLLER_PASSWORD="${KAFKA_CONTROLLER_PASSWORD:-}"
KAFKA_SASL_SECRET_NAME="${KAFKA_SASL_SECRET_NAME:-${KAFKA_RELEASE_NAME}-sasl}"
KAFKA_REPLICAS="${KAFKA_REPLICAS:-1}"
KAFKA_AUTO_CREATE_TOPICS_ENABLE="${KAFKA_AUTO_CREATE_TOPICS_ENABLE:-true}"

# OpenSearch Configuration
LOCAL_OPENSEARCH_CHARTS_DIR="${LOCAL_OPENSEARCH_CHARTS_DIR:-${SCRIPT_DIR}/charts/opensearch}"
OPENSEARCH_NAMESPACE="${OPENSEARCH_NAMESPACE:-${RESOURCE_NAMESPACE}}"
OPENSEARCH_RELEASE_NAME="${OPENSEARCH_RELEASE_NAME:-opensearch}"
OPENSEARCH_CLUSTER_NAME="${OPENSEARCH_CLUSTER_NAME:-opensearch-cluster}"
OPENSEARCH_NODE_GROUP="${OPENSEARCH_NODE_GROUP:-master}"
OPENSEARCH_CHART_VERSION="${OPENSEARCH_CHART_VERSION:-3.4.0}"
OPENSEARCH_CHART_TGZ="${OPENSEARCH_CHART_TGZ:-${LOCAL_OPENSEARCH_CHARTS_DIR}/opensearch-${OPENSEARCH_CHART_VERSION}.tgz}"
OPENSEARCH_IMAGE="${OPENSEARCH_IMAGE:-}"
OPENSEARCH_IMAGE_REPOSITORY="${OPENSEARCH_IMAGE_REPOSITORY:-opensearchproject/opensearch}"
OPENSEARCH_IMAGE_TAG="${OPENSEARCH_IMAGE_TAG:-3.4.0}"
OPENSEARCH_IMAGE_FALLBACK="${OPENSEARCH_IMAGE_FALLBACK:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/opensearchproject/opensearch:3.4.0}"
# OpenSearch chart uses busybox initContainers (fsgroup-volume/sysctl) by default; set a mirror to avoid Docker Hub pulls.
OPENSEARCH_INIT_IMAGE="${OPENSEARCH_INIT_IMAGE:-${LOCALPV_HELPER_IMAGE}}"
OPENSEARCH_JAVA_OPTS="${OPENSEARCH_JAVA_OPTS:--Xms512m -Xmx512m -XX:MaxDirectMemorySize=128m}"
OPENSEARCH_MEMORY_REQUEST="${OPENSEARCH_MEMORY_REQUEST:-512Mi}"
# NOTE: OpenSearch uses heap + direct memory + native overhead. 768Mi is too tight for -Xmx512m.
# Increased to 2Gi to support plugin installation (IK analyzer, etc.)
OPENSEARCH_MEMORY_LIMIT="${OPENSEARCH_MEMORY_LIMIT:-2048Mi}"
OPENSEARCH_PROTOCOL="${OPENSEARCH_PROTOCOL:-http}" # http (default) or https (requires enabling security)
OPENSEARCH_DISABLE_SECURITY="${OPENSEARCH_DISABLE_SECURITY:-}"
OPENSEARCH_SINGLE_NODE="${OPENSEARCH_SINGLE_NODE:-true}"
OPENSEARCH_PERSISTENCE_ENABLED="${OPENSEARCH_PERSISTENCE_ENABLED:-true}"
OPENSEARCH_STORAGE_CLASS="${OPENSEARCH_STORAGE_CLASS:-}"
OPENSEARCH_STORAGE_SIZE="${OPENSEARCH_STORAGE_SIZE:-8Gi}"
OPENSEARCH_PURGE_PVC="${OPENSEARCH_PURGE_PVC:-false}"
OPENSEARCH_INITIAL_ADMIN_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-OpenSearch@123456}"
OPENSEARCH_SYSCTL_INIT_ENABLED="${OPENSEARCH_SYSCTL_INIT_ENABLED:-true}"
OPENSEARCH_SYSCTL_VM_MAX_MAP_COUNT="${OPENSEARCH_SYSCTL_VM_MAX_MAP_COUNT:-262144}"

# MongoDB Configuration
LOCAL_MONGODB_CHARTS_DIR="${LOCAL_MONGODB_CHARTS_DIR:-${SCRIPT_DIR}/charts/mongodb}"
MONGODB_NAMESPACE="${MONGODB_NAMESPACE:-${RESOURCE_NAMESPACE}}"
MONGODB_RELEASE_NAME="${MONGODB_RELEASE_NAME:-mongodb}"
MONGODB_IMAGE="${MONGODB_IMAGE:-}"
MONGODB_IMAGE_REPOSITORY="${MONGODB_IMAGE_REPOSITORY:-acr.aishu.cn/proton/proton-mongo}"
MONGODB_IMAGE_TAG="${MONGODB_IMAGE_TAG:-2.1.0-feature-mongo-4.4.30}"
MONGODB_REPLICAS="${MONGODB_REPLICAS:-1}"
MONGODB_REPLSET_ENABLED="${MONGODB_REPLSET_ENABLED:-true}"  # Default: single-node replica set mode (requires keyfile)
MONGODB_REPLSET_NAME="${MONGODB_REPLSET_NAME:-rs0}"
MONGODB_SERVICE_TYPE="${MONGODB_SERVICE_TYPE:-ClusterIP}"
MONGODB_SERVICE_PORT="${MONGODB_SERVICE_PORT:-30280}"
MONGODB_WIRED_TIGER_CACHE_SIZE_GB="${MONGODB_WIRED_TIGER_CACHE_SIZE_GB:-4}"
MONGODB_STORAGE_CLASS="${MONGODB_STORAGE_CLASS:-}"
MONGODB_STORAGE_SIZE="${MONGODB_STORAGE_SIZE:-10Gi}"
MONGODB_SECRET_NAME="${MONGODB_SECRET_NAME:-mongodb-secret}"
MONGODB_SECRET_USERNAME="${MONGODB_SECRET_USERNAME:-admin}"
MONGODB_SECRET_PASSWORD="${MONGODB_SECRET_PASSWORD:-}"
MONGODB_RESOURCES_REQUESTS_CPU="${MONGODB_RESOURCES_REQUESTS_CPU:-100m}"
MONGODB_RESOURCES_REQUESTS_MEMORY="${MONGODB_RESOURCES_REQUESTS_MEMORY:-128Mi}"
MONGODB_RESOURCES_LIMITS_CPU="${MONGODB_RESOURCES_LIMITS_CPU:-1}"
MONGODB_RESOURCES_LIMITS_MEMORY="${MONGODB_RESOURCES_LIMITS_MEMORY:-1Gi}"

# Zookeeper Configuration
LOCAL_ZOOKEEPER_CHARTS_DIR="${LOCAL_ZOOKEEPER_CHARTS_DIR:-${SCRIPT_DIR}/charts/zookeeper}"
ZOOKEEPER_NAMESPACE="${ZOOKEEPER_NAMESPACE:-${RESOURCE_NAMESPACE}}"
ZOOKEEPER_RELEASE_NAME="${ZOOKEEPER_RELEASE_NAME:-zookeeper}"
ZOOKEEPER_CHART_REF="${ZOOKEEPER_CHART_REF:-}"  # e.g., "dip/zookeeper" for remote repo, or local path
ZOOKEEPER_CHART_VERSION="${ZOOKEEPER_CHART_VERSION:-}"  # Chart version (--version)
ZOOKEEPER_CHART_DEVEL="${ZOOKEEPER_CHART_DEVEL:-false}"  # Use --devel flag
ZOOKEEPER_VALUES_FILE="${ZOOKEEPER_VALUES_FILE:-}"  # Additional values file (e.g., conf/config.yaml)
ZOOKEEPER_REPLICAS="${ZOOKEEPER_REPLICAS:-1}"
ZOOKEEPER_IMAGE_REGISTRY="${ZOOKEEPER_IMAGE_REGISTRY:-acr.aishu.cn}"
ZOOKEEPER_IMAGE_REPOSITORY="${ZOOKEEPER_IMAGE_REPOSITORY:-proton/proton-zookeeper}"
ZOOKEEPER_IMAGE_TAG="${ZOOKEEPER_IMAGE_TAG:-5.6.0-20250625.2.138fb9}"
ZOOKEEPER_EXPORTER_IMAGE_REPOSITORY="${ZOOKEEPER_EXPORTER_IMAGE_REPOSITORY:-proton/proton-zookeeper-exporter}"
ZOOKEEPER_EXPORTER_IMAGE_TAG="${ZOOKEEPER_EXPORTER_IMAGE_TAG:-5.6.0-20250625.2.138fb9}"
ZOOKEEPER_SERVICE_PORT="${ZOOKEEPER_SERVICE_PORT:-2181}"
ZOOKEEPER_EXPORTER_PORT="${ZOOKEEPER_EXPORTER_PORT:-9101}"
ZOOKEEPER_JMX_EXPORTER_PORT="${ZOOKEEPER_JMX_EXPORTER_PORT:-9995}"
ZOOKEEPER_STORAGE_CLASS="${ZOOKEEPER_STORAGE_CLASS:-}"
ZOOKEEPER_STORAGE_SIZE="${ZOOKEEPER_STORAGE_SIZE:-1Gi}"
ZOOKEEPER_PURGE_PVC="${ZOOKEEPER_PURGE_PVC:-true}"
ZOOKEEPER_RESOURCES_REQUESTS_CPU="${ZOOKEEPER_RESOURCES_REQUESTS_CPU:-500m}"
ZOOKEEPER_RESOURCES_REQUESTS_MEMORY="${ZOOKEEPER_RESOURCES_REQUESTS_MEMORY:-1Gi}"
ZOOKEEPER_RESOURCES_LIMITS_CPU="${ZOOKEEPER_RESOURCES_LIMITS_CPU:-1000m}"
ZOOKEEPER_RESOURCES_LIMITS_MEMORY="${ZOOKEEPER_RESOURCES_LIMITS_MEMORY:-2Gi}"
ZOOKEEPER_JVMFLAGS="${ZOOKEEPER_JVMFLAGS:--Xms500m -Xmx500m}"
ZOOKEEPER_SASL_ENABLED="${ZOOKEEPER_SASL_ENABLED:-true}"
ZOOKEEPER_SASL_USER="${ZOOKEEPER_SASL_USER:-kafka}"
ZOOKEEPER_SASL_PASSWORD="${ZOOKEEPER_SASL_PASSWORD:-eisoo.com123}"
ZOOKEEPER_EXTRA_SET_VALUES="${ZOOKEEPER_EXTRA_SET_VALUES:-}"  # Additional --set values (space-separated, e.g., "image.registry=xxx key2=value2")

# Ingress-Nginx Configuration
INGRESS_NGINX_HTTP_PORT="${INGRESS_NGINX_HTTP_PORT:-30080}"
INGRESS_NGINX_HTTPS_PORT="${INGRESS_NGINX_HTTPS_PORT:-30443}"
INGRESS_NGINX_CLASS="${INGRESS_NGINX_CLASS:-class-443}"
INGRESS_NGINX_CONTROLLER_IMAGE="${INGRESS_NGINX_CONTROLLER_IMAGE:-}"
INGRESS_NGINX_CONTROLLER_IMAGE_REPOSITORY="${INGRESS_NGINX_CONTROLLER_IMAGE_REPOSITORY:-ingress-nginx/controller}"
INGRESS_NGINX_CONTROLLER_IMAGE_TAG="${INGRESS_NGINX_CONTROLLER_IMAGE_TAG:-v1.14.1}"
INGRESS_NGINX_CONTROLLER_IMAGE_FALLBACK="${INGRESS_NGINX_CONTROLLER_IMAGE_FALLBACK:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/registry.k8s.io/ingress-nginx/controller:v1.14.1}"
INGRESS_NGINX_CHART_VERSION="${INGRESS_NGINX_CHART_VERSION:-4.13.1}"
INGRESS_NGINX_CHART_TGZ="${INGRESS_NGINX_CHART_TGZ:-${LOCAL_INGRESS_NGINX_CHARTS_DIR}/ingress-nginx-${INGRESS_NGINX_CHART_VERSION}.tgz}"
INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE:-}"
INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_REPOSITORY="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_REPOSITORY:-ingress-nginx/kube-webhook-certgen}"
INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_TAG="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_TAG:-v1.6.1}"
INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_FALLBACK="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_FALLBACK:-swr.cn-north-4.myhuaweicloud.com/ddn-k8s/registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.1}"
INGRESS_NGINX_HOSTNETWORK="${INGRESS_NGINX_HOSTNETWORK:-true}"
INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED="${INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED:-false}"
AUTO_INSTALL_INGRESS_NGINX="${AUTO_INSTALL_INGRESS_NGINX:-true}"

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

random_password() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 18 | tr -d '\n'
        return 0
    fi
    head -c 32 /dev/urandom | base64 | tr -d '\n' | head -c 24
}

# Quote a string for YAML single-quoted scalars.
yaml_quote() {
    local s="$1"
    s="${s//\'/\'\'}"
    printf "'%s'" "${s}"
}

get_config_image_registry() {
    local cfg="${CONFIG_YAML_PATH}"
    if [[ ! -f "${cfg}" ]]; then
        return 0
    fi

    awk '
      $1 == "image:" { in_image=1; next }
      in_image && $1 == "registry:" { print $2; exit }
      in_image && $0 ~ /^[^ ]/ { in_image=0 }
    ' "${cfg}" 2>/dev/null | sed -e 's/^["'\'']//; s/["'\'']$//' | tr -d '\r' || true
}

load_image_registry_from_config() {
    if [[ -n "${IMAGE_REGISTRY}" ]]; then
        return 0
    fi
    IMAGE_REGISTRY="$(get_config_image_registry)"
    IMAGE_REGISTRY="${IMAGE_REGISTRY%/}"
    if [[ -z "${IMAGE_REGISTRY}" ]]; then
        IMAGE_REGISTRY="swr.cn-east-3.myhuaweicloud.com/kweaver-ai"
    fi
}

image_from_registry() {
    local repository="$1"
    local tag="$2"
    local fallback="$3"

    load_image_registry_from_config
    if [[ -n "${IMAGE_REGISTRY}" ]]; then
        echo "${IMAGE_REGISTRY}/${repository}:${tag}"
    else
        echo "${fallback}"
    fi
}

get_secret_b64_key() {
    local namespace="$1"
    local name="$2"
    local key="$3"
    local safe_key="${key//\'/\\\'}"
    kubectl -n "${namespace}" get secret "${name}" -o "jsonpath={.data['${safe_key}']}" 2>/dev/null | base64 -d 2>/dev/null || true
}

first_service_with_port() {
    local namespace="$1"
    local selector="$2"
    local port="$3"
    kubectl -n "${namespace}" get svc -l "${selector}" -o jsonpath='{range .items[*]}{.metadata.name}{" "}{range .spec.ports[*]}{.port}{" "}{end}{"\n"}{end}' 2>/dev/null | \
        awk -v want="${port}" '$0 ~ (" " want " ") {print $1; exit}'
}

generate_config_yaml() {
    log_info "Generating config.yaml..."
    local out="${CONFIG_YAML_PATH}"
    mkdir -p "$(dirname "${out}")"

    load_image_registry_from_config

    local cfg_namespace="kweaver-ai"
    local cfg_lang="en_US.UTF-8"
    local cfg_tz="Asia/Shanghai"
    if [[ -f "${out}" ]]; then
        local v
        v="$(awk '$1=="namespace:"{print $2; exit}' "${out}" 2>/dev/null | sed -e 's/^["'\'']//; s/["'\'']$//' || true)"
        if [[ -n "${v}" ]]; then cfg_namespace="${v}"; fi
        v="$(awk '$1=="env:"{in=1; next} in && $1=="language:"{print $2; exit} in && $0~/^[^ ]/{in=0}' "${out}" 2>/dev/null | sed -e 's/^["'\'']//; s/["'\'']$//' || true)"
        if [[ -n "${v}" ]]; then cfg_lang="${v}"; fi
        v="$(awk '$1=="env:"{in=1; next} in && $1=="timezone:"{print $2; exit} in && $0~/^[^ ]/{in=0}' "${out}" 2>/dev/null | sed -e 's/^["'\'']//; s/["'\'']$//' || true)"
        if [[ -n "${v}" ]]; then cfg_tz="${v}"; fi
    fi

    local node_ip
    node_ip="$(hostname -I 2>/dev/null | awk '{print $1}' | tr -d '\n' || true)"
    if [[ -z "${node_ip}" ]]; then
        node_ip="10.x.x.x"
    fi

    # MariaDB
    local mariadb_ns="${MARIADB_NAMESPACE}"
    local mariadb_host="mariadb.${mariadb_ns}.svc.cluster.local"
    # Use default values from script defaults (adp/adp@123456) if not set
    local mariadb_user="${MARIADB_USER:-adp}"
    local mariadb_password="${MARIADB_PASSWORD:-adp@123456}"
    local mariadb_database="${MARIADB_DATABASE:-adp}"
    local mariadb_auth_secret="mariadb-auth"
    local from_secret
    from_secret="$(get_secret_b64_key "${mariadb_ns}" "${mariadb_auth_secret}" mariadb-user)"
    if [[ -n "${from_secret}" ]]; then
        mariadb_user="${from_secret}"
    fi
    from_secret="$(get_secret_b64_key "${mariadb_ns}" "${mariadb_auth_secret}" mariadb-password)"
    if [[ -n "${from_secret}" ]]; then
        mariadb_password="${from_secret}"
    else
        local mariadb_secret
        mariadb_secret="$(kubectl -n "${mariadb_ns}" get secret -l app.kubernetes.io/instance=mariadb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
        if [[ -n "${mariadb_secret}" ]]; then
            from_secret="$(get_secret_b64_key "${mariadb_ns}" "${mariadb_secret}" mariadb-password)"
            if [[ -n "${from_secret}" ]]; then
                mariadb_password="${from_secret}"
            fi
        fi
    fi
    # Get database name from secret if available
    from_secret="$(get_secret_b64_key "${mariadb_ns}" "${mariadb_auth_secret}" mariadb-database)"
    if [[ -n "${from_secret}" ]]; then
        mariadb_database="${from_secret}"
    fi
    # Generate admin_key: base64 encoded "user:password"
    local mariadb_admin_key
    mariadb_admin_key="$(printf '%s:%s' "${mariadb_user}" "${mariadb_password}" | base64 -w 0 2>/dev/null || printf '%s:%s' "${mariadb_user}" "${mariadb_password}" | base64 | tr -d '\n')"

    # Redis
    local redis_ns="${REDIS_NAMESPACE}"
    # Try to detect Redis release name (could be "redis" or "proton-redis" depending on chart)
    local redis_release_name="redis"
    # Check for proton-redis release first
    if helm list -n "${redis_ns}" -q 2>/dev/null | grep -q "^proton-redis"; then
        redis_release_name="proton-redis"
    elif helm list -n "${redis_ns}" -q 2>/dev/null | grep -q "^redis"; then
        redis_release_name="redis"
    fi
    
    # Try to get actual StatefulSet name (could be redis, redis-proton-redis, or proton-redis-proton-redis)
    # For proton-redis chart: StatefulSet name is {release-name}-proton-redis (e.g., redis-proton-redis)
    local redis_sts_name=""
    if kubectl -n "${redis_ns}" get statefulset redis-proton-redis >/dev/null 2>&1; then
        redis_sts_name="redis-proton-redis"
    elif kubectl -n "${redis_ns}" get statefulset proton-redis-proton-redis >/dev/null 2>&1; then
        redis_sts_name="proton-redis-proton-redis"
    elif kubectl -n "${redis_ns}" get statefulset redis >/dev/null 2>&1; then
        redis_sts_name="redis"
    fi
    
    # Default username is "root" for local chart, "default" for Bitnami chart
    local redis_user="root"
    # Try to get username from StatefulSet or Helm values
    if [[ -n "${redis_sts_name}" ]]; then
        # Try to get from StatefulSet env (for local chart)
        local user_from_sts
        user_from_sts="$(kubectl -n "${redis_ns}" get statefulset "${redis_sts_name}" -o jsonpath='{.spec.template.spec.containers[?(@.name=="redis")].env[?(@.name=="ROOT_USER")].value}' 2>/dev/null || echo "")"
        if [[ -n "${user_from_sts}" ]]; then
            redis_user="${user_from_sts}"
        else
            # Check Helm values for local chart
            local helm_values_json
            helm_values_json="$(helm get values "${redis_release_name}" -n "${redis_ns}" -o json 2>/dev/null || true)"
            if [[ -n "${helm_values_json}" ]]; then
                local user_from_helm
                user_from_helm="$(echo "${helm_values_json}" | grep -oE '"redis":\{[^}]*"rootUsername":"[^"]*"' | grep -oE '"rootUsername":"[^"]*"' | cut -d'"' -f4 || echo "")"
                if [[ -n "${user_from_helm}" ]]; then
                    redis_user="${user_from_helm}"
                fi
            fi
        fi
    fi
    
    # Use default value from script defaults (redis-password) if not set
    local redis_password="${REDIS_PASSWORD:-redis-password}"
    # Try to get password from secret (check multiple possible secret names)
    # For proton-redis chart: secret name is {release-name}-proton-redis-secret (e.g., redis-proton-redis-secret)
    local redis_secret_names=(
        "${redis_release_name}-proton-redis-secret"  # proton-redis chart naming
        "proton-redis-proton-redis-secret"           # alternative naming
        "${redis_release_name}-secret"                # generic naming
        "redis-auth"                                  # fallback
    )
    local redis_secret_password=""
    for secret_name in "${redis_secret_names[@]}"; do
        redis_secret_password="$(get_secret_b64_key "${redis_ns}" "${secret_name}" password 2>/dev/null || echo "")"
        if [[ -n "${redis_secret_password}" ]]; then
            redis_password="${redis_secret_password}"
            break
        fi
        # Also try nonEncrpt-password key (used by local chart)
        redis_secret_password="$(get_secret_b64_key "${redis_ns}" "${secret_name}" nonEncrpt-password 2>/dev/null || echo "")"
        if [[ -n "${redis_secret_password}" ]]; then
            redis_password="${redis_secret_password}"
            break
        fi
    done
    
    # Detect Redis deployment mode (standalone or sentinel)
    local redis_connect_type="standalone"
    local redis_host="redis.${redis_ns}.svc.cluster.local"
    local redis_sentinel_host=""
    local redis_sentinel_port="26379"
    local redis_master_group_name="${REDIS_MASTER_GROUP_NAME:-mymaster}"
    
    # Check if Redis is deployed in sentinel mode
    # Method 1: Check if sentinel service exists (for local chart)
    # For proton-redis chart: service name is {release-name}-proton-redis-sentinel
    # If release name is "redis", service is "redis-proton-redis-sentinel"
    # If release name is "proton-redis", service is "proton-redis-proton-redis-sentinel"
    local sentinel_svc_names=(
        "${redis_release_name}-proton-redis-sentinel"  # proton-redis chart naming (release=redis)
        "proton-redis-proton-redis-sentinel"           # proton-redis chart naming (release=proton-redis)
        "${redis_release_name}-sentinel"               # generic naming
        "redis-proton-redis-sentinel"                  # fallback
        "redis-sentinel"                                # fallback
    )
    local sentinel_svc_found=false
    for svc_name in "${sentinel_svc_names[@]}"; do
        if kubectl -n "${redis_ns}" get svc "${svc_name}" >/dev/null 2>&1; then
            redis_connect_type="sentinel"
            # Construct FQDN and remove trailing dot if present
            redis_sentinel_host="${svc_name}.${redis_ns}.svc.cluster.local"
            redis_sentinel_host="${redis_sentinel_host%.}"  # Remove trailing dot
            sentinel_svc_found=true
            log_info "Redis sentinel mode detected (via service: ${svc_name})"
            break
        fi
    done
    
    # Method 2: Check StatefulSet for sentinel container (for local chart)
    if [[ "${sentinel_svc_found}" == "false" ]] && [[ -n "${redis_sts_name}" ]]; then
        local sts_containers
        sts_containers="$(kubectl -n "${redis_ns}" get statefulset "${redis_sts_name}" -o jsonpath='{.spec.template.spec.containers[*].name}' 2>/dev/null || echo "")"
        if echo "${sts_containers}" | grep -q sentinel; then
            redis_connect_type="sentinel"
            # Try to find sentinel service name
            for svc_name in "${sentinel_svc_names[@]}"; do
                if kubectl -n "${redis_ns}" get svc "${svc_name}" >/dev/null 2>&1; then
                    redis_sentinel_host="${svc_name}.${redis_ns}.svc.cluster.local"
                    redis_sentinel_host="${redis_sentinel_host%.}"  # Remove trailing dot
                    break
                fi
            done
            # If no service found, use default naming for proton-redis chart
            # For proton-redis chart: {release-name}-proton-redis-sentinel
            if [[ -z "${redis_sentinel_host}" ]]; then
                # Calculate StatefulSet name: {release-name}-proton-redis
                local calculated_sts_name="${redis_release_name}-proton-redis"
                redis_sentinel_host="${calculated_sts_name}-sentinel.${redis_ns}.svc.cluster.local"
                redis_sentinel_host="${redis_sentinel_host%.}"  # Remove trailing dot
            fi
            log_info "Redis sentinel mode detected (via StatefulSet containers)"
        fi
    fi
    
    # Method 3: Check if REDIS_ARCHITECTURE is set to sentinel
    if [[ "${redis_connect_type}" != "sentinel" ]] && [[ "${REDIS_ARCHITECTURE:-standalone}" == "sentinel" ]]; then
        redis_connect_type="sentinel"
        # Use proton-redis chart naming convention: {release-name}-proton-redis-sentinel
        local calculated_sts_name="${redis_release_name}-proton-redis"
        redis_sentinel_host="${calculated_sts_name}-sentinel.${redis_ns}.svc.cluster.local"
        redis_sentinel_host="${redis_sentinel_host%.}"  # Remove trailing dot
        log_info "Redis sentinel mode detected (via REDIS_ARCHITECTURE variable)"
    fi
    
    # For sentinel mode, try to get master group name from StatefulSet or use default
    if [[ "${redis_connect_type}" == "sentinel" ]] && [[ -n "${redis_sts_name}" ]]; then
        # Try to get from StatefulSet env or config
        local master_group_from_sts
        master_group_from_sts="$(kubectl -n "${redis_ns}" get statefulset "${redis_sts_name}" -o jsonpath='{.spec.template.spec.containers[?(@.name=="sentinel")].env[?(@.name=="MASTER_GROUP")].value}' 2>/dev/null || echo "")"
        if [[ -n "${master_group_from_sts}" ]]; then
            redis_master_group_name="${master_group_from_sts}"
        else
            # Try to get from Helm values
            local helm_values_json
            helm_values_json="$(helm get values "${redis_release_name}" -n "${redis_ns}" -o json 2>/dev/null || true)"
            if [[ -n "${helm_values_json}" ]]; then
                local master_group_from_helm
                master_group_from_helm="$(echo "${helm_values_json}" | grep -oE '"redis":\{[^}]*"masterGroupName":"[^"]*"' | grep -oE '"masterGroupName":"[^"]*"' | cut -d'"' -f4 || true)"
                if [[ -n "${master_group_from_helm}" ]]; then
                    redis_master_group_name="${master_group_from_helm}"
                fi
            fi
        fi
    fi

    # OpenSearch
    local os_ns="${OPENSEARCH_NAMESPACE}"
    local os_host="${OPENSEARCH_CLUSTER_NAME}-${OPENSEARCH_NODE_GROUP}.${os_ns}.svc.cluster.local"
    local os_user="admin"
    local os_password="${OPENSEARCH_INITIAL_ADMIN_PASSWORD}"
    local os_protocol="${OPENSEARCH_PROTOCOL}"
    if [[ -z "${os_protocol}" ]]; then
        os_protocol="http"
    fi

    # MongoDB - only generate config if MongoDB is installed
    local mongodb_ns="${MONGODB_NAMESPACE}"
    # Prefer a stable service name "mongodb" (release name) for clients: mongodb.<ns>.svc.cluster.local
    local mongodb_host="${MONGODB_RELEASE_NAME}.${mongodb_ns}.svc.cluster.local"
    local mongodb_port="28000"
    local mongodb_user="${MONGODB_SECRET_USERNAME}"
    local mongodb_password="${MONGODB_SECRET_PASSWORD}"
    local mongodb_configured=false
    
    # Check if MongoDB secret exists (indicates MongoDB is installed)
    if kubectl -n "${mongodb_ns}" get secret "${MONGODB_SECRET_NAME}" >/dev/null 2>&1; then
        mongodb_configured=true
        if [[ -z "${mongodb_password}" ]]; then
            # Try to get password from secret
            mongodb_password=$(kubectl -n "${mongodb_ns}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
        fi
        log_info "MongoDB detected, will generate config section"
    else
        log_info "MongoDB not detected (secret ${MONGODB_SECRET_NAME} not found in namespace ${mongodb_ns}), skipping MongoDB config"
    fi
    
    # MongoDB connection parameters (config.yaml schema expected by proton-cli)
    # Set replicaSet based on whether replica set is enabled
    local mongodb_replica_set=""
    if [[ "${mongodb_configured}" == "true" ]]; then
        # Check if replica set is enabled by checking StatefulSet args or using default config
        # First, try to detect from StatefulSet
        local sts_replset
        sts_replset=$(kubectl -n "${mongodb_ns}" get statefulset "${MONGODB_RELEASE_NAME}-mongodb" -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null | grep -o "replSet [^ ]*" | awk '{print $2}' || echo "")
        if [[ -n "${sts_replset}" ]]; then
            mongodb_replica_set="${sts_replset}"
        elif [[ "${MONGODB_REPLSET_ENABLED:-true}" == "true" ]]; then
            # Use default from script variable (default is true for single-node replica set)
            mongodb_replica_set="${MONGODB_REPLSET_NAME:-rs0}"
        fi
        # If keyfile exists in secret, it's likely replica set mode
        local has_keyfile
        has_keyfile=$(kubectl -n "${mongodb_ns}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.mongodb\.keyfile}' 2>/dev/null || echo "")
        if [[ -n "${has_keyfile}" ]] && [[ -z "${mongodb_replica_set}" ]]; then
            mongodb_replica_set="${MONGODB_REPLSET_NAME:-rs0}"
        fi
    fi
    # Always use anyshare as authSource
    local mongodb_auth_source="anyshare"

    # Kafka
    local kafka_ns="${KAFKA_NAMESPACE}"
    local kafka_mechanism="${KAFKA_SASL_MECHANISM}"
    local kafka_user="${KAFKA_CLIENT_USER}"
    local kafka_password="${KAFKA_CLIENT_PASSWORD}"
    if [[ "${KAFKA_AUTH_ENABLED}" == "true" ]]; then
        local client_pw
        client_pw="$(get_secret_b64_key "${kafka_ns}" "${KAFKA_SASL_SECRET_NAME}" client-passwords)"
        if [[ -n "${client_pw}" ]]; then
            kafka_password="${client_pw%%,*}"
        fi
    fi
    local kafka_svc
    kafka_svc="$(first_service_with_port "${kafka_ns}" "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME}" 9092)"
    if [[ -z "${kafka_svc}" ]]; then
        kafka_svc="${KAFKA_RELEASE_NAME}"
    fi
    local kafka_host="${kafka_svc}.${kafka_ns}.svc.cluster.local"

    # Zookeeper - only generate config if Zookeeper is installed
    local zookeeper_ns="${ZOOKEEPER_NAMESPACE}"
    # Zookeeper uses headless service: {release-name}-headless.{namespace}.svc.cluster.local
    # Default release name is "zookeeper", so service name is "zookeeper-headless"
    # Use short format as requested: zookeeper-headless.resource
    local zookeeper_host="${ZOOKEEPER_RELEASE_NAME}-headless.${zookeeper_ns}"
    local zookeeper_port="${ZOOKEEPER_SERVICE_PORT:-2181}"
    local zookeeper_configured=false
    
    # Check if Zookeeper StatefulSet or Service exists (indicates Zookeeper is installed)
    # Try multiple detection methods for robustness
    local zookeeper_detected=false
    if kubectl -n "${zookeeper_ns}" get statefulset "${ZOOKEEPER_RELEASE_NAME}" >/dev/null 2>&1; then
        zookeeper_detected=true
    elif kubectl -n "${zookeeper_ns}" get svc "${ZOOKEEPER_RELEASE_NAME}-headless" >/dev/null 2>&1; then
        zookeeper_detected=true
    elif kubectl -n "${zookeeper_ns}" get statefulset -l "app=${ZOOKEEPER_RELEASE_NAME}" >/dev/null 2>&1; then
        zookeeper_detected=true
    elif kubectl -n "${zookeeper_ns}" get statefulset -l "app=zookeeper" >/dev/null 2>&1; then
        zookeeper_detected=true
    fi
    
    if [[ "${zookeeper_detected}" == "true" ]]; then
        zookeeper_configured=true
        log_info "Zookeeper detected, will generate config section"
    else
        log_info "Zookeeper not detected (StatefulSet or Service not found in namespace ${zookeeper_ns}), skipping Zookeeper config"
    fi

    # Build MongoDB config section if MongoDB is installed
    local mongodb_section=""
    if [[ "${mongodb_configured}" == "true" ]]; then
        mongodb_section=$(cat <<MONGODB_EOF
  mongodb:
    source_type: external
    host: $(yaml_quote "${mongodb_host}")
    port: ${mongodb_port}
    user: $(yaml_quote "${mongodb_user}")
    password: $(yaml_quote "${mongodb_password}")
    replicaSet: $(yaml_quote "${mongodb_replica_set}")
    options:
      authSource: $(yaml_quote "${mongodb_auth_source}")
MONGODB_EOF
)
        log_info "MongoDB config section prepared"
    fi

    # Build Zookeeper config section if Zookeeper is installed
    local zookeeper_section=""
    if [[ "${zookeeper_configured}" == "true" ]]; then
        # Use short format host as requested: zookeeper-headless.resource
        local zookeeper_host_short="${ZOOKEEPER_RELEASE_NAME}-headless.${zookeeper_ns}"
        zookeeper_section=$(cat <<ZOOKEEPER_EOF
  zookeeper:
    host: $(yaml_quote "${zookeeper_host_short}")
    port: ${zookeeper_port}
ZOOKEEPER_EOF
)
        log_info "Zookeeper config section prepared"
    fi

    # Ingress-Nginx - detect actual IngressClass name
    local ingress_class_name=""
    local ingress_class_configured=false
    local ingress_nginx_release="ingress-nginx"
    local ingress_nginx_namespace="ingress-nginx"
    
    # First, try to get IngressClass from actual Kubernetes resource (most reliable)
    ingress_class_name="$(kubectl get ingressclass -o jsonpath='{.items[?(@.spec.controller=="k8s.io/ingress-nginx")].metadata.name}' 2>/dev/null | awk '{print $1}' || true)"
    
    # If not found, try to get from Helm release values
    if [[ -z "${ingress_class_name}" ]] && helm status "${ingress_nginx_release}" -n "${ingress_nginx_namespace}" >/dev/null 2>&1; then
        # Try to get from Helm values
        local helm_values_json
        helm_values_json="$(helm get values "${ingress_nginx_release}" -n "${ingress_nginx_namespace}" -o json 2>/dev/null || true)"
        if [[ -n "${helm_values_json}" ]]; then
            # Extract controller.ingressClassResource.name or controller.ingressClass
            ingress_class_name="$(echo "${helm_values_json}" | grep -oE '"controller\.(ingressClassResource\.name|ingressClass)":"[^"]*"' | head -1 | cut -d'"' -f4 || true)"
        fi
    fi
    
    # If still not found, try to get from deployment args
    if [[ -z "${ingress_class_name}" ]]; then
        local deploy_args
        deploy_args="$(kubectl -n "${ingress_nginx_namespace}" get deploy ingress-nginx-controller -o jsonpath='{.spec.template.spec.containers[0].args[*]}' 2>/dev/null || true)"
        if [[ -n "${deploy_args}" ]]; then
            # Extract --ingress-class value
            ingress_class_name="$(echo "${deploy_args}" | grep -oE '--ingress-class[= ]([^ ]+)' | awk '{print $2}' | tr -d '=' || true)"
        fi
    fi
    
    # Final fallback: use default from script variable
    if [[ -z "${ingress_class_name}" ]]; then
        ingress_class_name="${INGRESS_NGINX_CLASS:-class-443}"
    fi
    
    # Check if ingress-nginx is actually installed (Helm release or deployment exists)
    if helm status "${ingress_nginx_release}" -n "${ingress_nginx_namespace}" >/dev/null 2>&1 || \
       kubectl -n "${ingress_nginx_namespace}" get deploy ingress-nginx-controller >/dev/null 2>&1; then
        ingress_class_configured=true
        log_info "Ingress-Nginx detected, IngressClass: ${ingress_class_name}"
    else
        log_info "Ingress-Nginx not detected, skipping ingress class config"
    fi

    # Build ingress class config section (always use "class-443" as key, but with actual ingressClass value)
    local ingress_class_section=""
    if [[ "${ingress_class_configured}" == "true" ]]; then
        ingress_class_section=$(cat <<INGRESS_CLASS_EOF
  class-443:
    ingressClass: $(yaml_quote "${ingress_class_name}")
INGRESS_CLASS_EOF
)
        log_info "Ingress class config section prepared (class-443 -> ${ingress_class_name})"
    fi

    # Build Redis config section based on deployment mode
    local redis_section=""
    if [[ "${redis_connect_type}" == "sentinel" ]]; then
        redis_section=$(cat <<REDIS_SENTINEL_EOF
  redis:
    connectInfo:
      masterGroupName: $(yaml_quote "${redis_master_group_name}")
      password: $(yaml_quote "${redis_password}")
      sentinelHost: $(yaml_quote "${redis_sentinel_host}")
      sentinelPassword: $(yaml_quote "${redis_password}")
      sentinelPort: ${redis_sentinel_port}
      sentinelUsername: $(yaml_quote "${redis_user}")
      username: $(yaml_quote "${redis_user}")
    connectType: $(yaml_quote "${redis_connect_type}")
    sourceType: external
REDIS_SENTINEL_EOF
)
    else
        redis_section=$(cat <<REDIS_STANDALONE_EOF
  redis:
    connectInfo:
      host: $(yaml_quote "${redis_host}")
      port: 6379
      username: $(yaml_quote "${redis_user}")
      password: $(yaml_quote "${redis_password}")
    connectType: $(yaml_quote "${redis_connect_type}")
    sourceType: external
REDIS_STANDALONE_EOF
)
    fi

    cat > "${out}" <<EOF
namespace: ${cfg_namespace}
env:
  language: ${cfg_lang}
  timezone: ${cfg_tz}
image:
  registry: ${IMAGE_REGISTRY}
accessAddress:
  host: ${node_ip}
  port: 443
  scheme: https
  path: /
depServices:
  mq:
    auth:
      mechanism: $(yaml_quote "${kafka_mechanism}")
      username: $(yaml_quote "${kafka_user}")
      password: $(yaml_quote "${kafka_password}")
    mqHost: $(yaml_quote "${kafka_host}")
    mqLookupdHost: ""
    mqLookupdPort: 0
    mqPort: 9092
    mqType: kafka
  opensearch:
    distribution: opensearch
    host: $(yaml_quote "${os_host}")
    user: $(yaml_quote "${os_user}")
    password: $(yaml_quote "${os_password}")
    port: 9200
    protocol: ${os_protocol}
    version: ""
${mongodb_section}
${zookeeper_section}
  rds:
    admin_key: $(yaml_quote "${mariadb_admin_key}")
    host: $(yaml_quote "${mariadb_host}")
    hostRead: $(yaml_quote "${mariadb_host}")
    port: 3306
    portRead: 3306
    source_type: external
    type: MariaDB
    user: $(yaml_quote "${mariadb_user}")
    password: $(yaml_quote "${mariadb_password}")
    database: $(yaml_quote "${mariadb_database}")
${redis_section}
${ingress_class_section}
EOF

    log_info "Wrote config file: ${out}"
    if [[ "${mongodb_configured}" == "true" ]]; then
        log_info "✓ MongoDB config was included in config.yaml"
    else
        log_info "✗ MongoDB config was NOT included in config.yaml (mongodb_configured=${mongodb_configured})"
    fi
    if [[ "${zookeeper_configured}" == "true" ]]; then
        log_info "✓ Zookeeper config was included in config.yaml"
    else
        log_info "✗ Zookeeper config was NOT included in config.yaml (zookeeper_configured=${zookeeper_configured})"
    fi
    if [[ "${ingress_class_configured}" == "true" ]]; then
        log_info "✓ Ingress class config (class-443) was included in config.yaml with ingressClass: ${ingress_class_name}"
    else
        log_info "✗ Ingress class config was NOT included in config.yaml (ingress_class_configured=${ingress_class_configured})"
    fi
}

is_bitnami_mariadb_image() {
    local image="$1"
    [[ "${image}" == *"/bitnami/mariadb:"* || "${image}" == "bitnami/mariadb:"* ]]
}

# Read vendored file if exists; otherwise fetch from URL.
read_or_fetch() {
    local path="$1"
    local url="$2"

    if [[ -n "${path}" && -f "${path}" ]]; then
        cat "${path}"
        return 0
    fi

    if [[ -z "${url}" ]]; then
        log_error "No local file found and no URL provided"
        return 1
    fi

    curl -fsSL "${url}"
}

# Detect package manager (prefer dnf, fallback to yum, then apt)
detect_package_manager() {
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        PKG_MANAGER_UPDATE="dnf makecache"
        PKG_MANAGER_INSTALL="dnf install -y"
        PKG_MANAGER_HOLD="dnf mark install"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        PKG_MANAGER_UPDATE="yum makecache"
        PKG_MANAGER_INSTALL="yum install -y"
        # yum doesn't have a direct hold command; use versionlock plugin if available, otherwise skip
        PKG_MANAGER_HOLD="yum versionlock add 2>/dev/null || true"
    elif command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        PKG_MANAGER_UPDATE="apt-get update -y"
        PKG_MANAGER_INSTALL="apt-get install -y"
        PKG_MANAGER_HOLD="apt-mark hold"
    else
        log_error "No supported package manager found (dnf, yum, or apt-get)"
        exit 1
    fi
    
    export PKG_MANAGER PKG_MANAGER_UPDATE PKG_MANAGER_INSTALL PKG_MANAGER_HOLD
    log_info "Using package manager: ${PKG_MANAGER}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubeadm is installed
    if ! command -v kubeadm &> /dev/null; then
        log_error "kubeadm is not installed. Please install kubeadm first."
        exit 1
    fi
    
    # Check if kubelet is installed
    if ! command -v kubelet &> /dev/null; then
        log_error "kubelet is not installed. Please install kubelet first."
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if container runtime is running, try to start if not
    if systemctl is-active --quiet containerd; then
        log_info "containerd is running"
    elif systemctl is-active --quiet docker; then
        log_info "docker is running"
    elif systemctl is-active --quiet crio; then
        log_info "cri-o is running"
    else
        # Try to start containerd if it's installed but not running
        if command -v containerd &> /dev/null; then
            log_info "containerd is installed but not running, attempting to start..."
            systemctl start containerd 2>/dev/null || true
            sleep 2
            if systemctl is-active --quiet containerd; then
                log_info "containerd started successfully"
            else
                log_error "Failed to start containerd"
                exit 1
            fi
        else
            log_error "No container runtime (containerd/docker/cri-o) is installed or running"
            exit 1
        fi
    fi
    
    log_info "Prerequisites check passed"
}

# Initialize Kubernetes master node
init_k8s_master() {
    log_info "Initializing Kubernetes master node..."
    log_info "Configuration: POD_CIDR=${POD_CIDR}, SERVICE_CIDR=${SERVICE_CIDR}"

    # Configure system for Kubernetes (must be done before kubeadm init)
    log_info "Configuring system for Kubernetes..."
    disable_selinux
    configure_system

    if [[ -f /etc/kubernetes/admin.conf ]]; then
        if KUBECONFIG=/etc/kubernetes/admin.conf kubectl get nodes >/dev/null 2>&1; then
            log_info "Kubernetes already initialized (kubectl get nodes succeeded). Skipping kubeadm init."
            mkdir -p /root/.kube
            cp -f /etc/kubernetes/admin.conf /root/.kube/config
            export KUBECONFIG=/root/.kube/config
            return 0
        fi
    fi

    if [[ -f /root/.kube/config ]]; then
        if KUBECONFIG=/root/.kube/config kubectl get nodes >/dev/null 2>&1; then
            log_info "Kubernetes already initialized (kubectl get nodes succeeded). Skipping kubeadm init."
            export KUBECONFIG=/root/.kube/config
            return 0
        fi
    fi
    
    # Get the default network interface IP if not specified
    if [[ -z "${API_SERVER_ADVERTISE_ADDRESS}" ]]; then
        API_SERVER_ADVERTISE_ADDRESS=$(hostname -I | awk '{print $1}')
    fi
    
    log_info "API Server advertise address: ${API_SERVER_ADVERTISE_ADDRESS}"
    
    # Pre-pull images before kubeadm init
    log_info "Pre-pulling Kubernetes images from ${IMAGE_REPOSITORY}..."
    kubeadm config images pull \
        --kubernetes-version=stable-1.28 \
        --image-repository="${IMAGE_REPOSITORY}" \
        2>&1 || log_warn "Some images may have failed to pull, continuing..."
    
    # Pre-pull pause image with all possible versions and tag them
    log_info "Pre-pulling pause images with all versions..."
    for pause_version in 3.6 3.9 3.10 3.10.0 3.10.1; do
        log_info "Pulling pause:${pause_version}..."
        crictl pull "${IMAGE_REPOSITORY}/pause:${pause_version}" 2>/dev/null || true
        # Tag the image as registry.k8s.io version for kubeadm
        ctr -n k8s.io image tag "${IMAGE_REPOSITORY}/pause:${pause_version}" "registry.k8s.io/pause:${pause_version}" 2>/dev/null || true
    done
    
    # Create kubeadm config file to specify image repository
    log_info "Creating kubeadm configuration file..."
    mkdir -p /tmp/kubeadm
    cat > /tmp/kubeadm/config.yaml <<EOF
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock
  kubeletExtraArgs:
    pod-infra-container-image: ${IMAGE_REPOSITORY}/pause:3.9
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: stable-1.28
controlPlaneEndpoint: ${API_SERVER_ADVERTISE_ADDRESS}:6443
networking:
  podSubnet: ${POD_CIDR}
  serviceSubnet: ${SERVICE_CIDR}
imageRepository: ${IMAGE_REPOSITORY}
EOF
    
    log_info "Initializing the cluster..."
    # Initialize the cluster with config file
    kubeadm init \
        --config=/tmp/kubeadm/config.yaml \
        --ignore-preflight-errors=NumCPU,Mem 2>&1 | tee /tmp/kubeadm-init.log || true
    
    # Fix pause image version in kubelet configuration
    log_info "Fixing pause image version in kubelet configuration..."
    systemctl stop kubelet
    
    # Replace pause image versions with 3.9 in all kubelet config files
    # Replace registry.k8s.io with aliyun registry for all pause versions (including 3.6)
    sed -i 's|registry\.k8s\.io/pause:[0-9.]*|registry.aliyuncs.com/google_containers/pause:3.9|g' /var/lib/kubelet/kubeadm-flags.env 2>/dev/null || true
    sed -i 's|registry\.k8s\.io/pause:[0-9.]*|registry.aliyuncs.com/google_containers/pause:3.9|g' /var/lib/kubelet/config.yaml 2>/dev/null || true
    
    # Ensure pause image is set correctly in kubelet extra args
    if ! grep -q 'pod-infra-container-image' /var/lib/kubelet/kubeadm-flags.env; then
        sed -i 's|--container-runtime-endpoint|--pod-infra-container-image=registry.aliyuncs.com/google_containers/pause:3.9 --container-runtime-endpoint|g' /var/lib/kubelet/kubeadm-flags.env
    fi
    
    systemctl start kubelet
    
    # Wait for control plane to stabilize
    log_info "Waiting for control plane to stabilize..."
    sleep 30
    
    # Setup kubeconfig for root user
    log_info "Setting up kubeconfig..."
    mkdir -p /root/.kube
    cp -f /etc/kubernetes/admin.conf /root/.kube/config
    chown root:root /root/.kube/config
    
    # Setup kubeconfig for current user if not root
    if [[ -n "${SUDO_USER}" ]]; then
        USER_HOME=$(getent passwd "${SUDO_USER}" | cut -d: -f6)
        mkdir -p "${USER_HOME}/.kube"
        cp -f /etc/kubernetes/admin.conf "${USER_HOME}/.kube/config"
        chown -R "${SUDO_USER}:${SUDO_USER}" "${USER_HOME}/.kube"
    fi
    
    export KUBECONFIG=/etc/kubernetes/admin.conf
    
    log_info "Kubernetes master node initialized successfully"
}

# Remove taint to allow scheduling on master node
allow_master_scheduling() {
    log_info "Allowing scheduling on master node..."
    
    # Remove the NoSchedule taint from master/control-plane node
    kubectl taint nodes --all node-role.kubernetes.io/control-plane- 2>/dev/null || true
    kubectl taint nodes --all node-role.kubernetes.io/master- 2>/dev/null || true
    
    log_info "Master node is now schedulable"
}

# Install Weave CNI plugin (simpler alternative to Calico)
install_cni() {
    log_info "Installing Flannel CNI plugin..."

    if kubectl get daemonset kube-flannel-ds -n kube-flannel >/dev/null 2>&1; then
        local desired
        local ready
        desired=$(kubectl get daemonset kube-flannel-ds -n kube-flannel -o jsonpath='{.status.desiredNumberScheduled}' 2>/dev/null || echo "")
        ready=$(kubectl get daemonset kube-flannel-ds -n kube-flannel -o jsonpath='{.status.numberReady}' 2>/dev/null || echo "")
        if [[ -n "${desired}" && -n "${ready}" && "${desired}" == "${ready}" && "${ready}" != "0" ]]; then
            log_info "Flannel is already installed and ready (daemonset Ready ${ready}/${desired}), skipping"
            return 0
        fi
    fi
    
    # Install Flannel CNI (ensure network CIDR matches POD_CIDR and use configured image repository)
    read_or_fetch "${FLANNEL_MANIFEST_PATH}" "${FLANNEL_MANIFEST_URL}" | \
        sed "s|10.244.0.0/16|${POD_CIDR}|g" | \
        sed "s|docker.io/flannel/|${FLANNEL_IMAGE_REPO}flannel/|g" | \
        kubectl apply -f -
    
    log_info "Waiting for Flannel pods to be ready..."
    sleep 10
    kubectl wait --for=condition=Ready pods --all -n kube-flannel --timeout=300s 2>/dev/null || true
    
    # Restart containerd to ensure CNI plugin is properly initialized
    log_info "Restarting containerd to ensure CNI plugin initialization..."
    systemctl restart containerd
    sleep 5
    
    # Wait for node network to be ready (CNI plugin initialized)
    log_info "Waiting for CNI plugin to initialize network..."
    local max_attempts=30
    local attempt=0
    while [[ ${attempt} -lt ${max_attempts} ]]; do
        if kubectl get nodes -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null | grep -q "True"; then
            log_info "Node network is ready"
            break
        fi
        attempt=$((attempt + 1))
        log_info "Waiting for node network to be ready... (${attempt}/${max_attempts})"
        sleep 5
    done
    
    # If node is still not ready, try to remove not-ready taint to allow pods to schedule and trigger CNI init
    if ! kubectl get nodes -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null | grep -q "True"; then
        log_info "Node still not ready, removing not-ready taint to allow pod scheduling..."
        local node_name
        node_name=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        if [[ -n "${node_name}" ]]; then
            kubectl taint nodes "${node_name}" node.kubernetes.io/not-ready:NoSchedule- 2>/dev/null || true
            log_info "Waiting for CNI to initialize after taint removal..."
            sleep 15
        fi
    fi
    
    log_info "Flannel CNI plugin installed successfully"
}

# Wait for CoreDNS to be ready (it's installed by kubeadm by default)
wait_for_dns() {
    log_info "Waiting for CoreDNS to be ready..."
    
    kubectl wait --for=condition=Ready pods -l k8s-app=kube-dns -n kube-system --timeout=300s
    
    log_info "CoreDNS is ready"
}

# Install Helm 3
install_helm() {
    log_info "Installing Helm 3..."

    local desired="${HELM_VERSION}"
    local existing=""
    if command -v helm &> /dev/null; then
        existing="$(helm version --short 2>/dev/null | awk '{print $1}' | cut -d'+' -f1 || true)"
        if [[ -n "${existing}" && "${existing}" == "${desired}" ]]; then
            log_info "Helm ${desired} is already installed"
            return 0
        fi
        if [[ -n "${existing}" ]]; then
            log_warn "Helm version ${existing} detected; installing desired ${desired}"
        fi
    fi

    # Prefer HuaweiCloud tarball (pinned by version + arch); fallback to get-helm-3 script if needed.
    local arch=""
    case "$(uname -m)" in
        x86_64|amd64)
            arch="amd64"
            ;;
        aarch64|arm64)
            arch="arm64"
            ;;
        *)
            log_error "Unsupported architecture for Helm: $(uname -m)"
            return 1
            ;;
    esac

    local base="${HELM_TARBALL_BASEURL%/}/"
    local tarball="helm-${desired}-linux-${arch}.tar.gz"
    local url="${base}${tarball}"

    log_info "Downloading Helm ${desired} from ${url}..."
    local tmpdir
    tmpdir="$(mktemp -d /tmp/helm.XXXXXX)"
    if curl -fsSLo "${tmpdir}/${tarball}" "${url}"; then
        tar -xzf "${tmpdir}/${tarball}" -C "${tmpdir}"
        install -m 0755 "${tmpdir}/linux-${arch}/helm" /usr/local/bin/helm
        rm -rf "${tmpdir}" 2>/dev/null || true
        log_info "Helm ${desired} installed successfully"
        return 0
    fi
    rm -rf "${tmpdir}" 2>/dev/null || true

    log_warn "Failed to download Helm tarball from HuaweiCloud; falling back to get-helm-3 script..."
    if [[ -f "${HELM_INSTALL_SCRIPT_PATH}" ]]; then
        bash "${HELM_INSTALL_SCRIPT_PATH}"
    else
        curl -fsSL "${HELM_INSTALL_SCRIPT_URL}" | bash
    fi

    # Do not auto-add Helm repos here: modules add repos only when a local chart is not available.
    log_info "Helm 3 installed successfully"
}

install_localpv() {
    log_info "Installing local-path-provisioner (hostPath local PV)..."

    read_or_fetch "${LOCALPV_MANIFEST_PATH}" "${LOCALPV_MANIFEST_URL}" | \
        sed "s|image: rancher/local-path-provisioner:.*$|image: ${LOCALPV_PROVISIONER_IMAGE}|g" | \
        sed "s|image: busybox.*$|image: ${LOCALPV_HELPER_IMAGE}|g" | \
        sed "s|/opt/local-path-provisioner|${LOCALPV_BASE_PATH}|g" | \
        kubectl apply -f -

    kubectl wait --for=condition=Available deployment/local-path-provisioner -n local-path-storage --timeout=300s 2>/dev/null || true

    if [[ "${LOCALPV_SET_DEFAULT}" == "true" ]]; then
        kubectl patch storageclass local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}' 2>/dev/null || true
    fi

    log_info "local-path-provisioner installed"
}

# Create MongoDB databases (anyshare, osssys, autosheets, anydata, pipeline, automation)
# Initialize MongoDB replica set
setup_mongodb_replicaset() {
    local ns="${MONGODB_NAMESPACE}"
    local pod_name="${MONGODB_RELEASE_NAME}-mongodb-0"
    local mongodb_user="${MONGODB_SECRET_USERNAME}"
    local mongodb_password="${MONGODB_SECRET_PASSWORD}"
    local replicas="${MONGODB_REPLICAS:-1}"
    local replset_name="${MONGODB_REPLSET_NAME:-rs0}"
    
    # Only initialize if replica set is enabled
    if [[ "${MONGODB_REPLSET_ENABLED:-false}" != "true" ]]; then
        log_info "Replica set is not enabled, skipping replica set initialization"
        return 0
    fi
    
    log_info "Initializing MongoDB replica set: ${replset_name} with ${replicas} member(s)..."
    
    # Temporarily disable set -e to prevent script from exiting on detection failures
    set +e
    
    if [[ -z "${mongodb_password}" ]]; then
        mongodb_password=$(kubectl -n "${ns}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null)
    fi
    
    if [[ -z "${mongodb_password}" ]]; then
        log_warn "MongoDB password not found, skipping replica set initialization"
        set -e
        return 0
    fi
    
    # Wait for pod(s) to be ready
    log_info "Waiting for MongoDB pod(s) to be ready..."
    local max_attempts=60
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        local ready_count
        ready_count=$(kubectl -n "${ns}" get pods -l "app=${MONGODB_RELEASE_NAME}-mongodb" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Ready")].status=="True")].metadata.name}' 2>/dev/null | wc -w)
        if [[ "${ready_count}" -ge "${replicas}" ]]; then
            log_info "All ${replicas} MongoDB pod(s) are ready"
            break
        fi
        attempt=$((attempt + 1))
        if [[ $((attempt % 10)) -eq 0 ]]; then
            log_info "Waiting for MongoDB pod(s)... (${ready_count}/${replicas} ready, attempt ${attempt}/${max_attempts})"
        fi
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_warn "MongoDB pod(s) may not be ready, but continuing with replica set initialization..."
    fi
    
    # Detect mongo tool
    log_info "Detecting MongoDB shell tool..."
    local mongo_tool=""
    local tool_attempt=0
    while [[ $tool_attempt -lt 10 ]]; do
        if kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- mongosh --version >/dev/null 2>&1; then
            mongo_tool="mongosh"
            break
        elif kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- mongo --version >/dev/null 2>&1; then
            mongo_tool="mongo"
            break
        fi
        tool_attempt=$((tool_attempt + 1))
        sleep 2
    done
    
    if [[ -z "${mongo_tool}" ]]; then
        log_warn "Neither mongo nor mongosh found, skipping replica set initialization"
        set -e
        return 0
    fi
    log_info "Detected MongoDB tool: ${mongo_tool}"
    
    # Check if replica set is already initialized
    log_info "Checking if replica set is already initialized..."
    local rs_status
    rs_status=$(kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- ${mongo_tool} \
        --quiet \
        --port 28000 \
        -u "${mongodb_user}" \
        -p "${mongodb_password}" \
        --authenticationDatabase admin \
        --eval "try { rs.status(); print('INITIALIZED'); } catch(e) { print('NOT_INITIALIZED'); }" 2>/dev/null | grep -E "INITIALIZED|NOT_INITIALIZED" || echo "NOT_INITIALIZED")
    
    if [[ "${rs_status}" == *"INITIALIZED"* ]]; then
        log_info "Replica set ${replset_name} is already initialized"
        set -e
        return 0
    fi
    
    # Build members array
    log_info "Building replica set members configuration..."
    local service_name="${MONGODB_RELEASE_NAME}-mongodb"
    local members_js=""
    local i=0
    while [[ $i -lt $replicas ]]; do
        local member_host="${service_name}-${i}.${service_name}.${ns}.svc.cluster.local:28000"
        # For single-node replica set, use priority 1 (default)
        # For multi-node, first node gets priority 2 (primary preference)
        if [[ $i -gt 0 ]]; then
            members_js="${members_js}, "
        fi
        if [[ $i -eq 0 ]] && [[ $replicas -gt 1 ]]; then
            members_js="${members_js}{ _id: ${i}, host: \"${member_host}\", priority: 2 }"
        else
            members_js="${members_js}{ _id: ${i}, host: \"${member_host}\" }"
        fi
        i=$((i + 1))
    done
    
    log_info "Initializing replica set with members: ${members_js}"
    
    # Initialize replica set
    log_info "Executing rs.initiate() command..."
    kubectl -n "${ns}" exec -i "${pod_name}" -c mongodb -- ${mongo_tool} \
        --quiet \
        --port 28000 \
        -u "${mongodb_user}" \
        -p "${mongodb_password}" \
        --authenticationDatabase admin <<EOF
try {
    var cfg = {
        _id: "${replset_name}",
        members: [${members_js}]
    };
    var result = rs.initiate(cfg);
    print("Replica set initialization command executed");
    print("Result: " + JSON.stringify(result));
} catch(e) {
    print("Error initializing replica set: " + e);
    // If already initialized, that's okay
    if (e.message && (e.message.indexOf("already initialized") !== -1 || e.message.indexOf("already been initiated") !== -1)) {
        print("Replica set already initialized, continuing...");
    } else {
        // Re-throw to see the error
        print("Unexpected error, re-throwing...");
        throw e;
    }
}
EOF
    
    local init_rc=$?
    set -e
    
    if [[ $init_rc -eq 0 ]]; then
        log_info "Replica set initialization command executed successfully"
        log_info "Waiting for replica set to stabilize (this may take 30-60 seconds)..."
        
        # Wait and verify replica set status
        local verify_attempts=0
        local max_verify_attempts=30
        local verified=false
        
        while [[ $verify_attempts -lt $max_verify_attempts ]]; do
            sleep 2
            set +e
            local status_check
            status_check=$(kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- ${mongo_tool} \
                --quiet \
                --port 28000 \
                -u "${mongodb_user}" \
                -p "${mongodb_password}" \
                --authenticationDatabase admin \
                --eval "try { var s = rs.status(); if (s && s.members && s.members.length > 0) { print('OK'); } else { print('PENDING'); } } catch(e) { print('PENDING: ' + e.message); }" 2>/dev/null | grep -E "OK|PENDING" || echo "PENDING")
            set -e
            
            if [[ "${status_check}" == *"OK"* ]]; then
                verified=true
                break
            fi
            
            verify_attempts=$((verify_attempts + 1))
            if [[ $((verify_attempts % 5)) -eq 0 ]]; then
                log_info "Waiting for replica set to be ready... (attempt ${verify_attempts}/${max_verify_attempts})"
            fi
        done
        
        if [[ "${verified}" == "true" ]]; then
            log_info "✓ Replica set ${replset_name} initialized and verified successfully"
        else
            log_warn "Replica set initialization command executed, but status verification timed out."
            log_warn "The replica set may still be initializing. Please check manually with:"
            log_warn "  kubectl -n ${ns} exec ${pod_name} -c mongodb -- ${mongo_tool} --port 28000 -u ${mongodb_user} -p '***' --authenticationDatabase admin --eval 'rs.status()'"
        fi
    else
        log_warn "Replica set initialization command returned non-zero exit code, but continuing..."
        log_warn "Please check replica set status manually"
    fi
}

setup_mongodb_databases() {
    local ns="${MONGODB_NAMESPACE}"
    local pod_name="${MONGODB_RELEASE_NAME}-mongodb-0"
    local mongodb_user="${MONGODB_SECRET_USERNAME}"
    local mongodb_password="${MONGODB_SECRET_PASSWORD}"
    
    # Temporarily disable set -e to prevent script from exiting on detection failures
    set +e
    
    if [[ -z "${mongodb_password}" ]]; then
        mongodb_password=$(kubectl -n "${ns}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null)
    fi
    
    if [[ -z "${mongodb_password}" ]]; then
        log_warn "MongoDB password not found, skipping database creation"
        set -e
        return 0
    fi
    
    log_info "Setting up MongoDB databases..."
    
    # Detection loop for mongo or mongosh
    log_info "Waiting for MongoDB to be ready and detecting shell tool..."
    local max_attempts=30
    local attempt=0
    local mongo_tool=""
    
    while [[ $attempt -lt $max_attempts ]]; do
        # We use '|| true' to be absolutely sure set -e doesn't catch these
        if kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- mongosh --version >/dev/null 2>&1; then
            mongo_tool="mongosh"
            break
        elif kubectl -n "${ns}" exec "${pod_name}" -c mongodb -- mongo --version >/dev/null 2>&1; then
            mongo_tool="mongo"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [[ -z "${mongo_tool}" ]]; then
        log_warn "Neither mongo nor mongosh found in container ${pod_name}, skipping DB setup"
        set -e
        return 0
    fi
    log_info "Detected MongoDB tool: ${mongo_tool}"
    
    # List of databases to create
    local databases=(
        "anyshare"
        "osssys"
        "automation"
    )
    
    log_info "Ensuring databases and user permissions exist..."
    # Format the JS array for the shell
    local db_list_js
    db_list_js=$(printf "'%s'," "${databases[@]}" | sed 's/,$//')

    # Execute JS script via stdin - specify port 28000
    kubectl -n "${ns}" exec -i "${pod_name}" -c mongodb -- ${mongo_tool} \
        --quiet \
        --port 28000 \
        -u "${mongodb_user}" \
        -p "${mongodb_password}" \
        --authenticationDatabase admin <<EOF
// 1. Ensure databases exist by inserting a dummy document
var dbs = [${db_list_js}];
for (var i = 0; i < dbs.length; i++) {
    var dbName = dbs[i];
    var dbObj = db.getSiblingDB(dbName);
    dbObj.healthcheck.insert({init: true, timestamp: new Date()});
    print("✓ Ensured database exists: " + dbName);
}

// 2. Create/update the user in 'anyshare' database for auth_source: anyshare support
// Grant access to ALL business databases to this user
var anyshareDB = db.getSiblingDB('anyshare');
var userObj = anyshareDB.getUser('${mongodb_user}');

var userRoles = [];
dbs.forEach(function(dbName) {
    userRoles.push({role: 'dbOwner', db: dbName});
    userRoles.push({role: 'readWrite', db: dbName});
});

if (!userObj) {
    print("Creating user '${mongodb_user}' in 'anyshare' database with access to all databases...");
    anyshareDB.createUser({
        user: '${mongodb_user}',
        pwd: '${mongodb_password}',
        roles: userRoles
    });
} else {
    print("Updating user '${mongodb_user}' in 'anyshare' database with access to all databases...");
    anyshareDB.updateUser('${mongodb_user}', {
        pwd: '${mongodb_password}',
        roles: userRoles
    });
}
EOF
    
    # Re-enable set -e
    set -e
    log_info "MongoDB database setup completed"
}

# Create additional databases and grant permissions to adp user
setup_mariadb_databases() {
    local ns="${MARIADB_NAMESPACE}"
    local mariadb_host="mariadb.${ns}.svc.cluster.local"
    local mariadb_port="3306"
    
    log_info "Setting up additional databases and permissions..."
    
    # Wait for MariaDB to be fully ready
    log_info "Waiting for MariaDB to be ready..."
    local max_attempts=30
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if kubectl -n "${ns}" exec mariadb-0 -- mysqladmin ping -h localhost -u root -p"${MARIADB_ROOT_PASSWORD}" --silent 2>/dev/null; then
            break
        fi
        ((attempt++))
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_warn "MariaDB may not be fully ready, but continuing with database setup..."
    fi
    
    # List of databases to create
    local databases=(
        "user_management"
        "anyshare"
        "policy_mgnt"
        "privacy"
        "authentication"
        "eofs"
        "deploy"
        "sharemgnt_db"
        "ets"
        "ossmanager"
        "license"
        "nodemgnt"
        "sites"
        "anydata"
        "third_app_mgnt"
        "hydra_v2"
        "thirdparty_message"
    )
    
    # Create SQL script
    local sql_script=""
    for db in "${databases[@]}"; do
        sql_script+="CREATE DATABASE IF NOT EXISTS \`${db}\`; "
        sql_script+="GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${MARIADB_USER}'@'%'; "
    done
    sql_script+="FLUSH PRIVILEGES;"
    
    # Execute SQL commands
    log_info "Creating databases and granting permissions..."
    if kubectl -n "${ns}" exec mariadb-0 -- mysql -h localhost -u root -p"${MARIADB_ROOT_PASSWORD}" -e "${sql_script}" 2>/dev/null; then
        log_info "Successfully created ${#databases[@]} databases and granted permissions to ${MARIADB_USER}"
    else
        log_warn "Failed to create databases via kubectl exec, trying alternative method..."
        # Alternative: use mysql client from host if available
        if command -v mysql &>/dev/null; then
            if mysql -h "${mariadb_host}" -P "${mariadb_port}" -u root -p"${MARIADB_ROOT_PASSWORD}" -e "${sql_script}" 2>/dev/null; then
                log_info "Successfully created ${#databases[@]} databases and granted permissions to ${MARIADB_USER}"
            else
                log_error "Failed to create databases. Please create them manually."
            fi
        else
            log_warn "mysql client not found. Please create databases manually using:"
            log_warn "  kubectl -n ${ns} exec -it mariadb-0 -- mysql -u root -p${MARIADB_ROOT_PASSWORD}"
            log_warn "Then run the CREATE DATABASE and GRANT commands."
        fi
    fi
}

# Install single-node MariaDB 11 via manifest (official mariadb image)
install_mariadb_official() {
    log_info "Installing MariaDB (single-node) via manifest..."

    local ns="${MARIADB_NAMESPACE}"

    if [[ -z "${MARIADB_IMAGE}" ]]; then
        MARIADB_IMAGE="$(image_from_registry "${MARIADB_IMAGE_REPOSITORY}" "${MARIADB_IMAGE_TAG}" "${MARIADB_IMAGE_FALLBACK}")"
    fi

    # Create namespace if not exists
    kubectl create namespace "${ns}" 2>/dev/null || true

    local persistence_enabled="${MARIADB_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. MariaDB PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi

            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling MariaDB persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    # Best-effort cleanup if a previous Bitnami release exists.
    helm uninstall mariadb -n "${ns}" 2>/dev/null || true
    kubectl -n "${ns}" delete statefulset mariadb 2>/dev/null || true
    kubectl -n "${ns}" delete svc mariadb mariadb-headless 2>/dev/null || true
    kubectl -n "${ns}" delete secret mariadb-auth 2>/dev/null || true

    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: mariadb-auth
  namespace: ${ns}
type: Opaque
stringData:
  mariadb-root-password: "${MARIADB_ROOT_PASSWORD}"
  mariadb-database: "${MARIADB_DATABASE}"
  mariadb-user: "${MARIADB_USER}"
  mariadb-password: "${MARIADB_PASSWORD}"
---
apiVersion: v1
kind: Service
metadata:
  name: mariadb
  namespace: ${ns}
  labels:
    app: mariadb
spec:
  type: ClusterIP
  selector:
    app: mariadb
  ports:
    - name: mysql
      port: 3306
      targetPort: 3306
---
apiVersion: v1
kind: Service
metadata:
  name: mariadb-headless
  namespace: ${ns}
  labels:
    app: mariadb
spec:
  clusterIP: None
  selector:
    app: mariadb
  ports:
    - name: mysql
      port: 3306
      targetPort: 3306
EOF

    if [[ "${persistence_enabled}" == "true" ]]; then
        local storage_class_yaml=""
        if [[ -n "${MARIADB_STORAGE_CLASS}" ]]; then
            storage_class_yaml="        storageClassName: \"${MARIADB_STORAGE_CLASS}\""
        fi

        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mariadb
  namespace: ${ns}
spec:
  serviceName: mariadb-headless
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
        - name: mariadb
          image: ${MARIADB_IMAGE}
          imagePullPolicy: IfNotPresent
          ports:
            - name: mysql
              containerPort: 3306
          args:
            - --max-connections=${MARIADB_MAX_CONNECTIONS}
          env:
            - name: MARIADB_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-root-password
            - name: MARIADB_DATABASE
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-database
            - name: MARIADB_USER
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-user
            - name: MARIADB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-password
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
          readinessProbe:
            tcpSocket:
              port: 3306
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            tcpSocket:
              port: 3306
            initialDelaySeconds: 30
            periodSeconds: 10
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 375m
              memory: 384Mi
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${MARIADB_STORAGE_SIZE}
${storage_class_yaml}
EOF
    else
        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mariadb
  namespace: ${ns}
spec:
  serviceName: mariadb-headless
  replicas: 1
  selector:
    matchLabels:
      app: mariadb
  template:
    metadata:
      labels:
        app: mariadb
    spec:
      containers:
        - name: mariadb
          image: ${MARIADB_IMAGE}
          imagePullPolicy: IfNotPresent
          ports:
            - name: mysql
              containerPort: 3306
          args:
            - --max-connections=${MARIADB_MAX_CONNECTIONS}
          env:
            - name: MARIADB_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-root-password
            - name: MARIADB_DATABASE
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-database
            - name: MARIADB_USER
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-user
            - name: MARIADB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mariadb-auth
                  key: mariadb-password
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
          readinessProbe:
            tcpSocket:
              port: 3306
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            tcpSocket:
              port: 3306
            initialDelaySeconds: 30
            periodSeconds: 10
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 375m
              memory: 384Mi
      volumes:
        - name: data
          emptyDir: {}
EOF
    fi

    kubectl -n "${ns}" rollout status statefulset/mariadb --timeout=600s 2>/dev/null || true
    kubectl -n "${ns}" wait --for=condition=Ready pod/mariadb-0 --timeout=600s 2>/dev/null || true
    
    log_info "MariaDB installed successfully"
    log_info "MariaDB connection info:"
    log_info "  Host: mariadb.${ns}.svc.cluster.local"
    log_info "  Port: 3306"
    log_info "  Root Password: ${MARIADB_ROOT_PASSWORD}"
    log_info "  Database: ${MARIADB_DATABASE}"
    log_info "  Username: ${MARIADB_USER}"
    log_info "  Password: ${MARIADB_PASSWORD}"

    # Create additional databases and grant permissions
    setup_mariadb_databases

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

# Install single-node MariaDB 11 using Bitnami chart (requires Bitnami image layout)
install_mariadb_bitnami() {
    log_info "Installing MariaDB (single-node) via Bitnami Helm chart..."

    local ns="${MARIADB_NAMESPACE}"

    if [[ -z "${MARIADB_IMAGE}" ]]; then
        MARIADB_IMAGE="$(image_from_registry "${MARIADB_IMAGE_REPOSITORY}" "${MARIADB_IMAGE_TAG}" "${MARIADB_IMAGE_FALLBACK}")"
    fi

    # Parse image registry/repository/tag from MARIADB_IMAGE
    local image_without_tag="${MARIADB_IMAGE%:*}"
    local image_tag="${MARIADB_IMAGE##*:}"
    local image_registry="${image_without_tag%%/*}"
    local image_repo="${image_without_tag#*/}"

    local chart_ref="bitnami/mariadb"
    local use_local_chart="false"
    if [[ -f "${MARIADB_CHART_TGZ}" ]]; then
        chart_ref="${MARIADB_CHART_TGZ}"
        use_local_chart="true"
        log_info "Using local MariaDB chart: ${chart_ref}"
    else
        log_info "Using remote MariaDB chart: ${chart_ref} (version ${MARIADB_CHART_VERSION})"
    fi

    kubectl create namespace "${ns}" 2>/dev/null || true

    local persistence_enabled="${MARIADB_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. MariaDB PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi
            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling MariaDB persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm repo add --force-update bitnami "${HELM_REPO_BITNAMI}"
        helm repo update
    fi

    local -a helm_args
    helm_args=(
        upgrade --install mariadb "${chart_ref}"
        --namespace "${ns}"
        --set image.registry="${image_registry}"
        --set image.repository="${image_repo}"
        --set image.tag="${image_tag}"
        --set architecture=standalone
        --set auth.rootPassword="${MARIADB_ROOT_PASSWORD}"
        --set auth.database="${MARIADB_DATABASE}"
        --set auth.username="${MARIADB_USER}"
        --set auth.password="${MARIADB_PASSWORD}"
        --set primary.extraFlags="--max-connections=${MARIADB_MAX_CONNECTIONS}"
        --wait --timeout=600s
    )

    if [[ "${use_local_chart}" != "true" ]]; then
        helm_args+=(--version "${MARIADB_CHART_VERSION}")
    fi

    if [[ "${persistence_enabled}" == "true" ]]; then
        helm_args+=(
            --set primary.persistence.enabled=true
            --set primary.persistence.size="${MARIADB_STORAGE_SIZE}"
        )
        if [[ -n "${MARIADB_STORAGE_CLASS}" ]]; then
            helm_args+=(--set primary.persistence.storageClass="${MARIADB_STORAGE_CLASS}")
        fi
    else
        helm_args+=(--set primary.persistence.enabled=false)
    fi

    helm "${helm_args[@]}"

    log_info "MariaDB installed successfully"
    log_info "MariaDB connection info:"
    log_info "  Host: mariadb.${ns}.svc.cluster.local"
    log_info "  Port: 3306"
    log_info "  Root Password: ${MARIADB_ROOT_PASSWORD}"
    log_info "  Database: ${MARIADB_DATABASE}"
    log_info "  Username: ${MARIADB_USER}"
    log_info "  Password: ${MARIADB_PASSWORD}"

    # Create additional databases and grant permissions
    setup_mariadb_databases

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

install_mariadb() {
    if [[ -z "${MARIADB_IMAGE}" ]]; then
        MARIADB_IMAGE="$(image_from_registry "${MARIADB_IMAGE_REPOSITORY}" "${MARIADB_IMAGE_TAG}" "${MARIADB_IMAGE_FALLBACK}")"
    fi

    if is_bitnami_mariadb_image "${MARIADB_IMAGE}" || [[ "${MARIADB_IMAGE_REPOSITORY}" == bitnami/mariadb ]]; then
        install_mariadb_bitnami
    else
        install_mariadb_official
    fi
}

uninstall_mariadb() {
    local ns="${MARIADB_NAMESPACE}"
    log_info "Uninstalling MariaDB from namespace ${ns}..."

    local delete_data="${MARIADB_PURGE_PVC}"
    for arg in "$@"; do
        case "${arg}" in
            --delete-data)
                delete_data="true"
                ;;
            *)
                log_error "Unknown mariadb uninstall option: ${arg}"
                return 1
                ;;
        esac
    done

    helm uninstall mariadb -n "${ns}" 2>/dev/null || true
    kubectl -n "${ns}" delete statefulset mariadb 2>/dev/null || true
    kubectl -n "${ns}" delete svc mariadb mariadb-headless 2>/dev/null || true
    kubectl -n "${ns}" delete secret mariadb-auth 2>/dev/null || true

    if [[ "${delete_data}" == "true" ]]; then
        log_warn "Deleting MariaDB PVCs (data loss!)"
        kubectl delete pvc -n "${ns}" -l app.kubernetes.io/instance=mariadb 2>/dev/null || true
        kubectl delete pvc -n "${ns}" -l app.kubernetes.io/name=mariadb 2>/dev/null || true
        kubectl delete pvc -n "${ns}" data-mariadb-0 2>/dev/null || true
    fi

    log_info "MariaDB uninstall done"
}

is_bitnami_redis_image() {
    local image="$1"
    [[ "${image}" == *"/bitnami/redis:"* || "${image}" == "bitnami/redis:"* ]]
}

install_redis_official() {
    local image="${REDIS_IMAGE}"
    if [[ -z "${image}" ]]; then
        image="$(image_from_registry "${REDIS_IMAGE_REPOSITORY}" "${REDIS_IMAGE_TAG}" "${REDIS_IMAGE_FALLBACK}")"
        REDIS_IMAGE="${image}"
    fi

    local ns="${REDIS_NAMESPACE}"
    log_info "Installing Redis (single-node) via manifest with image: ${image}"

    kubectl create namespace "${ns}" 2>/dev/null || true

    local persistence_enabled="${REDIS_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. Redis PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi

            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling Redis persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: redis-auth
  namespace: ${ns}
type: Opaque
stringData:
  redis-password: "${REDIS_PASSWORD}"
EOF

    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: ${ns}
  labels:
    app: redis
spec:
  type: ClusterIP
  selector:
    app: redis
  ports:
    - name: redis
      port: 6379
      targetPort: 6379
EOF

    local storage_class_yaml=""
    if [[ -n "${REDIS_STORAGE_CLASS}" ]]; then
        storage_class_yaml="        storageClassName: \"${REDIS_STORAGE_CLASS}\""
    fi

    if [[ "${persistence_enabled}" == "true" ]]; then
        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: ${ns}
  labels:
    app: redis
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      securityContext:
        fsGroup: 999
      initContainers:
        - name: volume-permissions
          image: "${LOCALPV_HELPER_IMAGE}"
          imagePullPolicy: IfNotPresent
          command: ["sh","-c","mkdir -p /data && chown -R 999:999 /data"]
          securityContext:
            runAsUser: 0
          volumeMounts:
            - name: data
              mountPath: /data
      containers:
        - name: redis
          image: "${image}"
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 6379
              name: redis
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-auth
                  key: redis-password
          command: ["sh","-c"]
          args:
            - 'exec redis-server --appendonly yes --requirepass "\$REDIS_PASSWORD"'
          readinessProbe:
            tcpSocket:
              port: 6379
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 6
          livenessProbe:
            tcpSocket:
              port: 6379
            initialDelaySeconds: 15
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: data
              mountPath: /data
          securityContext:
            runAsUser: 999
            runAsGroup: 999
            runAsNonRoot: true
  volumeClaimTemplates:
    - metadata:
        name: data
        labels:
          app: redis
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: "${REDIS_STORAGE_SIZE}"
${storage_class_yaml}
EOF
    else
        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ${ns}
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      securityContext:
        fsGroup: 999
      containers:
        - name: redis
          image: "${image}"
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 6379
              name: redis
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-auth
                  key: redis-password
          command: ["sh","-c"]
          args:
            - 'exec redis-server --appendonly no --requirepass "\$REDIS_PASSWORD"'
          readinessProbe:
            tcpSocket:
              port: 6379
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 6
          livenessProbe:
            tcpSocket:
              port: 6379
            initialDelaySeconds: 15
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            runAsUser: 999
            runAsGroup: 999
            runAsNonRoot: true
EOF
    fi

    # If there is an in-progress StatefulSet rollout but the existing Pod is not Ready, it may block updates (OrderedReady).
    # Force restart the single replica to pick up the new template.
    if kubectl -n "${ns}" get sts redis >/dev/null 2>&1; then
        local sts_current_revision
        local sts_update_revision
        sts_current_revision="$(kubectl -n "${ns}" get sts redis -o jsonpath='{.status.currentRevision}' 2>/dev/null || true)"
        sts_update_revision="$(kubectl -n "${ns}" get sts redis -o jsonpath='{.status.updateRevision}' 2>/dev/null || true)"
        if [[ -n "${sts_update_revision}" && -n "${sts_current_revision}" && "${sts_update_revision}" != "${sts_current_revision}" ]]; then
            log_warn "Redis StatefulSet rollout pending (${sts_current_revision} -> ${sts_update_revision}); restarting pod to apply new template..."
            kubectl -n "${ns}" delete pod redis-0 --ignore-not-found --grace-period=0 --force >/dev/null 2>&1 || true
        fi
    fi

    kubectl -n "${ns}" wait --for=condition=Ready pod -l app=redis --timeout=180s 2>/dev/null || true

    log_info "Redis installed successfully"
    log_info "Redis connection info:"
    log_info "  Host: redis.${ns}.svc.cluster.local"
    log_info "  Port: 6379"
    log_info "  Password: ${REDIS_PASSWORD}"

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

# Install Redis via Helm (Bitnami chart or local chart) unless REDIS_IMAGE is provided.
install_redis() {
    local ns="${REDIS_NAMESPACE}"
    
    # Create namespace if not exists
    kubectl create namespace "${ns}" 2>/dev/null || true

    # Check if using local chart directory (priority: local chart dir > tgz > remote)
    local use_local_chart="false"
    local chart_ref=""
    
    # Priority 1: Use local chart directory if it exists (scripts/charts/proton-redis) - sentinel mode
    if [[ -d "${REDIS_LOCAL_CHART_DIR}" ]]; then
        use_local_chart="true"
        chart_ref="${REDIS_LOCAL_CHART_DIR}"
        log_info "Using local Redis chart from: ${chart_ref} (proton-redis, sentinel mode)"
        install_redis_sentinel_local
        return $?
    # Priority 2: Use local chart tgz if exists
    elif [[ -f "${REDIS_CHART_TGZ}" ]]; then
        use_local_chart="true"
        chart_ref="${REDIS_CHART_TGZ}"
        log_info "Using local Redis chart tgz: ${chart_ref}"
        # For tgz, assume it's Bitnami chart (standalone only)
    # Priority 3: Use Bitnami chart from remote repo
    else
        # Use Bitnami chart from remote repo
        chart_ref="bitnami/redis"
        log_info "Using remote Redis chart: ${chart_ref} (version ${REDIS_CHART_VERSION})"
    fi

    # Default to deploying the official Redis image via manifest (to avoid Docker Hub pulls).
    # If REDIS_IMAGE is not explicitly set, compose it from conf/config.yaml:image.registry.
    if [[ -z "${REDIS_IMAGE}" ]]; then
        REDIS_IMAGE="$(image_from_registry "${REDIS_IMAGE_REPOSITORY}" "${REDIS_IMAGE_TAG}" "${REDIS_IMAGE_FALLBACK}")"
    fi

    if [[ -n "${REDIS_IMAGE}" ]] && ! is_bitnami_redis_image "${REDIS_IMAGE}"; then
        install_redis_official
        return $?
    fi

    log_info "Installing Redis ${REDIS_VERSION} (standalone) via Helm..."

    local persistence_enabled="${REDIS_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. Redis PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi

            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling Redis persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm repo add --force-update bitnami "${HELM_REPO_BITNAMI}"
        helm repo update
    fi
    
    # Install Redis using Bitnami chart
    local -a helm_args
    helm_args=(
        upgrade --install redis "${chart_ref}"
        --namespace "${ns}"
        --set image.tag="${REDIS_VERSION}"
        --set architecture="${architecture}"
        --set auth.enabled=true
        --set auth.password="${REDIS_PASSWORD}"
        --wait --timeout=600s
    )

    if [[ "${use_local_chart}" != "true" ]]; then
        helm_args+=(--version "${REDIS_CHART_VERSION}")
    fi

    if [[ "${persistence_enabled}" == "true" ]]; then
        helm_args+=(
            --set master.persistence.enabled=true
            --set master.persistence.size="${REDIS_STORAGE_SIZE}"
        )
        if [[ -n "${REDIS_STORAGE_CLASS}" ]]; then
            helm_args+=(--set master.persistence.storageClass="${REDIS_STORAGE_CLASS}")
        fi
    else
        helm_args+=(--set master.persistence.enabled=false)
    fi

    helm "${helm_args[@]}"
    
    log_info "Redis ${REDIS_VERSION} (${architecture}) installed successfully"
    log_info "Redis connection info:"
    log_info "  Host: redis-master.${ns}.svc.cluster.local"
    log_info "  Port: 6379"
    log_info "  Password: ${REDIS_PASSWORD}"

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

# Install Redis in sentinel mode using local chart (proton-redis)
install_redis_sentinel_local() {
    local ns="${REDIS_NAMESPACE}"
    local redis_release_name="redis"
    log_info "Installing Redis in sentinel mode using proton-redis chart..."

    # Build image registry string (default from user's values)
    local image_registry="${REDIS_IMAGE_REGISTRY:-swr.cn-east-3.myhuaweicloud.com/kweaver-ai}"
    if [[ -z "${image_registry}" ]]; then
        # Try to get from config.yaml
        image_registry=$(grep -E "^[[:space:]]*registry:" "${SCRIPT_DIR}/conf/config.yaml" 2>/dev/null | head -1 | sed 's/.*registry:[[:space:]]*//' | tr -d "'\"")
    fi
    if [[ -z "${image_registry}" ]]; then
        image_registry="swr.cn-east-3.myhuaweicloud.com/kweaver-ai"
    fi

    # Decode base64 password if provided (user's values has YWRwQHJlZGlzMTIz which is base64 of adp@redis123)
    local redis_password="${REDIS_PASSWORD:-adp@redis123}"
    # If password looks like base64, try to decode it
    if echo "${redis_password}" | grep -qE '^[A-Za-z0-9+/]+={0,2}$' && [[ ${#redis_password} -gt 10 ]]; then
        local decoded
        decoded=$(echo "${redis_password}" | base64 -d 2>/dev/null || echo "")
        if [[ -n "${decoded}" ]]; then
            redis_password="${decoded}"
        fi
    fi

    # Prepare Helm values according to user's specification
    local -a helm_args
    helm_args=(
        upgrade --install redis "${REDIS_LOCAL_CHART_DIR}"
        --namespace "${ns}"
        --set enableSecurityContext=false
        --set env.language=en_US.UTF-8
        --set env.timezone=Asia/Shanghai
        --set image.registry="${image_registry}"
        --set namespace="${ns}"
        --set redis.masterGroupName="${REDIS_MASTER_GROUP_NAME:-mymaster}"
        --set redis.rootPassword="${redis_password}"
        --set redis.rootUsername=root
        --set replicaCount="${REDIS_REPLICA_COUNT:-1}"
        --set service.enableDualStack=false
        --set service.sentinel.port=26379
        --set storage.storageClassName=local-path
        --wait --timeout=600s
    )

    # Set image repository and tag if provided
    if [[ -n "${REDIS_IMAGE_REPOSITORY}" ]]; then
        helm_args+=(--set image.redis.repository="${REDIS_IMAGE_REPOSITORY}")
    fi
    if [[ -n "${REDIS_IMAGE_TAG}" ]]; then
        helm_args+=(--set image.redis.tag="${REDIS_IMAGE_TAG}")
    fi

    # Set storage capacity if persistence is enabled
    if [[ "${REDIS_PERSISTENCE_ENABLED:-true}" == "true" ]]; then
        helm_args+=(--set storage.capacity="${REDIS_STORAGE_SIZE:-5Gi}")
    fi

    log_info "Installing Redis with values:"
    log_info "  Chart: ${REDIS_LOCAL_CHART_DIR}"
    log_info "  Namespace: ${ns}"
    log_info "  Image Registry: ${image_registry}"
    log_info "  Replica Count: ${REDIS_REPLICA_COUNT:-1}"
    log_info "  Master Group: ${REDIS_MASTER_GROUP_NAME:-mymaster}"
    log_info "  Storage Class: local-path"

    helm "${helm_args[@]}"
    
    # Wait for Pods to be ready
    log_info "Waiting for Redis Pods to be ready..."
    # Try multiple label selectors for different chart naming conventions
    kubectl wait --for=condition=ready pod -l app="${redis_release_name}-proton-redis" -n "${ns}" --timeout=300s 2>/dev/null || \
    kubectl wait --for=condition=ready pod -l "app.kubernetes.io/instance=${redis_release_name}" -n "${ns}" --timeout=300s 2>/dev/null || {
        log_warn "Redis Pod(s) may not be ready yet"
    }
    
    log_info "Redis sentinel mode installed successfully"
    log_info "Redis sentinel connection info:"
    log_info "  Sentinel Host: redis-sentinel.${ns}.svc.cluster.local"
    log_info "  Sentinel Port: 26379"
    log_info "  Master Group: ${REDIS_MASTER_GROUP_NAME:-mymaster}"
    log_info "  Password: ${redis_password}"
    log_info "  Replicas: ${REDIS_REPLICA_COUNT:-1}"

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        log_info "Generating config.yaml with Redis sentinel configuration..."
        generate_config_yaml
    fi
}

uninstall_redis() {
    local ns="${REDIS_NAMESPACE}"
    log_info "Uninstalling Redis from namespace ${ns}..."

    helm uninstall redis -n "${ns}" 2>/dev/null || true
    # Best-effort cleanup for old Bitnami redis chart resources (may remain if release was upgraded/failed).
    kubectl delete -n "${ns}" sts,deploy,svc,pod,cm,secret,pdb -l app.kubernetes.io/instance=redis 2>/dev/null || true
    kubectl delete deploy/redis -n "${ns}" 2>/dev/null || true
    kubectl delete sts/redis -n "${ns}" 2>/dev/null || true
    kubectl delete svc/redis -n "${ns}" 2>/dev/null || true
    kubectl delete secret/redis-auth -n "${ns}" 2>/dev/null || true

    if [[ "${REDIS_PURGE_PVC}" == "true" ]]; then
        log_warn "REDIS_PURGE_PVC=true: deleting Redis PVCs (data loss!)"
        # Delete PVCs by label (Bitnami chart)
        kubectl delete pvc -n "${ns}" -l app.kubernetes.io/instance=redis 2>/dev/null || true
        kubectl delete pvc -n "${ns}" -l app.kubernetes.io/name=redis 2>/dev/null || true
        kubectl delete pvc -n "${ns}" -l app=redis 2>/dev/null || true
        # Delete PVCs by name pattern (local chart StatefulSet)
        # Local chart uses volumeClaimTemplates, so PVCs are named: redis-datadir-redis-0, redis-datadir-redis-1, etc.
        local redis_release_name="redis"
        local pvc_patterns=(
            "data-redis-0"
            "data-redis-1"
            "data-redis-2"
            "redis-datadir-${redis_release_name}-0"
            "redis-datadir-${redis_release_name}-1"
            "redis-datadir-${redis_release_name}-2"
        )
        for pvc_name in "${pvc_patterns[@]}"; do
            kubectl delete pvc -n "${ns}" "${pvc_name}" 2>/dev/null || true
        done
        # Also try to find and delete any PVCs that match the pattern
        local existing_pvcs
        existing_pvcs="$(kubectl -n "${ns}" get pvc -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")"
        if [[ -n "${existing_pvcs}" ]]; then
            for pvc in ${existing_pvcs}; do
                if [[ "${pvc}" =~ ^redis-datadir-.*-redis-[0-9]+$ ]] || [[ "${pvc}" =~ ^data-redis-[0-9]+$ ]]; then
                    kubectl delete pvc -n "${ns}" "${pvc}" 2>/dev/null || true
                fi
            done
        fi
    else
        log_info "REDIS_PURGE_PVC=false: Redis PVCs were retained."
    fi

    log_info "Redis uninstall done"
}

install_kafka() {
    log_info "Installing Kafka (1 controller + 1 broker) via Helm..."

    if ! command -v helm >/dev/null 2>&1; then
        log_error "Helm is required to install Kafka. Please run: $0 k8s init"
        return 1
    fi

    kubectl create namespace "${KAFKA_NAMESPACE}" 2>/dev/null || true

    if [[ -z "${KAFKA_IMAGE}" ]]; then
        KAFKA_IMAGE="$(image_from_registry "${KAFKA_IMAGE_REPOSITORY}" "${KAFKA_IMAGE_TAG}" "${KAFKA_IMAGE_FALLBACK}")"
    fi

    if [[ "${KAFKA_AUTH_ENABLED}" == "true" ]]; then
        # Ensure passwords exist (and persist via a Secret for idempotency)
        if kubectl -n "${KAFKA_NAMESPACE}" get secret "${KAFKA_SASL_SECRET_NAME}" >/dev/null 2>&1; then
            if [[ -z "${KAFKA_CLIENT_PASSWORD}" ]]; then
                KAFKA_CLIENT_PASSWORD="$(get_secret_b64_key "${KAFKA_NAMESPACE}" "${KAFKA_SASL_SECRET_NAME}" client-passwords)"
                KAFKA_CLIENT_PASSWORD="${KAFKA_CLIENT_PASSWORD%%,*}"
            fi
            if [[ -z "${KAFKA_INTERBROKER_PASSWORD}" ]]; then
                KAFKA_INTERBROKER_PASSWORD="$(get_secret_b64_key "${KAFKA_NAMESPACE}" "${KAFKA_SASL_SECRET_NAME}" inter-broker-password)"
            fi
            if [[ -z "${KAFKA_CONTROLLER_PASSWORD}" ]]; then
                KAFKA_CONTROLLER_PASSWORD="$(get_secret_b64_key "${KAFKA_NAMESPACE}" "${KAFKA_SASL_SECRET_NAME}" controller-password)"
            fi
        fi

        if [[ -z "${KAFKA_CLIENT_PASSWORD}" ]]; then
            KAFKA_CLIENT_PASSWORD="$(random_password)"
        fi
        if [[ -z "${KAFKA_INTERBROKER_PASSWORD}" ]]; then
            KAFKA_INTERBROKER_PASSWORD="$(random_password)"
        fi
        if [[ -z "${KAFKA_CONTROLLER_PASSWORD}" ]]; then
            KAFKA_CONTROLLER_PASSWORD="$(random_password)"
        fi

        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: ${KAFKA_SASL_SECRET_NAME}
  namespace: ${KAFKA_NAMESPACE}
type: Opaque
stringData:
  client-passwords: "${KAFKA_CLIENT_PASSWORD}"
  inter-broker-password: "${KAFKA_INTERBROKER_PASSWORD}"
  controller-password: "${KAFKA_CONTROLLER_PASSWORD}"
EOF

        # Force SASL listeners when auth is enabled
        KAFKA_PROTOCOL="SASL_PLAINTEXT"
    fi

    local persistence_enabled="${KAFKA_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. Kafka PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi

            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling Kafka persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    # Parse image registry/repository/tag from KAFKA_IMAGE
    local image_without_tag="${KAFKA_IMAGE%:*}"
    local image_tag="${KAFKA_IMAGE##*:}"
    local image_registry="${image_without_tag%%/*}"
    local image_repo="${image_without_tag#*/}"

    local chart_ref="bitnami/kafka"
    local use_local_chart="false"
    if [[ -f "${KAFKA_CHART_TGZ}" ]]; then
        chart_ref="${KAFKA_CHART_TGZ}"
        use_local_chart="true"
        log_info "Using local Kafka chart: ${chart_ref}"
    else
        log_info "Using remote Kafka chart: ${chart_ref} (version ${KAFKA_CHART_VERSION})"
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm repo add --force-update bitnami "${HELM_REPO_BITNAMI}"
        helm repo update
    fi

    # Use a temporary values file for Kafka config overrides.
    local tmp_values
    tmp_values="$(mktemp /tmp/kafka-values.XXXXXX.yaml)"
    
    # KRaft requires controller.quorum.voters (or --initial-controllers during storage format).
    # Without it, controller pods will CrashLoop with:
    #   Because controller.quorum.voters is not set on this controller, you must specify ... --initial-controllers ...
    local quorum_voters=""
    local i
    for ((i = 0; i < KAFKA_REPLICAS; i++)); do
        local voter="${i}@${KAFKA_RELEASE_NAME}-controller-${i}.${KAFKA_RELEASE_NAME}-controller-headless.${KAFKA_NAMESPACE}.svc.cluster.local:9093"
        if [[ -z "${quorum_voters}" ]]; then
            quorum_voters="${voter}"
        else
            quorum_voters="${quorum_voters},${voter}"
        fi
    done
    
    # Convert boolean to string for Kafka server.properties (true/false -> "true"/"false")
    local auto_create_topics_value="true"
    if [[ "${KAFKA_AUTO_CREATE_TOPICS_ENABLE}" != "true" ]]; then
        auto_create_topics_value="false"
    fi
    
    cat > "${tmp_values}" <<EOF
# Global overrideConfiguration (applies to both controller and broker)
# Both controller and broker need controller.quorum.voters to know the controller quorum addresses
overrideConfiguration:
  "controller.quorum.voters": "${quorum_voters}"
  "auto.create.topics.enable": "${auto_create_topics_value}"
EOF

    if [[ "${KAFKA_REPLICAS}" == "1" ]]; then
        cat >> "${tmp_values}" <<EOF
  "default.replication.factor": 1
  "min.insync.replicas": 1
  "offsets.topic.replication.factor": 1
  "transaction.state.log.replication.factor": 1
  "transaction.state.log.min.isr": 1
EOF
    fi

    cat >> "${tmp_values}" <<EOF
listeners:
  # Avoid clients dialing per-pod headless DNS from advertised.listeners; advertise the stable service DNS instead.
  advertisedListeners: "CLIENT://${KAFKA_RELEASE_NAME}.${KAFKA_NAMESPACE}.svc.cluster.local:9092,INTERNAL://${KAFKA_RELEASE_NAME}.${KAFKA_NAMESPACE}.svc.cluster.local:9094"
EOF

    local -a helm_args
    helm_args=(
        upgrade --install "${KAFKA_RELEASE_NAME}" "${chart_ref}"
        --namespace "${KAFKA_NAMESPACE}"
        -f "${tmp_values}"
        --set global.security.allowInsecureImages=true
        --set image.registry="${image_registry}"
        --set image.repository="${image_repo}"
        --set image.tag="${image_tag}"
        # KRaft: run controller-eligible nodes as controllers only, and run dedicated broker nodes for client traffic.
        # This prevents clients from ever landing on controller pods (which would break consumer groups / JoinGroup).
        --set controller.replicaCount="${KAFKA_REPLICAS}"
        --set controller.controllerOnly=true
        --set broker.replicaCount="${KAFKA_REPLICAS}"
        --set broker.heapOpts="${KAFKA_HEAP_OPTS}"
        # Client/inter-broker can be SASL, but controller listener should stay PLAINTEXT for compatibility
        --set listeners.client.protocol="${KAFKA_PROTOCOL}"
        --set listeners.controller.protocol=PLAINTEXT
        --set listeners.interbroker.protocol="${KAFKA_PROTOCOL}"
        --wait --timeout="${KAFKA_HELM_TIMEOUT}"
    )

    if [[ "${KAFKA_HELM_ATOMIC}" == "true" ]]; then
        helm_args+=(--atomic)
    fi

    if [[ "${KAFKA_AUTH_ENABLED}" == "true" ]]; then
        helm_args+=(
            --set sasl.enabledMechanisms="${KAFKA_SASL_MECHANISM}"
            --set sasl.interBrokerMechanism="${KAFKA_SASL_MECHANISM}"
            --set sasl.interbroker.user="${KAFKA_INTERBROKER_USER}"
            --set sasl.client.users[0]="${KAFKA_CLIENT_USER}"
            --set sasl.existingSecret="${KAFKA_SASL_SECRET_NAME}"
        )
    fi

    if [[ -n "${KAFKA_MEMORY_REQUEST}" || -n "${KAFKA_MEMORY_LIMIT}" ]]; then
        helm_args+=(--set controller.resourcesPreset=none --set broker.resourcesPreset=none)
        if [[ -n "${KAFKA_MEMORY_REQUEST}" ]]; then
            helm_args+=(--set controller.resources.requests.memory="${KAFKA_MEMORY_REQUEST}" --set broker.resources.requests.memory="${KAFKA_MEMORY_REQUEST}")
        fi
        if [[ -n "${KAFKA_MEMORY_LIMIT}" ]]; then
            helm_args+=(--set controller.resources.limits.memory="${KAFKA_MEMORY_LIMIT}" --set broker.resources.limits.memory="${KAFKA_MEMORY_LIMIT}")
        fi
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm_args+=(--version "${KAFKA_CHART_VERSION}")
    fi

    if [[ "${persistence_enabled}" == "true" ]]; then
        helm_args+=(
            --set controller.persistence.enabled=true
            --set controller.persistence.size="${KAFKA_STORAGE_SIZE}"
            --set broker.persistence.enabled=true
            --set broker.persistence.size="${KAFKA_STORAGE_SIZE}"
        )
        if [[ -n "${KAFKA_STORAGE_CLASS}" ]]; then
            helm_args+=(
                --set controller.persistence.storageClass="${KAFKA_STORAGE_CLASS}"
                --set broker.persistence.storageClass="${KAFKA_STORAGE_CLASS}"
            )
        fi
    else
        helm_args+=(--set controller.persistence.enabled=false --set broker.persistence.enabled=false)
    fi

    local helm_out=""
    set +e
    helm_out="$(helm "${helm_args[@]}" 2>&1)"
    local helm_rc=$?
    set -e
    rm -f "${tmp_values}" 2>/dev/null || true

    if [[ ${helm_rc} -ne 0 ]]; then
        log_error "Kafka Helm install/upgrade failed (exit code: ${helm_rc})."
        echo "${helm_out}" >&2
        log_info "Collecting Kafka diagnostics (pods/events/pvc)..."
        kubectl -n "${KAFKA_NAMESPACE}" get pods -o wide 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" get pvc 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" get svc,endpoints 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" get events --sort-by=.lastTimestamp 2>/dev/null | tail -n 60 || true
        return ${helm_rc}
    fi

    log_info "Kafka installed successfully"
    log_info "Kafka connection info:"
    log_info "  Namespace: ${KAFKA_NAMESPACE}"
    log_info "  Release: ${KAFKA_RELEASE_NAME}"
    log_info "  Port: 9092"

    # Post-install health check (pods might exist but be CrashLooping; Helm can still "succeed").
    if ! kubectl -n "${KAFKA_NAMESPACE}" wait --for=condition=Ready pod -l "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME}" --timeout="${KAFKA_READY_TIMEOUT}" >/dev/null 2>&1; then
        log_error "Kafka pods are not Ready within ${KAFKA_READY_TIMEOUT}."
        log_info "Kafka pods:"
        kubectl -n "${KAFKA_NAMESPACE}" get pod -o wide 2>/dev/null || true
        log_info "Recent events:"
        kubectl -n "${KAFKA_NAMESPACE}" get events --sort-by=.lastTimestamp 2>/dev/null | tail -n 80 || true
        log_info "Describe controller/broker (best-effort):"
        kubectl -n "${KAFKA_NAMESPACE}" describe pod "${KAFKA_RELEASE_NAME}-controller-0" 2>/dev/null | tail -n 200 || true
        kubectl -n "${KAFKA_NAMESPACE}" describe pod "${KAFKA_RELEASE_NAME}-broker-0" 2>/dev/null | tail -n 200 || true
        log_info "Logs (best-effort):"
        kubectl -n "${KAFKA_NAMESPACE}" logs "${KAFKA_RELEASE_NAME}-controller-0" --tail=200 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" logs "${KAFKA_RELEASE_NAME}-controller-0" --previous --tail=200 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" logs "${KAFKA_RELEASE_NAME}-broker-0" --tail=200 2>/dev/null || true
        kubectl -n "${KAFKA_NAMESPACE}" logs "${KAFKA_RELEASE_NAME}-broker-0" --previous --tail=200 2>/dev/null || true
        return 1
    fi

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

uninstall_kafka() {
    log_info "Uninstalling Kafka from namespace ${KAFKA_NAMESPACE}..."

    helm uninstall "${KAFKA_RELEASE_NAME}" -n "${KAFKA_NAMESPACE}" 2>/dev/null || true

    if [[ "${KAFKA_PURGE_PVC}" == "true" ]]; then
        log_info "Deleting Kafka PVCs..."

        # Capture PV names bound to Kafka PVCs (so we can clean up PVs after PVC deletion)
        local pv_names=()
        local pvc_list
        pvc_list="$(kubectl -n "${KAFKA_NAMESPACE}" get pvc -l "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME}" -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{.spec.volumeName}{"\n"}{end}' 2>/dev/null || true)"
        if [[ -n "${pvc_list}" ]]; then
            while IFS="|" read -r pvc_name pv_name; do
                if [[ -n "${pv_name}" ]]; then
                    pv_names+=("${pv_name}")
                fi
            done <<< "${pvc_list}"
        fi

        # Delete PVCs (common label sets + fallback patterns)
        kubectl delete pvc -n "${KAFKA_NAMESPACE}" -l "app.kubernetes.io/instance=${KAFKA_RELEASE_NAME}" 2>/dev/null || true
        kubectl delete pvc -n "${KAFKA_NAMESPACE}" -l "app.kubernetes.io/name=kafka" 2>/dev/null || true
        # Common Bitnami PVC names (best-effort)
        kubectl delete pvc -n "${KAFKA_NAMESPACE}" -l "app=${KAFKA_RELEASE_NAME}" 2>/dev/null || true

        # Best-effort PV cleanup: delete PVs that become Released
        if [[ ${#pv_names[@]} -gt 0 ]]; then
            local pv
            for pv in "${pv_names[@]}"; do
                # Wait briefly for PV to transition after PVC deletion
                sleep 1
                local phase
                phase="$(kubectl get pv "${pv}" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
                if [[ "${phase}" == "Released" ]]; then
                    kubectl delete pv "${pv}" 2>/dev/null || true
                fi
            done
        fi
    else
        log_warn "KAFKA_PURGE_PVC=false: Kafka PVCs were retained."
    fi

    log_info "Kafka uninstall done"
}

install_opensearch() {
    log_info "Installing OpenSearch via Helm..."

    if [[ -z "${OPENSEARCH_INITIAL_ADMIN_PASSWORD}" ]]; then
        log_error "OPENSEARCH_INITIAL_ADMIN_PASSWORD is empty; OpenSearch will not start."
        return 1
    fi

    kubectl create namespace "${OPENSEARCH_NAMESPACE}" 2>/dev/null || true

    if [[ -z "${OPENSEARCH_IMAGE}" ]]; then
        OPENSEARCH_IMAGE="$(image_from_registry "${OPENSEARCH_IMAGE_REPOSITORY}" "${OPENSEARCH_IMAGE_TAG}" "${OPENSEARCH_IMAGE_FALLBACK}")"
    fi

    local persistence_enabled="${OPENSEARCH_PERSISTENCE_ENABLED}"
    if [[ "${persistence_enabled}" == "true" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. OpenSearch PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi

            if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
                log_warn "Still no StorageClass found. Disabling OpenSearch persistence to avoid Pending PVC."
                persistence_enabled="false"
            fi
        fi
    fi

    # Parse image repository/tag from OPENSEARCH_IMAGE (chart expects image.repository + image.tag)
    local os_image_repo="${OPENSEARCH_IMAGE%:*}"
    local os_image_tag="${OPENSEARCH_IMAGE##*:}"
    if [[ "${os_image_repo}" == "${OPENSEARCH_IMAGE}" || -z "${os_image_tag}" ]]; then
        log_error "Invalid OPENSEARCH_IMAGE (expected repo:tag): ${OPENSEARCH_IMAGE}"
        return 1
    fi

    # Parse init image repo/tag for busybox-based initContainers (chart expects persistence.image/imageTag + sysctlInit.image/imageTag)
    local init_image_repo="${OPENSEARCH_INIT_IMAGE%:*}"
    local init_image_tag="${OPENSEARCH_INIT_IMAGE##*:}"
    if [[ "${init_image_repo}" == "${OPENSEARCH_INIT_IMAGE}" || -z "${init_image_tag}" ]]; then
        log_error "Invalid OPENSEARCH_INIT_IMAGE (expected repo:tag): ${OPENSEARCH_INIT_IMAGE}"
        return 1
    fi

    local chart_ref="opensearch/opensearch"
    local use_local_chart="false"
    if [[ -f "${OPENSEARCH_CHART_TGZ}" ]]; then
        chart_ref="${OPENSEARCH_CHART_TGZ}"
        use_local_chart="true"
        log_info "Using local OpenSearch chart: ${chart_ref}"
    else
        log_info "Using remote OpenSearch chart: ${chart_ref} (version ${OPENSEARCH_CHART_VERSION})"
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm repo add --force-update opensearch "${HELM_REPO_OPENSEARCH}"
        helm repo update
    fi

    local disable_security="${OPENSEARCH_DISABLE_SECURITY}"
    if [[ -z "${disable_security}" ]]; then
        if [[ "${OPENSEARCH_PROTOCOL}" == "http" ]]; then
            disable_security="true"
        else
            disable_security="false"
        fi
    fi

    local tmp_os_yml
    tmp_os_yml="$(mktemp)"
    cat >"${tmp_os_yml}" <<EOF
cluster.name: ${OPENSEARCH_CLUSTER_NAME}
network.host: 0.0.0.0
EOF
    if [[ "${disable_security}" == "true" ]]; then
        cat >>"${tmp_os_yml}" <<EOF
plugins.security.disabled: true
EOF
    fi

    local -a helm_args
    helm_args=(
        upgrade --install "${OPENSEARCH_RELEASE_NAME}" "${chart_ref}"
        --namespace "${OPENSEARCH_NAMESPACE}"
        --atomic
        --set image.repository="${os_image_repo}"
        --set image.tag="${os_image_tag}"
        --set-file config.opensearch\\.yml="${tmp_os_yml}"
        --set persistence.image="${init_image_repo}"
        --set persistence.imageTag="${init_image_tag}"
        --set opensearchJavaOpts="${OPENSEARCH_JAVA_OPTS}"
        --set clusterName="${OPENSEARCH_CLUSTER_NAME}"
        --set nodeGroup="${OPENSEARCH_NODE_GROUP}"
        --set singleNode="${OPENSEARCH_SINGLE_NODE}"
        --set replicas=1
        --set sysctlInit.enabled="${OPENSEARCH_SYSCTL_INIT_ENABLED}"
        --set sysctlInit.image="${init_image_repo}"
        --set sysctlInit.imageTag="${init_image_tag}"
        --set sysctlVmMaxMapCount="${OPENSEARCH_SYSCTL_VM_MAX_MAP_COUNT}"
        --set-string extraEnvs[0].name=OPENSEARCH_INITIAL_ADMIN_PASSWORD
        --set-string extraEnvs[0].value="${OPENSEARCH_INITIAL_ADMIN_PASSWORD}"
        --wait --timeout=900s
    )

    if [[ "${use_local_chart}" != "true" ]]; then
        helm_args+=(--version "${OPENSEARCH_CHART_VERSION}")
    fi

    if [[ "${persistence_enabled}" == "true" ]]; then
        helm_args+=(
            --set persistence.enabled=true
            --set persistence.size="${OPENSEARCH_STORAGE_SIZE}"
        )
        if [[ -n "${OPENSEARCH_STORAGE_CLASS}" ]]; then
            helm_args+=(--set persistence.storageClass="${OPENSEARCH_STORAGE_CLASS}")
        fi
    else
        helm_args+=(--set persistence.enabled=false)
    fi

    if [[ -n "${OPENSEARCH_MEMORY_REQUEST}" ]]; then
        helm_args+=(--set resources.requests.memory="${OPENSEARCH_MEMORY_REQUEST}")
    fi
    if [[ -n "${OPENSEARCH_MEMORY_LIMIT}" ]]; then
        helm_args+=(--set resources.limits.memory="${OPENSEARCH_MEMORY_LIMIT}")
    fi

    helm "${helm_args[@]}"
    rm -f "${tmp_os_yml}" 2>/dev/null || true

    local service_name="${OPENSEARCH_CLUSTER_NAME}-${OPENSEARCH_NODE_GROUP}"
    log_info "OpenSearch installed successfully"
    log_info "OpenSearch connection info:"
    log_info "  Service: ${service_name}.${OPENSEARCH_NAMESPACE}.svc.cluster.local"
    log_info "  Port: 9200"
    if [[ "${disable_security}" == "true" ]]; then
        log_warn "  Security: disabled (HTTP, no auth)"
    else
        log_info "  Security: enabled (HTTPS + basic auth)"
        log_info "  Username: admin"
        log_info "  Password: ${OPENSEARCH_INITIAL_ADMIN_PASSWORD}"
    fi

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}

uninstall_opensearch() {
    log_info "Uninstalling OpenSearch from namespace ${OPENSEARCH_NAMESPACE}..."

    helm uninstall "${OPENSEARCH_RELEASE_NAME}" -n "${OPENSEARCH_NAMESPACE}" 2>/dev/null || true

    # Delete PVCs (this will also trigger PV deletion if reclaim policy is Delete)
    if [[ "${OPENSEARCH_PURGE_PVC}" == "true" ]]; then
        log_warn "OPENSEARCH_PURGE_PVC=true: deleting OpenSearch PVCs (data loss!)"
        
        # Get all PVCs related to OpenSearch before deletion
        local pvc_names
        pvc_names=$(kubectl get pvc -n "${OPENSEARCH_NAMESPACE}" -l "app.kubernetes.io/instance=${OPENSEARCH_RELEASE_NAME}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)
        
        # Delete PVCs by label
        kubectl delete pvc -n "${OPENSEARCH_NAMESPACE}" -l "app.kubernetes.io/instance=${OPENSEARCH_RELEASE_NAME}" 2>/dev/null || true
        # Also try to delete by name pattern (OpenSearch chart naming)
        kubectl delete pvc -n "${OPENSEARCH_NAMESPACE}" -l "app.kubernetes.io/name=opensearch" 2>/dev/null || true
        # Try to delete PVCs by name pattern
        local pvc_name="${OPENSEARCH_CLUSTER_NAME}-${OPENSEARCH_NODE_GROUP}-${OPENSEARCH_CLUSTER_NAME}-${OPENSEARCH_NODE_GROUP}-0"
        kubectl delete pvc -n "${OPENSEARCH_NAMESPACE}" "${pvc_name}" 2>/dev/null || true
        
        # Wait a bit for PVs to be released
        sleep 2
        
        # Try to delete PVs that are in Released state
        log_info "Cleaning up Released PVs..."
        local released_pvs
        released_pvs=$(kubectl get pv -o jsonpath='{.items[?(@.status.phase=="Released")].metadata.name}' 2>/dev/null || true)
        if [[ -n "${released_pvs}" ]]; then
            for pv in ${released_pvs}; do
                # Check if this PV was bound to one of the deleted PVCs
                local pv_claim
                pv_claim=$(kubectl get pv "${pv}" -o jsonpath='{.spec.claimRef.name}' 2>/dev/null || true)
                if [[ -n "${pv_claim}" ]] && echo "${pvc_names}" | grep -q "${pv_claim}"; then
                    log_info "Deleting Released PV: ${pv}"
                    kubectl delete pv "${pv}" 2>/dev/null || true
                fi
            done
        fi
    else
        # Even if PURGE_PVC is false, try to find and delete orphaned PVCs
        log_info "Checking for orphaned PVCs..."
        local orphaned_pvcs
        orphaned_pvcs=$(kubectl get pvc -n "${OPENSEARCH_NAMESPACE}" -l "app.kubernetes.io/instance=${OPENSEARCH_RELEASE_NAME}" -o name 2>/dev/null || true)
        if [[ -n "${orphaned_pvcs}" ]]; then
            log_warn "Found orphaned PVCs. Use OPENSEARCH_PURGE_PVC=true to delete them."
        fi
    fi

    log_info "OpenSearch uninstall done"
}

# Install Zookeeper via Helm
install_zookeeper() {
    log_info "Installing Zookeeper via Helm..."

    kubectl create namespace "${ZOOKEEPER_NAMESPACE}" 2>/dev/null || true

    # Check for StorageClass if persistence is enabled
    local storage_class="${ZOOKEEPER_STORAGE_CLASS}"
    if [[ -z "${storage_class}" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. Zookeeper PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi
            # Try to use local-path if available
            if kubectl get storageclass local-path >/dev/null 2>&1; then
                storage_class="local-path"
                log_info "Using local-path StorageClass for Zookeeper"
            fi
        else
            # Use first available StorageClass
            storage_class="$(kubectl get storageclass -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)"
            log_info "Using StorageClass: ${storage_class}"
        fi
    fi

    # Determine chart reference (remote repo or local path)
    local chart_ref="${ZOOKEEPER_CHART_REF}"
    local use_local_chart="false"
    
    if [[ -z "${chart_ref}" ]]; then
        # Default to local chart if ZOOKEEPER_CHART_REF is not set
        chart_ref="${LOCAL_ZOOKEEPER_CHARTS_DIR}"
        use_local_chart="true"
    fi
    
    # Check if it's a local path
    if [[ -d "${chart_ref}" ]]; then
        use_local_chart="true"
        log_info "Using local Zookeeper chart: ${chart_ref}"
    elif [[ "${chart_ref}" == *"/"* && ! "${chart_ref}" =~ ^/ ]]; then
        # Looks like a remote chart reference (e.g., "dip/zookeeper")
        use_local_chart="false"
        log_info "Using remote Zookeeper chart: ${chart_ref}"
    else
        # Try to use as local path
        if [[ -d "${chart_ref}" ]]; then
            use_local_chart="true"
            log_info "Using local Zookeeper chart: ${chart_ref}"
        else
            log_error "Zookeeper chart not found: ${chart_ref}"
            log_error "Please set ZOOKEEPER_CHART_REF to a valid chart path or remote repo (e.g., 'dip/zookeeper')"
            return 1
        fi
    fi

    # Create temporary values file for Helm (handles array structures like SASL users)
    local tmp_values
    tmp_values="$(mktemp /tmp/zookeeper-values.XXXXXX.yaml)"
    cat > "${tmp_values}" <<EOF
namespace: ${ZOOKEEPER_NAMESPACE}
replicaCount: ${ZOOKEEPER_REPLICAS}
antiAffinity:
  enabled: false
image:
  registry: ${ZOOKEEPER_IMAGE_REGISTRY}
  zookeeper:
    repository: ${ZOOKEEPER_IMAGE_REPOSITORY}
    tag: ${ZOOKEEPER_IMAGE_TAG}
  exporter:
    repository: ${ZOOKEEPER_EXPORTER_IMAGE_REPOSITORY}
    tag: ${ZOOKEEPER_EXPORTER_IMAGE_TAG}
service:
  zookeeper:
    port: ${ZOOKEEPER_SERVICE_PORT}
  exporter:
    port: ${ZOOKEEPER_EXPORTER_PORT}
  jmxExporter:
    port: ${ZOOKEEPER_JMX_EXPORTER_PORT}
config:
  zookeeperENV:
    JVMFLAGS: ${ZOOKEEPER_JVMFLAGS}
  sasl:
    enabled: ${ZOOKEEPER_SASL_ENABLED}
EOF

    # Add SASL users if enabled
    if [[ "${ZOOKEEPER_SASL_ENABLED}" == "true" ]]; then
        cat >> "${tmp_values}" <<EOF
    user:
      - username: ${ZOOKEEPER_SASL_USER}
        password: ${ZOOKEEPER_SASL_PASSWORD}
EOF
    fi

    # Add storage and resources
    # Note: Chart logic:
    # - If storageClassName is set (non-empty), uses that StorageClass
    # - If storageClassName is empty/not set, chart checks storage.local for local PVs
    # - If neither, PVC will use cluster's default StorageClass (if exists)
    cat >> "${tmp_values}" <<EOF
storage:
  capacity: ${ZOOKEEPER_STORAGE_SIZE}
EOF

    # Set storageClassName if we have one
    if [[ -n "${storage_class}" ]]; then
        cat >> "${tmp_values}" <<EOF
  storageClassName: ${storage_class}
EOF
        log_info "Using StorageClass: ${storage_class}"
    else
        # If no StorageClass found, set to empty string
        # Chart will check storage.local for local storage, or use default StorageClass
        cat >> "${tmp_values}" <<EOF
  storageClassName: ""
EOF
        log_info "No StorageClass specified, using empty string (chart will handle)"
    fi

    cat >> "${tmp_values}" <<EOF
resources:
  requests:
    cpu: ${ZOOKEEPER_RESOURCES_REQUESTS_CPU}
    memory: ${ZOOKEEPER_RESOURCES_REQUESTS_MEMORY}
  limits:
    cpu: ${ZOOKEEPER_RESOURCES_LIMITS_CPU}
    memory: ${ZOOKEEPER_RESOURCES_LIMITS_MEMORY}
EOF

    # Install via Helm with values file
    log_info "Installing Zookeeper Helm chart..."
    log_info "Chart reference: ${chart_ref}"
    log_info "Release name: ${ZOOKEEPER_RELEASE_NAME}"
    log_info "Namespace: ${ZOOKEEPER_NAMESPACE}"
    
    local helm_cmd=(
        helm upgrade --install "${ZOOKEEPER_RELEASE_NAME}" "${chart_ref}"
        --namespace "${ZOOKEEPER_NAMESPACE}"
        -f "${tmp_values}"
    )
    
    # Add additional values file if specified
    if [[ -n "${ZOOKEEPER_VALUES_FILE}" && -f "${ZOOKEEPER_VALUES_FILE}" ]]; then
        helm_cmd+=(-f "${ZOOKEEPER_VALUES_FILE}")
        log_info "Using additional values file: ${ZOOKEEPER_VALUES_FILE}"
    fi
    
    # Add version if specified
    if [[ -n "${ZOOKEEPER_CHART_VERSION}" ]]; then
        helm_cmd+=(--version "${ZOOKEEPER_CHART_VERSION}")
        log_info "Using chart version: ${ZOOKEEPER_CHART_VERSION}"
    fi
    
    # Add --devel flag if enabled
    if [[ "${ZOOKEEPER_CHART_DEVEL}" == "true" ]]; then
        helm_cmd+=(--devel)
        log_info "Using --devel flag (development versions)"
    fi
    
    # Add extra --set values if specified
    if [[ -n "${ZOOKEEPER_EXTRA_SET_VALUES}" ]]; then
        # Split by space and add each as --set
        # Use array to handle multiple values
        local -a set_values
        read -ra set_values <<< "${ZOOKEEPER_EXTRA_SET_VALUES}"
        local set_value
        for set_value in "${set_values[@]}"; do
            if [[ -n "${set_value}" ]]; then
                helm_cmd+=(--set "${set_value}")
                log_info "Adding --set: ${set_value}"
            fi
        done
    fi
    
    helm_cmd+=(--wait --timeout=600s)
    
    log_info "Running: ${helm_cmd[*]}"
    
    local helm_output
    helm_output=$("${helm_cmd[@]}" 2>&1)
    local helm_exit_code=$?
    
    rm -f "${tmp_values}" 2>/dev/null || true
    
    if [[ ${helm_exit_code} -ne 0 ]]; then
        log_error "Failed to install Zookeeper"
        log_error "Helm command exit code: ${helm_exit_code}"
        log_error "Helm output:"
        echo "${helm_output}" | while IFS= read -r line; do
            log_error "  ${line}"
        done
        return 1
    fi

    log_info "Zookeeper installed successfully"
    
    # Wait for Zookeeper to be ready
    log_info "Waiting for Zookeeper Pod to be ready..."
    kubectl wait --for=condition=ready pod -l "app=${ZOOKEEPER_RELEASE_NAME}" -n "${ZOOKEEPER_NAMESPACE}" --timeout=300s 2>/dev/null || {
        log_warn "Zookeeper Pod may not be ready yet"
    }
    
    log_info "Zookeeper connection info:"
    log_info "  Service: ${ZOOKEEPER_RELEASE_NAME}-headless.${ZOOKEEPER_NAMESPACE}.svc.cluster.local"
    log_info "  Port: ${ZOOKEEPER_SERVICE_PORT}"
    if [[ "${ZOOKEEPER_SASL_ENABLED}" == "true" ]]; then
        log_info "  SASL enabled: true"
        log_info "  SASL user: ${ZOOKEEPER_SASL_USER}"
    fi

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        log_info "Calling generate_config_yaml to update config.yaml..."
        generate_config_yaml
        log_info "Config.yaml generation completed"
    else
        log_info "AUTO_GENERATE_CONFIG is false, skipping config generation"
    fi
}

# Uninstall Zookeeper
uninstall_zookeeper() {
    log_info "Uninstalling Zookeeper from namespace ${ZOOKEEPER_NAMESPACE}..."

    helm uninstall "${ZOOKEEPER_RELEASE_NAME}" -n "${ZOOKEEPER_NAMESPACE}" 2>/dev/null || true

    # Delete PVCs by default (Zookeeper PVCs are deleted on uninstall)
    if [[ "${ZOOKEEPER_PURGE_PVC}" == "true" ]]; then
        log_info "Deleting Zookeeper PVCs..."
        
        # Get all PVCs related to Zookeeper before deletion
        local pvc_names
        pvc_names=$(kubectl get pvc -n "${ZOOKEEPER_NAMESPACE}" -l "app=${ZOOKEEPER_RELEASE_NAME}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)
        
        # Delete PVCs by label
        kubectl delete pvc -n "${ZOOKEEPER_NAMESPACE}" -l "app=${ZOOKEEPER_RELEASE_NAME}" 2>/dev/null || true
        
        # Also try to delete by name pattern
        local i
        for ((i=0; i<ZOOKEEPER_REPLICAS; i++)); do
            kubectl delete pvc -n "${ZOOKEEPER_NAMESPACE}" "data-${ZOOKEEPER_RELEASE_NAME}-${i}" 2>/dev/null || true
        done
        
        # Wait a bit for PVs to be released
        sleep 2
        
        # Try to delete PVs that are in Released state
        log_info "Cleaning up Released PVs..."
        local released_pvs
        released_pvs=$(kubectl get pv -o jsonpath='{.items[?(@.status.phase=="Released")].metadata.name}' 2>/dev/null || true)
        if [[ -n "${released_pvs}" ]]; then
            for pv in ${released_pvs}; do
                # Check if this PV was bound to one of the deleted PVCs
                local pv_claim
                pv_claim=$(kubectl get pv "${pv}" -o jsonpath='{.spec.claimRef.name}' 2>/dev/null || true)
                if [[ -n "${pv_claim}" ]] && echo "${pvc_names}" | grep -q "${pv_claim}"; then
                    log_info "Deleting Released PV: ${pv}"
                    kubectl delete pv "${pv}" 2>/dev/null || true
                fi
            done
        fi
    else
        log_warn "ZOOKEEPER_PURGE_PVC=false: Zookeeper PVCs were retained."
    fi

    log_info "Zookeeper uninstall done"
}

# Install MongoDB via Helm
install_mongodb() {
    log_info "Installing MongoDB via Helm..."

    kubectl create namespace "${MONGODB_NAMESPACE}" 2>/dev/null || true

    # Check for StorageClass if persistence is enabled
    local storage_class="${MONGODB_STORAGE_CLASS}"
    if [[ -z "${storage_class}" ]]; then
        if [[ -z "$(kubectl get storageclass --no-headers 2>/dev/null)" ]]; then
            log_warn "No StorageClass found. MongoDB PVC will stay Pending."
            if [[ "${AUTO_INSTALL_LOCALPV}" == "true" ]]; then
                install_localpv
            fi
            # Try to use local-path if available
            if kubectl get storageclass local-path >/dev/null 2>&1; then
                storage_class="local-path"
                log_info "Using local-path StorageClass for MongoDB"
            fi
        else
            # Use first available StorageClass
            storage_class="$(kubectl get storageclass -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)"
            log_info "Using StorageClass: ${storage_class}"
        fi
    fi

    # Create or check MongoDB secret
    if ! kubectl -n "${MONGODB_NAMESPACE}" get secret "${MONGODB_SECRET_NAME}" >/dev/null 2>&1; then
        log_info "Creating MongoDB secret..."
        local mongodb_password="${MONGODB_SECRET_PASSWORD}"
        if [[ -z "${mongodb_password}" ]]; then
            mongodb_password="$(openssl rand -base64 32 | tr -d '\n')"
            log_info "Generated MongoDB password"
        fi
        # Only create keyfile if replica set is enabled
        local secret_args=(
            --from-literal=username="${MONGODB_SECRET_USERNAME}"
            --from-literal=password="${mongodb_password}"
        )
        if [[ "${MONGODB_REPLSET_ENABLED:-false}" == "true" ]]; then
            local mongodb_keyfile
            # MongoDB keyfile must be <= 1024 bytes (not base64 encoded size)
            # Generate 768 bytes of random data, base64 encode it (will be ~1024 chars)
            # Then truncate to exactly 1024 bytes to be safe
            mongodb_keyfile="$(openssl rand -base64 768 | tr -d '\n' | head -c 1024)"
            secret_args+=(--from-literal=mongodb.keyfile="${mongodb_keyfile}")
        fi
        kubectl create secret generic "${MONGODB_SECRET_NAME}" \
            "${secret_args[@]}" \
            -n "${MONGODB_NAMESPACE}" 2>/dev/null || {
            log_error "Failed to create MongoDB secret"
            return 1
        }
        log_info "MongoDB secret created"
    else
        log_info "MongoDB secret already exists"
        # If replica set is enabled, ensure mongodb.keyfile exists in the Secret (older installs may not have it)
        if [[ "${MONGODB_REPLSET_ENABLED:-false}" == "true" ]]; then
            local existing_keyfile_b64
            existing_keyfile_b64="$(kubectl -n "${MONGODB_NAMESPACE}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.mongodb\.keyfile}' 2>/dev/null || true)"
            if [[ -z "${existing_keyfile_b64}" ]]; then
                log_warn "MongoDB replica set is enabled but secret ${MONGODB_SECRET_NAME} has no mongodb.keyfile; patching secret..."
                local mongodb_keyfile
                # MongoDB keyfile must be <= 1024 bytes (not base64 encoded size)
                # Generate 768 bytes of random data, base64 encode it (will be ~1024 chars)
                # Then truncate to exactly 1024 bytes to be safe
                mongodb_keyfile="$(openssl rand -base64 768 | tr -d '\n' | head -c 1024)"
                local mongodb_keyfile_b64
                mongodb_keyfile_b64="$(printf '%s' "${mongodb_keyfile}" | base64 | tr -d '\n')"
                kubectl -n "${MONGODB_NAMESPACE}" patch secret "${MONGODB_SECRET_NAME}" --type merge \
                    -p "{\"data\":{\"mongodb.keyfile\":\"${mongodb_keyfile_b64}\"}}" >/dev/null 2>&1 || {
                    log_error "Failed to patch mongodb.keyfile into secret ${MONGODB_SECRET_NAME}"
                    return 1
                }
                log_info "Patched mongodb.keyfile into secret ${MONGODB_SECRET_NAME}"
            fi
        fi
    fi

    # Prepare chart path
    local chart_path="${LOCAL_MONGODB_CHARTS_DIR}"
    if [[ ! -d "${chart_path}" ]]; then
        log_error "MongoDB chart not found at: ${chart_path}"
        log_error "Please ensure the MongoDB chart is available at ${chart_path}"
        return 1
    fi

    # Prepare values
    local mongodb_image="${MONGODB_IMAGE}"
    if [[ -z "${mongodb_image}" ]]; then
        mongodb_image="${MONGODB_IMAGE_REPOSITORY}:${MONGODB_IMAGE_TAG}"
    fi

    # Parse image repository/tag
    local image_repo="${mongodb_image%:*}"
    local image_tag="${mongodb_image##*:}"
    if [[ "${image_repo}" == "${mongodb_image}" || -z "${image_tag}" ]]; then
        log_error "Invalid MONGODB_IMAGE (expected repo:tag): ${mongodb_image}"
        return 1
    fi

    # Build Helm values
    local helm_values=(
        "mongodb.image.repository=${image_repo}"
        "mongodb.image.tag=${image_tag}"
        "mongodb.replicas=${MONGODB_REPLICAS}"
        "mongodb.replSet.enabled=${MONGODB_REPLSET_ENABLED}"
        "mongodb.replSet.name=${MONGODB_REPLSET_NAME}"
        "mongodb.service.type=${MONGODB_SERVICE_TYPE}"
        "mongodb.service.port=${MONGODB_SERVICE_PORT}"
        "mongodb.conf.wiredTigerCacheSizeGB=${MONGODB_WIRED_TIGER_CACHE_SIZE_GB}"
        "mongodb.resources.requests.cpu=${MONGODB_RESOURCES_REQUESTS_CPU}"
        "mongodb.resources.requests.memory=${MONGODB_RESOURCES_REQUESTS_MEMORY}"
        "mongodb.resources.limits.cpu=${MONGODB_RESOURCES_LIMITS_CPU}"
        "mongodb.resources.limits.memory=${MONGODB_RESOURCES_LIMITS_MEMORY}"
        "storage.capacity=${MONGODB_STORAGE_SIZE}"
        "secret.name=${MONGODB_SECRET_NAME}"
        "secret.createSecret=false"
    )

    if [[ -n "${storage_class}" ]]; then
        helm_values+=("storage.storageClassName=${storage_class}")
    else
        helm_values+=("storage.storageClassName=")
    fi

    # Install via Helm
    log_info "Installing MongoDB Helm chart..."
    log_info "Chart path: ${chart_path}"
    log_info "Release name: ${MONGODB_RELEASE_NAME}"
    log_info "Namespace: ${MONGODB_NAMESPACE}"
    
    # Build helm command with all values
    local helm_cmd=(
        helm upgrade --install "${MONGODB_RELEASE_NAME}" "${chart_path}"
        --namespace "${MONGODB_NAMESPACE}"
    )
    
    # Add all set values
    for val in "${helm_values[@]}"; do
        helm_cmd+=(--set "${val}")
    done
    
    helm_cmd+=(--wait --timeout=600s)
    
    log_info "Running: ${helm_cmd[*]}"
    
    # Execute helm command and capture output
    local helm_output
    helm_output=$("${helm_cmd[@]}" 2>&1)
    local helm_exit_code=$?
    
    if [[ ${helm_exit_code} -ne 0 ]]; then
        log_error "Failed to install MongoDB"
        log_error "Helm command exit code: ${helm_exit_code}"
        log_error "Helm output:"
        echo "${helm_output}" | while IFS= read -r line; do
            log_error "  ${line}"
        done
        
        # Try to get more details from helm status if release exists
        if helm status "${MONGODB_RELEASE_NAME}" -n "${MONGODB_NAMESPACE}" >/dev/null 2>&1; then
            log_info "Release exists, checking status..."
            helm status "${MONGODB_RELEASE_NAME}" -n "${MONGODB_NAMESPACE}" 2>&1 | while IFS= read -r line; do
                log_info "  ${line}"
            done
        fi
        
        # Check for pod issues
        log_info "Checking for pod issues..."
        if kubectl -n "${MONGODB_NAMESPACE}" get pods -l "app=${MONGODB_RELEASE_NAME}-mongodb" >/dev/null 2>&1; then
            kubectl -n "${MONGODB_NAMESPACE}" get pods -l "app=${MONGODB_RELEASE_NAME}-mongodb" 2>&1 | while IFS= read -r line; do
                log_info "  ${line}"
            done
            
            # Get pod events
            local pod_name
            pod_name=$(kubectl -n "${MONGODB_NAMESPACE}" get pods -l "app=${MONGODB_RELEASE_NAME}-mongodb" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
            if [[ -n "${pod_name}" ]]; then
                log_info "Pod events for ${pod_name}:"
                kubectl -n "${MONGODB_NAMESPACE}" describe pod "${pod_name}" 2>&1 | grep -A 20 "Events:" | while IFS= read -r line; do
                    log_info "  ${line}"
                done || true
            fi
        fi
        
        return 1
    else
        log_info "Helm installation output:"
        echo "${helm_output}" | while IFS= read -r line; do
            log_info "  ${line}"
        done
    fi

    log_info "MongoDB installed successfully"
    
    # Wait for MongoDB to be ready before initializing replica set and creating databases
    log_info "Waiting for MongoDB Pod(s) to be ready..."
    kubectl wait --for=condition=ready pod -l "app=${MONGODB_RELEASE_NAME}-mongodb" -n "${MONGODB_NAMESPACE}" --timeout=300s 2>/dev/null || {
        log_warn "MongoDB Pod(s) may not be ready yet"
    }
    
    # Initialize replica set if enabled (supports both single-node and multi-node replica sets)
    if [[ "${MONGODB_REPLSET_ENABLED:-false}" == "true" ]]; then
        log_info "Initializing MongoDB replica set..."
        setup_mongodb_replicaset
    fi
    
    # Create databases
    setup_mongodb_databases
    
    log_info "MongoDB connection info:"
    log_info "  Service: ${MONGODB_RELEASE_NAME}-mongodb.${MONGODB_NAMESPACE}.svc.cluster.local"
    log_info "  Port: 28000"
    log_info "  Username: ${MONGODB_SECRET_USERNAME}"
    local secret_password
    secret_password=$(kubectl -n "${MONGODB_NAMESPACE}" get secret "${MONGODB_SECRET_NAME}" -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    if [[ -n "${secret_password}" ]]; then
        log_info "  Password: ${secret_password}"
    else
        log_info "  Password: (check secret ${MONGODB_SECRET_NAME})"
    fi
    log_info "  AuthSource: anyshare"
    if [[ "${MONGODB_REPLSET_ENABLED:-false}" == "true" ]]; then
        log_info "  ReplicaSet: ${MONGODB_REPLSET_NAME}"
    fi

    log_info "AUTO_GENERATE_CONFIG=${AUTO_GENERATE_CONFIG}"
    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        log_info "Calling generate_config_yaml to update config.yaml..."
        generate_config_yaml
        log_info "Config.yaml generation completed"
    else
        log_info "AUTO_GENERATE_CONFIG is false, skipping config generation"
    fi
}

# Uninstall MongoDB
uninstall_mongodb() {
    log_info "Uninstalling MongoDB from namespace ${MONGODB_NAMESPACE}..."

    helm uninstall "${MONGODB_RELEASE_NAME}" -n "${MONGODB_NAMESPACE}" 2>/dev/null || true

    # Delete PVCs by default (MongoDB PVCs are deleted on uninstall)
    log_info "Deleting MongoDB PVCs..."
    
    # Get all PVCs related to MongoDB before deletion
    local pvc_names
    pvc_names=$(kubectl get pvc -n "${MONGODB_NAMESPACE}" -l "app=${MONGODB_RELEASE_NAME}-mongodb" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)
    
    # Delete PVCs by label
    kubectl delete pvc -n "${MONGODB_NAMESPACE}" -l "app=${MONGODB_RELEASE_NAME}-mongodb" 2>/dev/null || true
    
    # Wait a bit for PVs to be released
    sleep 2
    
    # Try to delete PVs that are in Released state
    log_info "Cleaning up Released PVs..."
    local released_pvs
    released_pvs=$(kubectl get pv -o jsonpath='{.items[?(@.status.phase=="Released")].metadata.name}' 2>/dev/null || true)
    if [[ -n "${released_pvs}" ]]; then
        for pv in ${released_pvs}; do
            # Check if this PV was bound to one of the deleted PVCs
            local pv_claim
            pv_claim=$(kubectl get pv "${pv}" -o jsonpath='{.spec.claimRef.name}' 2>/dev/null || true)
            if [[ -n "${pv_claim}" ]] && echo "${pvc_names}" | grep -q "${pv_claim}"; then
                log_info "Deleting Released PV: ${pv}"
                kubectl delete pv "${pv}" 2>/dev/null || true
            fi
        done
    fi

    log_info "MongoDB uninstall done"
}

# Install ingress-nginx-controller
install_ingress_nginx() {
    log_info "Installing ingress-nginx-controller..."

    # Create namespace if not exists
    kubectl create namespace ingress-nginx 2>/dev/null || true

    if [[ -z "${INGRESS_NGINX_CONTROLLER_IMAGE}" ]]; then
        INGRESS_NGINX_CONTROLLER_IMAGE="$(image_from_registry "${INGRESS_NGINX_CONTROLLER_IMAGE_REPOSITORY}" "${INGRESS_NGINX_CONTROLLER_IMAGE_TAG}" "${INGRESS_NGINX_CONTROLLER_IMAGE_FALLBACK}")"
    fi
    if [[ -z "${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE}" ]]; then
        INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE="$(image_from_registry "${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_REPOSITORY}" "${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_TAG}" "${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE_FALLBACK}")"
    fi

    if helm status ingress-nginx -n ingress-nginx >/dev/null 2>&1; then
        if kubectl -n ingress-nginx rollout status deployment/ingress-nginx-controller --timeout=3s >/dev/null 2>&1; then
            local current_image=""
            current_image="$(kubectl -n ingress-nginx get deploy ingress-nginx-controller -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)"
            if [[ -n "${current_image}" && "${current_image}" == "${INGRESS_NGINX_CONTROLLER_IMAGE}" ]]; then
                if [[ "${INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED}" != "true" ]]; then
                    if kubectl get validatingwebhookconfiguration ingress-nginx-admission >/dev/null 2>&1; then
                        log_warn "ingress-nginx admission webhook still exists but is disabled in config; upgrading/cleaning..."
                    else
                        log_info "ingress-nginx is already installed with desired image (${current_image}), skipping"
                        return 0
                    fi
                else
                    log_info "ingress-nginx is already installed with desired image (${current_image}), skipping"
                    return 0
                fi
            fi
            log_warn "ingress-nginx installed but image differs (${current_image} != ${INGRESS_NGINX_CONTROLLER_IMAGE}); upgrading..."
        fi
    fi

    # Parse image repository/tag from INGRESS_NGINX_CONTROLLER_IMAGE
    local controller_repo="${INGRESS_NGINX_CONTROLLER_IMAGE%:*}"
    local controller_tag="${INGRESS_NGINX_CONTROLLER_IMAGE##*:}"
    if [[ "${controller_repo}" == "${INGRESS_NGINX_CONTROLLER_IMAGE}" || -z "${controller_tag}" ]]; then
        log_error "Invalid INGRESS_NGINX_CONTROLLER_IMAGE (expected repo:tag): ${INGRESS_NGINX_CONTROLLER_IMAGE}"
        return 1
    fi

    # Parse webhook certgen image repository/tag (admission webhook jobs)
    local certgen_repo="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE%:*}"
    local certgen_tag="${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE##*:}"
    if [[ "${certgen_repo}" == "${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE}" || -z "${certgen_tag}" ]]; then
        log_error "Invalid INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE (expected repo:tag): ${INGRESS_NGINX_WEBHOOK_CERTGEN_IMAGE}"
        return 1
    fi

    local chart_ref="ingress-nginx/ingress-nginx"
    local use_local_chart="false"
    if [[ -f "${INGRESS_NGINX_CHART_TGZ}" ]]; then
        chart_ref="${INGRESS_NGINX_CHART_TGZ}"
        use_local_chart="true"
        log_info "Using local ingress-nginx chart: ${chart_ref}"
    else
        log_info "Using remote ingress-nginx chart: ${chart_ref} (version ${INGRESS_NGINX_CHART_VERSION})"
    fi

    if [[ "${use_local_chart}" != "true" ]]; then
        helm repo add --force-update ingress-nginx "${HELM_REPO_INGRESS_NGINX}"
        helm repo update
    fi

    local -a helm_args
    helm_args=(
        upgrade --install ingress-nginx "${chart_ref}"
        --namespace ingress-nginx
        --set controller.image.repository="${controller_repo}"
        --set controller.image.tag="${controller_tag}"
        --set-string controller.image.digest=
        --set controller.admissionWebhooks.patch.image.repository="${certgen_repo}"
        --set controller.admissionWebhooks.patch.image.tag="${certgen_tag}"
        --set-string controller.admissionWebhooks.patch.image.digest=
        --set controller.ingressClassResource.enabled=true
        --set controller.ingressClassResource.name="${INGRESS_NGINX_CLASS}"
        --set controller.ingressClassResource.default=true
        --set controller.ingressClass="${INGRESS_NGINX_CLASS}"
        --set defaultBackend.enabled=false
        --wait --timeout=600s
    )

    if [[ "${INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED}" != "true" ]]; then
        helm_args+=(
            --set controller.admissionWebhooks.enabled=false
        )
    fi

    if [[ "${INGRESS_NGINX_HOSTNETWORK}" == "true" ]]; then
        helm_args+=(
            --set controller.hostNetwork=true
            --set controller.dnsPolicy=ClusterFirstWithHostNet
            --set controller.service.type=ClusterIP
        )
    else
        helm_args+=(
            --set controller.service.type=NodePort
            --set controller.service.nodePorts.http="${INGRESS_NGINX_HTTP_PORT}"
            --set controller.service.nodePorts.https="${INGRESS_NGINX_HTTPS_PORT}"
        )
    fi

    if [[ "${use_local_chart}" != "true" && -n "${INGRESS_NGINX_CHART_VERSION}" ]]; then
        helm_args+=(--version "${INGRESS_NGINX_CHART_VERSION}")
    fi

    local helm_out=""
    local helm_rc=0
    set +e
    helm_out="$(helm "${helm_args[@]}" 2>&1)"
    helm_rc=$?
    set -e
    if [[ ${helm_rc} -ne 0 ]]; then
        echo "${helm_out}" >&2
        if [[ "${INGRESS_NGINX_HOSTNETWORK}" != "true" ]] && echo "${helm_out}" | grep -q "nodePort: Invalid value: .*provided port is already allocated"; then
            log_warn "NodePort ${INGRESS_NGINX_HTTP_PORT}/${INGRESS_NGINX_HTTPS_PORT} already allocated; uninstalling existing ingress-nginx release and retrying..."
            helm uninstall ingress-nginx -n ingress-nginx 2>/dev/null || true
            kubectl -n ingress-nginx delete svc -l app.kubernetes.io/instance=ingress-nginx 2>/dev/null || true
            helm "${helm_args[@]}"
        else
            return "${helm_rc}"
        fi
    else
        echo "${helm_out}"
    fi

    if [[ "${INGRESS_NGINX_ADMISSION_WEBHOOKS_ENABLED}" != "true" ]]; then
        # Best-effort cleanup of webhook resources that may linger from previous installs.
        kubectl delete validatingwebhookconfiguration ingress-nginx-admission 2>/dev/null || true
        kubectl delete mutatingwebhookconfiguration ingress-nginx-admission 2>/dev/null || true
        kubectl -n ingress-nginx delete job ingress-nginx-admission-create ingress-nginx-admission-patch 2>/dev/null || true
        kubectl -n ingress-nginx delete secret ingress-nginx-admission 2>/dev/null || true
    fi
    
    log_info "ingress-nginx-controller installed successfully"
    log_info "Ingress-nginx access info:"
    log_info "  Namespace: ingress-nginx"
    log_info "  IngressClass: ${INGRESS_NGINX_CLASS}"
    if [[ "${INGRESS_NGINX_HOSTNETWORK}" == "true" ]]; then
        log_info "  Mode: hostNetwork (ports 80/443 on node)"
        log_info ""
        log_info "To access the ingress controller:"
        log_info "  http://<node-ip>:80"
        log_info "  https://<node-ip>:443"
    else
        log_info "  Service type: NodePort"
        log_info "  HTTP NodePort: ${INGRESS_NGINX_HTTP_PORT}"
        log_info "  HTTPS NodePort: ${INGRESS_NGINX_HTTPS_PORT}"
        log_info ""
        log_info "To access the ingress controller:"
        log_info "  http://<node-ip>:${INGRESS_NGINX_HTTP_PORT}"
        log_info "  https://<node-ip>:${INGRESS_NGINX_HTTPS_PORT}"
    fi

    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        log_info "Calling generate_config_yaml to update config.yaml..."
        generate_config_yaml
        log_info "Config.yaml generation completed"
    else
        log_info "AUTO_GENERATE_CONFIG is false, skipping config generation"
    fi
}

# Show cluster status
show_status() {
    log_info "Cluster Status:"
    echo ""
    kubectl get nodes -o wide
    echo ""
    kubectl get pods -A
}

# Install system dependencies and container runtime
install_dependencies() {
    log_info "Installing system dependencies..."
    
    detect_package_manager
    
    # Update package manager
    ${PKG_MANAGER_UPDATE}
    
    # Install required packages based on package manager
    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        # For dnf, install dnf-plugins-core; for yum, install yum-plugin-versionlock (optional)
        if [[ "${PKG_MANAGER}" == "dnf" ]]; then
            ${PKG_MANAGER_INSTALL} \
                dnf-plugins-core \
                curl \
                gnupg \
                git \
                wget \
                net-tools \
                ca-certificates \
                openssl \
                tar
        else
            ${PKG_MANAGER_INSTALL} \
                curl \
                gnupg \
                git \
                wget \
                net-tools \
                ca-certificates \
                openssl \
                tar
        fi
    else
        ${PKG_MANAGER_INSTALL} \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release \
            software-properties-common \
            git \
            wget \
            net-tools \
            tar
    fi
    
    log_info "System dependencies installed"
}

# Install containerd container runtime
install_containerd() {
    log_info "Installing containerd..."

    detect_package_manager
    
    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        # For RHEL/CentOS/Fedora systems - use Aliyun Docker repository
        log_info "Configuring Docker CE yum repo: ${DOCKER_CE_REPO_URL}"
        curl -fsSLo /etc/yum.repos.d/docker-ce.repo "${DOCKER_CE_REPO_URL}"
        
        # Fix for openEuler: replace $releasever with 9 in repo file
        if [[ -f /etc/os-release ]]; then
            source /etc/os-release
            if [[ "${ID}" == "openEuler" ]] || [[ "${ID}" == "openeuler" ]]; then
                log_info "Detected openEuler system, fixing Docker CE repo paths..."
                # Replace $releasever with 9 to use centos/9/ instead of centos/24.09/
                sed -i 's|\$releasever|9|g' /etc/yum.repos.d/docker-ce.repo
            fi
        fi
        
        ${PKG_MANAGER_UPDATE}

        if command -v containerd &> /dev/null; then
            log_info "containerd is already installed"
            return 0
        fi

        ${PKG_MANAGER_INSTALL} containerd.io
    else
        # For Ubuntu/Debian systems
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
            tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        ${PKG_MANAGER_UPDATE}

        if command -v containerd &> /dev/null; then
            log_info "containerd is already installed"
            return 0
        fi

        ${PKG_MANAGER_INSTALL} containerd.io
    fi
    
    # Configure containerd
    mkdir -p /etc/containerd
    containerd config default | tee /etc/containerd/config.toml
    
    # Enable systemd cgroup driver
    sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
    
    # Start and enable containerd
    systemctl daemon-reload
    systemctl enable containerd
    systemctl restart containerd
    
    log_info "containerd installed and configured"
}

# Install crictl (container runtime interface CLI)
install_crictl() {
    log_info "Installing crictl..."
    
    if command -v crictl &> /dev/null; then
        log_info "crictl is already installed"
        # Still ensure config file exists
        if [[ ! -f /etc/crictl.yaml ]]; then
            log_info "Creating crictl configuration file..."
            cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
        fi
        return 0
    fi

    detect_package_manager

    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        log_info "Attempting to install cri-tools (crictl) from ${PKG_MANAGER} repo..."
        if ${PKG_MANAGER_INSTALL} cri-tools; then
            log_info "cri-tools installed successfully"
        else
            log_warn "Failed to install cri-tools from ${PKG_MANAGER} repo; falling back to GitHub release tarball"
        fi
    elif [[ "${PKG_MANAGER}" == "apt" ]]; then
        log_info "Attempting to install cri-tools (crictl) from apt repo..."
        if ${PKG_MANAGER_INSTALL} cri-tools; then
            log_info "cri-tools installed successfully"
        else
            log_warn "Failed to install cri-tools from apt repo; falling back to GitHub release tarball"
        fi
    fi

    if command -v crictl &> /dev/null; then
        # Create crictl configuration
        log_info "Creating crictl configuration file..."
        cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
        return 0
    fi
    
    # Download and install crictl
    CRICTL_VERSION="v1.28.0"
    ARCH="amd64"
    
    log_info "Downloading crictl ${CRICTL_VERSION}..."
    curl -L https://github.com/kubernetes-sigs/cri-tools/releases/download/${CRICTL_VERSION}/crictl-${CRICTL_VERSION}-linux-${ARCH}.tar.gz | tar -C /usr/local/bin -xz
    
    # Create crictl configuration
    log_info "Creating crictl configuration file..."
    cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
    
    log_info "crictl installed successfully"
}

# Install Kubernetes components (kubeadm, kubelet, kubectl)
install_kubernetes() {
    log_info "Installing Kubernetes components..."
    
    detect_package_manager

    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        # Always configure repo for stability and later upgrades.
        cat > /etc/yum.repos.d/kubernetes.repo <<EOF
[kubernetes]
name=Kubernetes (Aliyun mirror)
baseurl=${K8S_RPM_REPO_BASEURL}
enabled=1
gpgcheck=1
gpgkey=${K8S_RPM_REPO_GPGKEY}
EOF
        ${PKG_MANAGER_UPDATE}
    fi
    
    if ! command -v kubeadm &> /dev/null || ! command -v kubelet &> /dev/null || ! command -v kubectl &> /dev/null; then
        if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
            # For RHEL/CentOS/Fedora systems
            ${PKG_MANAGER_INSTALL} kubeadm kubelet kubectl kubernetes-cni
            # Only use hold command if it's available (dnf mark install works, yum versionlock may need plugin)
            if [[ "${PKG_MANAGER}" == "dnf" ]]; then
                ${PKG_MANAGER_HOLD} kubeadm kubelet kubectl kubernetes-cni 2>/dev/null || true
            fi
        else
            # For Ubuntu/Debian systems
            curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
            echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | \
                tee /etc/apt/sources.list.d/kubernetes.list
            
            ${PKG_MANAGER_UPDATE}
            ${PKG_MANAGER_INSTALL} kubeadm kubelet kubectl
            ${PKG_MANAGER_HOLD} kubeadm kubelet kubectl
        fi
        
        log_info "Kubernetes components installed"
    else
        log_info "Kubernetes components are already installed"
    fi
    
    # Install crictl (always install, even if K8s components already exist)
    install_crictl
    
    # Enable kubelet service
    systemctl daemon-reload
    systemctl enable kubelet
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    
    detect_package_manager
    
    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        log_info "Running ${PKG_MANAGER} update..."
        ${PKG_MANAGER} update -y
    else
        log_info "Running apt-get update and upgrade..."
        ${PKG_MANAGER_UPDATE}
        apt-get upgrade -y
    fi
    
    log_info "System packages updated"
}

# Disable SELinux
disable_selinux() {
    log_info "Disabling SELinux..."
    
    if command -v getenforce &> /dev/null; then
        SELINUX_STATUS=$(getenforce)
        if [[ "${SELINUX_STATUS}" != "Disabled" ]]; then
            log_info "Current SELinux status: ${SELINUX_STATUS}"
            
            # Disable SELinux immediately
            setenforce 0 2>/dev/null || log_warn "Failed to disable SELinux immediately"
            
            # Disable SELinux permanently
            sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config 2>/dev/null || true
            
            log_info "SELinux has been disabled (reboot required for permanent effect)"
        else
            log_info "SELinux is already disabled"
        fi
    else
        log_info "SELinux is not installed on this system"
    fi
}

# Configure system for Kubernetes
configure_system() {
    log_info "Configuring system for Kubernetes..."
    
    # Disable swap
    log_info "Disabling swap..."
    swapoff -a 2>/dev/null || true
    sed -i '/ swap / s/^/#/' /etc/fstab 2>/dev/null || true
    
    # Load required kernel modules
    log_info "Loading kernel modules..."
    modprobe overlay 2>/dev/null || true
    modprobe br_netfilter 2>/dev/null || true
    
    # Configure kernel parameters
    log_info "Configuring kernel parameters..."
    cat > /etc/sysctl.d/99-kubernetes.conf <<EOF
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
    
    # Apply sysctl settings with timeout to avoid hanging
    timeout 10 sysctl --system 2>/dev/null || log_warn "sysctl configuration may have timed out"
    
    # Ensure ip_forward is enabled immediately (in case sysctl didn't apply it)
    echo 1 > /proc/sys/net/ipv4/ip_forward 2>/dev/null || true
    
    log_info "System configured for Kubernetes"
}

# Pre-install all dependencies
preinstall_all() {
    log_info "Starting pre-installation of all dependencies..."
    
    check_root
    detect_package_manager
    install_dependencies
    install_containerd
    install_kubernetes
    install_helm
    
    log_info "Pre-installation completed successfully"
}

# Print usage
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
    echo "  ZOOKEEPER_SASL_PASSWORD        Zookeeper SASL password (default: eisoo.com123)"
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
    echo "  $0 config generate            # Generate/update conf/config.yaml"
    echo "  $0 all init                   # Full initialization with all components"
}

reset_k8s() {
    log_info "Resetting Kubernetes cluster state..."
    
    check_root
    
    # Confirmation prompt
    echo ""
    echo "WARNING: This will reset Kubernetes and clean up CNI/kubeconfig files."
    echo "This action cannot be undone."
    read -p "Type 'Y' or 'y' to confirm: " -r confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Reset cancelled by user"
        return 0
    fi
    
    systemctl stop kubelet 2>/dev/null || true
    kubeadm reset -f 2>/dev/null || true
    
    rm -rf /etc/cni/net.d 2>/dev/null || true
    rm -rf /var/lib/cni 2>/dev/null || true
    rm -rf /root/.kube 2>/dev/null || true
    rm -f /etc/kubernetes/admin.conf 2>/dev/null || true
    
    log_warn "Reset completed. iptables/IPVS rules are not automatically cleaned by this script."
    log_info "Kubernetes reset done"
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
        install_dependencies
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
                install_dependencies
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
            *)
                log_error "Unknown ingress-nginx action: ${action}"
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
                install_dependencies
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
