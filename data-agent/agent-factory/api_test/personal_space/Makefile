# Personal Space API 测试 Makefile
# 用于执行个人空间API的各种测试和生成报告

# 变量定义
TOOL_PATH = /Users/Zhuanz/Work/as/dip_ws/agent-go-common-pkg/tool/apitesttool
TEST_DIR = .
SERVICE_URL = http://127.0.0.1:13020

# 颜色定义
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help test-all testAllIsPass test-agent-tpl-list test-agent-list run-tests \
        report-all report-agent-tpl-list report-agent-list \
        clean start-service stop-service health-check list-reports

# 默认目标
help:
	@echo "$(GREEN)个人空间API测试 Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)可用命令:$(NC)"
	@echo "  $(GREEN)help$(NC)              - 显示此帮助信息"
	@echo "  $(GREEN)test-all$(NC)          - 执行所有测试"
	@echo "  $(GREEN)testAllIsPass$(NC)     - 检查所有测试是否通过"
	@echo ""
	@echo "$(YELLOW)功能测试:$(NC)"
	@echo "  $(GREEN)test-agent-tpl-list$(NC) - 个人空间Agent模板列表测试"
	@echo "  $(GREEN)test-agent-list$(NC)     - 个人空间Agent列表测试"
	@echo "  $(GREEN)run-tests$(NC)       - 使用Go程序执行所有测试"
	@echo ""
	@echo "$(YELLOW)报告生成:$(NC)"
	@echo "  $(GREEN)report-*$(NC)          - 生成对应测试的HTML报告"
	@echo ""
	@echo "$(YELLOW)服务管理:$(NC)"
	@echo "  $(GREEN)start-service$(NC)     - 启动agent-factory服务"
	@echo "  $(GREEN)stop-service$(NC)      - 停止agent-factory服务"
	@echo "  $(GREEN)health-check$(NC)      - 检查服务健康状态"
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

# 测试执行
test-all: test-agent-tpl-list test-agent-list
	@echo "$(GREEN)所有测试执行完成$(NC)"

test-agent-tpl-list:
	@echo "$(YELLOW)执行个人空间Agent模板列表测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_tpl_list/test_config.yaml

test-agent-list:
	@echo "$(YELLOW)执行个人空间Agent列表测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_list/test_config.yaml

run-tests:
	@echo "$(YELLOW)使用Go程序执行所有个人空间API测试...$(NC)"
	@go run run_tests.go

# 报告生成
report-all: report-agent-tpl-list report-agent-list
	@echo "$(GREEN)所有HTML报告生成完成$(NC)"
	@make list-reports

report-agent-tpl-list:
	@echo "$(YELLOW)生成个人空间Agent模板列表测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_tpl_list/test_config.yaml \
		-format html -output $(TEST_DIR)/agent_tpl_list/agent_tpl_list_report.html
	@echo "$(GREEN)✓ 个人空间Agent模板列表测试报告已生成$(NC)"
	@open $(TEST_DIR)/agent_tpl_list/agent_tpl_list_report.html

report-agent-list:
	@echo "$(YELLOW)生成个人空间Agent列表测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_list/test_config.yaml \
		-format html -output $(TEST_DIR)/agent_list/agent_list_report.html
	@echo "$(GREEN)✓ 个人空间Agent列表测试报告已生成$(NC)"
	@open $(TEST_DIR)/agent_list/agent_list_report.html

# 工具命令
list-reports:
	@echo "$(YELLOW)生成的报告文件:$(NC)"
	@find $(TEST_DIR) -name "*.html" -type f | sort | while read file; do \
		size=$$(ls -lh "$$file" | awk '{print $$5}'); \
		echo "  $(GREEN)$$file$(NC) ($$size)"; \
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
	@echo "$(GREEN)  个人空间API测试通过率统计$(NC)"
	@echo "$(GREEN)================================$(NC)"
	@echo ""
	@echo "$(YELLOW)1. 个人空间Agent模板列表测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_tpl_list/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)2. 个人空间Agent列表测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/agent_list/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(GREEN)================================$(NC)"
	@echo "$(GREEN)    所有测试配置执行完成$(NC)"
	@echo "$(GREEN)================================$(NC)"
