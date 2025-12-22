# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-26
from os import path
from datetime import datetime
from typing import Optional, List, Any

from data_retrieval.prompts.base import BasePrompt

with open(path.join(path.dirname(__file__), 'params_json.txt'), 'r', encoding='utf-8') as file:
    content = file.read()

func_description = content

prompt_template_en = """
Please call metric_query functions to assist with the user query.

And you have METRICs with DIMENSIONS listed below in markdown:
<data>
{{ indicators }}
</data>

METRIC function signatures within <tools></tools> XML tags, you need to generate the parameters for the function:
<tools>
##_func_description_##
</tools>

<operator>
| Operator | Symbol |
|----------|--------|
| Less than | < |
| Less than or equal to | <= |
| Greater than | > |
| Greater than or equal to | >= |
| Equal to | = |
| Not equal to | <> |
| Is null | null |
| Is not null | not null |
| Includes | include |
| Does not include | not include |
| Starts with | prefix |
| Does not start with | not prefix |
| In list | in list |
| Belongs to | belong |
| Is true (bool, field type tinyint) | true |
| Is false | false |
</operator>

For each query, return a json object of arguments:
{<args-json-object>}

{% if background %}
<background>
When generating results, you can refer frm the following background knowledge, which can be directly considered as part of the user's question:
{{ background }}
</background>
{% endif %}

**EXAMPLES:**
<examples>
Below is a complete parameter example for "metric_query" function, as your reference:

User question: Query the sales volume of a certain product in August 2013 by day
Generated parameters:
{
    "id": "...",
    "params": {
        "dimensions": [
            {
                "field_id": ...time_id..., // dimension id with original_data_type as date or timestamp
                "format": "day"
            }
        ],
        "filters": [
            {
                "field_id": "...product_id...",
                "operator": "=",
                "value": ["Product Name"]
            }
        ],
        "time_constraint": {
            "start_time": "2013-08-01 00:00:00",
            "end_time": "2013-08-31 23:59:59"
        }
    }
    "explanation": "Using '...' metric, grouped by '...' and '...' dimensions",
    "title": "Daily sales volume of a certain product in August 2013"
}
</examples>

**NOTICE:**

1. **Please double-check**, if the user does not specify a time dimension grouping method in the question (i.e., does not specify whether to group by day or month), **do not** set the time dimension and format in dimensions in params.
2. **Please double-check**, if time_constraint is set, do not add the same time dimension again in {params.dimensions} and {params.filters}.
3. **Please double-check**, ONLY select necessary dimensions to the {params.dimensions}.
4. Note that the current time is {{ current_date_time }}
5. If user asks what to query data in a certain period, you MAY NOT to drill down. eg: if user asks "Query data in August 2011", it's on month basis, DO NOT to query data in August 2011 by day (format: day).
{% if enable_yoy_or_mom %}
6. If user asks for period-over-period comparison, the time range in {params.time_constraint} is the latest statistical period, not the entire time range. For example: "2001 sales YoY", the time range is '2001-01-01 00:00:00 to 2001-12-31 23:59:59', not '2000-01-01 00:00:00 to 2001-12-31 23:59:59'
{% endif %}

{%- if errors  %}
Some error might happened last time. If possible, please correct them:
{{ errors }}
Correct them without changing the user's question intent.
{%- endif %}
""".replace("##_func_description_##", func_description) # use replace to prevent errors from jinja

prompt_template_cn = prompt_template_en + "\n请使用中文回答问题"

_DESC = {
    "explanation_format": {
        "cn": "使用'...'指标，按'...'维度分组，查询'...'",
        "en": "Using '...' metric, grouped by '...' dimension, querying '...'"
    }
}


prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_en
}


class Text2MetricPromptFunc(BasePrompt):
    """Text2Metric Prompt
    There are three variables in the prompt:
    - indicators: List[Any], the indicators that need to be analyzed
    - background: str, the background information
    - enable_yoy_or_mom: bool, whether to enable YoY or MoM analysis
    - explanation_format: str, the format of the explanation
    - language: str, the language of the prompt
    - errors: Optional[dict], the errors of the last prompt
    """
    indicators: List[Any]
    background: str = ""
    templates: dict = prompts
    language: str = "cn"
    current_date_time: str = ""
    enable_yoy_or_mom: bool = False
    explanation_format: str = ""
    errors: Optional[dict]
    name: str = "default-text2metric-with-func"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        now_time = datetime.now()
        self.current_date_time = now_time.strftime("%Y-%m-%d %H:%M:%S")
        self.explanation_format = _DESC["explanation_format"][self.language]


if __name__ == "__main__":
    # indiactor info
    # get https://10.4.109.236/api/indicator-management/v1/indicator/528138869825120136
    #
    # query:
    # post https://10.4.109.236/api/indicator-management/v1/indicator/query?id=528138869825120136
    #
    prompt = Text2MetricPromptFunc(
        indicators=[
            {
                "id": "525138889825120138",
                "name": "电脑外设销售额",
                "description": "电脑外设总销售额",
                "params": {
                    "analysis_dimensions": [
                        {
                            "field_id": "77988979-9207-4022-bf00-6a3933638e9b",
                            "business_name": "订单渠道",
                            "technical_name": "order_channel",
                            "original_data_type": "char"
                        },
                        {
                            "field_id": "7d1818b0-588c-441b-ba43-90efa866f749",
                            "business_name": "订单区域",
                            "technical_name": "order_area",
                            "original_data_type": "char"
                        },
                        {
                            "field_id": "db1f83cd-d11c-48df-8547-81949974fa49",
                            "business_name": "产品名称",
                            "technical_name": "product_name",
                            "original_data_type": "char"
                        },
                        {
                            "field_id": "3fe7824e-c431-42e4-9878-637e0075d7f2",
                            "business_name": "标准化订单时间",
                            "technical_name": "order_time",
                            "original_data_type": "timestamp"
                        },
                        {
                            "field_id": "e1af55cc-8369-4ff0-8ead-253af38b64af",
                            "business_name": "主键ID",
                            "technical_name": "id",
                            "original_data_type": "number"
                        },
                        {
                            "field_id": "10d93644-43a3-4e8c-be09-3e282d23e190",
                            "business_name": "标准化订单金额",
                            "technical_name": "order_amount",
                            "original_data_type": "number"
                        }
                    ]
                }
            }
        ],
        background="这是背景知识",
        enable_yoy_or_mom=True,
        language="cn"
    )

    prompt_str = prompt.render()
    print(prompt_str)
