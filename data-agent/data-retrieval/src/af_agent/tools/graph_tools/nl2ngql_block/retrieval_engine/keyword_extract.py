import json, aiohttp
from .prompt import keyword_schema, prompt_extract_keywords
from af_agent.tools.graph_tools.common.stand_log import StandLogger
from af_agent.tools.graph_tools.utils.llm import llm_chat

class KeywordsExtract:
    def __init__(self):
        # 初始化向量检索算法，例如LSH
        pass

    async def extract(self, intermediate_result):

        # 使用LLM和少量示例来识别问题中的关键词
        keywords = await self._extract_keywords(intermediate_result)
        return keywords

    async def _extract_keywords(self, intermediate_result):
        query = intermediate_result.query
        schema = intermediate_result.schema
        inner_llm = intermediate_result.inner_llm
        background = intermediate_result.background
        # 提取关键词的逻辑
        content = prompt_extract_keywords.format(keyword_schema=keyword_schema, schema=schema, background=background, question=query)
        StandLogger.debug("cot generator prompt：{}".format(content))
        intermediate_result.history.append({"role": "user", "content": content})
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
        intermediate_result.history.append({"role": "assistant", "content": response})
        try:
            # response = response.replace("keywords:", "").replace("```", "").replace("json", "")
            # response = response.replace(response.split("}")[-1], "")
            response = response.replace("```", "").replace("json", "")
            keywords = eval(response.strip())
        except:
            StandLogger.warn("抽取关键词格式错误:{}".format(response))
            keywords = {}
        StandLogger.debug("关键词抽取response：{}".format(response))
        return keywords
