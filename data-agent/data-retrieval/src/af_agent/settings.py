# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-26

import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class DIPSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Agent Settings
    MODEL_TYPE: str = "default"
    AGENT_MAX_ITERATIONS: int = 20
    AGENT_MAX_EXECUTION_TIME: int = 600
    SHOW_OLD_THINK_CONTENT: bool = False

    # Agent Session Settings
    AGENT_SESSION_TYPE: str = "redis"
    AGENT_SESSION_HISTORY_NUM_LIMIT: int = 10
    AGENT_SESSION_HISTORY_MAX: int = 5000

    # Agent LLM Settings
    AGENT_LLM_MODEL_NAME: str = "Qwen-72B-Chat"
    AGENT_LLM_OPENAI_API_KEY: str = "EMPTY"
    AGENT_LLM_OPENAI_API_BASE: str = "http://10.4.117.180:8304/v1"
    SCRATCHPAD_ROUND_LIMIT: int = 0

    # Tool Settings
    INDICATOR_RECALL_TOP_K: int = 5
    INDICATOR_REWRITE_QUERY: bool = False
    TEXT2METRIC_MODEL_TYPE: str = "default"
    TEXT2METRIC_DIMENSION_NUM_LIMIT: int = 30
    TEXT2METRIC_FORCE_LIMIT: int = 1000

    TEXT2SQL_MODEL_TYPE: str = "default"
    TEXT2SQL_RECALL_TOP_K: int = 5
    TEXT2SQL_DIMENSION_NUM_LIMIT: int = 30
    TEXT2SQL_REWRITE_QUERY: bool = False
    TEXT2SQL_FORCE_LIMIT: int = 200
    SHOW_SQL_GRAPH: bool = False

    SQL_HELPER_RECALL_TOP_K: int = 5
    SQL_HELPER_DIMENSION_NUM_LIMIT: int = 30
    SQL_HELPER_FORCE_LIMIT: int = 200

    RETURN_RECORD_LIMIT: int = 100
    RETURN_DATA_LIMIT: int = 5000

    KNOWLEDGE_ITEM_RETURN_RECORD_LIMIT: int = 30
    KNOWLEDGE_ITEM_HARD_LIMIT: int = 2000
    
    CODE_RUNNER_OUTPUT_LIMIT: int = 2000
    CODE_RUNNER_OUTPUT_LINES_LIMIT: int = 10

    CACHE_SIZE_LIMIT: int = 2000

    KNOWLEDGE_ITEM_LIMIT: int = 5

    # Tool LLM Settings
    TOOL_LLM_MODEL_NAME: str = "Qwen-72B-Chat"
    TOOL_LLM_OPENAI_API_KEY: str = "EMPTY"
    TOOL_LLM_OPENAI_API_BASE: str = "http://10.4.117.180:8304/v1"

    SENTINELPASS: str = 'eisoo.com123'
    SENTINELUSER: str = 'root'

    REDISHOST: str = '10.4.111.247'
    REDISPORT: str = "6379"
    REDIS_PASSWORD: str = 'eisoo.com123'

    # AF 内部 VEGA 服务和指标服务
    # AF_VEGA_URL: str = "http://af-vega-gateway:8099"
    # AF_VEGA_DATA_VIEW_URL: str = "http://data-view:8123"
    # INDICATOR_MANAGEMENT_URL: str = "http://indicator-management:8213"

    # DIP VEGA
    OUTTER_VEGA_URL: str = ""
    VIR_ENGINE_URL: str = "http://vega-gateway:8099"
    DATA_VIEW_URL: str = "http://mdl-data-model-svc:13020"
    
    # Embedding Settings
    EMB_URL: str = 'http://mf-model-api:9898/api/private/mf-model-api/v1/small-model/embedding'
    EMB_URL_suffix: str = ''
    EMB_TYPE: str = 'model_factory'

    # Debug Settings
    AF_DEBUG_IP: str = ""
    SAILOR_URL: str = "http://af-sailor:9797"

    # Jupyter Gateway Settings
    JUPYTER_GATEWAY_URL: str = "http://127.0.0.1:8888"

    # Sandbox Settings
    SANDBOX_URL: str = "http://sandbox-env:9101"

    # AD CONFIG
    AD_VERSION: str = "3.0.1.4"
    AD_ACCESS_KEY: str = ""
    AD_GATEWAY_URL: str = ""
    AD_GATEWAY_USER: str = ""
    AD_GATEWAY_PASSWORD: str = ""
    OPENSEARCH_HOST: str = ""
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_USER: str = "admin"
    OPENSEARCH_PASS: str = "admin"

    # 知识网络服务类型
    KN_SERVICE_TYPE: str = "dip"

    # DIP 服务
    OUTTER_DIP_URL: str = ""
    DIP_ENGINE_URL: str = "http://kn-data-query:6480"
    DIP_BUILDER_URL: str = "http://kn-knowledge-data:6475"
    DIP_ALG_SERVER_URL: str = "http://kn-search-engine:6479"
    DIP_MODEL_API_URL: str = "http://mf-model-api:9898/api/private/mf-model-api/v1"

    DIP_DATA_MODEL_URL: str = "http://mdl-data-model-svc:13020"
    DIP_MODEL_QUERY_URL: str = "http://mdl-uniquery-svc:13011"
    
    DIP_AGENT_RETRIEVAL_URL: str = "http://agent-retrieval:30779"
    DEFAULT_AGENT_RETRIEVAL_MAX_CONCEPTS: int = 10
    DEFAULT_AGENT_RETRIEVAL_MODE: str = "keyword_vector_retrieval"

    # 新增 DEBUG 配置项
    DEBUG: bool = False
    # DEBUG: bool = True
    if DEBUG:
        DIP_HOST: str = "192.168.232.11"
        DIP_AGENT_RETRIEVAL_URL: str = f"http://{DIP_HOST}:30779"
        DIP_DATA_MODEL_URL: str = f"http://{DIP_HOST}:13020"
        DIP_MODEL_QUERY_URL: str = f"http://{DIP_HOST}:13011"
        EMB_URL: str = f'http://{DIP_HOST}:9898/api/private/mf-model-api/v1/small-model/embedding'
        DIP_MODEL_API_URL: str = f"http://{DIP_HOST}:9898/api/private/mf-model-api/v1"
        VIR_ENGINE_URL: str = f"http://{DIP_HOST}:8099"
        SANDBOX_URL: str = f"http://{DIP_HOST}:9101"
        DIP_ENGINE_URL: str = f"http://{DIP_HOST}:6480"
        DIP_BUILDER_URL: str = f"http://{DIP_HOST}:6475"
        DIP_ALG_SERVER_URL: str = f"http://{DIP_HOST}:6479"
        # EMB_URL: str = f'http://{DIP_HOST}:9898/api/private/mf-model-manager/v1/small-model/embedding'
    # Redis Setings
    REDISCLUSTERMODE: str = 'master-slave'
    SENTINELMASTER: str = 'mymaster'
    REDIS_DB: str = "0"

    # 需要根据环境变量动态指定，因为部署时环境变量会动态通过 REIDSHOST 和 REDISPORT 来指定
    # REDIS_SENTINEL_HOST: str = 'proton-redis-proton-redis-sentinel.resource'
    # REDIS_SENTINEL_PORT: str = "26379"

    @computed_field
    @property
    def REDIS_SENTINEL_HOST(self) -> str:
        if self.REDISCLUSTERMODE == "sentinel":
            return self.REDISHOST
        return "proton-redis-proton-redis-sentinel.resource"

    @computed_field
    @property
    def REDIS_SENTINEL_PORT(self) -> str:
        if self.REDISCLUSTERMODE == "sentinel":
            return self.REDISPORT
        return "26379"


    def __str__(self):
        val =[f"{k}: {v}" for k, v in self.model_dump().items()]
        
        return "\n".join(val)


_settings = DIPSettings()

def get_settings() -> DIPSettings:
    return _settings

def set_value(key, value):
    if hasattr(_settings, key):
        setattr(_settings, key, value)
    else:
        raise ValueError(f"Key {key} not found in settings")
