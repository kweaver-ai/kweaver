
# retrieval_content = """
# ===(1)、图数据库的schema定义
# {schema}
#
# ===(2)、nGQL样例：和Cypher语法有些差别，可以用于语法参考。
# 注意：nGQL语句的节点标签名称统一用v1、v2、v3、v4...表示，关系边统一用e1、e2、e3、e4...表示
# 如下参考样例：
# {template_question_retrieval}
#
# ===(3)、关键词抽取：抽取了和schema中有关的实体和属性字段，可以作为参考，请仔细甄别。。
# {keyword_retrieval}
#
# ===(4)、检索的属性值：根据关键词，从图谱中检索了一些相似的值，只用于实体消岐，可以作为参考，请仔细甄别。
# {value_retrieval}
#
# ===(5)、其他信息：根据关键词返回了部分子图信息，并做了部分剪枝，整个结果用yaml表示。
# {kg_node_retrieval}
# """

retrieval_content = """
===(1)、图数据库的schema定义
{schema}

===(2)、nGQL样例：和Cypher语法有些差别，可以用于语法参考。
注意：
- nGQL语句的节点标签名称统一用v1、v2、v3、v4...表示，关系边统一用e1、e2、e3、e4...表示
- 如果是涉及到条件查询，请务必使用 where 语句 
如下参考样例：
{template_question_retrieval}

===(3)、关键词抽取：抽取了和schema中有关的实体和属性字段，可以作为参考，请仔细甄别。。
{keyword_retrieval}
也通过向量搜索召回了相似的字段。
{value_retrieval}

===(4)、其他信息：根据关键词返回了部分子图信息，并做了部分剪枝，整个结果用yaml表示。
{kg_node_retrieval}
"""

prompt_generate_nGQL = """
你现在是一个NebulaGraph图数据库问答的专家，你擅长根据问题生成正确的nGQL图查询语言。
===注意事项 
1.根据上下文的所有信息，请生成一个有效的nGQL查询，确保输出nGQL没有语法错误. 
2.只需要输出nGQL查询语句，不要输出其他内容，不对问题进行任何解释。 
3.生成的nGQL条件匹配时，不要使用=~正则匹配，尽量使用contains。 
4.如果问题需要多个nGQL查询语句，请先生成第一个子问题的查询语句即可，不要生成多个。
5.有些问题一个查询语句不能直接解决问题，可以提供一些中间线索即可，最后再让人工来判断，来回答问题即可。
6.如果schema中只有entity没有edge，可以生成只查询单个节点的nGQL语句，例如：MATCH (v1:person) WHERE v1.person.name contains "张三" RETURN v1.person.name


question: {question}

为了回答这个问题，我又收集了很多信息。
{retrieval_content}

question: {question}
{rewrite_question}
nGQL:
"""

prompt_generate_nGQL_with_history = """
请继续根据子问题生成nGQL查询语句，不要解释和输出其他内容。
question: {question}
nGQL:
"""

# prompt_generate_nGQL_fix = """
# nGQL查询语句，执行后的结果如下：
# {ngql}
#
#
# 你需要审核查询语句是否有错误。
# 如果问题的意图和查询语句的意图不一致，请输出正确的nGQL语句。
# 如果查询语句有箭头指向性的错误，请输出正确的nGQL语句。
# 如果nGQL查询语句的执行结果为空，或为0，或为1，有可能查询语句有错误，请输出正确的nGQL语句。
#
# 输出格式如下:
# 结论: 需要矫正
# nGQL:
#
# 如果nGQL查询语句没有错误，输出格式为：
# 结论: 不需要矫正
# """


