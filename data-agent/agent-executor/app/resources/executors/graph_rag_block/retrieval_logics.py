from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.preprocess import PreProcessor
from app.resources.executors.graph_rag_block.strategy import StrategyProcessor
from app.resources.executors.graph_rag_block.query import QueryProcessor
from app.resources.executors.graph_rag_block.retrieve import RetrieveProcessor
from app.resources.executors.graph_rag_block.aggregation import AggregationProcessor
from app.resources.executors.graph_rag_block.augmentation import AugmentationProcessor
from app.resources.executors.graph_rag_block.ranking import RankingProcessor
from app.resources.executors.graph_rag_block.formattor import FormattorProcessor
from .strategy import DefaultStrategy


class GraphRAGRetrival:
    def __init__(self, inputs, props, aug_config, emb_desc_config):
        self.inputs = inputs  # query, entities, rule_answers
        self.aug_config = aug_config  # aug_config
        self.emb_desc_config = emb_desc_config
        self.task = Task(self.inputs)

        print(f"-------inputs:{inputs}---------\n")
        print(f"-------props:{props}---------\n")
        print(f"-------aug_config:{aug_config}---------\n")
        print(f"-------emb_desc_config:{emb_desc_config}---------\n")
        self.preprocessor = PreProcessor(self.inputs, props)

    async def async_init(self):
        self.props = await self.preprocessor.update_output_field(
            self.task, self.emb_desc_config
        )  # intent_recognization
        # self.long_context_concepts = await self.preprocessor.get_long_context_concepts()  # 初始化的时候获取 长文本concepts
        self.long_context_concepts = []
        self.strategy: DefaultStrategy = StrategyProcessor().load_strategy(
            self.task,
            self.props,
            self.aug_config,
            self.long_context_concepts,
            self.emb_desc_config,
        )
        self.query_processor = QueryProcessor(self.strategy, self.props, self.inputs)
        self.retrival_processor = RetrieveProcessor(self.strategy.retrieve_strategy)
        self.aggregation_processor = AggregationProcessor(
            self.strategy.aggregation_strategy
        )
        self.ranking_processor = RankingProcessor(self.strategy.ranking_strategy)
        self.augmentation_processor = AugmentationProcessor(
            self.strategy.augmentation_strategy
        )
        self.formattor_processor = FormattorProcessor(self.strategy.formattor_strategy)
        print(
            f"---------------------strategy :{self.strategy}--------------------------"
        )

    async def ado_graph_rag_retrival(self, as_auth_info=None):
        await self.query_processor.ado_query(self.task)

        retrieve_results = await self.retrival_processor.ado_retrieve(
            self.task, self.props, as_auth_info
        )
        # print(f'---------------------retrieve_results :{retrieve_results}--------------------------')
        for _, retrieve_result in enumerate(retrieve_results):
            if retrieve_result == "entity_neighbor_recall":
                continue
            elif isinstance(retrieve_result, list):
                answers, key_process = retrieve_result
                self.task.set_attr("path_sim_answers", answers)
                self.task.set_attr("path_sim_key_process", key_process)
            elif isinstance(retrieve_result, Exception):
                raise retrieve_result

        await self.aggregation_processor.ado_aggregation(self.task)
        await self.ranking_processor.ado_ranking(self.task)
        await self.augmentation_processor.ado_augmentation(self.task)
        await self.formattor_processor.ado_formattor(self.task)
        return self.task.get_attr("graph_retrieval_res")
