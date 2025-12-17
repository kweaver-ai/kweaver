# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-26
from datetime import datetime
from typing import Optional, List, Any
import json

from af_agent.prompts.base import BasePrompt

# 指标过滤条件
# | Operator | Symbol | Value Format |
# |----------|--------|--------------|
# | 小于 | < | ["str"] |
# | 小于或等于 | <= | ["str"] |
# | 大于 | > | ["str"] |
# | 大于或等于 | >= | ["str"] |
# | 等于 | = | ["str"] |
# | 不等于 | <> | ["str"] |
# | 为空 | null | [] |
# | 不为空 | not null | [] |
# | 包含 | include | ["str"] |
# | 不包含 | not include | ["str"] |
# | 开头是 | prefix | ["str"] |
# | 开头不是 | not prefix | ["str"] |
# | 在列表中 | in list | ["str","str","str"] |
# | 属于 | belong | ["str","str","str"] |
# | 为是 (bool，字段类型tinyint) | true | [] |
# | 为否 | false | [] |
# | 介于 | between | ["datetime","datetime"] | TODO: Prompt 中需要暂时屏蔽，可能出现意想不到的问题
prompt_template_cn = """# ROLE
根据用户的问题生成指标函数的参数, 通过设置下钻维度(dimensions)、过滤条件(filters)、时间约束(timeConstraint)、指标类型(Metrics)等参数, 生成指标查询参数，在不设置 dimensions、filters 时，默认查询所有维度。

## INSTRUCTIONS

指标函数有三个参数:
- id: 指标唯一标识
- params: 指标查询参数，是一个 JSON 对象
- explanation: 对选择的指标和参数的解释
- title: 指标查询结果的标题

### 数据说明

可用指标的基本信息是一个 markdown 表格，以及 指标的维度 dimensions，也是 markdown 格式，使用时请确保 ID 正确:

{{ indicators }}

信息说明：
- id: 指标唯一标识, 为一个字符串
- name: 指标名称
- description: 指标描述
- refer_view_name: 引用的表

dimensions, 指标可供分组或下钻的维度
   - field_id: 字段唯一标识
   - business_name: 业务名称, 和用户问题对应
   - technical_name: 技术名称，数据库中字段名
   - original_data_type: 字段数据类型

{% if samples %}
### 样例数据

下面是指标引用数据的样例，样例仅供参考，**不要** 用于生成答案:

{{ samples }}

请注意样例数据中的前缀、后缀、空格、特殊符号、数值类型等，生成参数时请参考

{% endif %}

### 任务0: 生成标题

根据问题生成数据的标题, 格式如下:
{
    "title": "... 对于数据的简要描述 ... "
}
   
### 任务1: 选择指标

根据用户的问题选择一个合适的指标，指标的 id 为指标的唯一标识

**注意**:
1. 一次只能选择一个指标
2. 指标名称只用于选择指标，不要用于改写问题和辅助理解问题

### 任务2: 生成指标查询参数 param

#### 任务2.1: 设置时间约束

根据用户的问题设置时间约束，是一个时间范围，必须要生成，不能为空

例如, 查询8月份的数据, 假设当前时间是 2014 年
时间约束设置为
"time_constraint": {
    "start_time": "2014-08-01 00:00:00",
    "end_time": "2014-08-31 23:59:59"
}

当用户问题中没有提到日期，或包含相对时间时，需要根据当前时间 {{ current_date_time }} 计算时间约束，例如：1月（当年）、Q1、上周等


#### 任务2.2: 选择分组或下钻维度

根据用户问题选择分组或下钻维度 dimensions, 可以为空数组 []
dimensions 数组中的 JSON 对象结构如下：

{
    "field_id": 下钻维度 ID,
    "original_data_type": 下钻维度的数据类型,
    "format": 日期下钻方式，只有当 original_data_type 为 date 或 timestamp 时，才需要设置，且必须设置
}


注意：
1. 回答用户问题时，更加倾向于维度的聚合而不是下钻，即当用户没有提到额外的下钻维度时，不需要添加额外的或更细粒度的下钻维度
2. 注意用户问题中的关键词，如问题中涉及: "各产品" | "每月" | "各区域" | "各产品" | "分别" | "各" 是多少, 需要基于产品、时间、区域等维度进行下钻。请仔细分析指标维度
3. 如果需要按时间下钻，支持的 format 如下:

 - year: 按年
 - quarter: 按季度
 - month: 按月
 - week: 按周
 - day: 按日

4. 如果问题中提到了多个同类实体，且没有要求聚合，大概率需要下钻，例如: 产品A和产品B的销量是多少，这时需要按照产品维度下钻，但是用户问产品A和产品B的销量和是多少，这时不需要下钻
5. 特别注意, original_data_type 为 char 类型的维度 **绝对不能设置 format**, 否则系统会出错。

#### 正确的例子

例子：每个月X销售区域的指标如何

正确的参数: format 对应 时间维度
[
    {
        "field_id": ...时间维度...
        "original_data_type": "date" | "datetime" | "timestamp",
        "format": "month"
    },
    {
        "field_id": ...销售区域维度...,
        "original_data_type": "char" | "varchar"
    }
]

#### 错误的样例

**不要参考**!!

例子：每个月X销售区域的指标如何

生成的参数:
[
    {
        "field_id": ...销售区域维度...,
        "original_data_type": "char" | "varchar",
        "format": "month"
    }
]
错误的原因为: 没有选择时间维度，且选择了类型为 char 并设置了 format:

#### 任务2.3: 设置过滤条件

设置过滤条件 filters, 是一个JSON数组, 每个条件包含 field_id、operator 和 value:

| Operator | Symbol | Value Format |
|----------|--------|--------------|
| 小于 | < | ["str"] |
| 小于或等于 | <= | ["str"] |
| 大于 | > | ["str"] |
| 大于或等于 | >= | ["str"] |
| 等于 | = | ["str"] |
| 不等于 | <> | ["str"] |
| 为空 | null | [] |
| 不为空 | not null | [] |
| 包含 | include | ["str"] |
| 不包含 | not include | ["str"] |
| 开头是 | prefix | ["str"] |
| 开头不是 | not prefix | ["str"] |
| 在列表中 | in list | ["str","str","str"] |
| 属于 | belong | ["str","str","str"] |
| 为是 (bool, 字段类型tinyint) | true | [] |
| 为否 | false | [] |

例如：问题是"XX产品的销售情况"，则要选择产品名称维度，并设置产品名称，条件如下：
"filters": [
    {
        "field_id": "...id_of_product_name...",
        "operator": "=",
        "value": ["XX产品"]
    }
],

**注意**:
1. time_constraint 中已经设置过的时间条件，如果没有特殊说明，请不要在 filters 中再添加
2. 如果不需要设置过滤条件 filters, 请设置为空数组 []
3. 生成某些字段过滤条件的 value 时，如果输入文本如果有特殊符号或者空格，需要考虑分词，例如：产品名称 为 XX产品 或 `XX产品`，生成条件需要整个考虑
4. 生成某些字段过滤条件的 value 时，考虑输入内容的前缀、后缀等，结合样例数据来生成
5. 不需要设置问题中没有涉及的维度和值来作为过滤条件

{% if enable_yoy_or_mom %}
#### 任务2.4: 生成同比环比参数

识别问题中是否需要进行同比环比值和比率计算，如果需要，请生成 metrics 参数, 如果没有明确要求计算同环比，则不需要生成，metrics 是一个JSON对象, 格式如下:

"metrics": {
    "type": ... type of metrics,
    "interval": ... interval of metrics
}

其中:

- type: 字符串, 从数组中选择 "yoy" | "mom" | "qoq" | "dod", 分别是同比、月环比、季度环比、天环比
- interval: 整数, 默认为1, 表示同比或环比的间隔为1, 根据用户问题设置, 比如用户想计算"2年前同期的数据", 则设置为2

**注意**:

1. 如果用户没有明确要求计算同比或者环比，比如分别计算不同周期的数据，则不需要生成 metrics 参数
2. 如果问题中要计算同比或者环比，必须设置 type
3. 生成同比或者环比时，时间范围是最近的一个统计周期，而非全部时间范围, 例如：2001年销量同比，时间范围是 '2001-01-01 00:00:00 到 2001-12-31 23:59:59' 而非 '2000-01-01 00:00:00 到 2001-12-31 23:59:59'
{% endif %}

## Examples

下面给出完整的参数示例

用户问题: 按天来查询2013-08月某产品的销量
生成的参数：

{
    "id": "...",
    {
        "dimensions": [
            {
                "field_id": ...procduct_id...,
            },
            {
                "field_id": ...time_id..., // original_data_type 为 date 或 timestamp 的维度id
                "format": "day"
            }
        ],
        "filters": [
            {
                "field_id": "...product_id...",
                "operator": "=",
                "value": ["产品名称"]
            }
        ],
        "time_constraint": {
            "start_time": "2013-08-01 00:00:00",
            "end_time": "2013-08-31 23:59:59"
        }
    }
    "explanation": "使用 '...' 指标，按 '...' 和 '...' 维度分组",
    "title": "某产品2013-08月每日销量"
}

{% if background %}
## Background Knowledge

生成结果时可参考以下背景知识，可以直接认为是用户提问的一部分：
{{ background }}
{% endif %}

## Output Instructions

请返回一个JSON对象, 请不要使用上面的例子, 包含以下Key:

1. id: 选择的指标id, 注意一次只能选择一个指标，不选则设置为空
2. params: 指标查询参数
3. explanation: 对选择的指标和参数的解释。解释应包含选择的指标、维度、过滤条件和时间约束
4. title: 生成数据的标题

示例输出：
{
    "id": "...",
    "params": ...,
    "explanation": "...",
    "title": "..."
}

### 任务3: 生成解释

根据问题 生成 查询条件 生成解释, 格式如下:
{
    "explanation": "使用 '...' 指标，按 '...' 维度下钻，查询 '...'"
}

### 特别注意事项

1. 检查选择指标的正确性，如果找不到合适的指标, id 请填写空字符串，并在 explanation 中说明“有哪些指标可用”
2. **请再次检查**, {params.dimensions} ID 正确, 且 **不存在** 设置了 format 且 original_data_type 为 char 的维度
3. **请再次检查**, 如果 {params.time_constraint} 中 已经设置了时间，就不需要在 {params.filters} 中再添加时间维度
4. **请再次检查**, {params.dimensions} 中只有用户提到的维度, 没有缩小分组或下钻粒度, 没有增加不必要的维度
5. **请再次检查**, {params.time_constraint} 的时间范围是否正确，千万要注意当前时间 {{ current_date_time }}
{% if enable_yoy_or_mom %}
6. 生成同比或者环比时 {params.time_constraint} 的时间是最近的一个统计周期，而非完整时间范围
{% endif %}

{%- if errors  %}

## LAST ERROR
以下是上一次生成的参数和执行结果，如果可能请纠正:
{{ errors }}
纠正问同时不要改变用户问题的意图
{%- endif %}

必须按 `Output Instructions` 定义的 JSON 格式输出!

开始！
"""


suffix_command = {
    "cn": "请用中文回答问题",
    "en": "Please answer the question in English"
}

prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_cn + "\n" + suffix_command["en"]
}


class Text2MetricPrompt(BasePrompt):
    """Text2Metric Prompt
    There are three variables in the prompt:
    - indicators: dict, the indicators that need to be analyzed
    - background: str, the background information
    """
    indicators: Any = ""
    samples: list = []
    background: str = ""
    templates: dict = prompts
    language: str = "cn"
    current_date_time: str = ""
    enable_yoy_or_mom: bool = False
    errors: Optional[dict]
    name: str = "default-text2metric"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        now_time = datetime.now()
        self.current_date_time = now_time.strftime("%Y-%m-%d %H:%M:%S")

        if isinstance(self.indicators, dict):
            self.indicators = json.dumps(self.indicators, ensure_ascii=False)
        elif isinstance(self.indicators, list):
            if len(self.indicators) > 0:    
                if isinstance(self.indicators[0], dict):
                    self.indicators = '\n'.join([ json.dumps(indicator, ensure_ascii=False) for indicator in self.indicators ])
                else:
                    self.indicators = '\n\n'.join(self.indicators)
            else:
                self.indicators = ""


if __name__ == "__main__":
    # indiactor info
    # get https://10.4.109.236/api/indicator-management/v1/indicator/528138869825120136
    #
    # query:
    # post https://10.4.109.236/api/indicator-management/v1/indicator/query?id=528138869825120136
    #
    prompt = Text2MetricPrompt(
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
        samples=[
            {
                "refer_view_name": "订单渠道",
                "sample_data": [
                    {"order_channel": "线上"},
                    {"order_channel": "线下"},
                    {"order_channel": "其他"}
                ]
            }
        ],
        background="",
        enable_yoy_or_mom=True
    )

    prompt_str = prompt.render()
    print(prompt_str)
