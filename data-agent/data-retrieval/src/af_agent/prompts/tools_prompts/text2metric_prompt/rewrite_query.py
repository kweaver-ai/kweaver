# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-3-19
from datetime import datetime
from typing import Optional, List, Any
import json

from af_agent.prompts.base import BasePrompt

prompt_template_cn = """
# ROLE
你的工作将根据用户的问题，重写指标查询语句，然后 AI 会根据你生成的指标查询语句，生成指标查询结果。

## INSTRUCTIONS

1. 所有的指标都可以看作是在特定【时间范围】内和一定【过滤条件】下，对特定【下钻维度】下的数据进行聚合后的结果。
2. 你需要做的是根据给定的指标描述和维度列表, 将用户的查询语句变成一个符合上述结构的指标查询语句。
3. 样例数据也很有用，可以参考样例数据来参考数据类型
4. 如果用户输入的是相对时间，需要根据当前时间进行计算，当前时间是：{{ current_date_time }}
5. 时间下钻条件支持按月、按季度、按照和按月，设定时通过 `()` 来标识，如 `维度(按月)`
6. 维度列表中可能会包含业务名称和技术名称，你选择时需要都给出，用 - 连接
7. 输出结果中的 `问题` 是原始问题，不要改写问题，不要省略任何关键信息，不要遗漏任何信息，尤其是问句中提到的实体，不要改变语义也不要进行翻译
8. 指标名称只用于选择指标，不要用于改写问题
9. 以 JSON 格式输出问题

例如：
- 问题：X事业部2014年业绩
- 给定的指标列表
    1. 业绩指标
        - 指标描述：业绩指标
        - 维度列表：[事业部-bu_name, 时间-time, ....]
    2. 利润指标
        - 指标描述：利润指标
        - 维度列表：[事业部-bu_name, 时间-time, ....]
- 样例数据:
    XXXX

- 输出:
```json
{
    "问题": "X事业部2014年业绩",
    "指标名称": "业绩指标",
    "下钻维度": "无",
    "时间范围": "2014-01-01 ~ 2014-12-31",
    "过滤条件": "事业部-bu_name = X事业部",
    "同环比": "无"
}
```

维度下钻是需要 **特别注意** 的，需要根据用户的问题选择是否需要选择下钻维度, 下钻维度支持多个:
1. 注意 "分别"、"分组"、"各是"、"各"这类关键词，需要设置下钻维度，比如: 2003年各产品的销量，1月份每天的销量
2. 如果用户的问题中提到了多个同类实体，且没有明确要求聚合，则设置筛选条件的同时还需要设置下钻维度，例如: 产品A和产品B在X时间段、不同事业部的销量，这时需要按照 `产品`、`事业部`、`时间`三个维度下钻，但是用户问X时间段产品A和产品B的销量在各事业部总和是多少，这时只需要按 `时间` 和 `事业部` 两个维度下钻

指标维度过滤支持很多的过滤条件，包含但不限于：
- 等于 =
- 不等于 <>
- 大于 >
- 小于 <
- 大于等于 >=
- 小于等于 <=
- 包含 in, 设置后，要考虑是否增加下钻
- 不包含 not in
- 为空 is null
- 不为空 is not null

指标计算支持同环比计算，支持增长值和增长率，且指标工具会自动计算长期时间，例如：
- 同比: 2014年同比, 则时间范围设置为 2014-01-01 ~ 2014-12-31, 指标查询工具会自己查询上一个周期的数据
- 环比: 2014年12月环比, 则时间范围设置为 2014-12-01 ~ 2014-12-31, 指标查询工具会自己查询上一个周期的数据

同环比类型支持: 同比、月环比、季度环比、天环比
同环比值支持: 增长值、增长率
支持同环比周期数: 例如2年前同期的数据, 则设置为2

## OUTPUT FORMAT

```json
{
    "问题": "原始问题",
    "指标名称": "选择的指标",
    "下钻维度": "下钻维度, 注意时间维度",
    "时间范围": "时间范围, 格式为 "开始时间 ~ 结束时间"，例如："2014-01-01 ~ 2014-12-31"
    "过滤条件": "过滤条件, 格式为 "维度名称 = 维度值" 的列表, 例如："事业部-bu_name = X事业部"
    "同环比": "同环比参数, 格式为 "同环比类型, 值类型, 间隔期数(可选)", 例如："月环比, 增长量 & 增长率, 间隔:3" 或 "季度环比, 增长率, 间隔:2" 或 "天环比, 增长率, 间隔:365"
}
```

## EXAMPLES

### 示例1

- 问题: X事业部2014年每个月同比业绩增长了多少
- 给定的指标列表
    1. 业绩指标
        - 指标描述：业绩指标
        - 维度列表：[事业部(bu_name), 时间(time), 产品(product_name)]
    2. 利润指标
        - 指标描述：利润指标
        - 维度列表：[事业部(bu_name), 时间(time), 产品(product_name)]
- 样例数据:
    XXXX

- 输出:
```json
{
    "问题": "X事业部2014年每个月同比业绩增长了多少",
    "指标名称": "业绩指标",
    "下钻维度": "无",
    "时间范围": "2014-01-01 ~ 2014-12-31",
    "过滤条件": "事业部-bu_name = X事业部",
    "同环比": "同比，增长值"
}
```

### 示例2

- 问题：X事业部2014年每个月Y产品环比利润增长了多少
- 给定的指标列表
    1. 业绩指标
        - 指标描述：业绩指标
        - 维度列表：[事业部(bu_name), 时间(time), 产品(product_name)]
    2. 利润指标
        - 指标描述：利润指标
        - 维度列表：[事业部(bu_name), 时间(time), 产品(product_name)]
- 样例数据:
    XXXX

- 输出:
```json
{
    "问题": "X事业部2014年每个月Y产品环比利润增长了多少",
    "指标名称": "利润指标",
    "下钻维度": "时间-time(按月)",
    "时间范围": "2014-01-01 ~ 2014-12-31",
    "过滤条件": "产品-product_name = Y产品",
    "同环比": "环比，增长率"
}
```

### 示例3

- 问题: 2014年X产品和Y产品在各事业部的销量
- 给定的指标列表
    XXXX
- 样例数据:
    XXXX

- 输出:
```json
{
    "问题": "2014年X产品和Y产品在各事业部的销量",
    "指标名称": "销量指标",
    "下钻维度": "产品-product_name, 事业部-bu_name",
    "时间范围": "2014-01-01 ~ 2014-12-31",
    "过滤条件": "产品-product_name = X产品 or 产品-product_name = Y产品",
    "同环比": "无"
}
```

## INPUT

下面是用户的问题：
{{ question }}

给定的指标列表：
{{ metrics }}

{% if background %}
生成的时候用的上，如果有知识增强的结果，而且你选择参考中一个或多个结果，必须严格匹配：
{{ background }}
{% endif %}

{% if sample_data %}
样例数据：
{{ sample_data }}
{% endif %}

下面开始生成你的输出，按要求输出，不需要输出任何额外的解释，越多信息就越容易干扰指标调用！

{{ suffix_command[language] }}

## 输出:

```json
"""

suffix_command = {
    "cn": "请用中文生成",
    "en": "Please generate in English"
}

prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_cn
}

class RewriteMetricQueryPrompt(BasePrompt):
    """RewriteMetricQuery Prompt
    There are three variables in the prompt:
    - metrics: dict, the metrics that need to be analyzed
    - question: str, the question
    - samples: list, the samples
    """
    metrics: Any = ""
    question: str = ""
    samples: list = []
    templates: dict = prompts
    language: str = "cn"
    name: str = "rewrite-query"
    current_date_time: str = ""
    background: str = ""
    suffix_command: dict = suffix_command

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        now_time = datetime.now()
        self.current_date_time = now_time.strftime("%Y-%m-%d %H:%M:%S")

        if isinstance(self.metrics, dict):
            self.metrics = json.dumps(self.metrics, ensure_ascii=False)
        elif isinstance(self.metrics, list):
            if len(self.metrics) > 0:    
                if isinstance(self.metrics[0], dict):
                    self.metrics = '\n'.join([ json.dumps(metric, ensure_ascii=False) for metric in self.metrics ])
                else:
                    self.metrics = '\n\n'.join(self.metrics)
            else:
                self.metrics = ""