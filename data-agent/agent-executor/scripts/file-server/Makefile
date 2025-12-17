# 文件服务器管理 Makefile
# 用于管理文件web服务器的启动、停止和维护

.PHONY: start stop restart status test install check-deps clean-server logs follow-logs run down ps dev check-port kill-port help

# 配置变量
PORT = 8088
# 根据执行目录动态设置路径
ifeq ($(shell basename $(CURDIR)),scripts)
    LOG_DIR = $(CURDIR)/../log
    PROJECT_ROOT = $(CURDIR)/..
else
    LOG_DIR = $(CURDIR)/log
    PROJECT_ROOT = $(CURDIR)
endif
PYTHON = $(PROJECT_ROOT)/.venv/bin/python
PID_FILE = /tmp/file_server.pid
LOG_FILE = /tmp/file_server_output.log

# 默认目标
help:
	@echo "文件服务器管理命令:"
	@echo ""
	@echo "  start       - 启动文件服务器"
	@echo "  stop        - 停止文件服务器"
	@echo "  restart     - 重启文件服务器"
	@echo "  status      - 查看服务器状态"
	@echo "  test        - 测试服务器功能"
	@echo "  install     - 安装依赖"
	@echo "  check-deps  - 检查依赖"
	@echo "  clean-server- 清理服务器临时文件"
	@echo "  logs        - 显示服务器日志"
	@echo "  follow-logs - 实时查看日志"
	@echo "  dev         - 开发模式启动（前台运行）"
	@echo "  check-port  - 检查端口是否被占用"
	@echo "  kill-port   - 杀死占用端口的进程"
	@echo "  help        - 显示此帮助信息"
	@echo ""
	@echo "便捷命令："
	@echo "  make run, make up     - 启动服务器 (同 start)"
	@echo "  make down, make stop  - 停止服务器"
	@echo "  make ps, make status  - 查看状态"
	@echo ""
	@echo "服务器配置:"
	@echo "  端口: $(PORT)"
	@echo "  目录: $(LOG_DIR)"

# 启动服务器
start:
	@echo "启动文件服务器..."
	@echo "端口: $(PORT)"
	@echo "目录: $(LOG_DIR)"
	@echo "访问地址: http://localhost:$(PORT)"
	@if [ -f $(PID_FILE) ]; then \
		echo "服务器已在运行 (PID: $$(cat $(PID_FILE)))"; \
		echo "使用 'make stop' 停止服务器"; \
		exit 1; \
	fi
	@cd $(LOG_DIR) && LOG_DIR=$(LOG_DIR) $(PYTHON) $(dir $(MAKEFILE_LIST))server.py > $(LOG_FILE) 2>&1 & \
	echo $$! > $(PID_FILE)
	@echo "服务器已启动"
	@echo "PID: $$(cat $(PID_FILE))"
	@echo "日志文件: $(LOG_FILE)"
	@sleep 2
	@$(MAKE) -f $(MAKEFILE_LIST) status

# 停止服务器
stop:
	@echo "停止文件服务器..."
	@if [ -f $(PID_FILE) ]; then \
		kill -TERM $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "服务器已停止"; \
	else \
		echo "服务器未运行"; \
	fi

# 重启服务器
restart: stop start

# 查看服务器状态
status:
	@echo "=== 服务器状态 ==="
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "状态: 运行中"; \
			echo "PID: $$PID"; \
			echo "端口: $(PORT)"; \
			echo "访问地址: http://localhost:$(PORT)"; \
			echo "服务目录: $(LOG_DIR)"; \
			echo "日志文件: $(LOG_FILE)"; \
		else \
			echo "状态: 未运行 (PID文件存在但进程不存在)"; \
			rm -f $(PID_FILE); \
		fi; \
	else \
		echo "状态: 未运行"; \
		echo "端口: $(PORT)"; \
		echo "服务目录: $(LOG_DIR)"; \
	fi

# 测试服务器功能
test:
	@echo "=== 测试文件服务器 ==="
	@echo "1. 检查服务器是否运行..."
	@if [ -f $(PID_FILE) ] && ps -p $$(cat $(PID_FILE)) > /dev/null 2>&1; then \
		echo "✅ 服务器正在运行"; \
	else \
		echo "❌ 服务器未运行，正在启动..."; \
		$(MAKE) -f $(MAKEFILE_LIST) start; \
		sleep 3; \
	fi
	@echo ""
	@echo "2. 测试HTTP连接..."
	@curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:$(PORT)/ || echo "❌ 连接失败"
	@echo ""
	@echo "3. 测试主页内容..."
	@curl -s http://localhost:$(PORT)/ | grep -q "Log 文件浏览器" && echo "✅ 主页正常" || echo "❌ 主页异常"
	@echo ""
	@echo "4. 测试文件列表..."
	@FILE_COUNT=$$(curl -s http://localhost:$(PORT)/ | grep -c "file-item"); \
	echo "文件数量: $$FILE_COUNT"; \
	if [ $$FILE_COUNT -gt 0 ]; then \
		echo "✅ 文件列表正常"; \
	else \
		echo "❌ 文件列表为空"; \
	fi
	@echo ""
	@echo "5. 测试文件访问..."
	@curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:$(PORT)/file_server.py || echo "❌ 文件访问失败"
	@echo ""
	@echo "=== 测试完成 ==="
	@echo "如需在浏览器中查看，请访问: http://localhost:$(PORT)"

# 安装依赖
install:
	@echo "检查Python虚拟环境..."
	@if [ ! -f "$(PYTHON)" ]; then \
		echo "❌ Python虚拟环境不存在"; \
		echo "请先创建虚拟环境: python -m venv .venv"; \
		exit 1; \
	fi
	@echo "✅ 虚拟环境存在"
	@echo "检查所需模块..."
	@$(PYTHON) -c "import http.server, socketserver, mimetypes" && echo "✅ 所有依赖已满足" || echo "❌ 缺少依赖"

# 检查依赖
check-deps:
	@echo "=== 依赖检查 ==="
	@echo "Python路径: $(PYTHON)"
	@if [ -f "$(PYTHON)" ]; then \
		echo "✅ Python解释器存在"; \
		$(PYTHON) --version; \
	else \
		echo "❌ Python解释器不存在"; \
	fi
	@echo ""
	@echo "检查Python模块..."
	@$(PYTHON) -c "import http.server" 2>/dev/null && echo "✅ http.server" || echo "❌ http.server"
	@$(PYTHON) -c "import socketserver" 2>/dev/null && echo "✅ socketserver" || echo "❌ socketserver"
	@$(PYTHON) -c "import mimetypes" 2>/dev/null && echo "✅ mimetypes" || echo "❌ mimetypes"
	@$(PYTHON) -c "import urllib.parse" 2>/dev/null && echo "✅ urllib.parse" || echo "❌ urllib.parse"
	@echo ""
	@echo "检查目录权限..."
	@if [ -r "$(LOG_DIR)" ]; then \
		echo "✅ 日志目录可读: $(LOG_DIR)"; \
	else \
		echo "❌ 日志目录不可读: $(LOG_DIR)"; \
	fi

# 清理服务器临时文件
clean-server:
	@echo "清理服务器临时文件..."
	@rm -f $(PID_FILE)
	@rm -f $(LOG_FILE)
	@echo "✅ 清理完成"

# 显示日志
logs:
	@echo "=== 服务器日志 ==="
	@if [ -f $(LOG_FILE) ]; then \
		tail -20 $(LOG_FILE); \
	else \
		echo "日志文件不存在: $(LOG_FILE)"; \
	fi

# 实时查看日志
follow-logs:
	@echo "实时查看服务器日志 (Ctrl+C 退出)..."
	@if [ -f $(LOG_FILE) ]; then \
		tail -f $(LOG_FILE); \
	else \
		echo "日志文件不存在: $(LOG_FILE)"; \
	fi

# 便捷命令
run: start
up: start
down: stop
ps: status

# 开发模式启动 (前台运行，显示详细输出)
dev:
	@echo "开发模式启动文件服务器..."
	@echo "按 Ctrl+C 停止服务器"
	@cd $(LOG_DIR) && LOG_DIR=$(LOG_DIR) $(PYTHON) $(dir $(MAKEFILE_LIST))server.py

# 检查端口是否被占用
check-port:
	@echo "检查端口 $(PORT)..."
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		echo "❌ 端口 $(PORT) 被占用:"; \
		lsof -i :$(PORT); \
	else \
		echo "✅ 端口 $(PORT) 可用"; \
	fi

# 杀死占用端口的进程
kill-port:
	@echo "杀死占用端口 $(PORT) 的进程..."
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		lsof -ti :$(PORT) | xargs kill -9; \
		echo "✅ 已杀死占用端口的进程"; \
	else \
		echo "端口 $(PORT) 未被占用"; \
	fi