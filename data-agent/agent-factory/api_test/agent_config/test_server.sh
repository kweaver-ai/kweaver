#!/bin/bash

# Agent配置API测试 - 静态服务器功能验证脚本

echo "🚀 Agent配置API测试 - 静态服务器功能验证"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Python3是否可用
echo -e "${YELLOW}检查Python3环境...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3未安装或不在PATH中${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3可用${NC}"

# 检查端口8342是否被占用
echo -e "${YELLOW}检查端口8342...${NC}"
if lsof -i :8342 &> /dev/null; then
    echo -e "${YELLOW}⚠️  端口8342已被占用，尝试停止现有服务...${NC}"
    make stop-report-server
    sleep 2
fi

# 启动静态服务器
echo -e "${YELLOW}启动静态服务器...${NC}"
make start-report-server

# 等待服务器启动
sleep 3

# 检查服务器是否正常运行
echo -e "${YELLOW}检查服务器状态...${NC}"
if curl -s http://localhost:8342 > /dev/null; then
    echo -e "${GREEN}✓ 静态服务器运行正常${NC}"
else
    echo -e "${RED}❌ 静态服务器启动失败${NC}"
    exit 1
fi

# 检查首页是否可访问
echo -e "${YELLOW}检查报告首页...${NC}"
if curl -s http://localhost:8342/index.html | grep -q "Agent配置API测试报告"; then
    echo -e "${GREEN}✓ 报告首页可访问${NC}"
else
    echo -e "${RED}❌ 报告首页不可访问${NC}"
fi

# 列出当前报告
echo -e "${YELLOW}列出当前报告...${NC}"
make list-reports

echo ""
echo -e "${GREEN}🎉 静态服务器功能验证完成！${NC}"
echo -e "${YELLOW}访问地址: http://localhost:8342${NC}"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  make view-reports      - 在浏览器中查看报告"
echo "  make stop-report-server - 停止静态服务器"
echo "  make report-all        - 生成所有测试报告"
