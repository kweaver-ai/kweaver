# -*- coding: utf-8 -*-
"""
@Time    : 2024/10/31 11:04
@Author  : Danny.gao
@FileName: base.py
@Desc: 内存存储会话记录，重启项目会清除
"""
import time
import json
import threading

from langchain_core.chat_history import BaseChatMessageHistory
from langchain.schema import HumanMessage, SystemMessage, BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import AIMessage
from af_agent.sessions.base import BaseChatHistorySession
from af_agent.logs.logger import logger

class InMemoryChatSession(BaseChatHistorySession):
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize if not already initialized
        if not hasattr(self, '_initialized'):
            self.message_history_session = {}
            self.agent_logs = {}  # 新增：存储agent日志的字典
            self._initialized = True
            self._start_cleaner_thread()  # 启动定时清理线程

    def _start_cleaner_thread(self):
        self._cleaner_thread = threading.Thread(target=self._cleaner_loop, daemon=True)
        self._cleaner_thread.start()

    def _cleaner_loop(self):
        expire_seconds = 24 * 60 * 60  # 24小时
        while True:
            time.sleep(600)  # 每10分钟清理一次
            now = time.time()
            expired_history = [sid for sid, (_, ts) in self.message_history_session.items() if now - ts > expire_seconds]
            expired_logs = [sid for sid, (_, ts) in self.agent_logs.items() if now - ts > expire_seconds]
            for sid in expired_history:
                logger.info(f"clean expired chat history: {sid}")
                self.message_history_session.pop(sid, None)

            for sid in expired_logs:
                logger.info(f"clean expired agent logs: {sid}")
                self.agent_logs.pop(sid, None)


    def add_chat_history(
        self,
        session_id: str,
        types: str,
        content: str
    ):
        chat_message_history = self.get_chat_history(session_id)
        nums = str(len(chat_message_history.messages) + 1)
        nums = (4 - len(nums)) * "0" + nums

        if types == "human":
            message = HumanMessage(content=content)
        elif types == "ai":
            message = AIMessage(content=content)
        elif types == "system":
            message = SystemMessage(content=content)
        else:
            message = AIMessage(content=content)  # middle类型消息当作AI消息处理

        chat_message_history.add_message(message)
        self.message_history_session[session_id] = (chat_message_history, time.time())

    def add_agent_logs(
        self,
        session_id: str,
        logs: dict
    ):
        self.agent_logs[session_id] = (logs, time.time())

    def get_agent_logs(
        self,
        session_id: str
    ) -> dict:
        return self.agent_logs.get(session_id, ({}, 0))[0]

    def get_chat_history(
            self, session_id: str,
    ) -> BaseChatMessageHistory:
        if session_id in self.message_history_session:
            return self.message_history_session.get(session_id, (ChatMessageHistory(), 0))[0]
        else:
            self._add_chat_history(session_id, ChatMessageHistory())
            return self.message_history_session.get(session_id, (ChatMessageHistory(), 0))[0]

    def _add_chat_history(self, session_id: str, chat_history: BaseChatMessageHistory):
        self.message_history_session[session_id] = (chat_history, time.time())

    def delete_chat_history(self, session_id: str):
        if not self.message_history_session.pop(session_id, None):
            raise "%s not found in message_history_session" % session_id

    def clean_session(self):
        self.message_history_session = {}
        self.agent_logs = {}

    def add_working_context(self, session_id: str, working_context: dict):
        """ empty"""
        pass

    def get_working_context(self, session_id: str) -> dict:
        """ empty"""
        pass
