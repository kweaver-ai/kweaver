from typing import List
from pydantic import BaseModel


class GraphRAGRetrieveData(BaseModel):
    retrieve_string: str = ""  # 用来检索的字符串text
    graph_id: str = ""  # kg_id
    graph_name: str = ""  # kg_name
    src_entity_id: str = (
        ""  # src_vid，如果用户配置了output_fields，那么就优先output_fields
    )
    dst_entity_id: str = ("",)
    entity_type: str = (
        ""  # src_vid_tag_en      (v_tag)concept的英文名如：industry、person、district
    )
    entity_type_zh: str = (
        ""  # src_vid_tag_zh   (alias)concept中文名如：行业、人员、地区
    )
    entity_name: str = (
        ""  # src_vid_hit_value   (hit_value)hit_value具体的实体名称如：周磊、黄春华
    )
    raw_text: str = ""  # 内容
    path_entity_ids: List[str] = []  # 其他的vid，按照和src相应的顺序来写
    augmentation_entity_id: List[str] = []  # 使用了哪些vid来增强
    embedding: List[float] = []  # 默认无，kg不需要
    merge_score: float = 0.0  # reranker的分数
    token_score: float = 0.0  # token_score的分数
