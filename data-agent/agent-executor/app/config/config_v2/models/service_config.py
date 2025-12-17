"""
服务地址相关配置
"""

from dataclasses import dataclass


@dataclass
class ServiceEndpoint:
    """服务端点配置"""

    host: str = ""
    port: str = ""


@dataclass
class ServicesConfig:
    """依赖服务配置"""

    # 模型相关服务
    mf_model_factory: ServiceEndpoint = None
    mf_model_manager: ServiceEndpoint = None
    mf_model_api: ServiceEndpoint = None

    # Agent相关服务
    agent_app: ServiceEndpoint = None
    agent_executor: ServiceEndpoint = None
    agent_factory: ServiceEndpoint = None
    agent_operator_integration: ServiceEndpoint = None
    agent_memory: ServiceEndpoint = None

    # 知识相关服务
    kn_data_query: ServiceEndpoint = None
    kn_knowledge_data: ServiceEndpoint = None
    dp_data_source: ServiceEndpoint = None
    search_engine: ServiceEndpoint = None

    # 搜索相关服务
    ecosearch: ServiceEndpoint = None
    ecoindex_public: ServiceEndpoint = None
    ecoindex_private: ServiceEndpoint = None
    docset_private: ServiceEndpoint = None
    datahub: ServiceEndpoint = None

    def __post_init__(self):
        """初始化默认值"""
        if self.mf_model_factory is None:
            self.mf_model_factory = ServiceEndpoint("mf-model-factory", "9898")
        if self.mf_model_manager is None:
            self.mf_model_manager = ServiceEndpoint("mf-model-manager", "9898")
        if self.mf_model_api is None:
            self.mf_model_api = ServiceEndpoint("mf-model-api", "9898")
        if self.agent_app is None:
            self.agent_app = ServiceEndpoint("agent-app", "30777")
        if self.agent_executor is None:
            self.agent_executor = ServiceEndpoint("agent-executor", "30778")
        if self.agent_factory is None:
            self.agent_factory = ServiceEndpoint("agent-factory", "13020")
        if self.agent_operator_integration is None:
            self.agent_operator_integration = ServiceEndpoint(
                "agent-operator-integration", "9000"
            )
        if self.agent_memory is None:
            self.agent_memory = ServiceEndpoint("agent-memory", "30790")
        if self.kn_data_query is None:
            self.kn_data_query = ServiceEndpoint("kn-data-query", "6480")
        if self.kn_knowledge_data is None:
            self.kn_knowledge_data = ServiceEndpoint("kn-knowledge-data", "6475")
        if self.dp_data_source is None:
            self.dp_data_source = ServiceEndpoint("dp-data-source", "8098")
        if self.search_engine is None:
            self.search_engine = ServiceEndpoint("kn-search-engine", "6479")
        if self.ecosearch is None:
            self.ecosearch = ServiceEndpoint("ecosearch", "32126")
        if self.ecoindex_public is None:
            self.ecoindex_public = ServiceEndpoint("ecoindex-public", "32129")
        if self.ecoindex_private is None:
            self.ecoindex_private = ServiceEndpoint("ecoindex-private", "32130")
        if self.docset_private is None:
            self.docset_private = ServiceEndpoint("docset-private", "32597")
        if self.datahub is None:
            self.datahub = ServiceEndpoint("datahubcentral-private", "")

    @classmethod
    def from_dict(cls, data: dict) -> "ServicesConfig":
        """从字典创建配置对象"""

        def get_endpoint(service_data: dict) -> ServiceEndpoint:
            return ServiceEndpoint(
                host=service_data.get("host", ""),
                port=str(service_data.get("port", "")),
            )

        return cls(
            mf_model_factory=get_endpoint(data.get("mf_model_factory", {})),
            mf_model_manager=get_endpoint(data.get("mf_model_manager", {})),
            mf_model_api=get_endpoint(data.get("mf_model_api", {})),
            agent_app=get_endpoint(data.get("agent_app", {})),
            agent_executor=get_endpoint(data.get("agent_executor", {})),
            agent_factory=get_endpoint(data.get("agent_factory", {})),
            agent_operator_integration=get_endpoint(
                data.get("agent_operator_integration", {})
            ),
            agent_memory=get_endpoint(data.get("agent_memory", {})),
            kn_data_query=get_endpoint(data.get("kn_data_query", {})),
            kn_knowledge_data=get_endpoint(data.get("kn_knowledge_data", {})),
            dp_data_source=get_endpoint(data.get("dp_data_source", {})),
            search_engine=get_endpoint(data.get("search_engine", {})),
            ecosearch=get_endpoint(data.get("ecosearch", {})),
            ecoindex_public=get_endpoint(data.get("ecoindex_public", {})),
            ecoindex_private=get_endpoint(data.get("ecoindex_private", {})),
            docset_private=get_endpoint(data.get("docset_private", {})),
            datahub=get_endpoint(data.get("datahub", {})),
        )


@dataclass
class ExternalServicesConfig:
    """外部服务配置"""

    # Embedding服务
    emb_url: str = ""
    embedding_dimension: int = 768

    # Rerank服务
    rerank_url: str = ""

    @classmethod
    def from_dict(cls, data: dict) -> "ExternalServicesConfig":
        """从字典创建配置对象"""
        return cls(
            emb_url=data.get("emb_url", ""),
            embedding_dimension=int(data.get("embedding_dimension", 768)),
            rerank_url=data.get("rerank_url", ""),
        )
