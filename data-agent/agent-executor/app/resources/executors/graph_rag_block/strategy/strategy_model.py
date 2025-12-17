from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class QueryStrategy(BaseModel):
    query_understand_strategies: str = ""
    query_augmentation_strategies: str = ""
    query_rewriting_strategies: str = ""
    switch: Optional[bool] = False


class RetrieveStrategy(BaseModel):
    data_sources_field: List[str] = []
    long_context_field: List[str] = []
    output_field: List[str] = []  # 暂时不使用
    retrieve_source_config: Dict[str, Any] = {}
    retrieve_auth_config: str = ""
    switch: Optional[bool] = True


class AggregationStrategy(BaseModel):
    output_field: List[str] = []
    long_text_length: int = 256
    switch: Optional[bool] = True


class AugmentationStrategy(BaseModel):
    augmentation_type: str = "default"
    augmentation_field: List[str] = []  # 从哪些concept中进行增强
    augmentation_kg_id: str = ""
    output_field: List[str] = []
    aug_top_k: int = 5
    retrieve_source_config: Dict[str, Any] = {}
    switch: Optional[bool] = True


class RankingStrategy(BaseModel):
    reranker_method: Optional[str] = "only_reranker"
    reranker_cossim_threshold: float = -6.0
    switch: Optional[bool] = True


class FormattorStrategy(BaseModel):
    switch: Optional[bool] = False
    graph_rag_topk: int = 25


class DefaultStrategy(BaseModel):
    query_strategy: QueryStrategy = QueryStrategy()
    retrieve_strategy: RetrieveStrategy = RetrieveStrategy()
    aggregation_strategy: AggregationStrategy = AggregationStrategy()
    ranking_strategy: RankingStrategy = RankingStrategy()
    augmentation_strategy: AugmentationStrategy = AugmentationStrategy()
    formattor_strategy: FormattorStrategy = FormattorStrategy()
