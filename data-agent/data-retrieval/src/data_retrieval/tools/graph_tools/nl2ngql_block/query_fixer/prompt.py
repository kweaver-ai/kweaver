prompt_generate_nGQL_fix = """
cypher查询语句，执行后的结果如下：
{ngql}
因为上一轮的执行结果为空，或为0，或为1，查询语句有错误，请修正，只要输出正确的cypher语句，不要解释和生成其他内容。
cypher:
"""


# prompt_generate_nGQL_fix = """
# cypher查询语句，执行后的结果如下：
# {ngql}
# 因为cypher查询语句的执行结果为空，或为0，或为1，查询语句有错误，请先输出错误分析，最后输出正确的cypher语句。
# 注意：
# 1.如果cypher查询语句有多个查询，你可以拆分子问题，先生成其中一个子问题的cypher查询语句。
# 2.所有的分析、解释请放在错误分析部分，如果需要多个cypher，先输出一个cypher语句，不要多个，cypher后面务必不要输出其他内容。
# 输出格式如下:
# 错误分析: 
# cypher:
# """

