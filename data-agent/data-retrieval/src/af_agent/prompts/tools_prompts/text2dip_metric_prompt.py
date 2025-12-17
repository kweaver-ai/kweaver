# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-08-26
from datetime import datetime
from typing import Optional, List, Any
import json

from af_agent.prompts.base import BasePrompt
from af_agent.prompts.manager.base import BasePromptManager

# DIP 指标查询参数模板
dip_metric_prompt_template = """# ROLE
根据用户的问题生成指标查询参数, 通过设置查询参数生成指标查询请求，支持范围查询。
指标的意义是按照一定的分析维度/过滤条件在一定时间的条件下对数据进行聚合, 并查询结果

## INSTRUCTIONS

指标查询有两个主要的查询参数:
- metric_id: 指标唯一标识
- query_params: 指标查询参数，是一个 JSON 对象

还有三个解释性参数:
- explanation: 对选择的指标和参数的解释
- title: 指标查询结果的标题
- reason: 选择指标和参数的原因

### 数据说明

可用指标的基本信息是一个列表，包含指标的基本信息:

{{ metrics }}

信息说明：
- id: 指标唯一标识, 为一个字符串
- name: 指标名称
- metric_type: 指标类型
- query_type: 查询类型, 目前仅支持 sql
- unit: 单位
- date_field: 时间维度

{% if samples %}
### 样例数据

下面是指标引用数据的样例，样例仅供参考，比如字段的样式规律等等，**不要** 用于生成答案:

{{ samples }}

请注意样例数据中的前缀、后缀、空格、特殊符号、数值类型等，生成参数时请参考

{% endif %}

### 任务0: 生成标题即选择指标和参数的原因

根据问题生成数据的标题, 格式如下:
{
    "title": "... 对于数据的简要描述 ... ",
    "reason": "... 选择指标和参数的原因 ... "
}

原因中需要包含,为什么选择该指标,为什么选择该时间范围,选择什么样的时间间隔,以及为什么设置分析维度和过滤条件
   
### 任务1: 选择指标

根据用户的问题选择一个合适的指标，指标的 id 为指标的唯一标识

**注意**:
1. 一次只能选择一个指标
2. 指标名称只用于选择指标，不要用于改写问题和辅助理解问题

### 任务2: 生成指标查询参数 query_params

#### 任务2.1: 设置时间约束

根据用户的问题设置时间约束，支持范围查询，必须要生成，不能为空
你必须仔细分析用户提出问题的分析意图，是否为按时间段汇总或者下钻，还是要进行某一是按段内的数据分析

例如, 查询最近1小时的数据:
"query_params": {
    "instant": false,   # 如果要按时间段分析（按时间下钻），则设置为 false，否则设置为 true
    "start": "2025-01-01 00:00:00",  # 开始时间
    "end": "2025-01-01 23:59:59",    # 结束时间
    "step": "hour",            # 时间下钻, 参考下面的说明, promsql 使用数值+单位类似 `1d`, sql 使用日历类型. 类似 `hour`
}

时间设置有两种情况:
1. 按时间段分析（按时间下钻）, 即 instant 为 false, 注意这个模式必须设置 step
2. 截止到某一时间点之前的数据汇总（按时间汇总）, 即 instant 为 true, 注意这个模式不支持设置 step

##### 2.1.1: 按时间段分段分析（按时间下钻）, 即 instant 为 false，优先使用这个模式

如果 instant 设置为 false，则 start 和 end 必须设置

{% if query_type == "promsql" %}
当前查询类型为 promsql, 使用数值+单位来表示时间聚合方式, step 的格式为 `数值+单位`，例如：
- `15s`: 15秒
- `30s`
- `1m`: 1分钟
- `2m`
- `5m`
- `10m`
- `15m`
- `20m`
- `30m`
- `1h`: 1小时
- `2h`
- `3h`
- `6h`
- `12h`
- `1d`: 1天

例如:
1. 按小时分析，可以设置为 `1h`
2. 按天分析，可以设置为 `1d`

{% elif query_type == "sql" %}
当前查询类型为 sql, 使用日历类型来表示时间聚合方式, step 的格式为 `日历类型`，例如:
- `minute`: 1分钟
- `hour`: 1小时
- `day`: 1天
- `week`: 1周
- `month`: 1个月
- `quarter`: 1季度
- `year`: 1年
{% endif %}

**注意**: 
1. 聚合方式必须严格遵守格式，请理解用户问题，选择合适的聚合方式
2. 指标具备聚合分析能力, 如果用户没有特别说明，不要设置更小粒度的聚合方式
3. 务必不要使用更小粒度的数据来计算更大粒度的数据
4. 如果设置step，则 step 的值必须在上述列表中
5. 注意用户问题中的关键词，例如: `按月` | `分别` | `各` | `每天` | `哪月` | `哪年` 等，必须需要设置对应的日期聚合方式，即 step

例子:
1. 用户问 "1月件数"，则 step 聚合方式应该设置为 `month`, 不需要设置为 `day`
2. 用户问 "1月每天的发生次数"，则 step 聚合方式应该设置为 `day`, 不需要设置为 `hour`

##### 2.1.2: 截止到某一时间点的汇总, 即 instant 为 true

不需要设置 step, 有两种方式设置时间段, 设置 time 和 look_back_delta

look_back_delta 默认是5min。格式是 look_back_delta=<time_durations>，time_durations 用一个数字，后面跟时间单位来定义。若不填单位，则默认按秒计算。

时间单位可以是如下之一:
- ms - 毫秒,例如: `100ms` = 100毫秒
- s - 秒, `1s` = 1秒
- m - 分钟, `1m` = 1分钟, 注意不是月份, 例如 `1m` 是1分钟, 不是1个月, 如果查询一个月, 通过设置天数来实现
- h - 小时, `1h` = 1小时
- d - 天, `50d` = 50天, 如果需要根据`月份`/`季度`/`周`分析, 通过设置天数来实现, 如: `30d`,`31d`,`28d`,`29d`
- w - 周, `1w` = 1周
- y - 年, `1y` = 1年

下面是一个例子:
"query_params": {
    "instant": true,   # 如果要按时间进行汇总，不需要任何时间段分析，则设置为 true，否则设置为 false
    "time": "2025-01-01 23:59:59", // 开始追溯的时间
    "look_back_delta": "1y" // 追溯的时间长度
}

**注意**: 设置了 instant 为 true 后，就不支持按时间段分段(按时间下钻)分析了

##### 2.1.3: 设置绝对时间段

如果用户想查某一时间段内的数据, 不需要设置分段分析或者下钻分析, 而是计算汇总值, 例如:
1. 2月15日至2月20日的PM2.5平均值, 则: instnat 为 true, 时间分析粒度, start = 2025-02-15 00:00:00, end = 2025-02-20 23:59:59
2. 1月2日至1月10日的不同大区的销量, 则: instnat 为 true, 时间分析粒度, start = 2025-01-02 00:00:00, end = 2025-01-10 23:59:59

这时候不需要设置 step, time 和 look_back_delta, 直接设置 start 和 end 即可

具体例子如下:
"query_params": {
    "instant": true,
    "start": "2025-02-15 00:00:00",
    "end": "2025-02-20 23:59:59"
}

##### 2.1.4: 使用相对时间

当用户问题中没有提到日期，默认是当年, 当月, 或者当天
如果问题中包含相对时间时，需要根据当前时间 {{ current_date_time }} 计算时间约束，由于要精确设置时间戳, 下面是 instant 为 true 或 false 的一些示例:
- 最近1小时: 
  - instant = true, time = 当前时间 - 1小时, look_back_delta = 1h
  - instant = true, start = 当前时间 - 1小时, end = 当前时间
  - instant = false, start = 当前时间 - 1小时, end = 当前时间
- 昨天: 
  - instant = true, time = 当前天的00:00:00, look_back_delta = 1d
  - instant = true, start = 当前天的00:00:00, end = 当前天的23:59:59
  - instant = false, start = (当前天 - 1)天的00:00:00, end = (当前天 - 1)天的23:59:59
- 上个月: 
  - instant = true, time = 当前月份的1日00:00:00, look_back_delta = 30d
  - instant = true, start = 当前月份的1日00:00:00, end = 当前月份的最后一天23:59:59
  - instant = false, start = (当前月份 - 1)个月的1日00:00:00, end = (当前月份 - 1)个月的最后一天23:59:59
- 去年: 
  - instant = true, time = 当前年份的1月1日00:00:00, look_back_delta = 1y
  - instant = true, start = 当前年份的1月1日00:00:00, end = 当前年份的12月31日23:59:59
  - instant = false, start = (当前年份 - 1年)的1月1日00:00:00, end = (当前年份 - 1年)的12月31日23:59:59

#### 任务2.2: 设置过滤器

根据用户问题设置过滤器 filters, 可以为空数组 []
filters 数组中的 JSON 对象结构如下：

值型过滤器:
{
    "name": "字段名称",
    "value": "值",
    "operation": "操作符 =, !=, <, <=, >, >="
}

列表型过滤器:
{
    "name": "字段名称",
    "value": ["值1", "值2"],
    "operation": "操作符 in, not in, range, out_range"
}

支持的过滤器操作符(操作符:解释, 类型)：
- `=`:等于, 类型: 字符串, 数值, 布尔值
- `!=`: 不等于, 类型: 字符串, 数值, 布尔值
- `<`: 小于, 类型: 数值
- `<=`: 小于等于, 类型: 数值
- `>`: 大于, 类型: 数值
- `>=`: 大于等于, 类型: 数值
- `in`: 在列表中, 类型: 列表, 例如 ["value1", "value2"]
- `not in`: 不在列表中, 注意不要和 `!=` 混淆, 类型: 两个值的列表, 例如 ["value1", "value2"]
- `range`: 范围查询，例如 [1, 10], 表示值在 1 和 10 之间, 类型: 两个值的列表, 例如 [1, 10]
- `out_range`: 范围外查询，例如 [1, 10], 表示值不在 1 和 10 之间, 类型: 两个值的列表, 例如 [1, 10]

#### 任务2.3: 设置分析维度 analysis_dimensions

根据用户问题设置分析维度 analysis_dimensions，可以为空数组 [], 代表使用默认的分析维度，注意数据信息中的 `date_field` 无需在此处设置，而是通过 step 参数来设置按时间维度分析
1. 回答用户问题时，更加倾向于维度的聚合而不是下钻，即当用户没有提到额外的下钻维度时，不需要添加额外的或更细粒度的下钻维度，例如：XX产品2月的业绩，需要按2月聚合，而不是按天聚合; XX第一季度的业绩，需要按季度聚合，而不是按月聚合
2. 注意用户问题中的关键词，如问题中涉及: "各产品" | "各区域" | "各产品" | "分别" | "各" 是多少, 需要基于产品、区域等维度进行下钻。需要设置对应的分析维度

#### 任务2.4: 设置同环比 metrics

下面是同比、环比、占比分析的参数，如果用户问题中没有明确要求计算同环比，则不需要生成，metrics 是一个JSON对象, 格式如下:

"metrics": { // 同环比占比分析
    "type": "sameperiod", // 同环比：sameperiod，需配置 sameperiod_config； 占比： proportion，占比时不需要配置sameperiod_config
    "sameperiod_config": {
        "method": ["growth_value", "growth_rate"],
        "offset": 1,    // 偏移量, 同比环比占比都设置为1, 除非有特别要求
        "time_granularity": "year" // 同比设置为年, 环比设置为月, 季度环比设置为季度, 天环比设置为天
    }
}

time_granularity 可选值:
- "year": "同比",
- "month": "月环比",
- "quarter": "季度环比",
- "day": "天环比"

计算同环比时，只需要设置最近的一个统计周期，而不是全部时间范围，例如:
- 21年1月比20年1月同比增加了多少，查询数据范围仅需设置21年1月

## Examples

下面给出完整的参数示例

用户问题: 查询2021年1季度A产品在北区的产量同比增长率
生成的参数：
{
    "metric_id": "product_output_metric",
    "reason": "我们需要查询2021年1季度产品产量同比增长率, 这是一个按时间段分析的场景, 需要设置开始时间是2021年1月1日, 结束时间是2021年3月31日, 时间聚合方式为季度, 需要计算年度同比增长率",
    "explanation": "使用 '产品产量' 指标，查询2021年1季度A产品在北区的产量同比增长率, 开始时间是2021年1月1日, 结束时间是2021年3月31日, 时间聚合方式为季度, 需要计算年度同比增长率"
    "title": "2021年1季度A产品在北区的产量同比增长率",
    "query_params": {
        "instant": false,
        "start": "2021-01-01 00:00:00",
        "end": "2021-03-31 23:59:59",
        "step": "quarter",
        "analysis_dimensions": ["product"],
        "filters": [
            {
                "name": "labels.product",
                "value": ["产品A"],
                "operation": "in"
            },
            {
                "name": "labels.region",
                "value": "北区",
                "operation": "="
            }
        ],
        "metrics": {
            "type": "sameperiod",
            "sameperiod_config": {
                "method": ["growth_value", "growth_rate"],
                "offset": 1,
                "time_granularity": "year"
            }
        }
    }
}

例子二: 查询 2021年1月3日~5日的总产量
生成的参数：
{
    "metric_id": "product_output_metric",
    "reason": "我们需要查询2021年1月3日~5日的总产量, 这是一个按时间汇总分析的场景, 需要设置开始时间是2021年1月3日, 结束时间是2021年1月5日",
    "explanation": "使用 '产品产量' 指标，查询2021年1月3日~5日的总产量, 开始时间是2021年1月3日, 结束时间是2021年1月5日",
    "title": "2021年1月3日~5日的总产量",
    "query_params": {
        "instant": true,
        "start": "2021-01-03 00:00:00",
        "end": "2021-01-05 23:59:59",
    }
}

{% if background %}
## Background Knowledge

生成结果时可参考以下背景知识，可以直接认为是用户提问的一部分, 这部分信息非常重要, 请仔细阅读，应用在参数生成过程中：
{{ background }}
{% endif %}

## Output Instructions

请返回一个JSON对象, 请不要使用上面的例子, 包含以下Key:

1. metric_id: 选择的指标id, 注意一次只能选择一个指标，不选则设置为空字符串
2. query_params: 指标查询参数
3. explanation: 对选择的指标和参数的解释。解释应包含选择的指标、时间范围、过滤条件、同环比分析等
4. reason: 生成参数的解释，解释为什么选择这个指标，为什么选择这个时间范围，为什么选择这个过滤条件，按什么维度进行聚合，是否需要计算同环比
5. title: 生成数据的标题

示例输出：
{
    "metric_id": "...",
    "reason": "...",
    "explanation": "...",
    "title": "..."
    "query_params": ...,
}

{%- if errors  %}

## LAST ERROR
以下是上一次生成的参数和执行结果，如果可能请纠正:
{{ errors }}
纠正问同时不要改变用户问题的意图
{%- endif %}

## 特别注意事项

1. 检查选择指标的正确性，如果找不到合适的指标, metric_id 请填写空字符串，并在 explanation 中说明"有哪些指标可用"
2. **请再次检查**, query_params 中的 instant/time/start/end/look_back_delta 格式正确
3. **请再次检查**, query_params 中的 filters 格式正确
4. **请再次检查**, query_params 中的 analysis_dimensions 是否正确
5. **请再次检查**, 时间范围是否正确，千万要注意当前时间 {{ current_date_time }}, 注意月份的日期, 注意闰年的2月份是29天等情况
6. **请再次检查**, 同环比分析的时间范围是否正确，只需要设置最近的一个统计周期，而不是全部时间范围
6. **请再次检查**, 不要增加上述没有提到的参数，不要设置指标信息中不存在的字段

必须按 `Output Instructions` 定义的 JSON 格式输出!
注意先输出结构中的 reason 参数，再输出其他参数

开始！
"""

suffix_command = {
    "cn": "请用中文回答问题",
    "en": "Please answer the question in English"
}

prompts = {
    "cn": dip_metric_prompt_template,
    "en": dip_metric_prompt_template + "\n" + suffix_command["en"]
}

class Text2DIPMetricPrompt(BasePrompt):
    """Text2DIPMetric Prompt
    There are three variables in the prompt:
    - metrics: list, the metrics that need to be analyzed
    - samples: list, the sample data
    - background: str, the background information
    """
    metrics: Any = ""
    samples: dict = {}
    background: str = ""
    templates: dict = prompts
    language: str = "cn"
    current_date_time: str = ""
    errors: Optional[dict] = None
    name: str = "default-text2dipmetric"
    query_type: str = "sql"

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


# class Text2DIPMetricPromptManager(BasePromptManager):
#     """Text2DIPMetric Prompt 管理器"""

#     def __init__(self, **kwargs):
#         super().__init__(**kwargs)
#         self.prompts = {
#             "default": Text2DIPMetricPrompt,
#         }
