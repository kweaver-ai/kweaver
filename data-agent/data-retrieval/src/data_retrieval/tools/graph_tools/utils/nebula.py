import asyncio
import json
from typing import List
import re, requests, aiohttp
from nebula3.Config import Config
from nebula3.gclient.net import ConnectionPool
from collections import defaultdict, Counter
import re
import logging

http_max_initial_line_length = 16384  # opensearch http.max_initial_line_length配置
logging.basicConfig(format='%(asctime)s %(name)s %(levelname)s %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

def keyword_proc(predicted_ngql):
    raw_ngql = predicted_ngql
    # Nebula3的关键词需要加上``
    keywords = ['ACROSS', 'ADD', 'ALTER', 'AND', 'AS', 'ASC', 'ASCENDING', 'BALANCE', 'BOOL', 'BY',
                'CASE', 'CHANGE', 'COMPACT', 'CREATE', 'DATE', 'DATETIME', 'DELETE', 'DESC', 'DESCENDING',
                'DESCRIBE', 'DISTINCT', 'DOUBLE', 'DOWNLOAD', 'DROP', 'DURATION', 'EDGE', 'EDGES', 'EXISTS',
                'EXPLAIN', 'FALSE', 'FETCH', 'FIND', 'FIXED_STRING', 'FLOAT', 'FLUSH', 'FROM', 'GEOGRAPHY', 'GET',
                'GO', 'GRANT', 'IF', 'IGNORE_EXISTED_INDEX', 'IN', 'INDEX', 'INDEXES', 'INGEST', 'INSERT', 'INT',
                'INT16', 'INT32', 'INT64', 'INT8', 'INTERSECT', 'IS', 'JOIN', 'LEFT', 'LIST', 'LOOKUP', 'MAP',
                'MATCH', 'MINUS', 'NO', 'NOT', 'NULL', 'OF', 'ON', 'OR', 'ORDER', 'OVER', 'OVERWRITE', 'PATH',
                'PROP', 'REBUILD', 'RECOVER', 'REMOVE', 'RESTART', 'RETURN', 'REVERSELY', 'REVOKE', 'SET', 'SHOW',
                'STEP', 'STEPS', 'STOP', 'STRING', 'SUBMIT', 'TAG', 'TAGS', 'TIME', 'TIMESTAMP', 'TO', 'TRUE',
                'UNION', 'UNWIND', 'UPDATE', 'UPSERT', 'UPTO', 'USE', 'VERTEX', 'VERTICES', 'WHEN', 'WHERE',
                'WITH', 'XOR', 'YIELD']
    keywords_pattern = '|'.join(keywords + [x.lower() for x in keywords])
    match_groups = list(re.finditer('(?<=[.:])(' + keywords_pattern + ')(?![a-zA-Z0-9_])', predicted_ngql))
    for match_group in reversed(match_groups):
        beg = match_group.span()[0]
        end = match_group.span()[1]
        predicted_ngql = predicted_ngql[:beg] + '`' + match_group.group() + '`' + predicted_ngql[end:]
    if raw_ngql != predicted_ngql:
        logger.info("keyword_proc: {} -> {}".format(raw_ngql, predicted_ngql))
    return predicted_ngql
class NebulaConnector(object):
    """
    Nebula Graph Database Connect and Search API
    从search-engine-app的Executors/utils里搬来的
    """

    def __init__(self, ips: List[str], ports: List[str], user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: username to connect the service
        :param password: user password to connect the service
        """
        self.ips = ips
        self.ports = ports
        self.user = user
        self.password = password
        config = Config()
        config.max_connection_pool_size = 200
        # self.connect_pool = ConnectionPool()
        self.nebula_pool = False
        while len(self.ips) > 0:
            if self.nebula_pool:
                return
            try:
                self.connect_pool = ConnectionPool()
                host = [(ip, port) for ip, port in zip(self.ips, self.ports)]
                self.connect_pool.init(host, config)
                self.nebula_pool = True
            except Exception as e:
                err = str(e)
                # 节点挂掉时去除此节点并重试
                if "status: BAD" in err:
                    address = re.findall(r"[\[](.*?)[\]]", err)
                    for add in address:
                        if "status: BAD" in add:
                            bad_address = re.findall(r"[(](.*?)[)]", add)[0]
                            bad_address = eval(bad_address.split(',')[0])
                            self.ips.remove(bad_address)
                else:
                    raise Exception("Nebula connect error: {}".format(e.args[0]))
        raise Exception("All service are in BAD status!")

    def execute(self, space: str, sql: str):
        """
        execute a query
        """

        def _parse_result(result):
            records = []
            error_msg = result.error_msg()
            if error_msg:
                raise Exception(error_msg)
            for record in result:
                records.append(record.values())
            return records

        with self.connect_pool.session_context(self.user, self.password) as client:
            sql = "use `{space}`; ".format(space=space) + sql
            result = client.execute(sql)
        return _parse_result(result)

    def execute_any_ngql(self, space: str, sql: str):
        sql = keyword_proc(sql)
        with self.connect_pool.session_context(self.user, self.password) as client:
            sql = "use `{space}`; ".format(space=space) + sql
            response = client.execute_json(sql)
            # return _parse_result(result)
            try:
                result = json.loads(response)
            except UnicodeDecodeError as e:
                records = {}
                error_info = "nGQL语句执行结果解析错误: {}".format(e)
                return records, error_info
            error_info = ''
            # from pprint import pprint
            # pprint(result) TODO 查询关系边目前不支持
            if result['errors'][0]['code'] != 0:
                records = 'none'
                error_info = result['errors'][0]['message']
            else:
                records = {}
                for col_name in result['results'][0].get("columns", []):
                    records[col_name] = []
                for row_data in result['results'][0].get("data", []):
                    for col_data_num, col_data in enumerate(row_data['row']):
                        records[result['results'][0]['columns'][col_data_num]].append(col_data)
            return records, error_info

    def sys_execute_json(self, sql):
        with self.connect_pool.session_context(self.user, self.password) as client:
            result = client.execute_json(sql)
        return json.loads(result)

    async def execute_json(self, sql):
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, self.sys_execute_json, sql)
        result = await future
        return result

    @staticmethod
    def trim_quotation_marks(s: str):
        if not s:
            return s
        if s[0] == '"':
            return s[1:-1]

        return s

    async def get_vertex_by_id(self, space, vids: str or List):
        res = []
        if isinstance(vids, str):
            vids = [vids]
        sql = "MATCH (v) WHERE id(v) in {} RETURN v;".format(vids)
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, self.execute, space, sql)
        result_set = await future

        for rowValue in result_set:
            val_wrap = rowValue[0]
            _vid = val_wrap._value.value.vid.value.decode('utf-8')
            node = val_wrap.as_node()
            properties = {}
            # 一个实体只考虑一个tag
            v_tag = node.tags()[0]
            proper = node.properties(v_tag)
            for pro in proper.items():
                proper[pro[0]] = self.trim_quotation_marks(str(pro[1]))
            properties['uni_id'] = space + "#" + _vid
            properties['vid'] = _vid
            properties['props'] = [
                {
                    "tag": v_tag,
                    "props": proper
                }
            ]
            res.append(properties)
        return res

    def __del__(self):
        self.connect_pool.close()


class NebulaRequests(object):
    """
    Nebula Graph Database Connect and Search API
    """

    def __init__(self, base_url=None, appid=None, graph_id=None):
        self.base_url = base_url
        self.appid = appid
        self.graph_id = graph_id
        self.headers = {
            "Content-Type": "application/json",
            "appid": self.appid,
        }
        self.query_url = self.base_url + f"/api/engine/v1/open/custom-search/kgs/{self.graph_id}"

    def get_schema_desc(self, graph_id):
        schema_res = graph_util.find_redis_graph_cache(graph_id=graph_id)
        return schema_res

    def get_graph(self):
        # 定义基本URL
        schema_url = self.base_url + "/api/builder/v1/open/graph/info/onto"
        # 定义请求头

        # 定义查询参数
        params = {
            "graph_id": self.graph_id
        }

        # 发送GET请求
        response = requests.get(schema_url, headers=self.headers, params=params, verify=False)

        # 输出响应内容
        schema_res = json.loads(response.text)["res"]
        return schema_res

    def execute_any_ngql(self, space_name=None, query=None, limit=None):
        query = keyword_proc(query)
        if limit:
            query = query + " limit {}".format(limit)
        params = {
            "statements": [query]
        }
        response = requests.post(self.query_url, headers=self.headers, json=params, verify=False)
        result = json.loads(response.text)
        error_info = ''
        if result.get("error"):
            records = 'none'
            error_info = result.get("error")
        else:
            records = {}
            texts = result['res'][0].get("texts")
            if texts:
                for text in texts:
                    for columns in text['columns']:
                        records.setdefault(columns["column"], [])
                        records[columns["column"]].append(columns["value"])

        return records, error_info

    async def async_execute_query(self, query, limit=None):
        async with asyncio.Semaphore(100):
            query = keyword_proc(query)
            if limit:
                query = query + " limit {}".format(limit)
            params = {
                "statements": [query]
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(self.query_url, headers=self.headers, json=params, verify_ssl=False) as resp:
                    result = await resp.json()
            error_info = ''
            if result.get("error"):
                records = 'none'
                error_info = result.get("error")
            else:
                records = {}
                texts = result['res'][0].get("texts")
                if texts:
                    for text in texts:
                        for columns in text['columns']:
                            records.setdefault(columns["column"], [])
                            records[columns["column"]].append(columns["value"])

            return records, error_info


class GraphUtils:
    def __init__(self):
        from .redis import RedisClient
        self.rs = RedisClient()
        print()

    def find_redis_graph_cache(self, graph_id):
        res = {}
        try:
            redis_reader = self.rs.connect_redis(db="3", model="read")
            name = "graph_" + str(graph_id)
            if redis_reader.exists(name) == 0:
                logger.info(f"No schema information for {name} in Redis.")
                return {}
            res["graph_name"] = json.loads(redis_reader.hget(name, "graph_name").decode())
            res["dbname"] = json.loads(redis_reader.hget(name, "dbname").decode(encoding="utf-8"))
            res["entity"] = json.loads(redis_reader.hget(name, "entity").decode(encoding="utf-8"))
            res["edge"] = json.loads(redis_reader.hget(name, "edge").decode(encoding="utf-8"))
            res["quantized_flag"] = json.loads(redis_reader.hget(name, "quantized_flag").decode(encoding="utf-8"))
            return res
        except Exception as e:
            logger.error(f"Error in obtaining schema information for graph from Redis: {repr(e)}")
            raise Exception(f"Error in obtaining schema information for graph from Redis: {repr(e)}")

    def get_schema(self, graph_id, redis_ontology):
        """ 获取图谱本体结构 """
        entities, relations = [], []
        entity2property = defaultdict(list)
        entity2entity = defaultdict(list)
        entity2relation = defaultdict(list)
        entity2alias = {}
        relation2alias = {}
        entity2tag = {}
        res = redis_ontology
        if not res:
            res = self.find_redis_graph_cache(graph_id=graph_id)
        dbname = res.get("dbname")
        for item in res.get("entity", []):
            entities.append({
                "name": item["name"],
                "alias": item["alias"],
                "property": item["properties"]
            })
            entity2tag[item["name"]] = item["default_tag"]
            entity2alias[item["name"]] = item["alias"]
            for pro in item["properties"]:
                entity2property[item["name"]].append((pro["name"], pro["alias"]))
        for item in res.get("edge", []):
            relations.append({
                "name": item["name"],
                "alias": item["alias"],
                "relation": item["relations"]
            })
            relation2alias[item["name"]] = item["alias"]
            relation = item["relations"]
            if (relation[-1], entity2alias[relation[-1]]) not in entity2entity[relation[0]]:
                entity2entity[relation[0]].append((relation[-1], entity2alias[relation[-1]]))
            if (relation[0], entity2alias[relation[0]]) not in entity2entity[relation[-1]]:
                entity2entity[relation[-1]].append((relation[0], entity2alias[relation[0]]))
            if (item["name"], item["alias"]) not in entity2relation[relation[0]]:
                entity2relation[relation[0]].append((item["name"], item["alias"]))
            if (item["name"], item["alias"]) not in entity2relation[relation[-1]]:
                entity2relation[relation[-1]].append((item["name"], item["alias"]))

        schema = {
            "dbname": dbname,
            "entity": entities,
            "relation": relations,
            "entity2alias": entity2alias,
            "relation2alias": relation2alias,
            "entity2entity": dict(entity2entity),
            "entity2property": dict(entity2property),
            "entity2relation": dict(entity2relation),
            "entity2tag": entity2tag
        }
        return schema


graph_util = GraphUtils()
