
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

    # Check if Kubernetes is already initialized before doing any system configuration
    if [[ -f /etc/kubernetes/admin.conf ]]; then
        if KUBECONFIG=/etc/kubernetes/admin.conf kubectl get nodes >/dev/null 2>&1; then
            log_info "Kubernetes already initialized (kubectl get nodes succeeded). Skipping system configuration and kubeadm init."
            mkdir -p /root/.kube
            cp -f /etc/kubernetes/admin.conf /root/.kube/config
            export KUBECONFIG=/root/.kube/config
            return 0
        fi
    fi

    if [[ -f /root/.kube/config ]]; then
        if KUBECONFIG=/root/.kube/config kubectl get nodes >/dev/null 2>&1; then
            log_info "Kubernetes already initialized (kubectl get nodes succeeded). Skipping system configuration and kubeadm init."
            export KUBECONFIG=/root/.kube/config
            return 0
        fi
    fi

    # Configure system for Kubernetes (only if not already initialized)
    log_info "Configuring system for Kubernetes..."
    disable_selinux
    configure_system
    
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
    
    # Final CRI check before init
    if ! crictl info &>/dev/null; then
        log_warn "CRI is not responding. Attempting to fix and restart containerd..."
        install_containerd
    fi

    log_info "Initializing the cluster..."
    # Initialize the cluster with config file
    local init_rc=0
    set +e
    kubeadm init \
        --config=/tmp/kubeadm/config.yaml \
        --ignore-preflight-errors=NumCPU,Mem 2>&1 | tee /tmp/kubeadm-init.log
    init_rc=$?
    set -e

    if [[ ${init_rc} -ne 0 ]]; then
        log_error "kubeadm init failed (exit code: ${init_rc}). Check /tmp/kubeadm-init.log for details."
        # Check for common CRI error and provide automated fix hint
        if grep -q "unknown service runtime.v1.RuntimeService" /tmp/kubeadm-init.log; then
            log_warn "Detected CRI v1 API mismatch. This usually means containerd config is missing SystemdCgroup=true or not restarted."
            log_info "Attempting automated fix for containerd..."
            install_containerd
            log_info "Retrying kubeadm init..."
            kubeadm init --config=/tmp/kubeadm/config.yaml --ignore-preflight-errors=NumCPU,Mem 2>&1 | tee /tmp/kubeadm-init.log
        else
            return 1
        fi
    fi
    
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

# Install containerd container runtime
install_containerd() {
    log_info "Installing containerd..."

    detect_package_manager
    
    # Function to configure Docker repo and handle mirrors (defined at function level for availability in retries)
    configure_docker_repo() {
        local url="$1"
        curl -fsSLo /etc/yum.repos.d/docker-ce.repo "${url}"
        
        # Fix for openEuler: replace $releasever with 9 in repo file
        if [[ -f /etc/os-release ]]; then
            source /etc/os-release
            if [[ "${ID}" == "openEuler" ]] || [[ "${ID}" == "openeuler" ]]; then
                log_info "Detected openEuler system, fixing Docker CE repo paths..."
                sed -i 's|\$releasever|9|g' /etc/yum.repos.d/docker-ce.repo
            fi
        fi
        
        # Clean and makecache for the new repo
        ${PKG_MANAGER} clean all
        rm -rf /var/cache/dnf /var/cache/yum
    }
    
    if [[ "${PKG_MANAGER}" == "dnf" ]] || [[ "${PKG_MANAGER}" == "yum" ]]; then
        # For RHEL/CentOS/Fedora systems
        
        # Check if Docker CE repo already exists
        if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
            log_info "Configuring Docker CE yum repo: ${DOCKER_CE_REPO_URL}"
            
            # Try Aliyun first
            configure_docker_repo "${DOCKER_CE_REPO_URL}"
            
            set +e
            ${PKG_MANAGER_UPDATE}
            local update_rc=$?
            set -e

            if [[ ${update_rc} -ne 0 ]]; then
                log_warn "Failed to update metadata with Aliyun Docker repo. Trying Tsinghua mirror..."
                configure_docker_repo "https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo"
                ${PKG_MANAGER_UPDATE}
            fi
        fi

        if command -v containerd &> /dev/null; then
            log_info "containerd is already installed"
            # Ensure configuration is correct even if installed
        else
        # Try installation with retries
        local i
        local max_retries=3
        local docker_repo_name="docker-ce-stable"
        
        for ((i=1; i<=max_retries; i++)); do
            log_info "Attempting to install containerd.io (Attempt $i/$max_retries)..."
            set +e
            
            # First attempt: try with only docker-ce repo (no AppStream to avoid conflicts)
            if [[ $i -eq 1 ]]; then
                log_info "Trying with docker-ce repo only..."
                ${PKG_MANAGER_INSTALL} --disablerepo="*" --enablerepo="${docker_repo_name}" --nogpgcheck containerd.io
                local install_rc=$?
            # Second attempt: include base repo for dependencies
            elif [[ $i -eq 2 ]]; then
                log_info "Trying with docker-ce and base repos..."
                ${PKG_MANAGER_INSTALL} --disablerepo="*" --enablerepo="${docker_repo_name},base" --nogpgcheck containerd.io
                local install_rc=$?
            # Third attempt: include all necessary repos
            else
                log_info "Trying with docker-ce, base, and extras repos..."
                ${PKG_MANAGER_INSTALL} --disablerepo="*" --enablerepo="${docker_repo_name},base,extras" --nogpgcheck containerd.io
                local install_rc=$?
            fi
            
            set -e
            if [[ ${install_rc} -eq 0 ]]; then
                break
            fi
            
            if [[ $i -eq 1 ]]; then
                log_warn "Installation with docker-ce repo only failed, switching to Tsinghua mirror..."
                configure_docker_repo "https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo"
                ${PKG_MANAGER_UPDATE}
            fi
            
            if [[ $i -eq $max_retries ]]; then
                log_warn "DNF installation failed after $max_retries attempts. Trying direct RPM download and install..."
                # Fallback to direct RPM install if dnf fails
                local rpm_url="https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/8/x86_64/stable/Packages/containerd.io-1.6.32-3.1.el8.x86_64.rpm"
                curl -L -o /tmp/containerd.io.rpm "${rpm_url}"
                rpm -ivh /tmp/containerd.io.rpm --nodeps --force
                if [[ $? -eq 0 ]]; then break; fi
                log_error "Failed to install containerd.io."
                return 1
            fi
            log_warn "Installation failed, cleaning cache and retrying..."
            ${PKG_MANAGER} clean all
            rm -rf /var/cache/dnf /var/cache/yum
        done
        fi
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
    
    # Always ensure CRI plugin is enabled
    if [[ ! -f /etc/containerd/config.toml ]]; then
        log_info "Creating containerd configuration file..."
        containerd config default | tee /etc/containerd/config.toml
    else
        log_info "containerd configuration file already exists, ensuring CRI plugin is enabled..."
    fi
    
    # Enable CRI plugin (always check and enable)
    if grep -q "disabled_plugins.*cri" /etc/containerd/config.toml; then
        log_info "Enabling CRI plugin in containerd..."
        sed -i 's/disabled_plugins.*=.*\[.*"cri".*\]/disabled_plugins = []/g' /etc/containerd/config.toml
    fi
    
    # Enable systemd cgroup driver
    sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
    
    # Start and enable containerd
    systemctl daemon-reload
    systemctl enable containerd
    systemctl restart containerd
    
    # Wait for containerd to be ready
    sleep 2
    
    # Verify CRI connection
    if command -v crictl &> /dev/null; then
        log_info "Verifying CRI connection..."
        if ! crictl info &> /dev/null; then
            log_warn "crictl failed to connect to containerd. Ensuring /etc/crictl.yaml is correct..."
            cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
            # Final check
            if ! crictl info &> /dev/null; then
                log_error "CRI runtime is still not responsive."
                return 1
            fi
        fi
    fi
    
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
        # Check if Kubernetes repo already exists
        if [[ ! -f /etc/yum.repos.d/kubernetes.repo ]]; then
            log_info "Configuring Kubernetes yum repo..."
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
    install_containerd
    install_kubernetes
    install_helm
    
    log_info "Pre-installation completed successfully"
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

