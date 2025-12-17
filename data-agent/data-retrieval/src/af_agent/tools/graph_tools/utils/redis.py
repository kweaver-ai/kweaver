import time

import redis
import redis.asyncio as redis_async
from redis.asyncio.sentinel import Sentinel as Sentinel_async
from redis.sentinel import Sentinel

from af_agent.tools.graph_tools.common.config import Config


class RedisClient(object):
    def __init__(self):
        self.redis_cluster_mode = Config.REDISCLUSTERMODE
        self.redis_ip = Config.REDISHOST
        self.redis_read_ip = Config.REDISREADHOST
        self.redis_read_port = Config.REDISREADPORT
        self.redis_read_user = Config.REDISREADUSER
        self.redis_read_passwd = Config.REDISREADPASS
        self.redis_write_ip = Config.REDISWRITEHOST
        self.redis_write_port = Config.REDISWRITEPORT
        self.redis_write_user = Config.REDISWRITEUSER
        self.redis_write_passwd = Config.REDISWRITEPASS
        self.redis_port = Config.REDISPORT
        self.redis_user = ""
        if Config.REDISUSER:
            self.redis_user = Config.REDISUSER
        self.redis_passwd = Config.REDISPASS
        self.redis_master_name = Config.SENTINELMASTER
        self.redis_sentinel_user = Config.SENTINELUSER
        self.redis_sentinel_password = Config.SENTINELPASS

    def connect_redis(self, db, model):
        assert model in ["read", "write"]
        if self.redis_cluster_mode == "sentinel":
            sentinel = Sentinel([(self.redis_ip, self.redis_port)], password=self.redis_sentinel_password,
                                sentinel_kwargs={
                                    "password": self.redis_sentinel_password,
                                    "username": self.redis_sentinel_user
                                })
            if model == "write":
                redis_con = sentinel.master_for(self.redis_master_name, username=self.redis_user,
                                                password=self.redis_passwd, db=db)
            if model == "read":
                redis_con = sentinel.slave_for(self.redis_master_name, username=self.redis_user,
                                               password=self.redis_passwd, db=db)
            return redis_con
        if self.redis_cluster_mode == "master-slave":
            if model == "read":
                pool = redis.ConnectionPool(host=self.redis_read_ip, port=self.redis_read_port, db=db,
                                            password=self.redis_read_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
            if model == "write":
                pool = redis.ConnectionPool(host=self.redis_write_ip, port=self.redis_write_port, db=db,
                                            password=self.redis_write_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
            return redis_con

    def connect_redis_async(self, db, model):
        assert model in ["read", "write"]
        if self.redis_cluster_mode == "sentinel":
            sentinel = Sentinel_async([(self.redis_ip, self.redis_port)], password=self.redis_sentinel_password,
                                      sentinel_kwargs={
                                          "password": self.redis_sentinel_password,
                                          "username": self.redis_sentinel_user
                                      })
            if model == "write":
                redis_con = sentinel.master_for(self.redis_master_name, username=self.redis_user,
                                                password=self.redis_passwd, db=db)
            if model == "read":
                redis_con = sentinel.slave_for(self.redis_master_name, username=self.redis_user,
                                               password=self.redis_passwd, db=db)
            return redis_con
        if self.redis_cluster_mode == "master-slave":
            if model == "read":
                pool = redis_async.ConnectionPool(host=self.redis_read_ip, port=self.redis_read_port, db=db,
                                                  password=self.redis_read_passwd)
                redis_con = redis_async.StrictRedis(connection_pool=pool)
            if model == "write":
                pool = redis_async.ConnectionPool(host=self.redis_write_ip, port=self.redis_write_port, db=db,
                                                  password=self.redis_write_passwd)
                redis_con = redis_async.StrictRedis(connection_pool=pool)
            return redis_con


class RedisLock:
    """
    redis锁
    example:
    ```
    with RedisLock('my_lock') as lock:
        # 获取锁成功，执行操作
        ...
    # 锁已自动释放
    ```
    """

    def __init__(self, key, expire=30):
        self.redis_conn = redisConnect.connect_redis(0, 'write')  # Redis 连接对象
        self.key = key  # 锁的 key
        self.expire = expire  # 锁过期时间，单位是秒

    def acquire(self):
        while True:
            # 尝试获取锁
            acquired = self.redis_conn.setnx(self.key, time.time() + self.expire)
            if acquired:
                return True
            else:
                # 如果锁已被其他进程获取，检查锁是否已过期
                expiration = self.redis_conn.get(self.key)
                if not expiration:
                    continue
                if float(expiration.decode('utf-8')) < time.time():
                    # 锁已经过期，尝试重新获取锁
                    new_expiration = time.time() + self.expire
                    old_expiration = self.redis_conn.getset(self.key, new_expiration)
                    if old_expiration and float(old_expiration.decode('utf-8')) < time.time():
                        continue
                    else:
                        return True
                else:
                    time.sleep(0.1)

    def release(self):
        self.redis_conn.delete(self.key)

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.release()


redisConnect = RedisClient()
redis_conn_db0 = redisConnect.connect_redis(0, 'write')
