# Agent Config API 测试 Makefile
# 用于执行Agent配置API的各种测试和生成报告

# 变量定义
TOOL_PATH = /Users/Zhuanz/Work/as/dip_ws/agent-go-common-pkg/tool/apitesttool
TEST_DIR = .
SERVICE_URL = http://127.0.0.1:13020
REPORT_SERVER_PORT = 8342
REPORT_SERVER_URL = http://localhost:$(REPORT_SERVER_PORT)

# 颜色定义
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help test-all testAllIsPass test-copy-agent test-copy2tpl run-tests \
        report-all report-copy-agent report-copy2tpl \
        clean start-service stop-service health-check list-reports \
        start-report-server stop-report-server view-reports

# 默认目标
help:
	@echo "$(GREEN)Agent配置API测试 Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)可用命令:$(NC)"
	@echo "  $(GREEN)help$(NC)              - 显示此帮助信息"
	@echo "  $(GREEN)test-all$(NC)          - 执行所有测试"
	@echo "  $(GREEN)testAllIsPass$(NC)     - 检查所有测试是否通过"
	@echo ""
	@echo "$(YELLOW)功能测试:$(NC)"
	@echo "  $(GREEN)test-copy-agent$(NC)   - Agent复制接口测试"
	@echo "  $(GREEN)test-copy2tpl$(NC)     - Agent复制为模板接口测试"
	@echo "  $(GREEN)run-tests$(NC)         - 使用Go程序执行所有测试"
	@echo ""
	@echo "$(YELLOW)报告生成:$(NC)"
	@echo "  $(GREEN)report-*$(NC)          - 生成对应测试的HTML报告"
	@echo ""
	@echo "$(YELLOW)服务管理:$(NC)"
	@echo "  $(GREEN)start-service$(NC)     - 启动agent-factory服务"
	@echo "  $(GREEN)stop-service$(NC)      - 停止agent-factory服务"
	@echo "  $(GREEN)health-check$(NC)      - 检查服务健康状态"
	@echo ""
	@echo "$(YELLOW)报告服务器:$(NC)"
	@echo "  $(GREEN)start-report-server$(NC) - 启动报告静态服务器"
	@echo "  $(GREEN)stop-report-server$(NC)  - 停止报告静态服务器"
	@echo "  $(GREEN)view-reports$(NC)        - 在浏览器中查看报告"
	@echo ""
	@echo "$(YELLOW)工具:$(NC)"
	@echo "  $(GREEN)clean$(NC)             - 清理测试报告"
	@echo "  $(GREEN)list-reports$(NC)      - 列出所有测试报告"

# 服务管理
start-service:
	@echo "$(YELLOW)启动agent-factory服务...$(NC)"
	@cd ../.. && make localRun &
	@echo "$(GREEN)服务启动中，请等待几秒后检查健康状态$(NC)"

stop-service:
	@echo "$(YELLOW)停止agent-factory服务...$(NC)"
	@pkill -f "agent-factory" || true
	@echo "$(GREEN)服务已停止$(NC)"

health-check:
	@echo "$(YELLOW)检查服务健康状态...$(NC)"
	@curl -s $(SERVICE_URL)/health/ready > /dev/null && \
		echo "$(GREEN)✓ 服务运行正常$(NC)" || \
		echo "$(RED)✗ 服务未运行或不可访问$(NC)"

# 报告服务器管理
start-report-server:
	@echo "$(YELLOW)启动报告静态服务器...$(NC)"
	@if pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
		echo "$(YELLOW)报告服务器已在端口$(REPORT_SERVER_PORT)运行$(NC)"; \
	else \
		echo "$(GREEN)在端口$(REPORT_SERVER_PORT)启动报告服务器...$(NC)"; \
		cd $(TEST_DIR) && python3 -m http.server $(REPORT_SERVER_PORT) > /dev/null 2>&1 & \
		sleep 2; \
		echo "$(GREEN)✓ 报告服务器已启动: $(REPORT_SERVER_URL)$(NC)"; \
	fi

stop-report-server:
	@echo "$(YELLOW)停止报告静态服务器...$(NC)"
	@pkill -f "python.*http.server.*$(REPORT_SERVER_PORT)" || true
	@echo "$(GREEN)报告服务器已停止$(NC)"

view-reports:
	@echo "$(YELLOW)在浏览器中查看测试报告...$(NC)"
	@if ! pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
		echo "$(YELLOW)报告服务器未运行，正在启动...$(NC)"; \
		make start-report-server; \
	fi
	@echo "$(GREEN)打开报告页面: $(REPORT_SERVER_URL)$(NC)"
	@open "$(REPORT_SERVER_URL)"

# 测试执行
test-all: test-copy-agent test-copy2tpl
	@echo "$(GREEN)所有测试执行完成$(NC)"

test-copy-agent:
	@echo "$(YELLOW)执行Agent复制接口测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy_agent/test_config.yaml

test-copy2tpl:
	@echo "$(YELLOW)执行Agent复制为模板接口测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy2tpl/test_config.yaml

run-tests:
	@echo "$(YELLOW)使用Go程序执行所有Agent配置API测试...$(NC)"
	@go run run_tests.go

# 报告生成
report-all: report-copy-agent report-copy2tpl
	@echo "$(GREEN)所有HTML报告生成完成$(NC)"
	@make list-reports

report-copy-agent:
	@echo "$(YELLOW)生成Agent复制接口测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy_agent/test_config.yaml \
		-format html -output $(TEST_DIR)/copy_agent/copy_agent_report.html
	@echo "$(GREEN)✓ Agent复制接口测试报告已生成$(NC)"
	@if ! pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
		echo "$(YELLOW)启动报告服务器...$(NC)"; \
		make start-report-server; \
	fi
	@echo "$(GREEN)报告链接: $(REPORT_SERVER_URL)/copy_agent/copy_agent_report.html$(NC)"
	@open "$(REPORT_SERVER_URL)/copy_agent/copy_agent_report.html"

report-copy2tpl:
	@echo "$(YELLOW)生成Agent复制为模板接口测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy2tpl/test_config.yaml \
		-format html -output $(TEST_DIR)/copy2tpl/copy2tpl_report.html
	@echo "$(GREEN)✓ Agent复制为模板接口测试报告已生成$(NC)"
	@if ! pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
		echo "$(YELLOW)启动报告服务器...$(NC)"; \
		make start-report-server; \
	fi
	@echo "$(GREEN)报告链接: $(REPORT_SERVER_URL)/copy2tpl/copy2tpl_report.html$(NC)"
	@open "$(REPORT_SERVER_URL)/copy2tpl/copy2tpl_report.html"

# 工具命令
list-reports:
	@echo "$(YELLOW)生成的报告文件:$(NC)"
	@if ! pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
		echo "$(YELLOW)报告服务器未运行，使用 'make start-report-server' 启动$(NC)"; \
		echo ""; \
	fi
	@find $(TEST_DIR) -name "*.html" -type f | sort | while read file; do \
		size=$$(ls -lh "$$file" | awk '{print $$5}'); \
		relative_path=$$(echo "$$file" | sed 's|^\./||'); \
		if pgrep -f "python.*http.server.*$(REPORT_SERVER_PORT)" > /dev/null; then \
			echo "  $(GREEN)$$file$(NC) ($$size) - $(REPORT_SERVER_URL)/$$relative_path"; \
		else \
			echo "  $(GREEN)$$file$(NC) ($$size)"; \
		fi; \
	done

clean:
	@echo "$(YELLOW)清理生成的报告文件...$(NC)"
	@find $(TEST_DIR) -name "*.html" -type f -delete
	@echo "$(GREEN)清理完成$(NC)"

# 创建reports目录
$(TEST_DIR)/reports:
	@mkdir -p $(TEST_DIR)/reports

testAllIsPass:
	@echo "$(YELLOW)执行所有测试配置，仅显示通过率...$(NC)"
	@echo "$(GREEN)================================$(NC)"
	@echo "$(GREEN)  Agent配置API测试通过率统计$(NC)"
	@echo "$(GREEN)================================$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Agent复制接口测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy_agent/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)2. Agent复制为模板接口测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy2tpl/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(GREEN)================================$(NC)"
	@echo "$(GREEN)    所有测试配置执行完成$(NC)"
	@echo "$(GREEN)================================$(NC)"
