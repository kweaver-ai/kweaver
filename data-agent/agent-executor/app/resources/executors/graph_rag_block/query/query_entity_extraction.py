import copy
import json
import re

from app.common.stand_log import StandLogger
from app.driven.dip.model_api_service import model_api_service
from app.resources.executors.graph_rag_block.task import Task
from app.domain.enum.common.user_account_header_key import get_user_account_id


class QueryEntityExtraction:
    def __init__(self, llm_config: dict, headers: dict):
        self.llm_model_name = llm_config.get("llm_model_name")
        self.user_id = get_user_account_id(headers) or "fake-user-id"

        self.model_args = copy.deepcopy(llm_config)
        self.model_args.pop("id") if "id" in self.model_args else None
        self.model_args.pop("name") if "name" in self.model_args else None
        self.model_args.pop("icon") if "icon" in self.model_args else None
        self.model_args.pop("llm_id") if "llm_id" in self.model_args else None
        self.model_args["max_tokens"] = 50
        self.model_args["top_p"] = 0.95

    async def post_process_query(self, query, resposne, query_entity_remove_list):
        new_query = ""
        try:
            cleaned_content = resposne.strip("```json").strip("```").strip()
            arguments = json.loads(cleaned_content)
        except:
            new_query = query

        try:
            if not new_query and arguments:
                value_list = []
                pattern = "|".join(map(re.escape, query_entity_remove_list))
                for _, value in arguments.items():
                    new_value = re.sub(pattern, "", value).strip()
                    if new_value:
                        value_list.append(new_value)
                new_query = " ".join(list(set(value_list)))
            else:
                new_query = query
        except:
            new_query = query
        return new_query

    async def ado_entity_extraction(self, inputs, props: str, task: Task):
        query = inputs["query"]
        StandLogger.info_log(f"Extracting query entities...: {query}")

        query_entity_remove_list = task.get_attr("query_entity_remove_list")
        entity_map = task.get_attr("query_entity_map")

        entity_extraction_query = ""
        if entity_map and query_entity_remove_list:
            entity_map = json.dumps(entity_map, ensure_ascii=False)
            content = f"""是一个信息抽取专家，擅长抽取用户问题中的关键信息。
            用户问题：{query}

            # 限制
            1. 根据entity_map抽取关键词：
            entity_map信息如下：
            {entity_map}
            2. 抽取的关键词必须存在于用户问题中；
            3. 如果有人姓，只需要提取人名即可。

            # 输出格式限制
            抽取结果严格以字典的形式返回：key表示变量名，值为抽取出的关键词。
            不要返回任何额外说明信息。

            用户问题：{query}
            """
            messages = [{"content": content, "role": "user"}]
            response = await model_api_service.call(
                model=self.llm_model_name,
                messages=messages,
                temperature=self.model_args.get("temperature"),
                max_tokens=self.model_args.get("max_tokens"),
                userid=self.user_id,
                top_k=self.model_args.get("top_k"),
                top_p=self.model_args.get("top_p"),
                presence_penalty=self.model_args.get("presence_penalty"),
                frequency_penalty=self.model_args.get("frequency_penalty"),
            )
            entity_extraction_query = await self.post_process_query(
                query, response, query_entity_remove_list
            )
        return entity_extraction_query
