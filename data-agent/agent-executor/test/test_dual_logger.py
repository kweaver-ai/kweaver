#!/usr/bin/env python3
"""
测试双Logger功能
运行此脚本查看文件和控制台的不同输出效果
"""

import sys
import os

# 添加项目路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app.common.struct_logger import struct_logger, file_logger, console_logger


def test_dual_logger():
    """测试双logger功能"""

    print("=" * 80)
    print("测试1: struct_logger - 同时输出到文件和控制台")
    print("=" * 80)
    struct_logger.info("这是INFO日志", user="test_user", action="login")
    struct_logger.warning("这是WARNING日志", retry_count=3)
    struct_logger.error("这是ERROR日志", error_code="E001")

    print("\n" + "=" * 80)
    print("测试2: file_logger - 仅写入文件（控制台无输出）")
    print("=" * 80)
    print(">>> 下面的日志只会写入文件，不会在控制台显示 <<<")
    file_logger.info("仅文件日志", data="sensitive_data", size=1024)
    file_logger.debug("详细调试信息", step=1, details="step1_completed")
    print(">>> 文件日志已写入 log/agent-executor.log <<<")

    print("\n" + "=" * 80)
    print("测试3: console_logger - 仅输出到控制台（不写入文件）")
    print("=" * 80)
    console_logger.info("✓ 仅控制台日志", status="success")
    console_logger.warning("⚠ 临时调试信息", temp_var="value")

    print("\n" + "=" * 80)
    print("测试4: 不同日志级别的色彩效果")
    print("=" * 80)
    console_logger.debug("DEBUG级别 - 青色")
    console_logger.info("INFO级别 - 绿色")
    console_logger.warning("WARNING级别 - 黄色")
    console_logger.error("ERROR级别 - 红色")

    print("\n" + "=" * 80)
    print("测试5: 混合使用场景")
    print("=" * 80)
    struct_logger.info("开始处理任务", task_id="task-001")
    file_logger.debug("步骤1: 数据加载", records=100)
    file_logger.debug("步骤2: 数据处理", processed=100)
    file_logger.debug("步骤3: 数据保存", saved=100)
    console_logger.info("✓ 任务完成", task_id="task-001", duration="1.5s")

    print("\n" + "=" * 80)
    print("测试完成！")
    print("=" * 80)
    print(f"文件日志位置: {os.path.abspath('log/agent-executor.log')}")
    print("请查看文件内容对比JSON格式和控制台格式的差异")


if __name__ == "__main__":
    test_dual_logger()
