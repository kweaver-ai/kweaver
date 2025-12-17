#!/bin/bash

# 头像API快速测试脚本
# 用于验证20个头像的API功能

BASE_URL="http://127.0.0.1:13022"
API_PREFIX="/api/agent-factory/v3"

echo "🎯 开始头像API快速测试"
echo "============================================================"

# 测试1: 头像列表
echo "📋 测试1: 获取头像列表"
TOTAL=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in" | jq '.total')
ENTRIES_COUNT=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in" | jq '.entries | length')

if [ "$TOTAL" = "20" ] && [ "$ENTRIES_COUNT" = "20" ]; then
    echo "✅ 头像列表测试通过: 总数=$TOTAL, 列表长度=$ENTRIES_COUNT"
else
    echo "❌ 头像列表测试失败: 总数=$TOTAL, 列表长度=$ENTRIES_COUNT"
fi

# 测试2: 边界值头像
echo ""
echo "📋 测试2: 边界值头像测试"
ID1_RESULT=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in/1" | head -1)
ID20_RESULT=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in/20" | head -1)

if [[ "$ID1_RESULT" == *"<svg"* ]] && [[ "$ID20_RESULT" == *"<svg"* ]]; then
    echo "✅ 边界值头像测试通过: ID=1和ID=20都返回SVG"
else
    echo "❌ 边界值头像测试失败"
fi

# 测试3: 错误处理
echo ""
echo "📋 测试3: 错误处理测试"
ID0_ERROR=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in/0" | jq -r '.error_details')
ID21_ERROR=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in/21" | jq -r '.error_details')

if [ "$ID0_ERROR" = "头像不存在" ] && [ "$ID21_ERROR" = "头像不存在" ]; then
    echo "✅ 错误处理测试通过: ID=0和ID=21都正确返回错误"
else
    echo "❌ 错误处理测试失败: ID=0错误='$ID0_ERROR', ID=21错误='$ID21_ERROR'"
fi

# 测试4: 随机头像测试
echo ""
echo "📋 测试4: 随机头像测试"
PASS_COUNT=0
TOTAL_TEST=5

for i in 5 10 15 18 19; do
    RESULT=$(curl -s "${BASE_URL}${API_PREFIX}/agent/avatar/built-in/$i" | head -1)
    if [[ "$RESULT" == *"<svg"* ]]; then
        echo "✅ ID=$i 头像正常"
        ((PASS_COUNT++))
    else
        echo "❌ ID=$i 头像异常"
    fi
done

echo ""
echo "============================================================"
echo "🎯 测试总结"
echo "------------------------------------------------------------"
echo "📊 随机头像测试: $PASS_COUNT/$TOTAL_TEST 通过"

if [ "$TOTAL" = "20" ] && [ "$ENTRIES_COUNT" = "20" ] && [[ "$ID1_RESULT" == *"<svg"* ]] && [[ "$ID20_RESULT" == *"<svg"* ]] && [ "$ID0_ERROR" = "头像不存在" ] && [ "$ID21_ERROR" = "头像不存在" ] && [ "$PASS_COUNT" = "$TOTAL_TEST" ]; then
    echo "🎉 所有核心功能测试通过！头像数量已成功更新为20个"
    exit 0
else
    echo "⚠️  部分测试未通过，请检查具体问题"
    exit 1
fi 