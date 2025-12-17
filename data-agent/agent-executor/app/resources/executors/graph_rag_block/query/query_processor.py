import re
from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.strategy import (
    QueryStrategy,
    DefaultStrategy,
)
from app.resources.executors.graph_rag_block.query.query_entity_extraction import (
    QueryEntityExtraction,
)


class QueryRewriter:
    def __init__(self, rewrite_type) -> None:
        self.rewrite_type = rewrite_type

    async def ado_rewrite(self, query):
        if self.rewrite_type == "as_query_rewrite":
            pattern = r"(?:^|[\u4e00-\u9fff])([a-zA-Z]+)"
        query_text = query
        matches = re.findall(pattern, query_text)
        name_map_es = {
            "as": "AnyShare",
            "ab": "AnyBackup",
            "ad": "AnyData",
            "af": "AnyFabric",
            "ar": "AnyRobot",
        }
        for match in matches:
            if match.lower() in ["as", "ab", "af", "ar", "ad"]:
                query_text = query_text.replace(match, name_map_es[match.lower()])
        return query_text


class QueryProcessor:
    def __init__(self, strategy: DefaultStrategy, props, inputs) -> None:
        self.query_strategy: QueryStrategy = strategy.query_strategy
        self.switch = self.query_strategy.switch
        self.props = props
        self.inputs = inputs
        self.output_field = props["kg"][0]["output_fields"]
        self.entity_extractor = QueryEntityExtraction(
            llm_config=props["llm_config"], headers=props["headers"]
        )  # 初始化

        if self.switch:
            if self.query_strategy.query_augmentation_strategies:
                pass
            if self.query_strategy.query_understand_strategies:
                pass
            if self.query_strategy.query_rewriting_strategies:
                self.query_rewriter = QueryRewriter(
                    self.query_strategy.query_rewriting_strategies
                )

    async def ado_query(self, task: Task):
        origin_query = task.get_origin_query
        if self.switch:
            rewritten_query = self.query_rewriter.ado_rewrite(origin_query)
            task.set_attr("rewritten_query", rewritten_query)
        else:
            task.set_attr("origin_query", origin_query)

        entity_extraction_query = await self.entity_extractor.ado_entity_extraction(
            self.inputs, self.props, task
        )
        if entity_extraction_query:
            task.set_attr("entity_extraction_query", entity_extraction_query)
