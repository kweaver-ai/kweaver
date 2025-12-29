from confluent_kafka import Producer, Consumer
from confluent_kafka.admin import AdminClient, NewTopic

from app.core.config import base_config
from app.logs.stand_log import StandLogger

import redis
import redis.asyncio as redis_async
from redis.asyncio.sentinel import Sentinel as Sentinel_async
from redis.sentinel import Sentinel
from typing import Union, Dict, List
import asyncio


class RedisClient(object):
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(RedisClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, '_initialized'):
            self.redis_cluster_mode = base_config.REDISCLUSTERMODE
            self.redis_ip = base_config.REDISHOST
            self.redis_read_ip = base_config.REDISREADHOST
            self.redis_read_port = base_config.REDISREADPORT
            self.redis_read_user = base_config.REDISREADUSER
            self.redis_read_passwd = base_config.REDISREADPASS
            self.redis_write_ip = base_config.REDISWRITEHOST
            self.redis_write_port = base_config.REDISWRITEPORT
            self.redis_write_user = base_config.REDISWRITEUSER
            self.redis_write_passwd = base_config.REDISWRITEPASS
            self.redis_port = base_config.REDISPORT
            self.redis_user = ""
            if base_config.REDISUSER:
                self.redis_user = base_config.REDISUSER
            self.redis_passwd = base_config.REDISPASS
            self.redis_master_name = base_config.SENTINELMASTER
            self.redis_sentinel_user = base_config.SENTINELUSER
            self.redis_sentinel_password = base_config.SENTINELPASS
            self._initialized = True

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

    async def connect_redis_async(self, db, model):
        assert model in ["read", "write"]
        if self.redis_cluster_mode == "sentinel":
            try:
                sentinel = Sentinel_async([(self.redis_ip, self.redis_port)], password=self.redis_sentinel_password,
                                          sentinel_kwargs={
                                              "password": self.redis_sentinel_password,
                                              "username": self.redis_sentinel_user
                                          })
                if model == "write":
                    redis_con = await sentinel.master_for(self.redis_master_name, username=self.redis_user,
                                                          password=self.redis_passwd, db=db)
                if model == "read":
                    redis_con = await sentinel.slave_for(self.redis_master_name, username=self.redis_user,
                                                         password=self.redis_passwd, db=db)
                # 验证连接
                await redis_con.ping()
                return redis_con
            except Exception as e:
                StandLogger.error(f"Redis连接失败 - {model}模式: host={self.redis_ip}, port={self.redis_port}, error={str(e)}")
                raise Exception(f"connect redis error:{str(e)}")
        if self.redis_cluster_mode == "master-slave":
            try:
                if model == "read":
                    pool = redis_async.ConnectionPool(host=self.redis_read_ip, port=self.redis_read_port, db=db,
                                                      password=self.redis_read_passwd)
                    redis_con = redis_async.StrictRedis(connection_pool=pool)
                if model == "write":
                    pool = redis_async.ConnectionPool(host=self.redis_write_ip, port=self.redis_write_port, db=db,
                                                      password=self.redis_write_passwd)
                    redis_con = redis_async.StrictRedis(connection_pool=pool)
                # 验证连接
                await redis_con.ping()
                return redis_con
            except Exception as e:
                StandLogger.error(f"Redis连接失败 - {model}模式: host={self.redis_ip}, port={self.redis_port}, error={str(e)}")
                raise Exception(f"connect redis error:{str(e)}")


class ConnectUtil:
    _instance = None
    _lock = asyncio.Lock()
    _redis_client = None

    @classmethod
    async def create(cls, db=1):
        async with cls._lock:
            if cls._instance is None:
                instance = cls(db)
                if cls._redis_client is None:
                    cls._redis_client = RedisClient()
                await instance._reconnect()
                if instance.read_conn is None or instance.write_conn is None:
                    StandLogger.error(f"Redis连接创建失败: read_conn={instance.read_conn}, write_conn={instance.write_conn}")
                    raise Exception("Redis连接创建失败")
                instance._initialized = True
                StandLogger.info(f"Redis连接创建成功: read_conn={instance.read_conn}, write_conn={instance.write_conn}")
                cls._instance = instance
            return cls._instance

    def __init__(self, db=1):
        self.db = db
        self.read_conn = None
        self.write_conn = None

    async def _reconnect(self):
        """重新建立redis连接"""
        old_read_conn = self.read_conn
        old_write_conn = self.write_conn
        self.read_conn = None
        self.write_conn = None

        try:
            # 先尝试建立读连接
            self.read_conn = await self.__class__._redis_client.connect_redis_async(db=self.db, model="read")
            # 再尝试建立写连接
            self.write_conn = await self.__class__._redis_client.connect_redis_async(db=self.db, model="write")
            StandLogger.info("建立redis连接成功")
            # 关闭旧连接
            if old_read_conn:
                await old_read_conn.close()
            if old_write_conn:
                await old_write_conn.close()
        except Exception as e:
            StandLogger.error(f"Redis连接失败: {str(e)}")
            # 如果重连失败，恢复旧连接
            self.read_conn = old_read_conn
            self.write_conn = old_write_conn
            raise e

    async def close(self):
        """关闭Redis连接"""
        if self.read_conn:
            await self.read_conn.close()
        if self.write_conn:
            await self.write_conn.close()
        self.read_conn = None
        self.write_conn = None

    async def set_str(self, key: str, value: Union[str, int, float], expire: int = None) -> bool:
        for i in range(3):
            try:
                result = await self.write_conn.set(key, value)
                return result and await self._set_expire(key, expire)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def set_if_absent(self, key: str, value: Union[str, int, float] = 1, expire: int | None = None) -> bool:
        """SETNX 语义，已存在返回 False；设置成功可选过期时间"""
        for i in range(3):
            try:
                # Redis-py: set(name, value, ex=None, px=None, nx=False, xx=False)
                result = await self.write_conn.set(key, value, ex=expire, nx=True)
                return bool(result)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def _set_expire(self, key: str, expire: int = None) -> bool:
        """内部方法：设置key过期时间"""
        if expire is not None:
            return await self.write_conn.expire(key, expire)
        return True

    async def lpush(self, key: str, *values: Union[str, int, float], expire: int = None) -> int:
        for i in range(3):
            try:
                result = await self.write_conn.lpush(key, *values)
                await self._set_expire(key, expire)
                return result
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def rpush(self, key: str, *values: Union[str, int, float], expire: int = None) -> int:
        for i in range(3):
            try:
                result = await self.write_conn.rpush(key, *values)
                await self._set_expire(key, expire)
                return result
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def lrem(self, key: str, count: int, value: str, expire: int = None) -> int:
        for i in range(3):
            try:
                result = await self.write_conn.lrem(key, count, value)
                await self._set_expire(key, expire)
                return result
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def hset(self, key: str, field: str, value: Union[str, int, float], expire: int = None) -> int:
        for i in range(3):
            try:
                result = await self.write_conn.hset(key, field, value)
                await self._set_expire(key, expire)
                return result
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def hdel(self, key: str, *fields: str, expire: int = None) -> int:
        for i in range(3):
            try:
                result = await self.write_conn.hdel(key, *fields)
                await self._set_expire(key, expire)
                return result
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def get_str(self, key: str) -> Union[str, None]:
        for i in range(3):
            try:
                return await self.read_conn.get(key)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def delete_str(self, key: str | list[str]) -> bool:
        """
        删除一个或多个 Redis key
        :param key: 单个 key 或 key 列表
        :return: 是否删除成功
        """
        if isinstance(key, str):
            key = [key]
        for i in range(3):
            try:
                # 使用 pipeline 批量删除
                async with self.write_conn.pipeline(transaction=True) as pipe:
                    for k in key:
                        if await self.exists(k):
                            pipe.delete(k)
                    results = await pipe.execute()
                # 只要有一个 key 删除成功就返回 True
                return any(result > 0 for result in results)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def lrange(self, key: str, start: int = 0, end: int = -1) -> List:
        for i in range(3):
            try:
                return await self.read_conn.lrange(key, start, end)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def hget(self, key: str, field: str) -> Union[str, None]:
        for i in range(3):
            try:
                return await self.read_conn.hget(key, field)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def hgetall(self, key: str) -> Dict:
        for i in range(3):
            try:
                return await self.read_conn.hgetall(key)
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e

    async def exists(self, key: str) -> bool:
        for i in range(3):
            try:
                return await self.read_conn.exists(key) > 0
            except Exception as e:
                if i < 2:
                    import time
                    await asyncio.sleep(0.1)
                    await self._reconnect()
                else:
                    raise e


async def get_redis_util():
    """
    获取已初始化的redis_util实例
    """
    global redis_util
    if redis_util is None:

        try:
            redis_util = await ConnectUtil.create()
            StandLogger.info("Redis连接工厂初始化成功")
        except Exception as e:
            StandLogger.error(f"Redis连接工厂初始化失败: {str(e)}")
            raise e
    return redis_util

class MyKafkaClient(object):
    def __init__(self, topic_name='tenant_a.dip.model_manager.quota_data'):
        self.producer = None
        self.consumer = None
        self.topic_name = topic_name
        self.admin_client = None
        # 初始化时检查并创建topic
        self._init_admin_client()
        self._check_and_create_topic()

    def _init_admin_client(self):
        """初始化AdminClient"""
        self.admin_client = AdminClient({
            'bootstrap.servers': '{}:{}'.format(base_config.KAFKAHOST, base_config.KAFKAPORT),
            'security.protocol': 'sasl_plaintext',
            'enable.ssl.certificate.verification': 'false',
            'sasl.mechanism': 'PLAIN',
            'sasl.username': base_config.KAFKAUSER,
            'sasl.password': base_config.KAFKAPASS,
        })

    def _check_and_create_topic(self):
        """检查topic是否存在，如果不存在则创建"""
        try:
            # 获取集群元数据
            metadata = self.admin_client.list_topics(timeout=10)
            
            # 检查topic是否存在
            if self.topic_name not in metadata.topics:
                # 创建topic
                new_topic = NewTopic(
                    topic=self.topic_name,
                    num_partitions=3,  # 设置分区数为3
                    replication_factor=1  # 设置副本因子为1
                )
                
                # 创建topic
                fs = self.admin_client.create_topics([new_topic])
                for topic, f in fs.items():
                    try:
                        f.result()  # 等待创建完成
                        StandLogger.info(f"Topic {topic} created successfully")
                    except Exception as e:
                        StandLogger.error(f"Failed to create topic {topic}: {e}")
            else:
                StandLogger.info(f"Topic {self.topic_name} already exists")
        except Exception as e:
            StandLogger.error(f"Error checking/creating topic: {e}")

    def connect_producer(self):
        """连接生产者"""
        if self.producer is None:
            self.producer = Producer({
                'bootstrap.servers': '{}:{}'.format(base_config.KAFKAHOST, base_config.KAFKAPORT),
                'security.protocol': 'sasl_plaintext',
                'enable.ssl.certificate.verification': 'false',
                'sasl.mechanism': 'PLAIN',
                'sasl.username': base_config.KAFKAUSER,
                'sasl.password': base_config.KAFKAPASS,
                'acks': 1,  # 确认leader分区收到消息
                'queue.buffering.max.messages': 100000,  # 增加队列缓冲区大小
                'queue.buffering.max.kbytes': 102400,   # 增加队列缓冲区大小(KB)
                'batch.num.messages': 1000,             # 批量发送的消息数量
                'linger.ms': 5                          # 批量发送等待时间(ms)
            })

    def connect_consumer(self, group_id='quota_data_group'):
        """连接消费者"""
        if self.consumer is None:
            self.consumer = Consumer({
                'bootstrap.servers': '{}:{}'.format(base_config.KAFKAHOST, base_config.KAFKAPORT),
                'security.protocol': 'sasl_plaintext',
                'enable.ssl.certificate.verification': 'false',
                'sasl.mechanism': 'PLAIN',
                'sasl.username': base_config.KAFKAUSER,
                'sasl.password': base_config.KAFKAPASS,
                'group.id': group_id,
                'auto.offset.reset': 'latest',  # 改为latest或使用一个新的消费者组ID
                'enable.auto.commit': True,
                'auto.commit.interval.ms': 1000
            })
            # 订阅topic
            self.consumer.subscribe([self.topic_name])

    def produce_async(self, value, key=None, callback=None):
        """异步发送消息到Kafka"""
        if self.producer is None:
            self.connect_producer()
        
        # 异步发送消息
        self.producer.produce(
            self.topic_name, 
            key=key, 
            value=value, 
            callback=callback or self._delivery_callback
        )
        
        # 轮询队列以确保消息被发送
        self.producer.poll(0)

    def _delivery_callback(self, err, msg):
        """消息发送回调函数"""
        if err:
            StandLogger.error(f'Message delivery failed: {err}')
        else:
            StandLogger.info(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

    def flush_producer(self, timeout=10):
        """刷新生产者队列，确保所有消息都被发送"""
        if self.producer is not None:
            return self.producer.flush(timeout)
        return 0

    def consume_messages(self, timeout=1.0):
        """从Kafka消费消息"""
        if self.consumer is None:
            self.connect_consumer()
        
        try:
            # 轮询消息
            msg = self.consumer.poll(timeout)
            
            if msg is None:
                return None
            
            if msg.error():
                StandLogger.error(f'Consumer error: {msg.error()}')
                return None
            
            # 返回消息内容
            return {
                'key': msg.key(),
                'value': msg.value(),
                'topic': msg.topic(),
                'partition': msg.partition(),
                'offset': msg.offset()
            }
        except Exception as e:
            StandLogger.error(f'Error consuming message: {e}')
            return None

    def consume_batch(self, num_messages: int = 500, timeout: float = 1.0):
        """批量消费消息，返回统一结构的列表"""
        if self.consumer is None:
            self.connect_consumer()
        try:
            msgs = self.consumer.consume(num_messages=num_messages, timeout=timeout)
            result = []
            for msg in msgs or []:
                if msg is None:
                    continue
                if msg.error():
                    StandLogger.error(f'Consumer error: {msg.error()}')
                    continue
                result.append({
                    'key': msg.key(),
                    'value': msg.value(),
                    'topic': msg.topic(),
                    'partition': msg.partition(),
                    'offset': msg.offset()
                })
            return result
        except Exception as e:
            StandLogger.error(f'Error consuming batch messages: {e}')
            return []

    def close_producer(self):
        """关闭生产者连接"""
        if self.producer is not None:
            self.flush_producer()
            self.producer = None

    def close_consumer(self):
        """关闭消费者连接"""
        if self.consumer is not None:
            self.consumer.close()
            self.consumer = None
# 全局redis_util实例
redis_util = None
kafka_client = MyKafkaClient()