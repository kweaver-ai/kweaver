keyword_schema = {
    'entity': [
        {
            'name': 'district',
            'alias': '地区',
            'props': [{
                'name': 'name',
                'alias': '名称',
                'data_type': 'string',
                'partial_values': ['市辖区', '鼓楼区', '市中区', '新华区', '省直辖县级行政区划']
            }]
        },
        {
            'name': 'person',
            'alias': '人员',
            'props': [
                {
                    'name': 'position',
                    'alias': '职位',
                    'data_type': 'string',
                    'partial_values': ['技术工程师', '高级技术工程师', '高级后端开发工程师', '高级解决方案顾问']
                },
                {
                    'name': 'name',
                    'alias': '姓名',
                    'data_type': 'string',
                    'partial_values': ['王磊', '李蓉', '余双军', '潘月梅', '靳慧慧']
                }]
        },
		{
            'name': 'orgnization',
            'alias': '部门',
            'props': [{
                'name': 'name',
                'alias': '名称',
                'data_type': 'string',
                'partial_values': ['存储测试组', '系统测试部', '引擎研发部', '北区企业数据智能方案...', '引擎测试组']
            }]
        }],
    'edge': [{
        'name': 'district_2_district_child',
        'alias': '下级地区',
        'subject': 'district',
        'object': 'district',
        'description': '地区-下级地区->地区'
    }, {
        'name': 'person_2_district_work_at',
        'alias': '工作地点',
        'subject': 'person',
        'object': 'district',
        'description': '人员-工作地点->地区'
    }, {
        'name': 'person_2_orgnization_belong_to',
        'alias': '所在部门',
        'subject': 'person',
        'object': 'orgnization',
        'description': '人员-所在部门->部门'
    }, {
        'name': 'orgnization_2_orgnization_child',
        'alias': '子部门',
        'subject': 'orgnization',
        'object': 'orgnization',
        'description': '部门-子部门->部门'
    }]
}

prompt_extract_keywords = """
你是一个根据问题生成cypher的专家.

第一步：
用户提问时，可能存在指代不明，意图不明，缩略词等问题，所以请根据提供的对话信息或背景信息，进行问题补全。
第二步：
根据补全的问题，识别并提取涉及实体和关系以及查询目标，用于辅助生成cypher。
这些元素对于生成cypher至关重要。


你可以参考以下样例：
图谱schema：
{keyword_schema}

背景信息：
AnyDATA研发线(缩写ad)：
部门人员：张三、李四、王五

question: 张三和李四是ad的嘛，岗位是什么，是前端吗，他们在哪里上班？团队有多少人。
输出格式：
{{
"补全问题": "张三和李四是AnyDATA研发线的吗，职位是前端工程师吗，工作地点在哪里，AnyDATA研发线及其子部门共有多少人",
"涉及实体": {{'张三': 'person.name', '李四': 'person.name', 'AnyDATA研发线': 'orgnization.name', '前端工程师': 'person.position'}},
"涉及关系": ['person_2_orgnization_belong_to', 'person_2_district_work_at', 'orgnization_2_orgnization_child'],
"查询实体": ['orgnization.name', 'person.name', 'person.position', 'district.name']
}}

现在我给你新的图谱，图数据库schema如下：
===(1)、图数据库的schema定义，分别为节点、节点属性和关系的表示。
{schema}


===(2)、背景信息：
{background}


注意：请严格参考样例，只需要按照指定格式输出，务必不要解释其他内容，没有内容的字段请设为空。

question: {question}
"""
