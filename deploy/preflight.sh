#!/usr/bin/env bash
# KWeaver Core — pre-install environment check and safe fixes
# See help/zh/install.md. Run on the target Linux host (often as root for fixes).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/scripts/lib/common.sh"
# shellcheck source=scripts/services/k8s.sh
source "${SCRIPT_DIR}/scripts/services/k8s.sh"
# shellcheck source=scripts/lib/preflight_checks.sh
source "${SCRIPT_DIR}/scripts/lib/preflight_checks.sh"

PREFLIGHT_CHECK_ONLY="false"
PREFLIGHT_REPORT_FILE=""
PREFLIGHT_SKIP_SET="|"

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help"
    echo "  --check-only         Only run checks, do not modify the system (no root required for partial checks)"
    echo "  --fix                Check + apply safe fixes (default; requires root for fixes)"
    echo "  --report=PATH        Append full log to a file"
    echo "  --skip=LIST          Comma-separated: hardware,os,hostname,swap,firewall,sysctl,time,cgroup,network,ports,residue,tools"
    echo ""
    echo "Exit codes: 0 = OK, 1 = FAIL present, 2 = only WARN (no FAIL)"
    echo ""
    echo "Examples:"
    echo "  sudo $0"
    echo "  $0 --check-only"
    echo "  $0 --skip=network --report=/tmp/preflight.txt"
}

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        --check-only)
            PREFLIGHT_CHECK_ONLY="true"
            shift
            ;;
        --fix)
            PREFLIGHT_CHECK_ONLY="false"
            shift
            ;;
        --report=*)
            PREFLIGHT_REPORT_FILE="${1#*=}"
            shift
            ;;
        --skip=*)
            IFS=',' read -r -a _sk <<< "${1#*=}"
            for s in "${_sk[@]}"; do
                s="${s#"${s%%[![:space:]]*}"}"
                s="${s%"${s##*[![:space:]]}"}"
                s="$(printf '%s' "$s" | tr '[:upper:]' '[:lower:]')"
                PREFLIGHT_SKIP_SET+="${s}|"
            done
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

export PREFLIGHT_CHECK_ONLY PREFLIGHT_REPORT_FILE PREFLIGHT_SKIP_SET

if [[ -n "${PREFLIGHT_REPORT_FILE}" ]]; then
    mkdir -p "$(dirname "${PREFLIGHT_REPORT_FILE}")" 2>/dev/null || true
    {
        echo "=== KWeaver preflight $(date -Iseconds) ==="
    } > "${PREFLIGHT_REPORT_FILE}"
fi

if [[ "${PREFLIGHT_CHECK_ONLY}" != "true" ]]; then
    if [[ "${EUID}" -ne 0 ]]; then
        log_error "For automatic fixes, run as root: sudo $0"
        log_info "Falling back to read-only check (--check-only) …"
        PREFLIGHT_CHECK_ONLY="true"
    fi
fi

if [[ "${PREFLIGHT_CHECK_ONLY}" != "true" ]]; then
    check_root
fi

preflight_reset_counters

log_info "========== KWeaver preflight checks =========="
preflight_run_all_checks

if [[ "${PREFLIGHT_CHECK_ONLY}" != "true" ]]; then
    log_info "========== Safe fixes =========="
    preflight_apply_safe_fixes
fi

log_info "========== Summary =========="
echo "  [OK]    ${PREFLIGHT_OK_COUNT}"
echo "  [WARN]  ${PREFLIGHT_WARN_COUNT}"
echo "  [FAIL]  ${PREFLIGHT_FAIL_COUNT}"
echo "  [FIXED] ${PREFLIGHT_FIXED_COUNT}"
if [[ -n "${PREFLIGHT_REPORT_FILE}" ]]; then
    {
        echo "--- summary ---"
        echo "OK=${PREFLIGHT_OK_COUNT} WARN=${PREFLIGHT_WARN_COUNT} FAIL=${PREFLIGHT_FAIL_COUNT} FIXED=${PREFLIGHT_FIXED_COUNT}"
    } >> "${PREFLIGHT_REPORT_FILE}"
fi

preflight_compute_exit_code
exit_code=$?

if [[ ${exit_code} -eq 1 ]]; then
    log_error "Preflight failed (see [FAIL] lines above)."
elif [[ ${exit_code} -eq 2 ]]; then
    log_warn "Preflight completed with warnings only."
else
    log_info "Preflight passed."
fi

exit "${exit_code}"
