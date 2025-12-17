# API测试 Makefile
# 用于执行空间API的各种测试和生成报告

# 变量定义
TOOL_PATH = /Users/Zhuanz/Work/as/dip_ws/agent-go-common-pkg/tool/apitesttool
TEST_DIR = .
SERVICE_URL = http://127.0.0.1:13020

# 颜色定义
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help test-all testAllIsPass test-advanced test-complete test-create test-detail test-update \
        test-members-complete test-resources-complete test-integrated test-members-fixed \
        report-all report-advanced report-complete report-create report-detail report-update \
        report-members-complete report-resources-complete report-integrated report-members-fixed \
        clean start-service stop-service health-check list-reports

# 默认目标
help:
	@echo "$(GREEN)空间API测试 Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)可用命令:$(NC)"
	@echo "  $(GREEN)help$(NC)              - 显示此帮助信息"
	@echo "  $(GREEN)test-all$(NC)          - 执行所有基础测试"
	@echo "  $(GREEN)testAllIsPass$(NC)     - 检查所有测试是否通过"
	@echo "  $(GREEN)test-advanced$(NC)     - 执行高级功能测试"
	@echo "  $(GREEN)test-complete$(NC)     - 执行完整测试套件"
	@echo ""
	@echo "$(YELLOW)功能测试:$(NC)"
	@echo "  $(GREEN)test-create$(NC)       - 创建空间测试"
	@echo "  $(GREEN)test-detail$(NC)       - 空间详情测试"
	@echo "  $(GREEN)test-list$(NC)         - 空间列表测试"
	@echo "  $(GREEN)test-update$(NC)       - 空间更新测试"
	@echo "  $(GREEN)test-delete$(NC)       - 删除空间测试"
	@echo "  $(GREEN)test-members$(NC)      - 空间成员基础测试"
	@echo "  $(GREEN)test-resources$(NC)    - 空间资源基础测试"
	@echo ""
	@echo "$(YELLOW)完整测试:$(NC)"
	@echo "  $(GREEN)test-members-complete$(NC)   - 完整成员管理测试"
	@echo "  $(GREEN)test-resources-complete$(NC) - 完整资源管理测试"
	@echo "  $(GREEN)test-integrated$(NC)         - 综合测试"
	@echo "  $(GREEN)test-members-fixed$(NC)      - 修复版成员管理测试"
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
test-all: test-advanced test-complete test-create test-detail test-update test-delete test-members test-resources test-list test-members-complete test-resources-complete test-integrated
	@echo "$(GREEN)所有测试执行完成$(NC)"

test-advanced:
	@echo "$(YELLOW)执行高级功能测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/advanced_features_test.yaml

test-complete:
	@echo "$(YELLOW)执行完整测试套件...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/complete_test_suite.yaml

test-create:
	@echo "$(YELLOW)执行创建空间测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/create/test_config.yaml

test-detail:
	@echo "$(YELLOW)执行空间详情测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/detail/test_config.yaml

test-list:
	@echo "$(YELLOW)执行空间列表测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/list/test_config.yaml	

test-delete:
	@echo "$(YELLOW)执行删除空间测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config.yaml

test-members:
	@echo "$(YELLOW)执行空间成员基础测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/test_config.yaml

test-update:
	@echo "$(YELLOW)执行空间更新测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/update/test_config.yaml

test-resources:
	@echo "$(YELLOW)执行空间资源基础测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/test_config.yaml

# 新增的完整测试
test-members-complete:
	@echo "$(YELLOW)执行完整成员管理测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/complete_member_test.yaml

test-resources-complete:
	@echo "$(YELLOW)执行完整资源管理测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/complete_resource_test.yaml

test-integrated:
	@echo "$(YELLOW)执行成员和资源综合测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/integrated_member_resource_test.yaml

# 修复版成员管理测试
test-members-fixed:
	@echo "$(YELLOW)执行修复版成员管理测试...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/fixed_member_test.yaml

# 修复版成员管理测试报告
report-members-fixed:
	@echo "$(YELLOW)生成修复版成员管理测试报告...$(NC)"
	@mkdir -p $(TEST_DIR)/reports
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/fixed_member_test.yaml \
		-format html -output $(TEST_DIR)/reports/fixed_member_test_report.html
	@echo "$(GREEN)报告已生成: $(TEST_DIR)/reports/fixed_member_test_report.html$(NC)"

# 报告生成
report-all: report-advanced report-complete report-create report-detail report-update report-delete report-members report-resources report-list report-members-complete report-resources-complete report-integrated report-members-fixed
	@echo "$(GREEN)所有HTML报告生成完成$(NC)"
	@make list-reports

report-advanced:
	@echo "$(YELLOW)生成高级功能测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/advanced_features_test.yaml \
		-format html -output $(TEST_DIR)/reports/advanced_features_report.html
	@echo "$(GREEN)✓ 高级功能测试报告已生成$(NC)"
	@open $(TEST_DIR)/reports/advanced_features_report.html

report-complete:
	@echo "$(YELLOW)生成完整测试套件HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/complete_test_suite.yaml \
		-format html -output $(TEST_DIR)/reports/complete_suite_report.html
	@echo "$(GREEN)✓ 完整测试套件报告已生成$(NC)"
	@open $(TEST_DIR)/reports/complete_suite_report.html

report-create:
	@echo "$(YELLOW)生成创建空间测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/create/test_config.yaml \
		-format html -output $(TEST_DIR)/create/create_test_report.html
	@echo "$(GREEN)✓ 创建空间测试报告已生成$(NC)"
	@open $(TEST_DIR)/create/create_test_report.html

report-detail:
	@echo "$(YELLOW)生成空间详情测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/detail/test_config.yaml \
		-format html -output $(TEST_DIR)/detail/detail_test_report.html
	@echo "$(GREEN)✓ 空间详情测试报告已生成$(NC)"
	@open $(TEST_DIR)/detail/detail_test_report.html

report-list:
	@echo "$(YELLOW)生成空间列表测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/list/test_config.yaml \
		-format html -output $(TEST_DIR)/list/list_test_report.html
	@echo "$(GREEN)✓ 空间列表测试报告已生成$(NC)"
	@open $(TEST_DIR)/list/list_test_report.html

report-update:
	@echo "$(YELLOW)生成空间更新测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/update/test_config.yaml \
		-format html -output $(TEST_DIR)/update/update_test_report.html
	@echo "$(GREEN)✓ 空间更新测试报告已生成$(NC)"
	@open $(TEST_DIR)/update/update_test_report.html

report-delete:
	@echo "$(YELLOW)生成删除空间测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config.yaml \
		-format html -output $(TEST_DIR)/delete/delete_test_report.html
	@echo "$(GREEN)✓ 删除空间测试报告已生成$(NC)"
	@open $(TEST_DIR)/delete/delete_test_report.html

report-delete-fixed:
	@echo "$(YELLOW)生成删除空间测试HTML报告（修复版）...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config_fixed.yaml \
		-format html -output $(TEST_DIR)/delete/delete_test_fixed_report.html
	@echo "$(GREEN)✓ 删除空间测试报告（修复版）已生成$(NC)"
	@open $(TEST_DIR)/delete/delete_test_fixed_report.html

report-members:
	@echo "$(YELLOW)生成空间成员基础测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/test_config.yaml \
		-format html -output $(TEST_DIR)/members/members_test_report.html
	@echo "$(GREEN)✓ 空间成员基础测试报告已生成$(NC)"
	@open $(TEST_DIR)/members/members_test_report.html

report-resources:
	@echo "$(YELLOW)生成空间资源基础测试HTML报告...$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/test_config.yaml \
		-format html -output $(TEST_DIR)/resources/resources_test_report.html
	@echo "$(GREEN)✓ 空间资源基础测试报告已生成$(NC)"
	@open $(TEST_DIR)/resources/resources_test_report.html

# 新增的完整测试报告
report-members-complete:
	@echo "$(YELLOW)生成完整成员管理测试HTML报告...$(NC)"
	@mkdir -p $(TEST_DIR)/reports
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/complete_member_test.yaml \
		-format html -output $(TEST_DIR)/reports/complete_member_test_report.html
	@echo "$(GREEN)✓ 完整成员管理测试报告已生成$(NC)"
	@open $(TEST_DIR)/reports/complete_member_test_report.html

report-resources-complete:
	@echo "$(YELLOW)生成完整资源管理测试HTML报告...$(NC)"
	@mkdir -p $(TEST_DIR)/reports
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/complete_resource_test.yaml \
		-format html -output $(TEST_DIR)/reports/complete_resource_test_report.html
	@echo "$(GREEN)✓ 完整资源管理测试报告已生成$(NC)"
	@open $(TEST_DIR)/reports/complete_resource_test_report.html

report-integrated:
	@echo "$(YELLOW)生成成员和资源综合测试HTML报告...$(NC)"
	@mkdir -p $(TEST_DIR)/reports
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/integrated_member_resource_test.yaml \
		-format html -output $(TEST_DIR)/reports/integrated_test_report.html
	@echo "$(GREEN)✓ 成员和资源综合测试报告已生成$(NC)"
	@open $(TEST_DIR)/reports/integrated_test_report.html

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
	@echo "$(GREEN)    空间API测试通过率统计$(NC)"
	@echo "$(GREEN)================================$(NC)"
	@echo ""
	@echo "$(YELLOW)1. 高级功能测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/advanced_features_test.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)2. 完整测试套件:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/complete_test_suite.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)3. 创建空间测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/create/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)4. 空间详情测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/detail/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)5. 空间列表测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/list/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)6. 空间更新测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/update/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)7. 删除空间测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/delete/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)8. 空间成员基础测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)9. 空间资源基础测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/test_config.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)10. 完整成员管理测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/members/complete_member_test.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)11. 完整资源管理测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/resources/complete_resource_test.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(YELLOW)12. 成员和资源综合测试:$(NC)"
	@go run $(TOOL_PATH)/main.go -config $(TEST_DIR)/integrated_member_resource_test.yaml 2>/dev/null | grep "成功率" || echo "  $(RED)测试失败$(NC)"
	@echo ""
	@echo "$(GREEN)================================$(NC)"
	@echo "$(GREEN)    所有测试配置执行完成$(NC)"
	@echo "$(GREEN)================================$(NC)"