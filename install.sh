#!/bin/sh
set -eu

REPO_OWNER="${KWEAVER_REPO_OWNER:-kweaver-ai}"
REPO_NAME="${KWEAVER_REPO_NAME:-kweaver}"
REPO_REF="${KWEAVER_REF:-main}"
INSTALL_DIR="${KWEAVER_INSTALL_DIR:-$HOME/kweaver}"
SKIP_RUN=0

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

usage() {
    cat <<'EOF'
KWeaver quick install bootstrap

Usage:
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh -s -- full init
  curl -fsSL https://raw.githubusercontent.com/kweaver-ai/kweaver/main/install.sh | sh -s -- --skip-run

Bootstrap options:
  --dir <path>      Installation directory (default: $HOME/kweaver)
  --ref <ref>       Git branch/tag to download (default: main)
  --skip-run        Download/update repo only; do not run deploy.sh
  --help            Show this help

Remaining arguments are passed directly to deploy/deploy.sh.
If no deploy arguments are given, the default is: full init

Examples:
  sh install.sh
  sh install.sh --dir /opt/kweaver
  sh install.sh --ref release/0.3.1 full init
  sh install.sh full init --version=0.3.1
EOF
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --dir)
            [ $# -ge 2 ] || die "--dir requires a value"
            INSTALL_DIR="$2"
            shift 2
            ;;
        --dir=*)
            INSTALL_DIR="${1#*=}"
            shift
            ;;
        --ref)
            [ $# -ge 2 ] || die "--ref requires a value"
            REPO_REF="$2"
            shift 2
            ;;
        --ref=*)
            REPO_REF="${1#*=}"
            shift
            ;;
        --skip-run)
            SKIP_RUN=1
            shift
            ;;
        --help|-h)
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

TARBALL_URL="${KWEAVER_TARBALL_URL:-https://codeload.github.com/${REPO_OWNER}/${REPO_NAME}/tar.gz/refs/heads/${REPO_REF}}"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="${TMP_DIR}/kweaver.tar.gz"
EXTRACT_DIR="${TMP_DIR}/extract"

cleanup() {
    rm -rf "${TMP_DIR}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "Downloading ${REPO_OWNER}/${REPO_NAME}@${REPO_REF}"
curl -fsSL "${TARBALL_URL}" -o "${ARCHIVE_PATH}"

mkdir -p "${EXTRACT_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"

SOURCE_DIR="$(ls -d "${EXTRACT_DIR}"/* 2>/dev/null | head -n 1)"
[ -n "${SOURCE_DIR}" ] || die "Failed to extract repository archive"
[ -f "${SOURCE_DIR}/deploy/deploy.sh" ] || die "Downloaded archive does not contain deploy/deploy.sh"

mkdir -p "${INSTALL_DIR}"
log "Installing repository into ${INSTALL_DIR}"
cp -R "${SOURCE_DIR}"/. "${INSTALL_DIR}/"

chmod +x "${INSTALL_DIR}/deploy/deploy.sh"
chmod +x "${INSTALL_DIR}/install.sh" 2>/dev/null || true

log "Repository is ready"
log "Install dir: ${INSTALL_DIR}"

if [ "${SKIP_RUN}" -eq 1 ]; then
    log "Skipping deploy execution as requested"
    log "Next step: cd ${INSTALL_DIR}/deploy && bash ./deploy.sh $*"
    exit 0
fi

cd "${INSTALL_DIR}/deploy"
log "Running deploy.sh $*"
exec bash "./deploy.sh" "$@"
