# -*-coding:utf-8-*-
import threading

import rdsdriver
from dbutilsx.pooled_db import PooledDB, PooledDBInfo

from app.common.config import Config


# 单例
class PymysqlPool(object):
    yamlConfig = None
    _instance_lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, "_instance"):
            with PymysqlPool._instance_lock:
                if not hasattr(cls, "_instance"):
                    PymysqlPool._instance = super().__new__(cls)
            return PymysqlPool._instance

    @classmethod
    def get_pool(cls):
        DB_MINCACHED = 2
        DB_MAXCACHED = 5
        DB_MAXSHARED = 5
        DB_MAXCONNECTIONS = 3
        DB_BLOCKING = True

        DB_HOST = Config.rds.host
        DB_PORT = Config.rds.port
        DB_USER_NAME = Config.rds.user
        DB_PASSWORD = Config.rds.password
        DB_SCHEMA = Config.rds.dbname
        CHARSET = "utf8"

        w = PooledDBInfo(
            creator=rdsdriver,
            mincached=DB_MINCACHED,
            maxcached=DB_MAXCACHED,
            maxshared=DB_MAXSHARED,
            maxconnections=DB_MAXCONNECTIONS,
            blocking=DB_BLOCKING,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER_NAME,
            password=DB_PASSWORD,
            database=DB_SCHEMA,
            charset=CHARSET,
            cursorclass=rdsdriver.DictCursor,
        )
        r = w
        op = PooledDB(
            master=w,
            backup=r,
        )

        return op
