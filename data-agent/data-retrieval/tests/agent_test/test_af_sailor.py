# import sys
# sys.path.append("/mnt/pan/zkn/code_sdk/agent_678138/af-agent/src")
from af_agent.tools.base_tools.af_sailor import AfSailorTool
from af_agent.api.auth import get_authorization

if __name__ == "__main__":
    
    parameter = {
    "ad_appid": "O4ydIe0EcxLLZHVdK0O",
    "af_editions": "resource",
    "entity2service": {},
    "filter": {
        "asset_type": [
            -1
        ],
        "data_kind": "0",
        "department_id": [
            -1
        ],
        "end_time": "1800122122",
        "info_system_id": [
            -1
        ],
        "owner_id": [
            -1
        ],
        "publish_status_category": [
            -1
        ],
        "shared_type": [
            -1
        ],
        "start_time": "1600122122",
        "stop_entity_infos": [],
        "subject_id": [
            -1
        ],
        "update_cycle": [
            -1
        ]
    },
    "kg_id": 1693,
    "limit": 100,
    "query": "帮我查立白今年的销量是多少",
    "required_resource": {
        "lexicon_actrie": {
            "lexicon_id": "196"
        },
        "stopwords": {
            "lexicon_id": "197"
        }
    },
    "roles": [
        "normal",
        "data-owner",
        "data-butler",
        "data-development-engineer",
        "tc-system-mgm"
    ],
    "session_id": "84e50996e7b588d154c65e2329e5ff63",
    "stop_entities": [],
    "stopwords": [],
    "stream": False,
    "subject_id": "1a5df062-e2e9-11ee-bc25-de01d9e8c5c1",
    "subject_type": "user",
    "token": get_authorization("https://10.4.109.142", "liberly", "111111"),
    
}
    tool = AfSailorTool(parameter=parameter)
    import asyncio
    print(asyncio.run(tool.ainvoke({"question": "北京市门头沟区有哪些公司的股权是冻结的"})))
    
    # print(tool.invoke({"question": "北京市门头沟区有哪些公司的股权是冻结的"}))