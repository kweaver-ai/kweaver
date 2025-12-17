import asyncio
import json
import logging
import re
from typing import List

from nebula3.Config import Config as NebulaConfig
from nebula3.gclient.net import ConnectionPool

from app.common.config import Config

http_max_initial_line_length = 16384  # opensearch http.max_initial_line_length配置
logging.basicConfig(
    format="%(asctime)s %(name)s %(levelname)s %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


def keyword_proc(predicted_ngql):
    # Nebula3的关键词需要加上``
    keywords = [
        "ACROSS",
        "ADD",
        "ALTER",
        "AND",
        "AS",
        "ASC",
        "ASCENDING",
        "BALANCE",
        "BOOL",
        "BY",
        "CASE",
        "CHANGE",
        "COMPACT",
        "CREATE",
        "DATE",
        "DATETIME",
        "DELETE",
        "DESC",
        "DESCENDING",
        "DESCRIBE",
        "DISTINCT",
        "DOUBLE",
        "DOWNLOAD",
        "DROP",
        "DURATION",
        "EDGE",
        "EDGES",
        "EXISTS",
        "EXPLAIN",
        "FALSE",
        "FETCH",
        "FIND",
        "FIXED_STRING",
        "FLOAT",
        "FLUSH",
        "FROM",
        "GEOGRAPHY",
        "GET",
        "GO",
        "GRANT",
        "IF",
        "IGNORE_EXISTED_INDEX",
        "IN",
        "INDEX",
        "INDEXES",
        "INGEST",
        "INSERT",
        "INT",
        "INT16",
        "INT32",
        "INT64",
        "INT8",
        "INTERSECT",
        "IS",
        "JOIN",
        "LEFT",
        "LIST",
        "LOOKUP",
        "MAP",
        "MATCH",
        "MINUS",
        "NO",
        "NOT",
        "NULL",
        "OF",
        "ON",
        "OR",
        "ORDER",
        "OVER",
        "OVERWRITE",
        "PATH",
        "PROP",
        "REBUILD",
        "RECOVER",
        "REMOVE",
        "RESTART",
        "RETURN",
        "REVERSELY",
        "REVOKE",
        "SET",
        "SHOW",
        "STEP",
        "STEPS",
        "STOP",
        "STRING",
        "SUBMIT",
        "TAG",
        "TAGS",
        "TIME",
        "TIMESTAMP",
        "TO",
        "TRUE",
        "UNION",
        "UNWIND",
        "UPDATE",
        "UPSERT",
        "UPTO",
        "USE",
        "VERTEX",
        "VERTICES",
        "WHEN",
        "WHERE",
        "WITH",
        "XOR",
        "YIELD",
    ]
    keywords_pattern = "|".join(keywords + [x.lower() for x in keywords])
    match_groups = list(
        re.finditer(
            "(?<=[.:])(" + keywords_pattern + ")(?![a-zA-Z0-9_])", predicted_ngql
        )
    )
    for match_group in reversed(match_groups):
        beg = match_group.span()[0]
        end = match_group.span()[1]
        predicted_ngql = (
            predicted_ngql[:beg]
            + "`"
            + match_group.group()
            + "`"
            + predicted_ngql[end:]
        )
    return predicted_ngql


class NebulaConnector(object):
    """
    Nebula Graph Database Connect and Search API
    从search-engine-app的Executors/utils里搬来的
    """

    def __init__(
        self,
        ips: List[str] = None,
        ports: List[str] = None,
        user: str = None,
        password: str = None,
    ):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: username to connect the service
        :param password: user password to connect the service
        """
        self.ips = ips or Config.graphdb.host.split(",")
        self.ports = ports or Config.graphdb.port.split(",")
        self.user = user or Config.graphdb.read_only_user
        self.password = password or Config.graphdb.read_only_password
        self.connect_pool = None
        self.nebula_pool = False

    def _init_pool(self):
        """
        初始化连接池
        """
        if self.nebula_pool:
            return

        config = NebulaConfig()
        config.max_connection_pool_size = 200
        temp_ips = self.ips.copy()

        while len(temp_ips) > 0:
            try:
                self.connect_pool = ConnectionPool()
                host = [(ip, port) for ip, port in zip(temp_ips, self.ports)]
                self.connect_pool.init(host, config)
                self.nebula_pool = True
                return
            except Exception as e:
                err = str(e)
                # 节点挂掉时去除此节点并重试
                if "status: BAD" in err:
                    address = re.findall(r"[\[](.*?)[\]]", err)
                    for add in address:
                        if "status: BAD" in add:
                            bad_address = re.findall(r"[(](.*?)[)]", add)[0]
                            bad_address = eval(bad_address.split(",")[0])
                            temp_ips.remove(bad_address)
                else:
                    raise Exception("Nebula connect error: {}".format(e.args[0]))
        raise Exception("All service are in BAD status!")

    def execute(self, space: str, sql: str):
        """
        execute a query
        """
        if not self.nebula_pool:
            self._init_pool()

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
        if not self.nebula_pool:
            self._init_pool()

        with self.connect_pool.session_context(self.user, self.password) as client:
            sql = "use `{space}`; ".format(space=space) + sql
            response = client.execute_json(sql)
            try:
                result = json.loads(response)
            except UnicodeDecodeError as e:
                records = {}
                error_info = "nGQL语句执行结果解析错误: {}".format(e)
                return records, error_info
            error_info = ""
            if result["errors"][0]["code"] != 0:
                records = "none"
                error_info = result["errors"][0]["message"]
            else:
                records = {}
                for col_name in result["results"][0].get("columns", []):
                    records[col_name] = []
                for row_data in result["results"][0].get("data", []):
                    for col_data_num, col_data in enumerate(row_data["row"]):
                        records[result["results"][0]["columns"][col_data_num]].append(
                            col_data
                        )
            return records, error_info

    def sys_execute_json(self, sql):
        if not self.nebula_pool:
            self._init_pool()

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
            _vid = val_wrap._value.value.vid.value.decode("utf-8")
            node = val_wrap.as_node()
            properties = {}
            # 一个实体只考虑一个tag
            v_tag = node.tags()[0]
            proper = node.properties(v_tag)
            for pro in proper.items():
                proper[pro[0]] = self.trim_quotation_marks(str(pro[1]))
            properties["uni_id"] = space + "#" + _vid
            properties["vid"] = _vid
            properties["props"] = [{"tag": v_tag, "props": proper}]
            res.append(properties)
        return res

    def __del__(self):
        if self.connect_pool:
            self.connect_pool.close()


nebula_engine = NebulaConnector()
