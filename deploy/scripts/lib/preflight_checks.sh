#!/usr/bin/env bash
# =============================================================================
# KWeaver deploy preflight checks (sourced by deploy/preflight.sh)
# =============================================================================

# shellcheck disable=SC2034
PREFLIGHT_OK_COUNT=0
PREFLIGHT_WARN_COUNT=0
PREFLIGHT_FAIL_COUNT=0
PREFLIGHT_FIXED_COUNT=0

# --- reporting helpers ---------------------------------------------------------
preflight_reset_counters() {
    PREFLIGHT_OK_COUNT=0
    PREFLIGHT_WARN_COUNT=0
    PREFLIGHT_FAIL_COUNT=0
    PREFLIGHT_FIXED_COUNT=0
}

preflight_report_append() {
    local line="$1"
    if [[ -n "${PREFLIGHT_REPORT_FILE:-}" ]]; then
        echo "${line}" >> "${PREFLIGHT_REPORT_FILE}" 2>/dev/null || true
    fi
}

preflight_ok() {
    local msg="$1"
    echo -e "${GREEN}[OK]${NC} ${msg}"
    preflight_report_append "[OK] ${msg}"
    PREFLIGHT_OK_COUNT=$((PREFLIGHT_OK_COUNT + 1))
}

preflight_warn() {
    local msg="$1"
    echo -e "${YELLOW}[WARN]${NC} ${msg}"
    preflight_report_append "[WARN] ${msg}"
    PREFLIGHT_WARN_COUNT=$((PREFLIGHT_WARN_COUNT + 1))
}

preflight_fail() {
    local msg="$1"
    echo -e "${RED}[FAIL]${NC} ${msg}"
    preflight_report_append "[FAIL] ${msg}"
    PREFLIGHT_FAIL_COUNT=$((PREFLIGHT_FAIL_COUNT + 1))
}

preflight_fixed() {
    local msg="$1"
    echo -e "${GREEN}[FIXED]${NC} ${msg}"
    preflight_report_append "[FIXED] ${msg}"
    PREFLIGHT_FIXED_COUNT=$((PREFLIGHT_FIXED_COUNT + 1))
}

# --- skip set -----------------------------------------------------------------
preflight_skip() {
    local name="$1"
    [[ "${PREFLIGHT_SKIP_SET:-}" == *"|${name}|"* ]]
}

# --- hardware ----------------------------------------------------------------
preflight_check_hardware() {
    preflight_skip "hardware" && return 0
    log_info "Checking CPU / memory / disk..."

    local cpu nproc_val mem_mb
    nproc_val="$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 0)"
    cpu="${nproc_val:-0}"
    if [[ "${cpu}" -ge 16 ]]; then
        preflight_ok "CPU cores: ${cpu} (>= 16)"
    else
        preflight_warn "CPU cores: ${cpu} (recommended >= 16; kubeadm ignores NumCPU for init)"
    fi

    if command -v free &>/dev/null; then
        mem_mb="$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}')"
    else
        mem_mb="0"
    fi
    if [[ -n "${mem_mb}" && "${mem_mb}" -ge 47104 ]]; then
        preflight_ok "Memory: ${mem_mb} MB (>= 48GB)"
    elif [[ -n "${mem_mb}" && "${mem_mb}" -ge 1 ]]; then
        preflight_warn "Memory: ${mem_mb} MB (recommended >= 48GB)"
    else
        preflight_warn "Could not read memory (free not available?)"
    fi

    for mp in / /var; do
        local line avail_mib
        if df -P "${mp}" &>/dev/null; then
            line="$(df -Pk "${mp}" 2>/dev/null | tail -1 || true)"
        else
            line="$(df -k "${mp}" 2>/dev/null | tail -1 || true)"
        fi
        # Column 4 = avail K-blocks on GNU & BSD df -k
        avail_mib="$(echo "${line}" | awk '{print int($4/1024)}')"
        if [[ -n "${avail_mib}" && "${avail_mib}" -ge 204800 ]]; then
            preflight_ok "Disk free on ${mp}: ${avail_mib} MiB (>= 200GB)"
        elif [[ -n "${avail_mib}" ]]; then
            preflight_warn "Disk free on ${mp}: ${avail_mib} MiB (recommended >= 200GB free)"
        else
            preflight_warn "Could not parse disk free for ${mp}"
        fi
    done
}

# --- OS / kernel ---------------------------------------------------------------
preflight_check_os() {
    preflight_skip "os" && return 0
    log_info "Checking OS and kernel..."

    if [[ ! -f /etc/os-release ]]; then
        preflight_warn "No /etc/os-release (expected on RHEL/Debian/openEuler; macOS/others: run on Linux target host)"
        return
    fi
    # shellcheck source=/dev/null
    . /etc/os-release

    local id_like="${ID_LIKE:-}"
    local ok_os="no"
    case "${ID:-}" in
        centos|rhel|almalinux|rocky) [[ "${VERSION_ID%%.*}" -ge 8 ]] 2>/dev/null && ok_os="yes" || true ;;
        openeuler) [[ "${VERSION_ID%%.*}" -ge 23 ]] 2>/dev/null && ok_os="yes" || true ;;
        ubuntu) [[ "${VERSION_ID%%.*}" -ge 22 ]] 2>/dev/null && ok_os="yes" || true ;;
        *) true ;;
    esac
    if [[ "${ok_os}" == "yes" ]]; then
        preflight_ok "OS: ${ID:-unknown} ${VERSION_ID:-} (in supported set)"
    else
        preflight_warn "OS: ${ID:-unknown} ${VERSION_ID:-} (expected CentOS 8+ / openEuler 23+ / Ubuntu 22.04+); verify before production"
    fi

    local kver
    kver="$(uname -r 2>/dev/null | cut -d. -f1-2)"
    # 4.18 -> compare as 4.18.0
    local kmajor kminor
    kmajor="$(uname -r | cut -d. -f1)"
    kminor="$(uname -r | cut -d. -f2 | cut -d- -f1)"
    if [[ "${kmajor}" -gt 4 ]] || { [[ "${kmajor}" -eq 4 && "${kminor}" -ge 18 ]]; }; then
        preflight_ok "Kernel: $(uname -r) (>= 4.18)"
    else
        preflight_warn "Kernel: $(uname -r) (recommended >= 4.18 for Kubernetes containerd path)"
    fi
}

# --- hostname / hosts ----------------------------------------------------------
preflight_check_hostname_hosts() {
    preflight_skip "hostname" && return 0
    log_info "Checking hostname and /etc/hosts..."

    local h
    h="$(hostname 2>/dev/null || true)"
    if echo "${h}" | grep -qE '[_A-Z]'; then
        preflight_warn "Hostname contains uppercase or underscore: ${h} (K8s best practice: lowercase, DNS-1123 labels)"
    else
        preflight_ok "Hostname: ${h}"
    fi

    if [[ -f /etc/hosts ]] && grep -qE "127\.0\.0\.1[[:space:]]+${h}" /etc/hosts 2>/dev/null; then
        preflight_ok "/etc/hosts has 127.0.0.1 ${h}"
    elif [[ -f /etc/hosts ]] && grep -qE '127\.0\.0\.1[[:space:]]+localhost' /etc/hosts; then
        preflight_warn "Consider: echo '127.0.0.1 ${h}' >> /etc/hosts (safe-fix may add this)"
    else
        preflight_warn "Review /etc/hosts for 127.0.0.1 and hostname mapping"
    fi
}

# --- swap / selinux (inspect only) --------------------------------------------
preflight_check_swap_selinux() {
    preflight_skip "swap" && return 0
    log_info "Checking swap and SELinux..."

    if swapon --show 2>/dev/null | grep -q .; then
        preflight_warn "Swap is active; deploy will disable (or run with --fix)"
    else
        preflight_ok "No active swap"
    fi

    if command -v getenforce &>/dev/null; then
        local se
        se="$(getenforce 2>/dev/null || true)"
        if [[ "${se}" == "Enforcing" ]]; then
            preflight_warn "SELinux is Enforcing; deploy scripts typically set disabled/permissive for K8s"
        else
            preflight_ok "SELinux: ${se}"
        fi
    else
        preflight_ok "SELinux tools not present (assumed not applicable)"
    fi
}

# --- firewall ------------------------------------------------------------------
preflight_check_firewall() {
    preflight_skip "firewall" && return 0
    log_info "Checking local firewall..."

    if systemctl is-active --quiet firewalld 2>/dev/null; then
        preflight_warn "firewalld is active; recommend stop/disable for one-node install (or open required ports)"
    else
        preflight_ok "firewalld is not active (or not installed)"
    fi

    if command -v ufw &>/dev/null; then
        if ufw status 2>/dev/null | grep -qi "Status: active"; then
            preflight_warn "ufw is active; ensure 6443, 80/443, NodePort range are allowed"
        fi
    fi
}

# --- sysctl / modules (inspect) ----------------------------------------------
preflight_check_sysctl_modules() {
    preflight_skip "sysctl" && return 0
    log_info "Checking IP forward and kernel modules..."

    local ipf
    ipf="$(cat /proc/sys/net/ipv4/ip_forward 2>/dev/null || echo 0)"
    if [[ "${ipf}" == "1" ]]; then
        preflight_ok "net.ipv4.ip_forward=1"
    else
        preflight_warn "net.ipv4.ip_forward is ${ipf} (K8s needs forwarding; configure_system will set)"
    fi

    for mod in br_netfilter overlay; do
        if lsmod 2>/dev/null | awk -v m="${mod}" '$1==m {f=1} END{exit !f}'; then
            preflight_ok "Kernel module loaded: ${mod}"
        else
            preflight_warn "Kernel module not loaded: ${mod} (will be loaded on fix/install)"
        fi
    done
}

# --- chrony / time -------------------------------------------------------------
preflight_check_time_sync() {
    preflight_skip "time" && return 0
    log_info "Checking time sync..."

    if systemctl is-active --quiet chronyd 2>/dev/null; then
        preflight_ok "chronyd is active"
    elif systemctl is-active --quiet ntpd 2>/dev/null; then
        preflight_ok "ntpd is active"
    elif systemctl is-active --quiet systemd-timesyncd 2>/dev/null; then
        preflight_ok "systemd-timesyncd is active"
    else
        preflight_warn "No common time sync service active (recommend chrony/ntp for TLS and logs)"
    fi
}

# --- cgroup version ------------------------------------------------------------
preflight_check_cgroup() {
    preflight_skip "cgroup" && return 0
    log_info "Checking cgroup..."

    if [[ -f /sys/fs/cgroup/cgroup.controllers ]]; then
        preflight_ok "cgroup v2 is present (/sys/fs/cgroup/cgroup.controllers); ensure containerd uses systemd cgroup driver"
    elif [[ -d /sys/fs/cgroup/net_cls ]]; then
        preflight_ok "cgroup v1 layout detected (supported)"
    else
        preflight_warn "Could not determine cgroup version"
    fi
}

# --- network reachability (optional domains) ---------------------------------
preflight_check_network() {
    preflight_skip "network" && return 0
    log_info "Checking outbound HTTPS to common registries (optional)..."

    if ! command -v curl &>/dev/null; then
        preflight_warn "curl not installed; skipping HTTP reachability checks"
        return
    fi

    local hosts=(
        "mirrors.aliyun.com"
        "mirrors.tuna.tsinghua.edu.cn"
        "registry.aliyuncs.com"
        "swr.cn-east-3.myhuaweicloud.com"
        "repo.huaweicloud.com"
        "kweaver-ai.github.io"
    )
    for h in "${hosts[@]}"; do
        if curl -sS -o /dev/null --max-time 5 --connect-timeout 3 "https://${h}/" 2>/dev/null; then
            preflight_ok "HTTPS reachability: ${h}"
        else
            preflight_warn "HTTPS reachability: ${h} (failed; deploy may need proxy if offline air-gap)"
        fi
    done
}

# --- port usage ----------------------------------------------------------------
preflight_check_ports() {
    preflight_skip "ports" && return 0
    log_info "Checking listening ports (6443, 10250, ingress)..."

    if ! command -v ss &>/dev/null && ! command -v netstat &>/dev/null; then
        preflight_warn "Neither ss nor netstat available; skipping port checks"
        return
    fi

    preflight_check_port() {
        local port="$1" desc="$2"
        local busy="no"
        if command -v ss &>/dev/null; then
            if ss -H -lnt "sport = :${port}" 2>/dev/null | grep -q .; then
                busy="yes"
            fi
        elif netstat -lnt 2>/dev/null | awk -v p=":${port}" 'index($4, p) {f=1} END{exit !f}'; then
            busy="yes"
        fi
        if [[ "${busy}" == "yes" ]]; then
            if [[ "${port}" == "6443" || "${port}" == "10250" ]]; then
                preflight_ok "Port ${port} in use (likely Kubernetes — OK if re-installing)"
            else
                preflight_warn "Port ${port} (${desc}) already in use"
            fi
        else
            preflight_ok "Port ${port} (${desc}) not listening"
        fi
    }

    local hport="${INGRESS_NGINX_HTTP_PORT:-80}"
    local sport="${INGRESS_NGINX_HTTPS_PORT:-443}"
    preflight_check_port 6443 "apiserver"
    preflight_check_port 10250 "kubelet"
    preflight_check_port "${hport}" "ingress http"
    preflight_check_port "${sport}" "ingress https"
}

# --- old cluster / k3s residue -------------------------------------------------
preflight_check_residue() {
    preflight_skip "residue" && return 0
    log_info "Checking for K3s / prior Kubernetes / CNI residue..."

    if [[ -x /usr/local/bin/k3s ]] || command -v k3s &>/dev/null; then
        preflight_fail "K3s binary found; remove or use k3s-killall.sh before this installer"
    else
        preflight_ok "No K3s binary in PATH or /usr/local/bin/k3s"
    fi

    if [[ -f /etc/kubernetes/admin.conf ]]; then
        preflight_warn "Found /etc/kubernetes/admin.conf; cluster may already be initialized. For clean install: ./deploy.sh k8s reset"
    else
        preflight_ok "No /etc/kubernetes/admin.conf (fresh for kubeadm, if target)"
    fi

    if [[ -d /etc/cni/net.d ]] && ls /etc/cni/net.d/* &>/dev/null; then
        preflight_ok "CNI config present under /etc/cni/net.d/ (OK if reusing cluster)"
    fi
}

# --- client / optional tools (not failing install host) ------------------------
preflight_check_client_tools() {
    preflight_skip "tools" && return 0
    log_info "Checking optional client tools (kubectl, helm, kweaver, node/npx)..."

    if command -v kubectl &>/dev/null; then
        preflight_ok "kubectl: $(command -v kubectl)"
    else
        preflight_warn "kubectl not found (install on admin machine for post-install checks)"
    fi

    if command -v helm &>/dev/null; then
        preflight_ok "helm: $(command -v helm)"
    else
        preflight_warn "helm not found (deploy.sh will install on host during k8s install path)"
    fi

    if command -v kweaver &>/dev/null; then
        preflight_ok "kweaver: $(kweaver --version 2>/dev/null | head -1 || echo ok)"
    else
        preflight_warn "kweaver CLI not in PATH (npm i -g @kweaver-ai/kweaver-sdk for onboard / API)"
    fi

    if command -v node &>/dev/null; then
        preflight_ok "node: $(node -v 2>/dev/null)"
    else
        preflight_warn "node not in PATH (use npx kweaver on admin machine as alternative)"
    fi
}

# --- safe auto-fixes (requires root) ------------------------------------------
preflight_apply_safe_fixes() {
    if [[ "${PREFLIGHT_CHECK_ONLY}" == "true" ]]; then
        log_info "Check-only mode: skipping automatic fixes."
        return 0
    fi
    if [[ "${EUID}" -ne 0 ]]; then
        preflight_warn "Not root: skipping automatic fixes (run with sudo for swap/selinux/sysctl/hosts/chrony)"
        return 0
    fi

    log_info "Applying safe pre-install fixes (align with deploy k8s.sh)..."

    if command -v dnf &>/dev/null; then
        dnf install -y chrony 2>/dev/null && {
            systemctl enable --now chronyd 2>/dev/null || true
            preflight_fixed "Installed/ensured chrony via dnf"
        } || true
    elif command -v yum &>/dev/null; then
        yum install -y chrony 2>/dev/null && {
            systemctl enable --now chronyd 2>/dev/null || true
            preflight_fixed "Installed/ensured chrony via yum"
        } || true
    elif command -v apt-get &>/dev/null; then
        apt-get update -y 2>/dev/null && apt-get install -y chrony 2>/dev/null && {
            systemctl enable --now chrony 2>/dev/null || true
            preflight_fixed "Installed/ensured chrony via apt"
        } || true
    fi

    if systemctl is-active --quiet firewalld 2>/dev/null; then
        systemctl stop firewalld 2>/dev/null || true
        systemctl disable firewalld 2>/dev/null || true
        preflight_fixed "Stopped and disabled firewalld"
    fi

    if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -qi "Status: active"; then
        ufw --force disable 2>/dev/null || true
        preflight_fixed "Disabled ufw (use manual rules in production as needed)"
    fi

    if command -v disable_selinux &>/dev/null; then
        disable_selinux
        preflight_fixed "Applied disable_selinux()"
    fi

    if command -v configure_system &>/dev/null; then
        configure_system
        preflight_fixed "Applied configure_system() (swap, sysctl, modules)"
    fi

    # Ensure 127.0.0.1 <hostname> in /etc/hosts
    local hn
    hn="$(hostname 2>/dev/null || true)"
    if [[ -n "${hn}" && -f /etc/hosts ]]; then
        if ! grep -qE "127\.0\.0\.1[[:space:]]+${hn}" /etc/hosts; then
            if ! grep -qE "127\.0\.0\.1[[:space:]]+${hn}[[:space:]]" /etc/hosts; then
                echo "127.0.0.1 ${hn}" >> /etc/hosts
                preflight_fixed "Appended 127.0.0.1 ${hn} to /etc/hosts"
            fi
        fi
    fi
}

# --- run all checks in order ---------------------------------------------------
preflight_run_all_checks() {
    preflight_check_os
    preflight_check_hardware
    preflight_check_hostname_hosts
    preflight_check_swap_selinux
    preflight_check_firewall
    preflight_check_sysctl_modules
    preflight_check_cgroup
    preflight_check_time_sync
    preflight_check_network
    preflight_check_ports
    preflight_check_residue
    preflight_check_client_tools
}

# --- exit code: 0 ok, 1 fail, 2 warn only -------------------------------------
preflight_compute_exit_code() {
    if [[ "${PREFLIGHT_FAIL_COUNT}" -gt 0 ]]; then
        return 1
    fi
    if [[ "${PREFLIGHT_WARN_COUNT}" -gt 0 ]]; then
        return 2
    fi
    return 0
}
