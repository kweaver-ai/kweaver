import copy
import hashlib
from typing import List, Dict


def get_md5(string):
    md5_machine = hashlib.md5()
    md5_machine.update(str(string).encode("utf-8"))
    return md5_machine.hexdigest()


# 在query重新的时候会使用到几轮历史信息，根据cm中的config来clip。这里的clip不会影响embedding阶段和ranking阶段
def clip_history_messages(messages: List[Dict], history_epochs) -> List[Dict]:
    cliped_messages = []
    if history_epochs == 0:
        return {}
    if len(messages) > 2 * history_epochs:
        cliped_messages = copy.deepcopy(messages[-2 * history_epochs :])
    else:
        cliped_messages = messages
    return cliped_messages


def format_messages(messages):
    if not messages:
        return {}
    if isinstance(messages[0], dict):
        for _message in messages:
            _message["role"] = (
                _message["role"].value
                if not isinstance(_message["role"], str)
                else _message["role"]
            )
        return messages
    else:
        formatted_messages = []
        for _history_messages in messages:
            formatted_messages.append(_history_messages.model_dump())
        for _message in formatted_messages:
            _message["role"] = (
                _message["role"].value
                if not isinstance(_message["role"], str)
                else _message["role"]
            )
        return formatted_messages


class Query:
    def __init__(self, content, md5, type):
        self.content: str = content
        self.md5: str = md5
        self.type: str = type
        self.embedding: str = None

    def set_embedding(self, embedding):
        self.embedding = embedding

    def get_content(self):
        return self.content

    def get_md5(self):
        return self.md5

    def get_type(self):
        return self.type

    def get_embedding(self):
        return self.embedding


def judge_query_need_history(query):
    need_history_lists = ["它", "他", "她"]
    for item in need_history_lists:
        if item in query:
            return True
    return False
