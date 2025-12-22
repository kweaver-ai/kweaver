import asyncio
import time
from .config import MethodConfig
from .value_retrieval import ValueRetrieval, BaseValueRetrieval
from .keyword_extract import KeywordsExtract
from .qq_retrieval import QuestionRuleRetrieval
from ..common.structs import RetrievalResponse
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger


class RetrievalEngine:
    def __init__(self):
        self.keywords_extract = KeywordsExtract()
        if MethodConfig.enable_value_retrieval:
            params = MethodConfig.value_retrieval.get("params")
            self.value_retrieval = ValueRetrieval(params)
        if MethodConfig.enable_qq_retrieval:
            params = MethodConfig.qq_retrieval.get("params")
            # self.qq_retrieval = QuestionVectorRetrieval(params)
            self.qq_retrieval = QuestionRuleRetrieval(params)

    async def retrieval(self, intermediate_result):
        # question = intermediate_result.query

        tasks = {}
        keywords = await self.keywords_extract.extract(intermediate_result)
        if MethodConfig.enable_value_retrieval:
            # 属性值检索
            tasks['value_retrievals'] = asyncio.create_task(self.value_retrieval.retrieval(intermediate_result, keywords))
        if MethodConfig.enable_qq_retrieval:
            # TODO 现在是命中生成模板，如A，D，返回A->D，后面考虑返回A->B->C->D，之间的路径也返回。
            # QQ match检索
            tasks['template_question_retrieval'] = asyncio.create_task(self.qq_retrieval.retrieval(intermediate_result, keywords))
        results = await asyncio.gather(*tasks.values())
        # 创建一个字典，将结果与对应的键关联起来
        retrieval_values = {}
        for key, result in zip(tasks.keys(), results):
            if isinstance(result, dict):
                for k, v in result.items():
                    if k in RetrievalResponse.model_fields:
                        retrieval_values[k] = v
            if key in RetrievalResponse.model_fields:
                retrieval_values[key] = result
        retrieval_values["keyword_retrieval"] = keywords
        # 使用字典来初始化 RetrievalResponse 对象
        retrieval_response = RetrievalResponse(**retrieval_values)

        return retrieval_response
    

class BaseRetrievalEngine:
    def __init__(self, params):
        self.params = params
        self.keywords_extract = KeywordsExtract()
        self.value_retrieval = BaseValueRetrieval(params)

    async def retrieval(self, intermediate_result):
        if self.params.get("keywords_extract"):
            keywords = await self.keywords_extract.extract(intermediate_result)
        else:
            keywords = {}
        result = await self.value_retrieval.retrieval(intermediate_result, keywords)
        return result


if __name__ == "__main__":
    pass
    # asyncio.run(main())
