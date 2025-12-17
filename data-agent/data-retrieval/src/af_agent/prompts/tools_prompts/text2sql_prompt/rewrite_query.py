# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-04-23

from af_agent.prompts.base import BasePrompt

from datetime import datetime
from typing import Optional, List, Any
import json

from af_agent.prompts.base import BasePrompt

prompt_template_cn = """# ROLE
你是一个用户需求理解的专家，你的下一步是去查询数据库，但是用户的问题可能比较模糊和潦草，你的工作是改写问题，将用户问的一个相对简单或者模糊的问题，改写成一个具体且清晰的，方便进行 SQL 查询的问题。

## INSTRUCTIONS

1. 你需要做的是根据给定的表及维度的信息, 将问题进行改写
2. 不过你需要注意的是，如果用户的需求是明确，也就是说他的问题能进行查询，则不需要扩展
3. 以 JSON 格式输出问题

例如:
- 问题: 上个月销售情况怎么样，没有提到具体的维度，这时候就需要改写
- 问题: 上个月订单量是多少，虽然维度少，但是用户已经明确指定了维度，这时候就不需要改写

## EXAMPLES

### 输入

问题: 上个月销售情况怎么样
表单：
 - 表名: 订单
 - 维度: 时间、业务线、订单量、订单金额

### 输出
必须是 JSON 格式，包含 `新问题`
```json
{
    "新问题": "2023-03-01 到 2023-03-31 每个业务线的订单量、订单金额是多少",
    "rewrite": true
}
```

## 注意
- 如果问题中的条件已经比较具体了就不需要进行改写
- 当前时间是：{{current_date_time}}

## 下面是你的参考数据, 包括表的信息和样例数据
 {{metadata_and_samples}}

{% if background %}
## 下面是你的背景知识，改写问题时需要参考
{{background}}
{% endif %}

我们开始吧! 请重写用户的问题

```json
{
"""


suffix_command = {
    "cn": "请用中文生成",
    "en": "Please generate in English"
}


prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_cn
}

class RewriteQueryPrompt(BasePrompt):
    """RewriteQueryPrompt
    """
    metadata_and_samples: Any = ""
    current_date_time: str = ""
    background: str = ""
    templates: dict = prompts
    language: str = "cn"
    name: str = "rewrite-query"
    suffix_command: dict = suffix_command

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if isinstance(self.metadata_and_samples, dict):
            self.metadata_and_samples = json.dumps(self.metadata_and_samples, ensure_ascii=False)
        elif isinstance(self.metadata_and_samples, list):
            if len(self.metadata_and_samples) > 0:
                if isinstance(self.metadata_and_samples[0], dict):
                    self.metadata_and_samples = '\n'.join([ json.dumps(item, ensure_ascii=False) for item in self.metadata_and_samples ])
                else:
                    self.metadata_and_samples = '\n\n'.join(self.metadata_and_samples)
            else:
                self.metadata_and_samples = ""




