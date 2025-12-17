.PHONY: clean dev-setup test test-unit test-integration test-integration-filter test-legacy help lint format uv-sync uv-clean


# 通用安装命令（保持向后兼容）

install-dolphin:
	uv add  ../dolphin-language/

install-dolphin2:
	cd /Users/Zhuanz/Work/as/dip_ws/dolphin-language-versions/dolphin-language-5002 && uv pip install . -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn

install-dolphin-edit:
	cd ../dolphin-language && uv pip install -e . -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn

install-dolphin2-edit:
	cd /Users/Zhuanz/Work/as/dip_ws/dolphin-language-versions/dolphin-language-5002_bak && uv pip install -e . -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn


install-proton-mq-python:
	uv add ../proton-mq-python/

install-TelemetrySDK-Python: install-proton-mq-python
	uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade  -r ../TelemetrySDK-Python/pytest_requirements.txt; \
    uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade  -r ../TelemetrySDK-Python/requirements.txt; \
	uv add ../TelemetrySDK-Python/

# 运行应用
run:
	PYTHONUNBUFFERED=1 uv run python main.py

# 清理构建产物和缓存文件
clean:
	rm -rf dist
	rm -rf build/agent-executor
	#rm -rf *.spec
	rm -rf *.pyc
	rm -rf **/*.pyc
	rm -rf **/**/*.pyc
	rm -rf **/**/**/*.pyc
	rm -rf **/**/**/**/*.pyc
	rm -rf *.egg-info
	rm -rf **/*.egg-info
	rm -rf **/**/*.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	@echo "✅ 清理完成"

# 开发环境设置
dev-setup: uv-sync
	@echo "🚀 开发环境设置完成"
	@echo "🧪 运行 'make test' 来验证环境"

# 测试相关
test:
	@echo "🧪 运行测试..."
	uv run pytest test/ -v

test-unit:
	@echo "🧪 运行单元测试..."
	uv run pytest test/unit/ -v

test-integration:
	@echo "🧪 运行集成测试..."
	uv run pytest test/integration/ -v

test-integration-filter:
	@echo "🧪 运行过滤集成测试..."
	@echo "使用方法: make test-integration-filter FILTER=<pattern>"
	@echo "示例: make test-integration-filter FILTER=poem"
	uv run pytest test/integration/ -v -k "$(FILTER)"

test-legacy:
	uv run python run_tests.py --legacy

test-verbose:
	@echo "🧪 详细模式运行测试..."
	uv run pytest test/ -v -s

# 代码质量检查
lint:
	@echo "🔍 检查代码质量..."
	@if uv run which ruff >/dev/null 2>&1; then \
		uv run ruff check --fix app test; \
		uv run ruff format app test; \
	else \
		echo "⚠️  ruff 未安装，跳过代码检查"; \
	fi

# 代码格式化
format:
	@echo "🎨 格式化代码..."
	@if uv run which ruff >/dev/null 2>&1; then \
		uv run ruff format app test; \
	else \
		echo "⚠️  black 未安装，跳过代码格式化"; \
	fi

# UV 特定操作
uv-sync:
	uv sync --all-groups
	@echo "✅ UV 环境同步完成"

uv-clean:
	uv cache clean
	rm -rf .venv
	@echo "✅ UV 缓存清理完成"

# 帮助信息
help:
	@echo "🚀 Agent-Executor - Makefile 帮助"
	@echo ""
	@echo "🔧 安装:"
	@echo "  install-dolphin-local      - 安装本地 Dolphin SDK（相对路径）"
	@echo "  install-proton-mq-python-local - 安装本地 Proton MQ（相对路径）"
	@echo "  install-TelemetrySDK-Python - 安装本地 Telemetry SDK（相对路径）"
	@echo "  dev-setup            - 设置开发环境"
	@echo ""
	@echo "  clean                - 清理构建产物和缓存"
	@echo ""
	@echo "🧪 测试:"
	@echo "  test                 - 运行所有测试"
	@echo "  test-unit            - 运行单元测试"
	@echo "  test-integration     - 运行集成测试"
	@echo "  test-integration-filter FILTER=<pattern> - 过滤集成测试"
	@echo "  test-legacy          - 运行遗留测试"
	@echo "  test-verbose         - 详细模式运行测试"
	@echo ""
	@echo "🎨 代码质量:"
	@echo "  lint                 - 检查代码质量"
	@echo "  format               - 格式化代码"
	@echo ""
	@echo "🚀 UV 特定:"
	@echo "  uv-sync              - 同步 UV 环境依赖"
	@echo "  uv-clean             - 清理 UV 缓存和虚拟环境"
	@echo ""
	@echo "📖 示例用法:"
	@echo "  make dev-setup                    # 设置开发环境"
	@echo "  make test                         # 运行所有测试"
	@echo "  make run                          # 运行应用"
	