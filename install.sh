#!/bin/sh
set -eu

REPO_OWNER="${KWEAVER_REPO_OWNER:-kweaver-ai}"
REPO_NAME="${KWEAVER_REPO_NAME:-kweaver}"
VERSION_TAG="${KWEAVER_REF:-}"
INSTALL_DIR="${KWEAVER_INSTALL_DIR:-$HOME/kweaver}"
SKIP_RUN=0
ACCESS_HOST="${KWEAVER_ACCESS_HOST:-}"
ACCESS_PORT="${KWEAVER_ACCESS_PORT:-}"
ACCESS_SCHEME="${KWEAVER_ACCESS_SCHEME:-}"
ACCESS_PATH="${KWEAVER_ACCESS_PATH:-}"

log() {
    printf '[INFO] %s\n' "$*"
}

warn() {
    printf '[WARN] %s\n' "$*" >&2
}

die() {
    printf '[ERROR] %s\n' "$*" >&2
    exit 1
}

# Version tags: v1.2.3, v1.2.0-rc.1, etc.
is_version_tag() {
    case "$1" in
        v[0-9]*) return 0 ;;
        *) return 1 ;;
    esac
}

# Get latest release tag from GitHub API
get_latest_release_tag() {
    _api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
    _tag=$(curl -fsSL "${_api_url}" 2>/dev/null | grep -o '"tag_name": "[^"]*"' | head -1 | cut -d'"' -f4)
    [ -n "${_tag}" ] || return 1
    printf '%s' "${_tag}"
}

release_deploy_tarball_url() {
    _tag="$1"
    _ver="${_tag#v}"
    printf 'https://github.com/%s/%s/releases/download/%s/kweaver-deploy-%s.tar.gz' \
        "${REPO_OWNER}" "${REPO_NAME}" "${_tag}" "${_ver}"
}

# Update config.yaml with accessAddress settings if provided
update_access_address() {
    _config_file="$1"
    [ -f "${_config_file}" ] || return 0
    
    # Only update if at least one access parameter is provided
    [ -n "${ACCESS_HOST}${ACCESS_PORT}${ACCESS_SCHEME}${ACCESS_PATH}" ] || return 0
    
    # Use Python or a simple sed approach - for portability, use sed with backup
    _has_python=false
    if command -v python3 >/dev/null 2>&1; then
        _has_python=true
    elif command -v python >/dev/null 2>&1; then
        _has_python=true
    fi
    
    if [ "${_has_python}" = "true" ]; then
        # Use Python for reliable YAML update
        if command -v python3 >/dev/null 2>&1; then
            _py_cmd=python3
        else
            _py_cmd=python
        fi
        "${_py_cmd}" <<PYEOF || return 1
import sys
import re

config_file = "${_config_file}"
host = "${ACCESS_HOST}"
port = "${ACCESS_PORT}"
scheme = "${ACCESS_SCHEME}"
path = "${ACCESS_PATH}"

try:
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Find accessAddress block
    lines = content.split('\n')
    result = []
    in_block = False
    host_set = False
    port_set = False
    scheme_set = False
    path_set = False
    
    for i, line in enumerate(lines):
        if line.strip() == 'accessAddress:':
            in_block = True
            result.append(line)
            continue
        
        if in_block:
            if line.startswith('  host:'):
                if host:
                    result.append(f'  host: {host}')
                    host_set = True
                else:
                    result.append(line)
                continue
            elif line.startswith('  port:'):
                if port:
                    result.append(f'  port: {port}')
                    port_set = True
                else:
                    result.append(line)
                continue
            elif line.startswith('  scheme:'):
                if scheme:
                    result.append(f'  scheme: {scheme}')
                    scheme_set = True
                else:
                    result.append(line)
                continue
            elif line.startswith('  path:'):
                if path:
                    result.append(f'  path: {path}')
                    path_set = True
                else:
                    result.append(line)
                in_block = False
                continue
            elif line and not line.startswith(' '):
                # End of accessAddress block
                if host and not host_set:
                    result.append(f'  host: {host}')
                if port and not port_set:
                    result.append(f'  port: {port}')
                if scheme and not scheme_set:
                    result.append(f'  scheme: {scheme}')
                if path and not path_set:
                    result.append(f'  path: {path}')
                in_block = False
                result.append(line)
                continue
        
        result.append(line)
    
    # Handle case where accessAddress block ends at EOF
    if in_block:
        if host and not host_set:
            result.append(f'  host: {host}')
        if port and not port_set:
            result.append(f'  port: {port}')
        if scheme and not scheme_set:
            result.append(f'  scheme: {scheme}')
        if path and not path_set:
            result.append(f'  path: {path}')
    
    with open(config_file, 'w') as f:
        f.write('\n'.join(result))
except Exception as e:
    sys.stderr.write(f"Error updating config: {e}\n")
    sys.exit(1)
PYEOF
    else
        # Fallback: simple sed approach (less reliable but works for basic cases)
        _tmp_file="${_config_file}.tmp"
        cp "${_config_file}" "${_tmp_file}"
        
        if [ -n "${ACCESS_HOST}" ]; then
            if grep -q "^accessAddress:" "${_tmp_file}" && grep -A 5 "^accessAddress:" "${_tmp_file}" | grep -q "^  host:"; then
                sed -i.bak "s|^  host:.*|  host: ${ACCESS_HOST}|" "${_tmp_file}" 2>/dev/null || true
                rm -f "${_tmp_file}.bak" 2>/dev/null || true
            else
                sed -i.bak "/^accessAddress:/a\\
  host: ${ACCESS_HOST}
" "${_tmp_file}" 2>/dev/null || true
                rm -f "${_tmp_file}.bak" 2>/dev/null || true
            fi
        fi
        
        if [ -n "${ACCESS_PORT}" ]; then
            if grep -q "^accessAddress:" "${_tmp_file}" && grep -A 5 "^accessAddress:" "${_tmp_file}" | grep -q "^  port:"; then
                sed -i.bak "s|^  port:.*|  port: ${ACCESS_PORT}|" "${_tmp_file}" 2>/dev/null || true
                rm -f "${_tmp_file}.bak" 2>/dev/null || true
            fi
        fi
        
        if [ -n "${ACCESS_SCHEME}" ]; then
            if grep -q "^accessAddress:" "${_tmp_file}" && grep -A 5 "^accessAddress:" "${_tmp_file}" | grep -q "^  scheme:"; then
                sed -i.bak "s|^  scheme:.*|  scheme: ${ACCESS_SCHEME}|" "${_tmp_file}" 2>/dev/null || true
                rm -f "${_tmp_file}.bak" 2>/dev/null || true
            fi
        fi
        
        if [ -n "${ACCESS_PATH}" ]; then
            if grep -q "^accessAddress:" "${_tmp_file}" && grep -A 5 "^accessAddress:" "${_tmp_file}" | grep -q "^  path:"; then
                sed -i.bak "s|^  path:.*|  path: ${ACCESS_PATH}|" "${_tmp_file}" 2>/dev/null || true
                rm -f "${_tmp_file}.bak" 2>/dev/null || true
            fi
        fi
        
        mv "${_tmp_file}" "${_config_file}"
    fi
}

usage() {
    cat <<'EOF'
KWeaver quick install from release package

Usage:
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh -s -- --version v1.0.0
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh -s -- --version v1.0.0 full init
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh -s -- --skip-run

Options:
  --version <tag>         Release version tag (e.g. v1.0.0). If not specified, uses the latest release.
  --dir <path>            Installation directory (default: $HOME/kweaver)
  --access-host <host>    Set accessAddress.host in config.yaml (e.g. IP address or domain)
  --access-port <port>    Set accessAddress.port in config.yaml (default: 443)
  --access-scheme <scheme> Set accessAddress.scheme in config.yaml (default: https)
  --access-path <path>    Set accessAddress.path in config.yaml (default: /)
  --skip-run              Download package only; do not run deploy.sh
  --help                   Show this help

Environment:
  KWEAVER_REF              Same as --version
  KWEAVER_INSTALL_DIR      Same as --dir
  KWEAVER_ACCESS_HOST      Same as --access-host
  KWEAVER_ACCESS_PORT      Same as --access-port
  KWEAVER_ACCESS_SCHEME    Same as --access-scheme
  KWEAVER_ACCESS_PATH      Same as --access-path
  KWEAVER_REPO_OWNER       GitHub org/user (default: kweaver-ai)
  KWEAVER_REPO_NAME        Repository name (default: kweaver)

Remaining arguments are passed directly to deploy/deploy.sh.
If no deploy arguments are given, the default is: full init

Examples:
  sh install.sh
  sh install.sh --access-host 203.0.113.10
  sh install.sh --version vX.Y.Z
  sh install.sh --version vX.Y.Z --dir /opt/kweaver
  sh install.sh --version vX.Y.Z --access-host example.com --access-port 443
  sh install.sh --version vX.Y.Z full init
  sh install.sh --version vX.Y.Z --skip-run
EOF
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --version|--ref)
            [ $# -ge 2 ] || die "--version requires a value"
            VERSION_TAG="$2"
            shift 2
            ;;
        --version=*|--ref=*)
            VERSION_TAG="${1#*=}"
            shift
            ;;
        --dir)
            [ $# -ge 2 ] || die "--dir requires a value"
            INSTALL_DIR="$2"
            shift 2
            ;;
        --dir=*)
            INSTALL_DIR="${1#*=}"
            shift
            ;;
        --access-host)
            [ $# -ge 2 ] || die "--access-host requires a value"
            ACCESS_HOST="$2"
            shift 2
            ;;
        --access-host=*)
            ACCESS_HOST="${1#*=}"
            shift
            ;;
        --access-port)
            [ $# -ge 2 ] || die "--access-port requires a value"
            ACCESS_PORT="$2"
            shift 2
            ;;
        --access-port=*)
            ACCESS_PORT="${1#*=}"
            shift
            ;;
        --access-scheme)
            [ $# -ge 2 ] || die "--access-scheme requires a value"
            ACCESS_SCHEME="$2"
            shift 2
            ;;
        --access-scheme=*)
            ACCESS_SCHEME="${1#*=}"
            shift
            ;;
        --access-path)
            [ $# -ge 2 ] || die "--access-path requires a value"
            ACCESS_PATH="$2"
            shift 2
            ;;
        --access-path=*)
            ACCESS_PATH="${1#*=}"
            shift
            ;;
        --skip-run)
            SKIP_RUN=1
            shift
            ;;
        --help | -h)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        *)
            break
            ;;
    esac
done

if [ $# -eq 0 ]; then
    set -- full init
fi

require_cmd curl
require_cmd tar
require_cmd mktemp
require_cmd bash

# Determine version tag
if [ -z "${VERSION_TAG}" ]; then
    log "No version specified, fetching latest release..."
    VERSION_TAG="$(get_latest_release_tag)" || die "Failed to fetch latest release. Please specify --version vX.Y.Z"
    log "Using latest release: ${VERSION_TAG}"
fi

# Validate version tag format
is_version_tag "${VERSION_TAG}" || die "Invalid version tag format: ${VERSION_TAG} (expected vX.Y.Z, e.g. v1.0.0)"

TARBALL_URL="$(release_deploy_tarball_url "${VERSION_TAG}")"

TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="${TMP_DIR}/kweaver.tar.gz"
EXTRACT_DIR="${TMP_DIR}/extract"

cleanup() {
    rm -rf "${TMP_DIR}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "Downloading release package: ${VERSION_TAG}"
log "URL: ${TARBALL_URL}"
curl -fsSL "${TARBALL_URL}" -o "${ARCHIVE_PATH}"

mkdir -p "${EXTRACT_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"

SOURCE_DIR="$(ls -d "${EXTRACT_DIR}"/* 2>/dev/null | head -n 1)"
[ -n "${SOURCE_DIR}" ] || die "Failed to extract archive"
[ -f "${SOURCE_DIR}/deploy/deploy.sh" ] || die "Downloaded archive does not contain deploy/deploy.sh"

mkdir -p "${INSTALL_DIR}"
log "Installing into ${INSTALL_DIR}"
cp -R "${SOURCE_DIR}"/. "${INSTALL_DIR}/"

chmod +x "${INSTALL_DIR}/deploy/deploy.sh"
chmod +x "${INSTALL_DIR}/install.sh" 2>/dev/null || true

# Update config.yaml with accessAddress if provided
CONFIG_YAML="${INSTALL_DIR}/deploy/conf/config.yaml"
if [ -f "${CONFIG_YAML}" ]; then
    if [ -n "${ACCESS_HOST}${ACCESS_PORT}${ACCESS_SCHEME}${ACCESS_PATH}" ]; then
        log "Updating accessAddress in config.yaml"
        update_access_address "${CONFIG_YAML}"
    fi
fi

log "Install tree is ready"
log "Install dir: ${INSTALL_DIR}"

if [ "${SKIP_RUN}" -eq 1 ]; then
    log "Skipping deploy execution as requested"
    log "Next step: cd ${INSTALL_DIR}/deploy && bash ./deploy.sh $*"
    exit 0
fi

cd "${INSTALL_DIR}/deploy"
log "Running deploy.sh $*"
exec bash "./deploy.sh" "$@"
