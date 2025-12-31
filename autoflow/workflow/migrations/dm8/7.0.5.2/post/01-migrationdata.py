#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from urllib import request, parse
import json
import rdsdriver
import random
import re
import base64
import datetime
import time

USER_TYPE = 1
ANYONE_TYPE = 2

docLibTypeMap = {'user_doc_lib': 1, 'department_doc_lib': 2,
                 'custom_doc_lib': 3, 'knowledge_doc_lib': 6}


def get_conn(user, password, host, port):
    """
    获取数据库的连接
    """
    try:
        conn = rdsdriver.connect(host=host,
                                 port=int(port),
                                 user=user,
                                 password=password,
                                 autocommit=True,
                                 database='workflow')
        # cursor = conn.cursor()
    except Exception as e:
        print("connect workflow error: %s", str(e))
        sys.exit(1)
    return conn


def query_stratege_data(conn) -> list:
    select_query = "SELECT DISTINCT proc_def_id FROM t_wf_doc_share_strategy WHERE proc_def_id like 'Process_SHARE%'"
    conn.execute(select_query)
    res = conn_cursor.fetchall()
    return list(res)


def query_dict_data(conn) -> dict:
    select_query = """SELECT dict_code, dict_name FROM t_wf_dict
        WHERE dict_code IN
        ('rename_countersign_count','rename_countersign_switch','rename_countersign_auditors','rename_treansfer_count','rename_transfer_switch')
    """
    conn.execute(select_query)
    res = conn_cursor.fetchall()
    json_data = {}
    for val in res:
        json_data[val[0]] = val[1]
    return json_data


def fetch_process_config(proc_def_id: tuple) -> dict:
    url = "http://workflow-rest-private:9801/api/workflow-rest/v1/process-model-internal/{}".format(
        proc_def_id[0])
    response = request.urlopen(url)
    if response.status == 200:
        data = response.read()
        json_string = data.decode('utf-8')
        json_data = json.loads(json_string)
        return json_data
    else:
        # 请求失败
        raise RequestException(
            f'[fetch_process_config] Request failed with status code: {response.status_code, proc_def_id[0]}')


def get_share_auditors(proc_def_id: tuple) -> list:
    entries = []
    url = "http://workflow-rest-private:9801/api/workflow-rest/v1/doc-share-strategy-internal/?doc_type=&proc_def_id={}".format(
        proc_def_id[0])
    response = request.urlopen(url)
    if response.status == 200:
        # 请求成功
        data = response.read()
        # 将字节数据解码为字符串
        json_string = data.decode('utf-8')
        json_data = json.loads(json_string)
        entries = json_data.get("entries")
        return entries
    else:
        # 请求失败
        raise RequestException(
            f'[get_share_auditors] Request failed with status code: {response.status_code, proc_def_id[0]}')


def create_stratege(process_config, auditor, advance_config) -> str:
    reqest_body = {
        "name": process_config.get("name"),
        "key": "",
        "tenant_id": "{}_script_gen".format(process_config.get("tenant_id")),
        "type": "{}_audit".format(process_config.get("type")),
        "is_copy": 0,
        "advanced_setup": {
            "repeat_audit_rule": "once"
        },
        "audit_strategy_list": None,
        "docShareStrategyList": None,
        "flow_xml": "",
    }
    xml_data = process_config.get("flow_xml")
    key = uuid8(8, 62, 'Process')
    user_task_key = uuid8(8, 62, 'UserTask')
    pattern = re.compile(r'id="UserTask_\w+"')
    matches = pattern.findall(str(xml_data))
    original_user_task = matches[0]
    original_user_task = original_user_task[4:len(original_user_task)-1]
    xml_data = xml_data.replace(process_config.get("key"), key, -1)
    xml_data = xml_data.replace(original_user_task, user_task_key, -1)
    reqest_body['flow_xml'] = encodeXML(xml_data)
    reqest_body['key'] = key
    doc_share_strategy_list = []
    doc_share_strategy_map = {
        "doc_id": " ",
        "doc_name": None,
        "doc_type": " ",
        "auditor_list": [],
        "audit_model": auditor.get("audit_model"),
        "no_auditor_type": auditor.get("no_auditor_type") if auditor.get("no_auditor_type") is not None else "auto_reject",
        "own_auditor_type": auditor.get("own_auditor_type") if auditor.get("own_auditor_type") is not None else "auto_reject",
        "strategy_type": auditor.get("strategy_type"),
        "act_def_id": user_task_key,
        "act_def_name": auditor.get("act_def_name"),
        "countersign_switch": advance_config.get("rename_countersign_switch"),
        "countersign_count": advance_config.get("rename_countersign_count"),
        "countersign_auditors": advance_config.get("rename_countersign_auditors"),
        "transfer_switch": advance_config.get("rename_transfer_switch"),
        "transfer_count": advance_config.get("rename_treansfer_count")
    }
    auditor_list = []
    for auditor_info in auditor.get("auditor_list"):
        auditor_map = {
            "user_id": auditor_info.get("user_id"),
            "user_name": auditor_info.get("user_name"),
            "user_code": auditor_info.get("user_code"),
            "parent_dep_paths": ""
        }
        auditor_list.append(auditor_map)
    doc_share_strategy_map['auditor_list'] = auditor_list
    doc_share_strategy_list.append(doc_share_strategy_map)
    reqest_body['audit_strategy_list'] = doc_share_strategy_list
    reqest_body['docShareStrategyList'] = doc_share_strategy_list
    url = "http://workflow-rest-private:9801/api/workflow-rest/v1/process-model-internal?type=new"
    request_body_json = json.dumps(reqest_body).encode(encoding='utf-8')
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json'}
    req = request.Request(url=url, data=request_body_json,
                          headers=headers, method='POST')
    response = request.urlopen(req)
    if response.status == 200:
        return key
    else:
        # 请求失败
        raise RequestException(
            f'[create_stratege] Request failed with status code: {response.status_code, str(request_body_json)}')


def migration_data() -> dict:
    new_share_stratege_map = {"real_name": [], "anonymous": []}
    stratege_datas = query_stratege_data(conn_cursor)
    # 包含转审和加签开关
    dict_datas = query_dict_data(conn_cursor)
    # 获取流程信息
    for stratege in stratege_datas:
        try:
            # 流程信息
            process_config = retry_function(
                fetch_process_config, 3, 1, stratege)
            # 流程对应的审核员信息
            auditors = retry_function(get_share_auditors, 3, 1, stratege)
        except Exception as e:
            print(e)
            continue
        for auditor in auditors:
            try:
                key = retry_function(create_stratege, 3, 1,
                                     process_config, auditor, dict_datas)
                share_stratege_info = [auditor.get("doc_id"), auditor.get(
                    "doc_name"), auditor.get("doc_type"), key]
                if process_config.get("key") == 'Process_SHARE001':
                    new_share_stratege_map['real_name'].append(
                        share_stratege_info)
                else:
                    new_share_stratege_map['anonymous'].append(
                        share_stratege_info)
            except Exception as e:
                print(e)
                continue
    # new_share_stratege_map 数据顺序[doc_id, doc_name, doc_type, proc_def_id]
    return new_share_stratege_map

# doc-share升级脚本部分，添加数据时，做到幂等性，需要判断doc-share共享审核是否已绑定流程，若绑定流程跳过


def update_audit_policy(conn_cursor):
    share_stratege_map = migration_data()
    typeArry = ['real_name', 'anonymous']
    for userTypeStr in typeArry:
        # 共享审核策略
        user_share_stratege_info = share_stratege_map[userTypeStr]
        userType = USER_TYPE
        if userTypeStr == 'anonymous':
            userType = ANYONE_TYPE
        for info in user_share_stratege_info:
            doc_lib_id = info[0]
            doc_lib_name = info[1]
            doc_lib_type = docLibTypeMap[info[2]]
            if doc_lib_id[:3] == "all":
                doc_lib_id = 'gns://00000000000000000000000000000000'
                doc_lib_name = doc_lib_id
            else:
                if info[2] == 'user_doc_lib':
                    # 个人文档库时, workflow存储的doc_id是用户id，需要去文档库表查找
                    doc_lib_id = get_user_doc_lib_id(conn_cursor, doc_lib_id)
            # 文档库没找到 直接跳过
            if doc_lib_id == '':
                continue
            # 添加策略
            select_policy_sql = """
                select f_doc_lib_id from anyshare.t_audit_policy where f_type = {} and f_doc_lib_id = '{}' and f_doc_lib_type = {};
            """
            select_policy_sql = select_policy_sql.format(
                userType, info[0], doc_lib_type)
            conn_cursor.execute(select_policy_sql)
            column_res = conn_cursor.fetchall()
            # 如果策略存在则跳过
            if column_res:
                continue
            dt = datetime.datetime.now()
            timestamp = int(dt.timestamp() * 1000000)
            insert_policy_sql = """
                    insert into anyshare.t_audit_policy (f_type, f_doc_lib_id, f_doc_lib_name, f_doc_lib_type, f_proc_def_key, f_create_time) values ({},'{}','{}',{},'{}',{});
                """
            sqlStr = insert_policy_sql.format(
                userType, doc_lib_id, doc_lib_name, doc_lib_type, info[3][:16], timestamp)
            conn_cursor.execute(sqlStr)
    return


def get_user_doc_lib_id(conn_cursor, user_id):
    doc_lib_id = ""
    GET_USER__DOC_SQL = """select f_doc_id from anyshare.t_acs_doc where f_creater_id = '{}';""".format(
        user_id)
    conn_cursor.execute(GET_USER__DOC_SQL)
    docs_res = conn_cursor.fetchall()
    for rs in docs_res:
        doc_lib_id = rs[0]
    return doc_lib_id


def uuid8(lens=None, radix=None, prefix=None):
    chars = list(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    uuid = []
    radix = radix or len(chars)
    if lens:
        for i in range(lens):
            uuid.append(chars[int(random.random() * radix)])
    return "{}_{}".format(prefix, ''.join(uuid))


def encodeXML(xml: str) -> str:
    url_encoded_xml = parse.quote(xml, safe='/:?=&')
    return base64.b64encode(url_encoded_xml.encode("latin1")).decode('utf-8')


def retry_function(func, max_retries=3, delay=1, *args, **kwargs):
    for _ in range(max_retries):
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            print(
                f"[retry_function] Function {func.__name__} Exception caught: {e}")
            time.sleep(delay)
    raise Exception(
        f"[retry_function] Function {func.__name__} exceeded maximum retry attempts")


class RequestException(Exception):
    def __init__(self, message="请求异常"):
        self.message = message
        super().__init__(self.message)


if __name__ == "__main__":
    conn = get_conn(os.environ["DB_USER"], os.environ["DB_PASSWD"],
                    os.environ["DB_HOST"], os.environ["DB_PORT"])
    conn_cursor = conn.cursor()
    try:
        update_audit_policy(conn_cursor)
        conn.commit()
    except Exception:
        raise Exception()
    finally:
        conn_cursor.close()
        conn.close()
