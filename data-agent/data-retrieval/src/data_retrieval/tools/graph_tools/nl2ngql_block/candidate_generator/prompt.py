

retrieval_content = """
===(3)、cypher样例：
注意：
- cypher语句的节点标签名称统一用v1、v2、v3、v4...表示，关系边统一用e1、e2、e3、e4...表示
如下参考样例：
{template_question_retrieval}
===(4)、关键词抽取：抽取了和schema中有关的实体和属性字段，可以作为参考，请仔细甄别。。
{keyword_retrieval}
也通过向量搜索召回了相似的字段。
{value_retrieval}

===(5)、部分子图信息：根据关键词返回了部分子图信息，并做了部分剪枝，整个结果用yaml表示。
注意：
- 如果存在递归、自循环节点，问题或查询语句务必要考虑子类或父类信息。
{kg_node_retrieval}

"""

prompt_generate_nGQL = """
然后，你需要根据问题生成正确的cypher图查询语言。
===注意事项 
1.根据上下文的所有信息，请生成一个有效的cypher查询，确保输出cypher没有语法错误. 
2.只需要输出cypher查询语句，不要输出其他内容，不对问题进行任何解释。 
3.生成的cypher条件匹配时，不要使用=~正则匹配，尽量使用where 和 contains。 
4.如果问题需要多个cypher查询语句，请先生成第一个子问题的查询语句即可，不要生成多个。
5.有些问题一个查询语句不能直接解决问题，可以提供一些中间线索即可，最后再让人工来判断，来回答问题即可。


question: {question}

为了回答这个问题，我又收集了很多信息。
{retrieval_content}

question: {question}
{rewrite_question}
cypher:
"""

prompt_generate_nGQL_with_history = """
请继续根据子问题生成cypher查询语句，不要解释和输出其他内容。
question: {question}
cypher:
"""


