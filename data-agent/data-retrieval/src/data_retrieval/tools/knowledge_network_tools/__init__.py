from data_retrieval.tools.knowledge_network_tools.rerank_tool import KnowledgeNetworkRerankTool
from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool

KNOWLEDGE_NETWORK_TOOLS_MAPPING = {
    "knowledge_rerank": KnowledgeNetworkRerankTool,
    "knowledge_retrieve": KnowledgeNetworkRetrievalTool,
}
