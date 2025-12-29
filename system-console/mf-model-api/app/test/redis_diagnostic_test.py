"""
Redis性能诊断测试脚本
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.redis_diagnostic import redis_diagnostic
from app.logs.stand_log import StandLogger


async def run_redis_diagnosis():
    """运行Redis性能诊断"""
    try:
        StandLogger.info("开始Redis性能诊断...")
        
        # 从配置文件获取Redis服务器信息
        from app.core.config import base_config
        
        redis_host = base_config.REDISREADHOST
        redis_port = base_config.REDISREADPORT
        
        StandLogger.info(f"Redis服务器: {redis_host}:{redis_port}")
        
        # 运行综合诊断
        results = await redis_diagnostic.comprehensive_diagnosis(
            redis_host=redis_host,
            redis_port=redis_port,
            test_key="dip:model-api:llm:gpt-3.5-turbo:list"  # 测试常见的缓存key
        )
        
        # 生成诊断报告
        report = redis_diagnostic.generate_diagnosis_report(results)
        
        # 输出报告
        StandLogger.info(f"\n{report}")
        print(report)
        
        # 保存报告到文件
        with open("redis_diagnosis_report.txt", "w", encoding="utf-8") as f:
            f.write(report)
        
        StandLogger.info("诊断报告已保存到 redis_diagnosis_report.txt")
        
    except Exception as e:
        StandLogger.error(f"Redis性能诊断失败: {e}")
        print(f"诊断失败: {e}")


if __name__ == "__main__":
    asyncio.run(run_redis_diagnosis())
