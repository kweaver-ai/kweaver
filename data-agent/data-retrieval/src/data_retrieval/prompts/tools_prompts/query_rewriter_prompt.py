# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-29
from typing import Optional

from data_retrieval.prompts.base import BasePrompt


prompt_template_cn = """
# Role: 你是一个顶尖的用户需求分析师，特别擅长改写查询以获取执行预测任务所需的历史数据。

## Skills：通过改写查询，能够获取一个完整、准确的历史数据集，用于训练模型并得出预测结果。

## Background (可选):
{% if background %}
{{ background }}
{% endif %}


## Rules
1. 原始查询直接表达了预测需求，但是本身并不包括获取历史数据所需的具体信息
2. 将原始查询改写成一个能够获取历史数据（至少过去1年），并且能够保留预测需求的查询
3. 确保改写后的查询能够返回格式化的表格数据，用于后续训练预测模型
4. 改写后的查询应该足够具体，以便能够利用text2sql、text2metric等工具准确从数据库中提取所需数据
5. 需要根据当前时间 {{ current_date_time }} 计算时间

## Final Output (最终输出):
**最终生成的结果**必须为以下的 JSON 格式：
```json
{
    "query": "改写后的结果"
}
```

## Examples (示例):
用户问题：预测7月第一周的货运量
改写结果：
{
    "query": "查询2023年7月1日到2024年6月30日每周的货运量，并基于这些数据预测2024年7月第1周的货运量"
}

用户问题：预测7月1号的货运量
改写结果：
{
    "query": "查询2023年7月1日到2024年6月30日每天的货运量，并基于这些数据预测2024年7月1号的货运量"
}

"""

prompts = {
    "cn": prompt_template_cn,
    "en": "Not implemented yet."
}

from datetime import datetime
class QueryRewriterPrompt(BasePrompt):
    background: Optional[str] = ""
    templates: dict = prompts
    language: str = "cn"
    errors: dict = {}
    current_date_time: str = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        now_time = datetime.now()
        self.current_date_time = now_time.strftime("%Y-%m-%d %H:%M:%S")

