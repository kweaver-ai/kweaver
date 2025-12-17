from typing import List, Dict, Optional, Any


class BasicObject:
    def __init__(self):
        self.attrs_mapping: Dict[Any, Any] = {}  # task流 记录整个过程产生的内容

    def set_attr(self, name: str, value: Any) -> None:
        self.attrs_mapping[name] = value

    def get_attr(self, name: str, default: Optional[Any] = None) -> Any:
        if name in self.attrs_mapping:
            return self.attrs_mapping.get(name, default)
        else:
            return None

    def has_attr(self, name: str) -> bool:
        if name in self.attrs_mapping:
            return True
        else:
            return False

    def get_attrs(self) -> List[str]:
        return list(self.attrs_mapping)


class Task(BasicObject):
    def __init__(self, params):
        super().__init__()
        self.origin_query = self.format_user_query(params["query"])
        self.history_messages = (
            params["history_messages"] if "history_messages" in params else []
        )

    def __repr__(self):
        return "task stream which records data chains for graph rag block."

    def format_user_query(self, query: str) -> str:
        _query = query
        if any([_query[-1] == punctuation for punctuation in ["?", "？"]]):
            _query = _query[:-1]
        return _query

    @property
    def get_history_messages(self):
        return self.history_messages  # 支持上下文的时候，在这里填写相应的逻辑即可

    @property
    def get_origin_query(self):
        return self.origin_query
