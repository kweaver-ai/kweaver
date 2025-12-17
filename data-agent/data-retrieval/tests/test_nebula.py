
import os
import sys

# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)
grandparent_dir = os.path.abspath(os.path.join(current_file_path, '../../src'))
# 将上上级目录添加到sys.path中
sys.path.append(grandparent_dir)
print(sys.path)
from af_agent.tools.graph_tools.common.config import Config
from af_agent.tools.graph_tools.utils.nebula import NebulaConnector, graph_util, NebulaRequests
graph_id = 5 # 灰度环境的
nebula_engine = NebulaConnector(ips=Config.GRAPHDB_HOST.split(','),
                                ports=Config.GRAPHDB_PORT.split(','),
                                user=Config.GRAPHDB_READ_ONLY_USER,
                                password=Config.GRAPHDB_READ_ONLY_PASSWORD)
sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v2:orgnization)<-[e2:orgnization_2_orgnization_child*0..]-(v3:orgnization)
where v1.person.name contains "杨晨" return v1.person.position, v3.orgnization.name
"""

sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v2:orgnization)<-[e2:orgnization_2_orgnization_child*0..]-(v3:orgnization)
where v1.person.name contains "王欢" return v1.person.position, v3.orgnization.name
"""

sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v2:orgnization)
where v1.person.name contains "王欢" return v1.person.position, v2.orgnization.name
"""

sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v2:orgnization)
where v1.person.name contains "匡厚斌" return v1.person.position, v2.orgnization.name
"""

sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v_orgnization:orgnization)<-[e_orgnization:orgnization_2_orgnization_child*0..11]-(v2:orgnization) where toLower(v2.orgnization.name) contains toLower('AnyShare客户端研发部') return count(distinct v1)
"""
# res = nebula_engine.execute_any_ngql(query=sql)
# print(res)

sql = """
match (v1:orgnization)-[e1:orgnization_2_orgnization_child]->(v2:orgnization) where v1.orgnization.name contains '数据智能产品BG' and v2.orgnization.name contains '研发线' return distinct v2.orgnization.name


"""
# res = nebula_engine.execute_any_ngql(query=sql)
# print(res)

sql = """
match (v1:person)-[e1:person_2_orgnization_belong_to]->(v_orgnization:orgnization)<-[e_orgnization:orgnization_2_orgnization_child*0..11]-(v2:orgnization) where toLower(v2.orgnization.name) contains toLower('企业数据智能') and v1.person.position contains '顾问' return count(distinct v1)
"""
query = """
match (v1:orgnization)-[e1:orgnization_2_orgnization_child*0..11]->(v2:orgnization) return v1.orgnization.name
"""
query = """
MATCH (v1:orgnization)-[e1:orgnization_2_orgnization_child*0..]->(v2:orgnization)  WHERE v1.orgnization.name == \"AnyShare研发线\" MATCH (v3:person)-[e2:person_2_orgnization_belong_to]->(v2) RETURN COUNT(DISTINCT v3)
"""
query = """
LOOKUP ON person WHERE person.name =~ "叶晓艳" YIELD person.*
"""
res = nebula_engine.execute_any_ngql(space="u44c49b2c258b11f0b8cd8a7fcee1c07d-2", sql=query)
from pprint import pprint
pprint(res)