import json
import redis
from redis.sentinel import Sentinel
from typing import Any, Union
from enum import Enum

from af_agent.settings import get_settings
from af_agent.logs.logger import logger

settings = get_settings()


class EnumEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Enum):
            return o.name  # 返回枚举成员的名称作为字符串
        return json.JSONEncoder.default(self, o)
    

class RedisHistorySession:

    def __init__(self, history_num_limit=10, history_max=1000):
        self.client = RedisConnect().connect()
        self.history_num_limit = history_num_limit
        self.history_max = history_max

    def get_chat_history(
        self,
        session_id: str,
        role: str = None,
        prefix: str = None
    ) -> dict:
        session_id = f'{prefix}_{session_id}' if prefix else f'agent_{session_id}'
        history = self._hgetall(hname=session_id)
        if role:
            history = {k: v for k, v in history.items() if k.endswith(role)}
        else:
            history = {k: v for k, v in history.items()}
        sort_history = {k: history[k] for k in sorted(history)}
        return sort_history

    def add_chat_history(
        self,
        session_id: str,
        role: str,
        content: Union[str, dict],
        prefix: str = None
    ):
        session_id = f'{prefix}_{session_id}' if prefix else f'agent_{session_id}'
        count = self._hlen(session_id) + 1
        count = f'{count}'.zfill(len(f'{self.history_max}'))
        datas = {
            f'{count}:{role}': {'content': content} if isinstance(content, str) else content
        }
        self._hmset(hname=session_id, datas=datas)

        self.client.expire(session_id, 60 * 60 * 24)

    def _hmset(self, hname: str, datas: dict[str, dict]) -> bool:
        if self.check_and_try_reconnect():
            try:
                all_data = {k: json.dumps(v, cls=EnumEncoder, ensure_ascii=False) for k, v in datas.items()}
                self.client.hmset(name=hname, mapping=all_data)
                return True
            except Exception as e:
                logger.info(f'Redis hmset error: {e}')
        logger.info('Redis连接失败！！')
        return False

    def _hgetall(self, hname: str) -> dict[str, dict]:
        final_res = {}
        if self.check_and_try_reconnect():
            results = self.client.hgetall(name=hname)
            try:
                for key, value in results.items():
                    final_res[key.decode()] = json.loads(value.decode('utf-8'))
            except Exception as e:
                logger.info(f'Redis hgetall error: {e}')
        else:
            logger.info('Redis连接失败！！')
        return final_res
    
    def _hlen(self, hname: str):
        if self.check_and_try_reconnect():
            try:
                return self.client.hlen(hname)
            except Exception as e:
                logger.info(f'Redis hlen error: {e}')
        logger.info('Redis连接失败！！')
        return 0
    
    def check_and_try_reconnect(self):
        if self.client:
            return True
        logger.info(f'Redis连接失败！！重新连接中......')
        idx = 1
        while idx < 3:
            try:
                self.client = self.client.connect()
                return True
            except Exception as e:
                logger.info(f'第{idx-1}次重试Redis连接失败！！{e}')
            idx += 1
        return False

    
class RedisConnect:
    def __init__(self):
        settings = get_settings()
        self.redis_cluster_mode = settings.REDISCLUSTERMODE
        self.db = settings.REDIS_DB
        self.master_name = settings.SENTINELMASTER
        self.sentinel_user_name = settings.SENTINELUSER

        self.host = settings.REDISHOST
        # self.host = '10.4.109.216'
        self.sentinel_host = settings.REDIS_SENTINEL_HOST

        self.port = settings.REDISPORT
        self.sentinel_port = settings.REDIS_SENTINEL_PORT

        self.password = settings.REDIS_PASSWORD
        self.sentinel_password = settings.SENTINELPASS

    def connect(self):
        if self.redis_cluster_mode == "master-slave":
            pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                password=self.password,
                db=self.db,
            )
            client = redis.StrictRedis(connection_pool=pool)
            return client
        if self.redis_cluster_mode == "sentinel":
            sentinel = Sentinel(
                [(self.sentinel_host, self.sentinel_port)],
                password=self.sentinel_password,
                sentinel_kwargs={
                    "password": self.sentinel_password,
                    "username": self.sentinel_user_name
                }
            )
            client = sentinel.master_for(
                self.master_name,
                password=self.sentinel_password,
                username=self.sentinel_user_name,
                db=self.db
            )
            return client
        

if __name__ == '__main__':
    # agent0aad0c6e32779b1aaf49b333f53025a7
    base_session = RedisHistorySession()
    session_id = 'test_dl_null'
    # 添加数据
    # res = base_session._hmset(hname=session_id, datas={'k1': {'name': 'name1', 'detail': 'detail1'}, 'k2': {'name': 'name2', 'detail': 'detail2'}})
    # print(res)
    res = base_session._hgetall(hname=session_id)
    print(res)
