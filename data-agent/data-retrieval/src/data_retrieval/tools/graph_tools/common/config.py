import ipaddress
import logging
import os


class ConfigClass:
    DEBUG = False
    # app相关
    HOST_IP = os.getenv("HOST_IP", "0.0.0.0")
    if isinstance(ipaddress.ip_address(HOST_IP), ipaddress.IPv6Address):
        HOST_IP = "::"
    else:
        HOST_IP = "0.0.0.0"
    APP_PORT = int(os.getenv("PORT", 30778))
    HOST_PREFIX = "/api/agent-executor/v1"
    RPS_LIMIT = int(os.getenv("RPS_LIMIT", 100))
    ENABLE_SYSTEM_LOG = os.getenv("ENABLE_SYSTEM_LOG", "true")
    APP_ROOT = os.path.dirname(os.path.dirname(__file__))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "debug").lower()

    # 结构化数据库相关
    RDSHOST = os.getenv("RDSHOST")
    RDSPORT = int(os.getenv("RDSPORT", "3330"))
    RDSDBNAME = os.getenv("RDSDBNAME")
    RDSUSER = os.getenv("RDSUSER")
    RDSPASS = os.getenv("RDSPASS")

    # redis数据库相关
    REDISCLUSTERMODE = str(os.getenv("REDISCLUSTERMODE", ""))
    REDISHOST = os.getenv("REDISHOST", "")
    REDISREADHOST = os.getenv("REDISREADHOST", "")
    REDISREADPORT = os.getenv("REDISREADPORT", "")
    REDISREADUSER = os.getenv("REDISREADUSER", "")
    REDISREADPASS = str(os.getenv("REDISREADPASS", ""))
    REDISWRITEHOST = os.getenv("REDISWRITEHOST", "")
    REDISWRITEPORT = os.getenv("REDISWRITEPORT", "")
    REDISWRITEUSER = os.getenv("REDISWRITEUSER", "")
    REDISWRITEPASS = str(os.getenv("REDISWRITEPASS", ""))
    REDISPORT = os.getenv("REDISPORT", "")
    REDISUSER = os.getenv("REDISUSER", "")
    REDISPASS = str(os.getenv("REDISPASS", ""))
    SENTINELMASTER = str(os.getenv("SENTINELMASTER", ""))
    SENTINELUSER = str(os.getenv("SENTINELUSER", ""))
    SENTINELPASS = str(os.getenv("SENTINELPASS", ""))

    # 图数据库相关
    GRAPHDB_HOST = os.getenv("GRAPHDB_HOST", "")
    GRAPHDB_PORT = os.getenv("GRAPHDB_PORT", "")
    GRAPHDB_READ_ONLY_USER = os.getenv("GRAPHDB_READ_ONLY_USER", "")
    GRAPHDB_READ_ONLY_PASSWORD = os.getenv("GRAPHDB_READ_ONLY_PASSWORD", "")

    # opensearch
    OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "")
    OPENSEARCH_PORT = os.getenv("OPENSEARCH_PORT", "")
    OPENSEARCH_USER = os.getenv("OPENSEARCH_USER", "")
    OPENSEARCH_PASS = os.getenv("OPENSEARCH_PASS", "")

    # 依赖的服务地址
    # AD
    HOST_MF_MODEL_FACTORY = "mf-model-factory"
    PORT_MF_MODEL_FACTORY = "9898"
    
    # DIP
    HOST_MF_MODEL_API = "mf-model-api"
    PORT_MF_MODEL_API = "9898"

    # 依赖的外部接入的服务
    EMB_URL = os.getenv("EMB_URL", "")
    EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 768))
    RERANK_URL = os.getenv("RERANKER_URL", "")



    # DEBUG = True
    if DEBUG:
        # DIPHOST = "10.4.110.92"
        DIPHOST = "192.168.167.13"
        # DIPHOST = "192.168.232.11"
        # DIPHOST = "192.168.188.29"

        # 结构化数据库相关
        RDSHOST = DIPHOST
        RDSPORT = 3330
        RDSDBNAME = "anydata"
        RDSUSER = "root"

        RDSPASS = ""

        # 依赖的服务地址
        HOST_MF_MODEL_FACTORY = DIPHOST
        HOST_MF_MODEL_API = DIPHOST
        PORT_MF_MODEL_API = "19898"
        HOST_KN_DATA_QUERY = DIPHOST
        HOST_KN_KNOWLEDGE_DATA = DIPHOST
        HOST_DP_DATA_SOURCE = DIPHOST
        # HOST_DP_DATA_SOURCE = "10.4.110.188"
        PORT_DP_DATA_SOURCE = "38098"
        HOST_SEARCH_ENGINE = DIPHOST
        HOST_AGENT_FACTORY = DIPHOST
        PORT_AGENT_FACTORY = "32020"
        HOST_AGENT_APP = DIPHOST
        PORT_AGENT_APP = "30777"
        HOST_AGENT_EXECUTOR = "localhost"
        HOST_AGENT_OPERATOR_INTEGRATION = DIPHOST
        # HOST_AGENT_OPERATOR_INTEGRATION = '10.4.175.99'
        PORT_AGENT_OPERATOR_INTEGRATION = "39000"
        HOST_ECOSEARCH = DIPHOST
        PORT_ECOSEARCH = "32126"
        HOST_ECOINDEX_PUBLIC = DIPHOST
        # 依赖的外部接入的服务


        EMB_URL = "http://192.168.152.11:18302/v1/embeddings"
        # EMB_URL = f"http://{DIPHOST}:9898/api/private/mf-model-api/v1/small-model/embedding"


        # RERANK_URL = "http://192.168.152.11:8343/v1/reranker"
        RERANK_URL = "http://192.168.152.11:18343/v1/rerank"
        # RERANK_URL = "http://192.168.102.250:8302/v1/rerank"

        # redis数据库相关
        REDISHOST = DIPHOST
        REDISCLUSTERMODE = "master-slave"
        REDISREADHOST = DIPHOST
        REDISREADPORT = 6379
        REDISREADUSER = "root"
        REDISREADPASS = ""
        REDISWRITEHOST = DIPHOST
        REDISWRITEPORT = 6379
        REDISWRITEUSER = "root"
        REDISWRITEPASS = ""
        REDISHOST = DIPHOST
        REDISPORT = 6379
        REDISUSER = "root"
        REDISPASS = ""
        
        # 图谱opensearch
        OPENSEARCH_HOST = DIPHOST
        OPENSEARCH_PORT = "9200"
        OPENSEARCH_USER = "admin"
        OPENSEARCH_PASS = ""

        # Nebula
        GRAPHDB_HOST = DIPHOST
        # GRAPHDB_HOST = "10.4.134.253"
        GRAPHDB_PORT = "9669"
        GRAPHDB_READ_ONLY_USER = "anydata"
        # GRAPHDB_READ_ONLY_USER = 'root'
        GRAPHDB_READ_ONLY_PASSWORD = ""
        # GRAPHDB_READ_ONLY_PASSWORD = 'Driver@13'

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(ConfigClass, key, value)


Config = ConfigClass()


class BuiltinIdsConfig:
    """内置Agent和工具的ID配置类"""

    def __init__(self):
        # 内置Agent的ID配置
        # 这些ID在执行初始化脚本后会得到具体的值
        self.agent_ids = {
            "deepsearch": "deepsearch",
            "DocQA_Agent": "DocQA_Agent",
            "GraphQA_Agent": "GraphQA_Agent",
            "OnlineSearch_Agent": "OnlineSearch_Agent",
            "Plan_Agent": "Plan_Agent",
            "SimpleChat_Agent": "SimpleChat_Agent",
            "Summary_Agent": "Summary_Agent",
        }

        # 内置工具的ID配置
        self.tool_ids = {
            "zhipu_search_tool": "zhipu_search_tool",
            "check": "check",
            "doc_qa": "doc_qa",
            "graph_qa": "graph_qa",
            "pass": "pass",
            "search_file_snippets": "search_file_snippets",
            "get_file_full_content": "get_file_full_content",
            "process_file_intelligent": "process_file_intelligent",
            "get_file_download_url": "get_file_download_url"
        }

        self.tool_box_ids = {
            "搜索工具": "搜索工具",
            "数据处理工具": "数据处理工具",
            "文件处理工具": "文件处理工具",
        }

    def get_agent_id(self, agent_name):
        """获取指定Agent的ID"""
        return self.agent_ids.get(agent_name, "")

    def get_tool_id(self, tool_name):
        """获取指定工具的ID"""
        return self.tool_ids.get(tool_name, "")

    def get_tool_box_id(self, tool_box_name):
        """获取指定工具箱的ID"""
        return self.tool_box_ids.get(tool_box_name, "")

    def set_agent_id(self, agent_name, agent_id):
        """设置指定Agent的ID"""
        self.agent_ids[agent_name] = agent_id

    def set_tool_id(self, tool_name, tool_id):
        """设置指定工具的ID"""
        self.tool_ids[tool_name] = tool_id

    def set_tool_box_id(self, tool_box_name, tool_box_id):
        """设置指定工具箱的ID"""
        self.tool_box_ids[tool_box_name] = tool_box_id

    def get_all_agent_ids(self):
        """获取所有Agent的ID"""
        return self.agent_ids.copy()

    def get_all_tool_ids(self):
        """获取所有工具的ID"""
        return self.tool_ids.copy()

    def get_all_tool_box_ids(self):
        """获取所有工具箱的ID"""
        return self.tool_box_ids.copy()

# 创建内置ID配置实例
BuiltinIds = BuiltinIdsConfig()

# if Config.DEBUG:

#     BuiltinIds.set_tool_id("zhipu_search_tool", "fc0fa6cf-dbaf-481a-937d-133a5646800c")
#     BuiltinIds.set_tool_id("doc_qa", "1b3bdd0e-c9f1-4cb4-ae3e-22f8b3d4eab7")
#     BuiltinIds.set_tool_id("graph_qa", "981ee9e2-8141-4637-8713-99788f6d480c")
#     BuiltinIds.set_tool_id("process_file_intelligent", "c95aba5c-10a6-4cdb-b12c-41147f705ccd")

#     BuiltinIds.set_tool_box_id("搜索工具", "071ab02e-28df-4f07-93c1-3b5942850217")