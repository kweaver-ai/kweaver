# test/common_test 单元测试 Makefile
# 用于执行 common 模块的单元测试

PYTHON := ../../.venv/bin/python
PYTEST := $(PYTHON) -m pytest
TEST_DIR := .

# 默认目标：运行所有测试
.PHONY: all
all: test

# 运行所有测试
.PHONY: test
test:
	@echo "运行所有 common_test 测试..."
	$(PYTEST) $(TEST_DIR) -v

# 运行 curl 命令生成测试
.PHONY: test-curl
test-curl:
	@echo "运行 curl 命令生成测试..."
	$(PYTEST) test_stand_log_curl.py -v

# 运行 struct_logger 测试
.PHONY: test-logger
test-logger:
	@echo "运行 struct_logger 测试..."
	$(PYTEST) test_struct_logger.py -v

# 运行 errors 测试
.PHONY: test-errors
test-errors:
	@echo "运行 errors 测试..."
	$(PYTEST) errors_test/ -v

# 运行单个测试文件（用法: make test-file FILE=test_xxx.py）
.PHONY: test-file
test-file:
	@echo "运行测试文件: $(FILE)..."
	$(PYTEST) $(FILE) -v

# 运行匹配的测试（用法: make test-match MATCH=test_escape）
.PHONY: test-match
test-match:
	@echo "运行匹配的测试: $(MATCH)..."
	$(PYTEST) $(TEST_DIR) -v -k "$(MATCH)"

# 运行测试并显示覆盖率
.PHONY: test-cov
test-cov:
	@echo "运行测试并生成覆盖率报告..."
	$(PYTEST) $(TEST_DIR) -v --cov=app.common --cov-report=term-missing

# 运行测试（简洁输出）
.PHONY: test-quiet
test-quiet:
	@echo "运行所有测试（简洁模式）..."
	$(PYTEST) $(TEST_DIR) -q

# 运行失败的测试（上次失败的）
.PHONY: test-failed
test-failed:
	@echo "重新运行上次失败的测试..."
	$(PYTEST) $(TEST_DIR) -v --lf

# 运行测试并在第一个失败时停止
.PHONY: test-x
test-x:
	@echo "运行测试（遇到失败立即停止）..."
	$(PYTEST) $(TEST_DIR) -v -x

# 显示帮助
.PHONY: help
help:
	@echo "可用命令："
	@echo "  make test          - 运行所有测试"
	@echo "  make test-curl     - 运行 curl 命令生成测试"
	@echo "  make test-logger   - 运行 struct_logger 测试"
	@echo "  make test-errors   - 运行 errors 测试"
	@echo "  make test-file FILE=xxx.py  - 运行指定测试文件"
	@echo "  make test-match MATCH=xxx   - 运行匹配的测试"
	@echo "  make test-cov      - 运行测试并显示覆盖率"
	@echo "  make test-quiet    - 运行测试（简洁输出）"
	@echo "  make test-failed   - 重新运行失败的测试"
	@echo "  make test-x        - 遇到失败立即停止"
	@echo "  make help          - 显示此帮助"
