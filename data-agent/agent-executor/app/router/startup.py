"""
应用启动时的准备
"""

import os
import sys
import time

import jieba
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.logic.file_service import file_service


def load_executors():
    jieba.initialize()

    # 加载executors
    sys.path.append(os.path.join(Config.app.app_root, "resources"))
    executors_path = os.path.join(Config.app.app_root, "resources/executors")
    print("executor_path: {}".format(executors_path))
    ClsManager.discover_executors(executors_path)


def start_scheduler_async():
    """添加异步定时任务"""
    scheduler = AsyncIOScheduler(timezone="UTC")
    offset_hours = time.localtime().tm_gmtoff // 3600
    if offset_hours > 0:
        timezone_name = f"Etc/GMT-{int(offset_hours)}"
    else:
        timezone_name = f"Etc/GMT+{int(-offset_hours)}"

    StandLogger.info("timezone_name: " + timezone_name)

    scheduler.add_job(
        file_service.delete_temp_file,
        "cron",
        hour=0,
        minute=0,
        timezone=pytz.timezone(timezone_name),
    )

    scheduler.start()
