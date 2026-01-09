#!/bin/bash
# MongoDB 诊断脚本

NAMESPACE="${1:-resource}"
POD_NAME="mongodb-mongodb-0"

echo "=== MongoDB Pod 诊断 ==="
echo ""

echo "1. Pod 状态:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" 2>/dev/null || echo "Pod not found"
echo ""

echo "2. Pod 详细信息:"
kubectl -n "${NAMESPACE}" describe pod "${POD_NAME}" 2>/dev/null | tail -50
echo ""

echo "3. Pod 容器状态:"
kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[*]}' | jq . 2>/dev/null || kubectl -n "${NAMESPACE}" get pod "${POD_NAME}" -o jsonpath='{.status.containerStatuses[*]}'
echo ""

echo "4. InitContainer 日志:"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" -c fix-keyfile-permissions 2>&1 || echo "无法获取 initContainer 日志"
echo ""

echo "5. MongoDB 容器日志 (最后 50 行):"
kubectl -n "${NAMESPACE}" logs "${POD_NAME}" --tail=50 2>&1 || echo "无法获取日志"
echo ""

echo "6. 检查 Secret:"
kubectl -n "${NAMESPACE}" get secret mongodb-secret -o yaml 2>/dev/null | grep -E 'username|password|keyfile' | head -3 || echo "Secret not found"
echo ""

echo "7. 检查 ConfigMap:"
kubectl -n "${NAMESPACE}" get configmap mongodb-mongodb -o yaml 2>/dev/null | head -30 || echo "ConfigMap not found"
echo ""

echo "8. 检查 PVC:"
kubectl -n "${NAMESPACE}" get pvc | grep mongodb || echo "No MongoDB PVC found"
echo ""

echo "9. 如果 Pod 正在运行，检查 keyfile:"
if kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -- ls -la /mongodb/config/mongodb.keyfile 2>/dev/null; then
    echo "keyfile 存在"
    kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -- stat -c "%a %U:%G" /mongodb/config/mongodb.keyfile 2>/dev/null || true
else
    echo "无法访问 keyfile 或 Pod 未运行"
fi
echo ""

echo "10. 检查配置文件:"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -- cat /mongodb/mongoconfig/mongodb.conf 2>/dev/null | head -20 || echo "无法读取配置文件"
echo ""

echo "11. 检查数据目录:"
kubectl -n "${NAMESPACE}" exec "${POD_NAME}" -- ls -la /data/mongodb_data/ 2>/dev/null | head -10 || echo "无法访问数据目录"
echo ""

echo "12. StatefulSet 配置:"
kubectl -n "${NAMESPACE}" get sts mongodb-mongodb -o yaml 2>/dev/null | grep -A 30 'containers:' | head -40 || echo "StatefulSet not found"
echo ""
