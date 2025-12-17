# 模板API测试 Makefile
# 用于执行模板API的各种测试和生成报告

# 变量定义
TOOL_PATH = /Users/Zhuanz/Work/as/dip_ws/agent-go-common-pkg/tool/apitesttool
TEST_DIR = .
SERVICE_URL = http://127.0.0.1:13021

# 颜色定义
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help test-all test-advanced test-complete test-create test-detail test-update test-delete \
        test-publish test-copy test-publish-info test-list \
        report-all report-advanced report-complete report-create report-detail report-update \
        report-delete report-publish report-copy report-publish-info report-list \
        clean start-service stop-service health-check list-reports create-dirs

# 默认目标
help:
	@echo "$(GREEN)模板API测试 Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)可用命令:$(NC)"
	@echo "  $(GREEN)help$(NC)              - 显示此帮助信息"
	@echo ""
	@echo "$(YELLOW)服务管理:$(NC)"
	@echo "  $(GREEN)start-service$(NC)     - 启动agent-factory服务"
	@echo "  $(GREEN)stop-service$(NC)      - 停止agent-factory服务"
	@echo "  $(GREEN)health-check$(NC)      - 检查服务健康状态"
	@echo ""
	@echo "$(YELLOW)测试执行:$(NC)"
	@echo "  $(GREEN)test-all$(NC)          - 执行所有测试"
	@echo "  $(GREEN)test-advanced$(NC)     - 执行高级功能测试"
	@echo "  $(GREEN)test-complete$(NC)     - 执行完整测试套件"
	@echo "  $(GREEN)test-create$(NC)       - 执行创建模板测试"
	@echo "  $(GREEN)test-list$(NC)         - 执行模板列表测试"
	@echo "  $(GREEN)test-detail$(NC)       - 执行模板详情测试"
	@echo "  $(GREEN)test-update$(NC)       - 执行模板更新测试"
	@echo "  $(GREEN)test-delete$(NC)       - 执行删除模板测试"
	@echo "  $(GREEN)test-publish$(NC)      - 执行发布管理测试"
	@echo "  $(GREEN)test-copy$(NC)         - 执行复制模板测试"
	@echo "  $(GREEN)test-publish-info$(NC) - 执行发布信息测试"
	@echo ""
	@echo "$(YELLOW)报告生成:$(NC)"
	@echo "  $(GREEN)report-all$(NC)        - 生成所有HTML报告"
	@echo "  $(GREEN)report-advanced$(NC)   - 生成高级功能测试HTML报告"
	@echo "  $(GREEN)report-complete$(NC)   - 生成完整测试套件HTML报告"
	@echo "  $(GREEN)report-create$(NC)     - 生成创建模板测试HTML报告"
	@echo "  $(GREEN)report-list$(NC)       - 生成模板列表测试HTML报告"
	@echo "  $(GREEN)report-detail$(NC)     - 生成模板详情测试HTML报告"
	@echo "  $(GREEN)report-update$(NC)     - 生成模板更新测试HTML报告"
	@echo "  $(GREEN)report-delete$(NC)     - 生成删除模板测试HTML报告"
	@echo "  $(GREEN)report-publish$(NC)    - 生成发布管理测试HTML报告"
	@echo "  $(GREEN)report-copy$(NC)       - 生成复制模板测试HTML报告"
	@echo "  $(GREEN)report-publish-info$(NC) - 生成发布信息测试HTML报告"
	@echo ""
	@echo "$(YELLOW)工具命令:$(NC)"
	@echo "  $(GREEN)create-dirs$(NC)       - 创建测试目录结构"
	@echo "  $(GREEN)list-reports$(NC)      - 列出所有生成的报告文件"
	@echo "  $(GREEN)clean$(NC)             - 清理生成的报告文件"

# 创建目录结构
create-dirs:
	@echo "$(YELLOW)创建测试目录结构...$(NC)"
	@mkdir -p create list detail update delete publish copy publish_info reports docs
	@echo "$(GREEN)目录结构创建完成$(NC)"

# 服务管理
start-service:
	@echo "$(YELLOW)启动agent-factory服务...$(NC)"
	@cd ../.. && SERVICE_NAME=agent-factory make localRun &
	@echo "$(GREEN)服务启动中，请等待几秒后检查健康状态$(NC)"

stop-service:
	@echo "$(YELLOW)停止agent-factory服务...$(NC)"
	@lsof -i :13021 | awk 'NR!=1 {print $$2}' | xargs kill -9 2>/dev/null || true
	@echo "$(GREEN)服务已停止$(NC)"

health-check:
	@echo "$(YELLOW)检查服务健康状态...$(NC)"
	@curl -s $(SERVICE_URL)/health/ready > /dev/null && \
		echo "$(GREEN)✓ 服务运行正常$(NC)" || \
		echo "$(RED)✗ 服务未运行或不可访问$(NC)"

# 测试执行
test-all: test-advanced test-complete test-create test-list test-detail test-update test-delete test-publish test-copy test-publish-info
	@echo "$(GREEN)所有测试执行完成$(NC)"

test-advanced:
	@echo "$(YELLOW)执行高级功能测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/advanced_features_test.yaml

test-complete:
	@echo "$(YELLOW)执行完整测试套件...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/complete_test_suite.yaml

test-create:
	@echo "$(YELLOW)执行创建模板测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/create/test_config.yaml

test-list:
	@echo "$(YELLOW)执行模板列表测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/list/test_config.yaml

test-detail:
	@echo "$(YELLOW)执行模板详情测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/detail/test_config.yaml

test-update:
	@echo "$(YELLOW)执行模板更新测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/update/test_config.yaml

test-delete:
	@echo "$(YELLOW)执行删除模板测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config.yaml

test-publish:
	@echo "$(YELLOW)执行发布管理测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/publish/test_config.yaml

test-copy:
	@echo "$(YELLOW)执行复制模板测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy/test_config.yaml

test-publish-info:
	@echo "$(YELLOW)执行发布信息测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/publish_info/test_config.yaml

# 报告生成
report-all: $(TEST_DIR)/reports report-advanced report-complete report-create report-list report-detail report-update report-delete report-publish report-copy report-publish-info
	@echo "$(GREEN)所有HTML报告生成完成$(NC)"
	@make list-reports

report-advanced: $(TEST_DIR)/reports
	@echo "$(YELLOW)生成高级功能测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/advanced_features_test.yaml \
		-format html -output $(TEST_DIR)/reports/advanced_features_report.html
	@echo "$(GREEN)✓ 高级功能测试报告已生成$(NC)"

report-complete: $(TEST_DIR)/reports
	@echo "$(YELLOW)生成完整测试套件HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/complete_test_suite.yaml \
		-format html -output $(TEST_DIR)/reports/complete_suite_report.html
	@echo "$(GREEN)✓ 完整测试套件报告已生成$(NC)"

report-create:
	@echo "$(YELLOW)生成创建模板测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/create/test_config.yaml \
		-format html -output $(TEST_DIR)/create/create_test_report.html
	@echo "$(GREEN)✓ 创建模板测试报告已生成$(NC)"

report-list:
	@echo "$(YELLOW)生成模板列表测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/list/test_config.yaml \
		-format html -output $(TEST_DIR)/list/list_test_report.html
	@echo "$(GREEN)✓ 模板列表测试报告已生成$(NC)"

report-detail:
	@echo "$(YELLOW)生成模板详情测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/detail/test_config.yaml \
		-format html -output $(TEST_DIR)/detail/detail_test_report.html
	@echo "$(GREEN)✓ 模板详情测试报告已生成$(NC)"

report-update:
	@echo "$(YELLOW)生成模板更新测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/update/test_config.yaml \
		-format html -output $(TEST_DIR)/update/update_test_report.html
	@echo "$(GREEN)✓ 模板更新测试报告已生成$(NC)"

report-delete:
	@echo "$(YELLOW)生成删除模板测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config.yaml \
		-format html -output $(TEST_DIR)/delete/delete_test_report.html
	@echo "$(GREEN)✓ 删除模板测试报告已生成$(NC)"

report-publish:
	@echo "$(YELLOW)生成发布管理测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/publish/test_config.yaml \
		-format html -output $(TEST_DIR)/publish/publish_test_report.html
	@echo "$(GREEN)✓ 发布管理测试报告已生成$(NC)"

report-copy:
	@echo "$(YELLOW)生成复制模板测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/copy/test_config.yaml \
		-format html -output $(TEST_DIR)/copy/copy_test_report.html
	@echo "$(GREEN)✓ 复制模板测试报告已生成$(NC)"

report-publish-info:
	@echo "$(YELLOW)生成发布信息测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/publish_info/test_config.yaml \
		-format html -output $(TEST_DIR)/publish_info/publish_info_test_report.html
	@echo "$(GREEN)✓ 发布信息测试报告已生成$(NC)"

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