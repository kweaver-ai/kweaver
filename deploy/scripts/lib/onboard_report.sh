#!/usr/bin/env bash
# Completion report for deploy/onboard.sh. Source after onboard libs; call onboard_print_completion_report on success.
# Opt out: ONBOARD_NO_COMPLETION_REPORT=1
# shellcheck source=/dev/null

# Optional state (set by probe steps):
#   ONBOARD_REPORT_MAIN_MODE   interactive | bkn-only | config-yaml
#   ONBOARD_REPORT_ISF_TEST_USER  human-readable status
#   ONBOARD_REPORT_CONTEXT_LOADER  human-readable status

onboard_print_completion_report() {
    if [[ "${ONBOARD_NO_COMPLETION_REPORT:-}" == "1" || "${ONBOARD_NO_COMPLETION_REPORT:-}" == "true" ]]; then
        return 0
    fi

    local _ctx _isfu _line _kwh _kctx _bd _acurl _isf
    _ctx="${ONBOARD_REPORT_CONTEXT_LOADER:-}"
    _isfu="${ONBOARD_REPORT_ISF_TEST_USER:-}"
    _line="--------------------------------------------"

    if type onboard_isf_full_install &>/dev/null && onboard_isf_full_install 2>/dev/null; then
        _isf="ISF 全量（检测到 ISF/相关集群）"
    else
        _isf="最小安装 / 未检测到 ISF 组件"
    fi

    if command -v kweaver &>/dev/null; then
        _kwh="$(kweaver --version 2>/dev/null | head -1 || true)"
    else
        _kwh="(kweaver 不在 PATH)"
    fi

    if command -v kubectl &>/dev/null; then
        _kctx="$(kubectl config current-context 2>/dev/null || echo "(kubectl context 未设置)")"
    else
        _kctx="(kubectl 不在 PATH 或未配置)"
    fi

    _bd="${DEPLOY_BUSINESS_DOMAIN:-bd_public}"
    if type onboard_default_access_base_url &>/dev/null; then
        _acurl="$(onboard_default_access_base_url 2>/dev/null || true)"
    else
        _acurl="${ONBOARD_DEFAULT_ACCESS_BASE:-（设置 ONBOARD_DEFAULT_ACCESS_BASE 或本机默认 IP）}"
    fi

    {
        echo ""
        echo "============================================"
        echo "  KWeaver Onboard 完成报告"
        echo "  时间(UTC)   $(date -u '+%Y-%m-%dT%H:%M:%SZ') "
        echo "  主模式      ${ONBOARD_REPORT_MAIN_MODE:-interactive}"
        echo "${_line}"
        echo "  运行环境    host=$(hostname 2>/dev/null || echo '?')"
        echo "  Node        $(command -v node &>/dev/null && node -v || echo '—')"
        echo "  kweaver     ${_kwh}"
        echo "  kubectl     ctx=${_kctx}  namespace=${NAMESPACE:-kweaver}"
        echo "  业务域 -bd  ${_bd}  (DEPLOY_BUSINESS_DOMAIN)"
        echo "  默认访问基址 ${_acurl}"
        echo "${_line}"
        echo "  安装类型    ${_isf}"
        echo "  ISF test 用户  ${_isfu:-本阶段未执行或未记录}"
        echo "  Context Loader  ${_ctx:-本阶段未执行或未记录}"
        echo "${_line}"
        echo "  建议下一步"
        echo "   • 验证:   kweaver bkn list -bd ${_bd} --pretty"
        if [[ "${_ctx}" == *"已导入"* || "${_ctx}" == *"imported_ok"* ]]; then
            echo "   • 工具箱: 已尝试导入 ADP Context Loader 工具集；见上方日志中 HTTP/JSON 是否 200"
        else
            echo "   • 工具箱: 若需导入: deploy/onboard.sh 或 kweaver call impex（见 -h 与 CONTEXT_LOADER_TOOLSET_ADP_PATH）"
        fi
        echo "   • 产品文档: help/zh/  与  deploy/auto_cofig/README.md"
        echo "============================================"
        echo ""
    } 2>/dev/null || {
        echo ""
        echo "============================================"
        echo "  KWeaver Onboard 完成"
        echo "============================================"
        echo ""
    }
}
