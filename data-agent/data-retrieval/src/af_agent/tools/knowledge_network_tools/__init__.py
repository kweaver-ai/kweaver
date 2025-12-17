from af_agent.tools.knowledge_network_tools.rerank_tool import KnowledgeNetworkRerankTool
from af_agent.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool

KNOWLEDGE_NETWORK_TOOLS_MAPPING = {
    "knowledge_rerank": KnowledgeNetworkRerankTool,
    "knowledge_retrieve": KnowledgeNetworkRetrievalTool,
}
