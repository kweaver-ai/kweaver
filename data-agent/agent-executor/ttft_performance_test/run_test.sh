#!/bin/bash

# TTFT Performance Testing Script
# 优化的TTFT性能测试脚本，支持多种测试场景
#
# 作者: TTFT Performance Testing Package
# 版本: 2.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DEFAULT_CONFIG="$PROJECT_ROOT/examples/senario1/config.yaml"
OUTPUT_DIR="$PROJECT_ROOT/results"
TTFT_TESTER="ttft-tester"
VENV_DIR="$PROJECT_ROOT/.venv"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} ${BOLD}$1${NC}"
}

# 显示横幅
show_banner() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    TTFT Performance Testing                    ║"
    echo "║               Time to First Token Performance Tester          ║"
    echo "║                                                              ║"
    echo "║  优化脚本 - 支持多种测试场景和完整的错误处理                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查并激活虚拟环境
activate_venv() {
    if [ -d "$VENV_DIR" ]; then
        log_info "激活虚拟环境: $VENV_DIR"
        source "$VENV_DIR/bin/activate"
    else
        log_warning "虚拟环境不存在: $VENV_DIR"
        log_info "使用系统Python环境"
    fi
}

# 检查依赖
check_dependencies() {
    log_step "检查系统依赖..."

    # 检查Python版本
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
        log_success "Python版本: $PYTHON_VERSION"
    else
        log_error "Python3 未安装"
        exit 1
    fi

    # 检查ttft-tester
    if command -v "$TTFT_TESTER" >/dev/null 2>&1; then
        TTFT_PATH=$(which "$TTFT_TESTER")
        log_success "ttft-tester 已安装: $TTFT_PATH"

        # 显示版本信息
        VERSION=$($TTFT_TESTER --version 2>/dev/null || echo "未知版本")
        log_info "ttft-tester 版本: $VERSION"
    else
        log_error "ttft-tester 未找到"
        log_info "请安装包: pip install -e ."

        # 尝试自动安装
        if [ -f "$PROJECT_ROOT/setup.py" ]; then
            log_info "尝试自动安装..."
            activate_venv
            pip install -e "$PROJECT_ROOT" || {
                log_error "自动安装失败，请手动安装: pip install -e ."
                exit 1
            }
            log_success "安装成功"
        else
            exit 1
        fi
    fi

    # 检查YAML支持
    python3 -c "import yaml" 2>/dev/null || {
        log_warning "PyYAML 未安装，正在安装..."
        activate_venv
        pip install PyYAML
    }
}

# 初始化配置
init_config() {
    local config_file="$1"

    log_step "初始化配置文件: $config_file"

    if [ ! -f "$config_file" ]; then
        log_error "配置文件不存在: $config_file"

        # 查找可用配置文件
        log_info "查找可用的配置文件..."
        find "$PROJECT_ROOT/examples" -name "*.yaml" -type f | head -5

        log_info "可用配置文件示例:"
        echo "  - $PROJECT_ROOT/examples/senario1/config.yaml"
        echo "  - $PROJECT_ROOT/examples/senario2/config.yaml"
        echo "  - $PROJECT_ROOT/examples/senario4/config.yaml"

        exit 1
    fi

    # 验证配置文件格式
    if python3 -c "import yaml; yaml.safe_load(open('$config_file'))" 2>/dev/null; then
        log_success "配置文件格式正确"
    else
        log_error "配置文件格式错误"
        exit 1
    fi
}

# 创建输出目录
create_output_dir() {
    log_step "创建输出目录: $OUTPUT_DIR"

    if [ ! -d "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        log_success "输出目录已创建"
    else
        log_info "输出目录已存在"
    fi

    # 清理旧文件（可选）
    if [ "${CLEAN_RESULTS:-false}" = "true" ]; then
        log_info "清理旧的结果文件..."
        find "$OUTPUT_DIR" -name "ttft_report_*.json" -mtime +7 -delete 2>/dev/null || true
    fi
}

# 验证配置
validate_config() {
    local config_file="$1"

    log_step "验证配置..."

    if $TTFT_TESTER config validate --config "$config_file" 2>/dev/null; then
        log_success "配置验证通过"
    else
        log_warning "配置验证失败，但将继续测试"

        # 显示配置内容以便调试
        log_info "当前配置内容:"
        $TTFT_TESTER config show --config "$config_file" 2>/dev/null || {
            log_warning "无法显示配置内容"
        }
    fi
}

# 运行基础测试
run_basic_test() {
    local config_file="$1"
    local iterations="${2:-3}"

    log_step "运行基础性能测试..."
    log_info "配置: $config_file"
    log_info "并发数: 1"
    log_info "迭代次数: $iterations"

    if $TTFT_TESTER test \
        --config "$config_file" \
        --iterations "$iterations"; then
        log_success "基础测试完成"
        return 0
    else
        log_error "基础测试失败"
        return 1
    fi
}

# 运行并发测试
run_concurrent_test() {
    local config_file="$1"
    local concurrency="${2:-5}"
    local iterations="${3:-10}"

    log_step "运行并发性能测试..."
    log_info "配置: $config_file"
    log_info "并发数: $concurrency"
    log_info "迭代次数: $iterations"

    if $TTFT_TESTER test \
        --config "$config_file" \
        --concurrency "$concurrency" \
        --iterations "$iterations" \
        ; then
        log_success "并发测试完成"
        return 0
    else
        log_error "并发测试失败"
        return 1
    fi
}

# 运行负载测试
run_load_test() {
    local config_file="$1"
    local concurrency="${2:-20}"
    local iterations="${3:-50}"

    log_step "运行高负载测试..."
    log_info "配置: $config_file"
    log_info "并发数: $concurrency"
    log_info "迭代次数: $iterations"

    if $TTFT_TESTER test \
        --config "$config_file" \
        --concurrency "$concurrency" \
        --iterations "$iterations" \
        ; then
        log_success "负载测试完成"
        return 0
    else
        log_error "负载测试失败"
        return 1
    fi
}

# 运行自定义测试
run_custom_test() {
    local config_file="$1"
    shift

    log_step "运行自定义测试..."
    log_info "配置: $config_file"
    log_info "自定义参数: $*"

    if $TTFT_TESTER test \
        --config "$config_file" \
        "$@" \
        ; then
        log_success "自定义测试完成"
        return 0
    else
        log_error "自定义测试失败"
        return 1
    fi
}

# 显示结果
show_results() {
    log_step "测试结果汇总"

    if [ ! -d "$OUTPUT_DIR" ]; then
        log_warning "输出目录不存在: $OUTPUT_DIR"
        return 1
    fi

    # 查找最新的结果文件
    local latest_json=$(find "$OUTPUT_DIR" -name "ttft_report_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    local latest_txt=$(find "$OUTPUT_DIR" -name "ttft_report_*.txt" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    echo
    echo -e "${BOLD}📊 可用结果文件:${NC}"
    echo "输出目录: $OUTPUT_DIR"
    echo

    # 显示文件列表
    echo -e "${CYAN}结果文件列表:${NC}"
    find "$OUTPUT_DIR" -name "ttft_report_*" -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n' | sort | tail -10
    echo

    # 显示最新文件的内容摘要
    if [ -n "$latest_json" ]; then
        echo -e "${CYAN}最新JSON报告摘要:${NC}"
        echo "文件: $latest_json"

        if command -v jq >/dev/null 2>&1; then
            jq '{
                total_requests: .statistics.total_requests,
                successful_requests: .statistics.successful_requests,
                failed_requests: .statistics.failed_requests,
                success_rate: .statistics.success_rate,
                ttft_stats: {
                    mean_ms: .statistics.ttft_stats.mean_ms,
                    median_ms: .statistics.ttft_stats.median_ms,
                    min_ms: .statistics.ttft_stats.min_ms,
                    max_ms: .statistics.ttft_stats.max_ms
                }
            }' "$latest_json" 2>/dev/null || echo "无法解析JSON内容"
        else
            echo "安装jq以查看详细内容: sudo apt-get install jq"
        fi
        echo
    fi

    if [ -n "$latest_txt" ]; then
        echo -e "${CYAN}最新文本报告:${NC}"
        echo "文件: $latest_txt"
        head -20 "$latest_txt"
        echo "..."
    fi
}

# 生成综合报告
generate_report() {
    log_step "生成综合报告"

    # 查找最新的结果文件
    local latest_result=$(find "$OUTPUT_DIR" -name "ttft_report_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -n "$latest_result" ]; then
        log_info "使用最新结果: $latest_result"

        # 创建综合报告
        local report_file="$OUTPUT_DIR/comprehensive_report_$(date +%Y%m%d_%H%M%S).md"

        cat > "$report_file" << EOF
# TTFT 性能测试综合报告

**测试时间**: $(date '+%Y-%m-%d %H:%M:%S')
**配置文件**: $latest_result

## 测试统计

$(if command -v jq >/dev/null 2>&1; then
    jq -r '"- 总请求数: \(.statistics.total_requests)
- 成功请求: \(.statistics.successful_requests)
- 失败请求: \(.statistics.failed_requests)
- 成功率: \(.statistics.success_rate)%

## TTFT 性能指标

- 平均TTFT: \(.statistics.ttft_stats.mean_ms)ms
- 中位数TTFT: \(.statistics.ttft_stats.median_ms)ms
- 最小TTFT: \(.statistics.ttft_stats.min_ms)ms
- 最大TTFT: \(.statistics.ttft_stats.max_ms)ms
- 95百分位: \(.statistics.ttft_stats.percentile_95_ms)ms
- 99百分位: \(.statistics.ttft_stats.percentile_99_ms)ms

## 吞吐量统计

- 每秒请求数: \(.statistics.throughput_stats.requests_per_second)
- 每秒Token数: \(.statistics.throughput_stats.tokens_per_second)
- 总测试时间: \(.statistics.throughput_stats.total_time_seconds)s"' "$latest_result" 2>/dev/null
else
    echo "请安装jq以生成详细统计: sudo apt-get install jq"
fi)

---
*报告由 TTFT Performance Testing Package 自动生成*
EOF

        log_success "综合报告已生成: $report_file"
        echo "报告内容:"
        cat "$report_file"

    else
        log_warning "未找到结果文件用于生成报告"
    fi
}

# 显示配置信息
show_config_info() {
    local config_file="$1"

    log_step "显示配置信息"
    echo "配置文件: $config_file"
    echo

    if $TTFT_TESTER config show --config "$config_file" 2>/dev/null; then
        log_success "配置信息显示成功"
    else
        log_warning "无法显示配置信息"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BOLD}${CYAN}TTFT 性能测试脚本${NC}"
    echo
    echo "用法: $0 [命令] [选项]"
    echo
    echo -e "${BOLD}可用命令:${NC}"
    echo "  check [配置文件]       - 检查依赖和配置"
    echo "  info [配置文件]       - 显示配置信息"
    echo "  basic [配置文件] [N]   - 运行基础测试 (N次迭代，默认3次)"
    echo "  concurrent [配置文件] [C] [N] - 运行并发测试 (C并发，默认5；N迭代，默认10)"
    echo "  load [配置文件] [C] [N] - 运行负载测试 (C并发，默认20；N迭代，默认50)"
    echo "  custom [配置文件] [参数...] - 运行自定义测试"
    echo "  report [配置文件]      - 生成综合报告"
    echo "  results               - 显示测试结果"
    echo "  all [配置文件]        - 运行所有测试"
    echo "  help                  - 显示此帮助信息"
    echo
    echo -e "${BOLD}选项:${NC}"
    echo "  --clean               - 清理旧的结果文件"
    echo "  --venv               - 使用虚拟环境"
    echo
    echo -e "${BOLD}环境变量:${NC}"
    echo "  CLEAN_RESULTS=true   - 自动清理7天前的结果"
    echo "  CONFIG_FILE=路径     - 指定默认配置文件"
    echo
    echo -e "${BOLD}示例:${NC}"
    echo "  $0 check examples/senario1/config.yaml"
    echo "  $0 basic examples/senario1/config.yaml 5"
    echo "  $0 concurrent examples/senario1/config.yaml 10 20"
    echo "  $0 all examples/senario1/config.yaml"
    echo "  CLEAN_RESULTS=true $0 all examples/senario1/config.yaml"
    echo
}

# 主函数
main() {
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG}"

    # 解析全局选项
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN_RESULTS=true
                shift
                ;;
            --venv)
                activate_venv
                shift
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done

    # 没有命令时显示帮助
    if [ $# -eq 0 ]; then
        show_banner
        show_help
        exit 0
    fi

    local command="$1"
    shift

    show_banner

    case "$command" in
        check)
            activate_venv
            config_file="${1:-$config_file}"
            check_dependencies
            init_config "$config_file"
            create_output_dir
            validate_config "$config_file"
            log_success "检查完成，可以开始测试"
            ;;
        info)
            config_file="${1:-$config_file}"
            show_config_info "$config_file"
            ;;
        basic)
            activate_venv
            config_file="${1:-$config_file}"
            iterations="${2:-3}"
            check_dependencies
            init_config "$config_file"
            create_output_dir
            run_basic_test "$config_file" "$iterations"
            show_results
            ;;
        concurrent)
            activate_venv
            config_file="${1:-$config_file}"
            concurrency="${2:-5}"
            iterations="${3:-10}"
            check_dependencies
            init_config "$config_file"
            create_output_dir
            run_concurrent_test "$config_file" "$concurrency" "$iterations"
            show_results
            ;;
        load)
            activate_venv
            config_file="${1:-$config_file}"
            concurrency="${2:-20}"
            iterations="${3:-50}"
            check_dependencies
            init_config "$config_file"
            create_output_dir
            run_load_test "$config_file" "$concurrency" "$iterations"
            show_results
            ;;
        custom)
            activate_venv
            config_file="${1:-$config_file}"
            shift
            check_dependencies
            init_config "$config_file"
            create_output_dir
            run_custom_test "$config_file" "$@"
            show_results
            ;;
        report)
            config_file="${1:-$config_file}"
            activate_venv
            check_dependencies
            generate_report
            ;;
        results)
            show_results
            ;;
        all)
            activate_venv
            config_file="${1:-$config_file}"
            check_dependencies
            init_config "$config_file"
            create_output_dir
            validate_config "$config_file"
            echo
            run_basic_test "$config_file" 3
            echo
            run_concurrent_test "$config_file" 5 10
            echo
            generate_report
            echo
            show_results
            log_success "所有测试完成"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"