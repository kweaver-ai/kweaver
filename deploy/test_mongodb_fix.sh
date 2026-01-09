#!/bin/bash
# MongoDB 修复验证脚本

REMOTE_HOST="root@10.4.175.152"
REMOTE_SCRIPT="/root/init_infra.sh"

echo "=== MongoDB 修复验证脚本 ==="
echo ""

echo "1. 复制 charts 到远程服务器..."
scp -r /root/kelu/deploymentstudio/scripts/charts ${REMOTE_HOST}:/root/ || {
    echo "ERROR: 无法复制 charts 到远程服务器"
    exit 1
}
echo "✓ Charts 已复制"
echo ""

echo "2. 卸载旧的 MongoDB 安装..."
ssh ${REMOTE_HOST} "${REMOTE_SCRIPT} mongodb uninstall" || {
    echo "WARN: 卸载可能失败或 MongoDB 未安装"
}
echo ""

echo "3. 等待 PVC 清理..."
sleep 5
echo ""

echo "4. 重新安装 MongoDB..."
ssh ${REMOTE_HOST} "${REMOTE_SCRIPT} mongodb init" || {
    echo "ERROR: MongoDB 安装失败"
    exit 1
}
echo ""

echo "5. 等待 Pod 启动..."
sleep 10
echo ""

echo "6. 检查 Pod 状态..."
ssh ${REMOTE_HOST} "kubectl -n resource get pod mongodb-mongodb-0" || {
    echo "ERROR: 无法获取 Pod 状态"
    exit 1
}
echo ""

echo "7. 检查 initContainer 日志..."
ssh ${REMOTE_HOST} "kubectl -n resource logs mongodb-mongodb-0 -c fix-keyfile-permissions --tail=20" || {
    echo "WARN: 无法获取 initContainer 日志"
}
echo ""

echo "8. 检查 MongoDB 容器日志..."
ssh ${REMOTE_HOST} "kubectl -n resource logs mongodb-mongodb-0 -c mongodb --tail=50" || {
    echo "WARN: 无法获取 MongoDB 容器日志"
}
echo ""

echo "9. 检查 Pod 详细状态和退出码..."
ssh ${REMOTE_HOST} "kubectl -n resource get pod mongodb-mongodb-0 -o jsonpath='{.status.containerStatuses[0].lastState.terminated}' | jq . 2>/dev/null || kubectl -n resource get pod mongodb-mongodb-0 -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'"
echo ""

echo "10. 检查 Pod 事件..."
ssh ${REMOTE_HOST} "kubectl -n resource describe pod mongodb-mongodb-0 | grep -A 20 'Events:'"
echo ""

echo "=== 验证完成 ==="
