import json

name2roleid = {
    "超级管理员": "7dcfcc9c-ad02-11e8-aa06-000c29358ad6",
    "系统管理员": "d2bd2082-ad03-11e8-aa06-000c29358ad6",
    "安全管理员": "d8998f72-ad03-11e8-aa06-000c29358ad6",
    "审计管理员": "def246f2-ad03-11e8-aa06-000c29358ad6",
    "组织管理员": "e63e1c88-ad03-11e8-aa06-000c29358ad6",
    "组织审计员": "f06ac18e-ad03-11e8-aa06-000c29358ad6",
    "数据管理员": "00990824-4bf7-11f0-8fa7-865d5643e61f",
    "AI管理员": "3fb94948-5169-11f0-b662-3a7bdba2913f",
    "应用管理员": "1572fb82-526f-11f0-bde6-e674ec8dde71",
    "部门": "00000000-0000-0000-0000-000000000000",
}

menuid2name = {
    "home": "超级助手",
    "dataagent-factory": "智能体工厂",
    "ontology": "本体引擎",
    "datalakes": "多模态数据湖",
    "model-factory": "模型工厂",
    "settings": "管理后台",
    "information-security": "信息安全管理",
    #
    "user-org": "用户与组织",
    "audit": "审计与监控",
    "security": "安全策略",
    #
    "dataagent": "数据智能体",
    "mdl-manage-meta-af": "元数据服务",
    "metric-af": "指标管理",
    #
    "data-processing": "数据处理流",
    "operator-management": "算子管理",
    "all-operators": "全部算子",
    # 
    "workflow": "工作流",
    "aievla": "智能评测",
    "vega": "vega虚拟化",
}

policies = {
    "超级管理员": ["datalakes", "settings", "information-security"],
    "系统管理员": ["datalakes", "settings", "information-security"],
    "安全管理员": ["user-org", "audit", "security"],
    "审计管理员": ["audit"],
    "组织管理员": ["user-org"],
    "组织审计员": ["audit"],
    #
    "数据管理员": [
        "home",
        "dataagent-factory",
        "data-processing",
        "ontology",
        "datalakes",
        "model-factory",
        "mdl-manage-meta-af",
        "metric-af",
    ],
    "AI管理员": [
        "home",
        "dataagent-factory",
        "data-processing",
        "ontology",
        "datalakes",
        "model-factory",
        "mdl-manage-meta-af",
        "metric-af",
    ],
    "应用管理员": [
        "home",
        "dataagent-factory",
        "data-processing",
        "ontology",
        "datalakes",
        "model-factory",
        "mdl-manage-meta-af",
        "metric-af",
    ],
    "部门": [
        "home",
        "dataagent",
        "ontology",
        "datalakes",
        "model-factory",
        "mdl-manage-meta-af",
        "metric-af",
        "operator-management",
        "all-operators",
        "workflow",
        "aievla",
        "vega",
    ],  # 业务角色
}


def gen_policy(rolename: str, menuid: str):
    _type = "role"
    if rolename == "部门":
        _type = "department"
    return {
        "expires_at": "1970-01-01T08:00:00+08:00",
        "resource": {"id": menuid, "type": "menu", "name": menuid2name[menuid]},
        "accessor": {
            "id": name2roleid[rolename],
            "type": _type,
            "name": rolename,
        },
        "operation": {"allow": [{"id": "display"}], "deny": []},
    }



def gen():
    generated_policies = []

    for rolename, menus in policies.items():
        for menu in menus:
            generated_policies.append(gen_policy(rolename, menu))

    print(json.dumps(generated_policies, indent=4, ensure_ascii=False))


def get_roles(name: str):
    from collections import defaultdict
    infos = defaultdict(list)
    for rolename, menus in policies.items():
        for menu in menus:
            infos[menu].append(rolename)
    print(",".join(infos[name]))

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 2:
        get_roles(sys.argv[1])
    else:
        gen()