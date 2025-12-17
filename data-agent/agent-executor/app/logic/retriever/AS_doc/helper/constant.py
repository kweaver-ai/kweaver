from enum import Enum


class HitType(Enum):
    ALL_HIT = "all_hit"
    ONLY_SPARSE = "only_sparse"
    ONLY_DENSE = "only_dense"


class EnvironmentMode(Enum):
    DEV = "DEV"
    DEV_TEST = "DEV_TEST"
    TEST = "TEST"
    PROD = "PROD"
    STAGING = "STAGING"
    DEBUG = "DEBUG"


class MessageRole(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Lang(Enum):
    zh_CN = "zh_CN"
    en_US = "en_US"
    zh_TW = "zh_TW"


class RetrieveSourceType(Enum):
    DOC_LIB = "doc_lib"  # AnyShare DocLib
    WIKIDOC = "wikidoc"  # wikidoc
    KG = "kg"  # knowledge graph
    ASBOT = "asbot"

    DOC_LIB_FOLDER = "doc_lib_folder"
    OPENSEARCH = "opensearch"  # opensearch
    DOC_SET = "doc_set"  # doc_set
    KC = "kc"  # knowledge center
    APP = "app"  # universal app api
    EXTERNAL = "external"  # universal external
    WEBSITE_HTML = "website"  # html
    RESTFUL_API = "restful_api"  # restful


class RetrieveMethod(Enum):
    DENSE_RETRIEVE = "dense_retrieve"
    SPARSE_RETRIEVE = "sparse_retrieve"
    KNOWLEDGE_GRAPH_RETRIEVE = "knowledge_graph_retrieve"
    API_RETRIEVE = "api_retrieve"


class RetrieveDataType(Enum):
    COMMON_DOCUMENT = "common_document"
    SINGLE_DOCUMENT = "single_document"
    IMAGE = "image"
    SPREADSHEET = "spreadsheet"
    FAQ_DOCUMENT = "faq"


class RetrieveDataGranularity(Enum):  # 检索到的数据粒度
    SLICE = "slice"  # 不需要进一步切片
    DOCUMENT = "docment"  # 需要进一步切片
