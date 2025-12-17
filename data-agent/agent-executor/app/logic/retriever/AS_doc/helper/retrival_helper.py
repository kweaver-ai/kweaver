import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from app.logic.retriever.AS_doc.helper.constant import (
    RetrieveSourceType,
    RetrieveMethod,
    RetrieveDataType,
    RetrieveDataGranularity,
)


def random_uuid():
    return str(uuid.uuid4())


def get_now_timestamp() -> int:
    return int(datetime.now().timestamp())


class BaseRetrieveData(BaseModel):  # 基类
    retrieve_string: str  # 用户query
    retrieve_string_md5: str  # 用户query的md5
    retrieve_source_type: RetrieveSourceType = RetrieveSourceType.DOC_LIB
    retrieve_method: RetrieveMethod = RetrieveMethod.SPARSE_RETRIEVE
    data_type: RetrieveDataType = RetrieveDataType.COMMON_DOCUMENT
    data_granularity: RetrieveDataGranularity = RetrieveDataGranularity.SLICE
    has_score: bool = False


class DocLibOpenSearchRetrieveData(BaseRetrieveData):  # 从anyshare&opensearch中检索
    uuid: Optional[str] = random_uuid()
    belong_doc_id: str = ""
    belong_doc_path: str = ""
    belong_doc_name: str = ""
    belong_doc_size: int = 0
    belong_doc_md5: str = ""
    belong_doc_page: int = 0  # 在原文中页数，和pages可能重复
    belong_doc_mimetype: str = ""
    belong_doc_ext_type: str = ""
    belong_doc_parent_path: str = ""
    raw_text: str = ""
    embedding: List[float] = []
    segment_id: int = 0
    md5: str = ""
    score: float = 0.0
    created_at: int = get_now_timestamp()
    modified_at: int = get_now_timestamp()
    pages: list = []
    doc_lib_type: str = ""
