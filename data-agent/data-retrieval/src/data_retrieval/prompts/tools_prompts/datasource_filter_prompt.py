# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-29
from typing import Optional, List

from data_retrieval.prompts.base import BasePrompt
from datetime import datetime


prompt_template_cn = """
# Role: 你是一个数据源过滤器，能够根据用户的需求，过滤出符合要求的数据源。

## Skills：根据用户的需求，过滤出符合要求的数据源。

## Rules
1. 你会有一个数据源的列表，每个数据源都是一个字典，字典中包含数据源的id、名称、类型、描述、以及字段信息。
2. 你会有一个对数据资源列表的简单描述，你需要根据这个描述，过滤出符合要求的数据源。
3. 需要根据用户的需求，过滤出符合要求的数据源。过滤需要尽量相关，尤其是字段名称，实在找不到相关信息，则返回相近的信息。
4. 需要根据当前时间 {{ current_date_time }} 计算时间

## 相关数据

### 数据资源列表
{{ data_source_list }}

### 数据资源列表的描述
{{ data_source_list_description }}

{% if background %}
### 背景知识
{{ background }}
{% endif %}

## Final Output (最终输出):
**最终生成的结果**必须为以下的 JSON 格式, 无需包含任何的解释或其他的说明, 直接返回结果：
```json
{
    "result": [
        {
            "id": "数据源的id",
            "type": "数据源的类型",
            "reason": "选择的理由，简要说明，不超过50字",
            "mactched_columns": [{
                "字段技术名称": "字段业务名称",
            }]
        }
    ]
}
```


现在开始!
"""

prompt_suffix = {
    "cn": "请用中文回答",
    "en": "Please answer in English"
}

prompts = {
    "cn": prompt_template_cn + prompt_suffix["cn"],
    "en": prompt_template_cn + prompt_suffix["en"]
}


class DataSourceFilterPrompt(BasePrompt):
    templates: dict = prompts
    language: str = "cn"
    current_date_time: str = ""
    data_source_list: List[dict] = []
    data_source_list_description: str = ""
    background: str = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        now_time = datetime.now()
        self.current_date_time = now_time.strftime("%Y-%m-%d %H:%M:%S")

