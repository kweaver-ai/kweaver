"""
Redis性能测试脚本
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.redis_performance_analyzer import redis_analyzer
from app.logs.stand_log import StandLogger


async def test_redis_performance():
    """测试Redis性能"""
    try:
        StandLogger.info("开始Redis性能测试...")
        
        # 测试连接池状态
        StandLogger.info("测试连接池状态...")
        pool_analysis = await redis_analyzer.analyze_connection_pool()
        
        # 测试常见缓存key的性能
        test_model_names = [
            "gpt-3.5-turbo",
            "gpt-4",
            "claude-3-sonnet",
            "claude-3-haiku"
        ]
        
        StandLogger.info("测试缓存key性能...")
        cache_analysis = await redis_analyzer.analyze_cache_key_performance(test_model_names)
        
        # 生成报告
        analysis_results = {
            'connection_pool': pool_analysis,
            'cache_keys': cache_analysis
        }
        
        report = redis_analyzer.generate_report(analysis_results)
        StandLogger.info(f"\n{report}")
        
        # 输出到控制台
        print(report)
        
    except Exception as e:
        StandLogger.error(f"Redis性能测试失败: {e}")
        print(f"测试失败: {e}")


if __name__ == "__main__":
    asyncio.run(test_redis_performance())
