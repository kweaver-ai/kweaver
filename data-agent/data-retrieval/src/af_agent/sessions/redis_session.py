import json
import logging
import os
import redis
from redis.sentinel import Sentinel
import re
from abc import ABC
from typing import Any

from langchain.schema import HumanMessage, SystemMessage, BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import AIMessage
from typing import Union, Awaitable
from pydantic_settings import BaseSettings

from af_agent.sessions.base import BaseChatHistorySession
from af_agent.settings import get_settings
from af_agent.logs.logger import logger

settings = get_settings()
empty = ""
from af_agent.sessions.base import BaseChatHistorySession


class RedisHistorySession(BaseChatHistorySession):

    def __init__(
            self,
            history_num_limit=settings.AGENT_SESSION_HISTORY_NUM_LIMIT,
            history_max=settings.AGENT_SESSION_HISTORY_MAX
    ):
        self.client = RedisConnect().connect()
        self.history_num_limit = history_num_limit
        self.history_max = history_max

    @staticmethod
    def unescape_quotes(s):
        # 替换转义的双引号
        s = re.sub(r'\\\\\"', '\"', s)
        # 替换多层转义的双引号
        while '\\\"' in s:
            s = s.replace('\\\"', '\"')
        return s
    def get_history_num(
            self,
            session_id: str
    ) -> Union[Awaitable[int], int]:
        if not session_id.startswith("agent"):
            session_id = "agent" + session_id

        num = self.client.hlen(session_id)

        return num

    def get_chat_history(
        self,
        session_id: str
    ) -> str | BaseChatMessageHistory | Any:
        if not session_id.startswith("agent"):
            session_id = "agent" + session_id
        chat_message_history = ChatMessageHistory()
        history = self.client.hgetall(session_id)
        history = {
            k.decode('utf-8'): v.decode('utf-8')
            for k, v in history.items()
        }
        sort_history = {
            k: history[k]
            for k in sorted(history)
        }

        if sort_history:
            last_key_of_sort_history = list(sort_history.keys())[-1]
            for k, v in sort_history.items():
                v = self.unescape_quotes(v)
                # if len(v) > self.history_max:
                #     self.history_num_limit = 1
                if "human" in k:
                    chat_message_history.add_message(HumanMessage(v))
                elif "system" in k:
                    chat_message_history.add_message(SystemMessage(v))
                elif "ai" in k:
                    chat_message_history.add_message(AIMessage(v))
                else:
                    if k == last_key_of_sort_history:
                        chat_message_history.add_message(AIMessage(v))
        chat_message_history.messages = chat_message_history.messages[-self.history_num_limit:]
        
        idx, total_len = max(-self.history_num_limit, -len(chat_message_history.messages)), 0

        for i in range(-1, idx, -1):
            total_len += len(chat_message_history.messages[i].content)
            if total_len > self.history_max:
                idx = i
                break
        
        chat_message_history.messages = chat_message_history.messages[idx:]


        # for message in chat_message_history.messages:
        #     if len(message.content) > self.history_max:
        #         if_message_big_than_message = True
        #         break
        # if if_message_big_than_message:
        #     chat_message_history.messages = chat_message_history.messages[-1:]

        logger.info(
            f"session id {session_id}, chat_message_history num {len(chat_message_history.messages)}"
            f"检查最近 {self.history_num_limit} 历史记录总长度是否超过 {self.history_max}：获取到了最近{-idx}条数据")

        return chat_message_history

    # TODO: 优化成 BaseMessage，然后继承 add_chat_history
    def add_chat_history(
        self,
        session_id: str,
        types: str,
        content: str
    ):
        session_id = "agent" + session_id
        # chat_message_history = self.get_history_num(session_id)
        nums = str(self.get_history_num(session_id)+1)
        nums = (4 - len(nums)) * "0" + nums
        if types == "human":
            self.client.hset(session_id, f"{nums}:human", content)
        elif types == "ai":
            self.client.hset(session_id, f"{nums}:ai", content)
        elif types == "system":
            self.client.hset(session_id, f"{nums}:system", content)
        else:
            self.client.hset(session_id, f"{nums}:middle", content)

        self.client.expire(session_id, 60 * 60 * 24)

    def add_agent_logs(
        self,
        session_id: str,
        logs: dict
    ) -> Any:
        self.client.setex(
            name=session_id,
            time= 60 * 60 * 2,
            value=json.dumps(logs, ensure_ascii=False),
        )

    # TODO: 直接返回 get_chat_history
    def get_agent_logs(
        self,
        session_id: str
    ) -> dict | list:
        """获取历史记录"""
        history = self.client.get(session_id)
        if history is None:
            history = {}
        else:
            history = json.loads(history)
        return history

    def clean_session(self):
        """ empty"""
        pass

    def _add_chat_history(
        self,
        session_id: str,
        chat_history: BaseChatMessageHistory
    ):
        """ empty"""
        pass

    def delete_chat_history(
        self,
        session_id: str
    ):
        """ empty"""
        pass

    def add_working_context(
        self,
        session_id: str,
        working_context: dict
    ):
        """ empty"""
        pass

    def get_working_context(
        self,
        session_id: str
    ):
        """ empty"""
        pass

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