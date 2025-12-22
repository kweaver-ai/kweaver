# -*- coding: utf-8 -*-
"""
@Time    : 2024/10/31 11:04
@Author  : Danny.gao
@FileName: base.py
@Desc:
    1. 基类：增删改查
    2. 根据 user_id 生成 MD5 ID
"""

import hashlib
import time
from abc import ABC, abstractmethod

from langchain_core.chat_history import BaseChatMessageHistory

from data_retrieval.logs.logger import logger


class BaseChatHistorySession(ABC):

    @abstractmethod
    def get_chat_history(
        self, session_id: str,
    ) -> BaseChatMessageHistory:
        raise NotImplementedError

    @abstractmethod
    def _add_chat_history(self, session_id: str, chat_history: BaseChatMessageHistory):
        # Add chat_qa session
        raise NotImplementedError

    @abstractmethod
    def delete_chat_history(self, session_id: str):
        raise NotImplementedError

    @abstractmethod
    def clean_session(self):
        raise NotImplementedError
    
    @abstractmethod
    def add_working_context(self, session_id: str, working_context: dict):
        raise NotImplementedError
    
    @abstractmethod
    def get_working_context(self, session_id: str) -> dict:
        raise NotImplementedError

class GetSessionId(object):

    @classmethod
    def from_user_id(cls, user_id):
        """
        根据用户ID生成一个MD5会话ID
        :param user_id:
        :return:
        """
        timestamp = str(int(time.time()))
        input_str = f"{user_id}-{timestamp}"
        md5_hash = hashlib.md5(input_str.encode()).hexdigest()

        logger.info(f"md5_hash: {md5_hash}")
        return md5_hash
