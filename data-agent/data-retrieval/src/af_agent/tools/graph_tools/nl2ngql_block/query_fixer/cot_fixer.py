from .prompt import prompt_generate_nGQL_fix
from af_agent.tools.graph_tools.common.stand_log import StandLogger
from af_agent.tools.graph_tools.utils.llm import llm_chat


class CoTFixer():
    def __init__(self):
        pass

    async def generate(self, intermediate_result, messages, queries_fix):

        # 实现 CoT 方法生成 SQL 查询
        response = await self._generate(intermediate_result, messages, queries_fix)
        return response
    async def _generate(self, intermediate_result, messages, queries_fix):
        inner_llm = intermediate_result.inner_llm
        question = intermediate_result.query
        content = prompt_generate_nGQL_fix.format(question=question, ngql=queries_fix["executed_res"])
        messages.append({"role": "user", "content": content})
        response = await llm_chat(inner_llm, messages)
        messages.append({"role": "assistant", "content": response})
        StandLogger.debug("cot fix generator response：{}".format(response))
        response = response.split("cypher:")[-1].strip()
        return response