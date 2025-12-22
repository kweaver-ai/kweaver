import json, aiohttp, yaml
from .prompt import prompt_generate_nGQL, prompt_generate_nGQL_with_history, retrieval_content
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.utils.llm import llm_chat
class CoTGenerator:
    def __init__(self, params=None):
        self.database_schema = None

    async def generate(self, intermediate_result):

        # 实现 CoT 方法生成 SQL 查询
        response = await self._query_generate(intermediate_result)
        return response

    async def _query_generate(self, intermediate_result):
        question = intermediate_result.query
        if intermediate_result.rewrite_query:
            rewrite_question = "问题补全: " + intermediate_result.rewrite_query
        else:
            rewrite_question = ""
        schema = intermediate_result.schema
        background = intermediate_result.background
        schema = yaml.dump(schema, sort_keys=False, allow_unicode=True)
        inner_llm = intermediate_result.inner_llm
        other_variable = intermediate_result.retrieval_values.dict()
        retrieval_info = retrieval_content.format(schema=schema, background=background, **other_variable)
        if intermediate_result.retrieval:  # TODO 用其他参数触发
            content = prompt_generate_nGQL.format(question=question, rewrite_question=rewrite_question, retrieval_content=retrieval_info)

        else:
            content = prompt_generate_nGQL_with_history.format(question=question)

        intermediate_result.history.append({"role": "user", "content": content})
        # intermediate_result.history.append()
        # print(content)
        StandLogger.debug("cot generator prompt：{}".format(content))
        # messages = [{"role": "user", "content": content}]
        response = await llm_chat(inner_llm, intermediate_result.history)
        # response = await model_factory_service.call(model=inner_llm.get("name"),
        #                                             messages=messages,
        #                                             temperature=inner_llm.get("temperature", 0),
        #                                             stream=False,
        #                                             max_tokens=inner_llm.get("max_tokens", 5000),
        #                                             userid=inner_llm.get("userid", ""),
        #                                             top_k=inner_llm.get("top_k", 100),
        #                                             top_p=inner_llm.get("top_p"),
        #                                             presence_penalty=inner_llm.get("presence_penalty"))
        # intermediate_result.history = messages
        StandLogger.debug("cot generator response：{}".format(response))
        intermediate_result.history.append({"role": "assistant", "content": response})
        return {"response": response, "messages": intermediate_result.history}

