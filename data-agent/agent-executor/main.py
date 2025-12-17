# -*- coding:utf-8 -*-
import os
import sys
import signal
import asyncio
import logging

# 1. 服务启动前的boot
from app.boot import boot

boot.on_boot_run()


import uvicorn


server_instance = None

# 删除config.json fastapi app使用环境变量的Config
config_json_path = os.path.join(
    os.path.dirname(__file__), "app", "common", "config.json"
)
if os.path.exists(config_json_path):
    os.remove(config_json_path)

from app.common.config import Config
from app.router import app

# ----->国际化
# from app.common.international import compile_all
# compile_all()


def signal_handler(signum, frame):
    """信号处理器"""
    print("\n接收到停止信号，正在关闭服务...")

    if server_instance:
        if server_instance.should_exit:
            server_instance.force_exit = True
        else:
            server_instance.should_exit = True


def asyncio_exception_handler(loop, context):
    """Asyncio 异常处理器 - 抑制 KeyboardInterrupt 警告"""
    exception = context.get("exception")
    
    # 忽略 KeyboardInterrupt 和 CancelledError
    if isinstance(exception, (KeyboardInterrupt, asyncio.CancelledError)):
        return
    
    # 其他异常正常处理
    if exception:
        print(f"Asyncio 异常: {exception}")


class HealthCheckFilter(logging.Filter):
    """过滤健康检查端点的日志"""
    def filter(self, record: logging.LogRecord) -> bool:
        # 过滤掉健康检查端点的访问日志
        message = record.getMessage()
        if '/health/alive' in message or '/health/ready' in message:
            return False
        return True


def main():
    # 设置 asyncio 异常处理器
    try:
        loop = asyncio.get_event_loop()
        loop.set_exception_handler(asyncio_exception_handler)
    except RuntimeError:
        # 如果没有事件循环，忽略
        pass

    global server_instance

    # 配置 Uvicorn 日志格式，添加时间信息
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["default"]["fmt"] = "%(asctime)s - %(levelname)s - %(message)s"
    log_config["formatters"]["default"]["datefmt"] = "%Y-%m-%d %H:%M:%S"
    log_config["formatters"]["access"]["fmt"] = '%(asctime)s - %(levelname)s - %(client_addr)s - "%(request_line)s" %(status_code)s'
    log_config["formatters"]["access"]["datefmt"] = "%Y-%m-%d %H:%M:%S"

    # 添加健康检查过滤器
    log_config["filters"] = {
        "health_check_filter": {
            "()": HealthCheckFilter,
        }
    }
    log_config["handlers"]["access"]["filters"] = ["health_check_filter"]

    config = uvicorn.Config(
        app,
        host=Config.app.host_ip,
        port=Config.app.port,
        log_level=Config.app.log_level,
        log_config=log_config,
    )
    server_instance = uvicorn.Server(config)

    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # 运行服务
        server_instance.run()
    except (KeyboardInterrupt, SystemExit):
        print("\n服务已停止")
    except Exception as e:
        print(f"\n服务异常退出: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
