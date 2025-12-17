# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-5-27
import sqlglot
from sqlglot.expressions import Table, Column, Alias, Join, EQ, Star
import uuid
import hashlib
import json

def analyze_sql(sql):
    expr = sqlglot.parse_one(sql)
    
    # 表别名映射
    tables = {t.alias_or_name: t.name for t in expr.find_all(Table)}
    
    # 字段 + 表别名 - 重新组织格式
    columns_by_table = {}
    
    # 先收集所有列信息
    first_table = list(tables.keys())[0] if tables else ""
    all_columns = [(c.table if c.table else first_table, c.name) for c in expr.find_all(Column)]    
    # 字段别名（AS）- 加上表名
    aliases = []
    for a in expr.expressions:
        if isinstance(a, Alias):
            aliases.append((a.this.table if a.this.table else first_table, a.alias_or_name, a.this.name))
    
    # 构建带表名的字段映射
    column_mapping = {f"{table}.{name}": alias_or_name for table, alias_or_name, name in aliases}
    
    # 按表组织列信息
    for table_alias_or_name, table_name in tables.items():
        table_columns = []
        
        # 获取该表的所有列
        for col_table, col_name in all_columns:
            if col_table in [table_name, table_alias_or_name]:
                # 查找该列的别名
                col_alias = column_mapping.get(f"{col_table}.{col_name}", "")
                
                table_columns.append({
                    "name": col_name,
                    "alias": col_alias,
                    "expression": f"{col_table}.{col_name}"
                })
        
        # 去重（因为同一列可能在不同地方使用）
        unique_columns = []
        seen = set()
        for col in table_columns:
            if col["name"] not in seen:
                seen.add(col["name"])
                unique_columns.append(col)
        
        columns_by_table[table_alias_or_name] = {
            "table": table_alias_or_name,
            "alias": table_name,
            "columns": unique_columns
        }
    
    # 分析 JOIN
    joins = expr.find_all(Join)
    join_info = []
    for join in joins:
        join_type = join.kind.upper() if join.kind else "INNER"
        join_table = join.this.alias_or_name
        join_table_name = join.this.name
        
        # 查找 JOIN 中的 EQ 表达式
        eq_exprs = list(join.find_all(EQ))
        
        if eq_exprs:
            # 使用第一个等号表达式作为 JOIN 条件
            eq_expr = eq_exprs[0]
            join_condition = str(eq_expr)
            
            # 获取左右两边的列
            left_col = eq_expr.left
            right_col = eq_expr.right
            
            # 检查是否是 Column 类型
            if isinstance(left_col, Column) and isinstance(right_col, Column):
                # 获取左边表的信息
                left_table_name_or_alias = left_col.table
                left_table_name = tables.get(left_table_name_or_alias, left_table_name_or_alias)
                
                # 获取右边表的信息
                right_table_name_or_alias = right_col.table
                right_table_name = tables.get(right_table_name_or_alias, right_table_name_or_alias)
                
                join_fields = {
                    "left": {
                        "table_name_or_alias": left_col.table,
                        "table": left_table_name,
                        "column": left_col.name
                    },
                    "right": {
                        "table_name_or_alias": right_col.table,
                        "table": right_table_name,
                        "column": right_col.name
                    }
                }
            else:
                join_fields = None
        else:
            join_condition = None
            join_fields = None
        
        join_info.append({
            "type": join_type,
            "table": join_table,
            "table_name": join_table_name,
            "condition": join_condition,
            "fields": join_fields
        })
    
    return {
        "tables": tables,
        "columns": columns_by_table,
        # "aliases": aliases,
        # "column_mapping": column_mapping,
        "join_info": join_info
    }

def generate_node_id(table_name, properties):
    """
    基于表名和属性生成确定性的节点 ID
    Args:
        table_name: 表名
        properties: 节点属性列表
    Returns:
        基于属性生成的 UUID
    """
    # 将属性按名称排序，确保相同属性生成相同的 ID
    sorted_props = sorted(properties, key=lambda x: x["name"])
    # 构建唯一标识字符串
    props_str = json.dumps(sorted_props, sort_keys=True, ensure_ascii=False)
    # 使用表名和属性生成 hash
    hash_input = f"{table_name}:{props_str}"
    # 生成 hash
    hash_obj = hashlib.md5(hash_input.encode())
    # 使用 hash 的前 16 字节生成 UUID
    return str(uuid.UUID(bytes=hash_obj.digest()[:16]))

def build_graph(sql, columns, data):
    """
    构建图结构
    Args:
        sql: SQL 查询语句
        data: 包含 columns 和 data 的字典
    Returns:
        图结构数据
    """
    if not data or not columns:
        return {
            "nodes": [],
            "edges": []
        }

    # 分析 SQL
    analysis = analyze_sql(sql)
    
    # 初始化节点和边
    nodes = {}
    edges = []
    
    # 创建列名到表的映射, 转为真实的表名
    column_to_table = {}
    for table_alias_or_name, table_info in analysis["columns"].items():
        for col in table_info["columns"]:
            col_name = col["alias"] or col["name"]
            if col_name in [c["name_in_sql"] for c in columns]:
                column_to_table[col_name] = table_info["table"]
    
    # 遍历数据行
    for _, row in enumerate(data):
        # 将表中的实体加入节点，随后再处理边
        nodes_in_row = {}
        edges_in_row = {}

        for col_index, col in enumerate(columns):
            col_name = col["name_in_sql"]
            table_alias_or_name = column_to_table[col_name]

            if table_alias_or_name not in nodes_in_row:
                nodes_in_row[table_alias_or_name] = {
                    "id": "",
                    "name": "",
                    "data_source_name": analysis["tables"].get(table_alias_or_name, table_alias_or_name),
                    "properties": []
                }
            
            nodes_in_row[table_alias_or_name]["properties"].append({
                "name": col["name"],
                "name_in_sql": col_name,
                "value": row[col_index]
            })
        
        # 有 properties 的节点加入 nodes
        for table_alias_or_name in nodes_in_row:
            if nodes_in_row[table_alias_or_name]["properties"]:
                # 这里的目的在本行中，计算边的起点或终点的 id
                node_id = generate_node_id(table_alias_or_name, nodes_in_row[table_alias_or_name]["properties"])
                nodes_in_row[table_alias_or_name]["id"] = node_id

                # 设置实体的显示名称
                if len(nodes_in_row[table_alias_or_name]["properties"]) >= 1:
                    nodes_in_row[table_alias_or_name]["name"] = nodes_in_row[table_alias_or_name]["properties"][0]["value"]

                # 如果节点不存在，则加入 nodes
                if node_id not in nodes:
                    nodes[node_id] = nodes_in_row[table_alias_or_name]

        for join in analysis["join_info"]:
            if join["fields"]:
                left_table = join["fields"]["left"]["table_name_or_alias"]
                right_table = join["fields"]["right"]["table_name_or_alias"]
                
                if left_table in nodes_in_row \
                    and nodes_in_row[left_table]["properties"] \
                    and right_table in nodes_in_row \
                    and nodes_in_row[right_table]["properties"]:
                    # 生成基于源节点和目标节点的边 ID
                    edge_id = str(uuid.uuid5(
                        uuid.NAMESPACE_DNS,
                        f"{nodes_in_row[left_table]['id']}_{nodes_in_row[right_table]['id']}"
                    ))
                    edges_in_row[f"{left_table}_{right_table}"] = {
                        "id": edge_id,
                        "source": nodes_in_row[left_table]["id"],
                        "target": nodes_in_row[right_table]["id"],
                        "condition": join["condition"],
                    }

        edges.extend(edges_in_row.values())
    
    # 构建完整的图结构
    graph = {
        "nodes": list(nodes.values()),
        "edges": edges
    }
    
    return graph

if __name__ == "__main__":

    case_1 = {
        "sql": """
        SELECT T1.coursecode AS "课程代码", T1.is_pass AS "是否通过", T1.major_code AS "专业代码", 
            T1.major_name AS "专业名称", T1.name AS "课程名称", T1.score AS "得分", 
            T1.scoredescription AS "违纪代码", T1.semester AS "学期代码", T1.specialtylevel AS "专业层次", 
            T1.studentnumber AS "学号", T1.studenttype AS "学生类型", T1.teachingschoolcode AS "教学机构代码", 
            T1.violation_description AS "违纪描述", T2.semester_code AS "学期代码", T2.semester_name AS "学期名称", 
            T2.semester_type AS "学期类型", T2.semester_type_code AS "学期类型代码", T2.semester_year AS "学年", 
            T2.semester_year_code AS "学年代码" 
        FROM vdm_maria_6nmp7j5l.default.dwd_student_paper_scores T1 
        INNER JOIN vdm_maria_6nmp7j5l.default.dim_semester T2 
        ON T1.semester = T2.semester_code 
        WHERE T2.semester_name = '2021年秋' 
        LIMIT 2
        """,
        'data': [
            ['04020', '1', '03010100', '法学', '管理英语4', 74.0, '0', '211', '2', '1880201200014', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21],
            ['04020', '0', '03010100', '法学', '管理英语4', 52.0, '0', '211', '2', '1880201200022', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21]
        ],
        'columns': [
            {'name': '课程代码', 'type': 'varchar(200)', 'name_in_sql': '课程代码'},
            {'name': '是否通过', 'type': 'varchar(200)', 'name_in_sql': '是否通过'},
            {'name': '专业代码', 'type': 'varchar(200)', 'name_in_sql': '专业代码'},
            {'name': '专业名称', 'type': 'varchar(200)', 'name_in_sql': '专业名称'},
            {'name': '课程名称', 'type': 'varchar(200)', 'name_in_sql': '课程名称'},
            {'name': '得分', 'type': 'double', 'name_in_sql': '得分'},
            {'name': '违纪代码', 'type': 'varchar(200)', 'name_in_sql': '违纪代码'},
            {'name': '学期代码', 'type': 'varchar(200)', 'name_in_sql': '学期代码'},
            {'name': '专业层次', 'type': 'varchar(200)', 'name_in_sql': '专业层次'},
            {'name': '学号', 'type': 'varchar(200)', 'name_in_sql': '学号'},
            {'name': '学生类型', 'type': 'integer', 'name_in_sql': '学生类型'},
            {'name': '教学机构代码', 'type': 'varchar(200)', 'name_in_sql': '教学机构代码'},
            {'name': '违纪描述', 'type': 'varchar(200)', 'name_in_sql': '违纪描述'},
            {'name': '学期代码', 'type': 'integer', 'name_in_sql': '学期代码'},
            {'name': '学期名称', 'type': 'varchar(200)', 'name_in_sql': '学期名称'},
            {'name': '学期类型', 'type': 'varchar(200)', 'name_in_sql': '学期类型'},
            {'name': '学期类型代码', 'type': 'integer', 'name_in_sql': '学期类型代码'},
            {'name': '学年', 'type': 'integer', 'name_in_sql': '学年'},
            {'name': '学年代码', 'type': 'integer', 'name_in_sql': '学年代码'}
        ]
    }

    case_2 = {
        "sql": """
        SELECT dwd_student_paper_scores.coursecode, dwd_student_paper_scores.is_pass, 
            dwd_student_paper_scores.major_code, dwd_student_paper_scores.major_name, 
            dwd_student_paper_scores.name, dwd_student_paper_scores.score, 
            dwd_student_paper_scores.scoredescription, dwd_student_paper_scores.semester, 
            dwd_student_paper_scores.specialtylevel, dwd_student_paper_scores.studentnumber, 
            dwd_student_paper_scores.studenttype, dwd_student_paper_scores.teachingschoolcode, 
            dwd_student_paper_scores.violation_description, dim_semester.semester_code, 
            dim_semester.semester_name, dim_semester.semester_type, 
            dim_semester.semester_type_code, dim_semester.semester_year, 
            dim_semester.semester_year_code
        FROM vdm_maria_6nmp7j5l.default.dwd_student_paper_scores
        INNER JOIN vdm_maria_6nmp7j5l.default.dim_semester
        ON dwd_student_paper_scores.semester = dim_semester.semester_code
        WHERE dim_semester.semester_name = '2021年秋'
        LIMIT 2
        """,
        'data': [
            ['04020', '1', '03010100', '法学', '管理英语4', 74.0, '0', '211', '2', '1880201200014', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21],
            ['04020', '0', '03010100', '法学', '管理英语4', 52.0, '0', '211', '2', '1880201200022', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21]
        ],
        'columns': [
            {'name': 'coursecode', 'type': 'varchar(200)', 'name_in_sql': 'coursecode'},
            {'name': 'is_pass', 'type': 'varchar(200)', 'name_in_sql': 'is_pass'},
            {'name': 'major_code', 'type': 'varchar(200)', 'name_in_sql': 'major_code'},
            {'name': 'major_name', 'type': 'varchar(200)', 'name_in_sql': 'major_name'},
            {'name': 'name', 'type': 'varchar(200)', 'name_in_sql': 'name'},
            {'name': 'score', 'type': 'double', 'name_in_sql': 'score'},
            {'name': 'scoredescription', 'type': 'varchar(200)', 'name_in_sql': 'scoredescription'},
            {'name': 'semester', 'type': 'varchar(200)', 'name_in_sql': 'semester'},
            {'name': 'specialtylevel', 'type': 'varchar(200)', 'name_in_sql': 'specialtylevel'},
            {'name': 'studentnumber', 'type': 'varchar(200)', 'name_in_sql': 'studentnumber'},
            {'name': 'studenttype', 'type': 'integer', 'name_in_sql': 'studenttype'},
            {'name': 'teachingschoolcode', 'type': 'varchar(200)', 'name_in_sql': 'teachingschoolcode'},
            {'name': 'violation_description', 'type': 'varchar(200)', 'name_in_sql': 'violation_description'},
            {'name': 'semester_code', 'type': 'integer', 'name_in_sql': 'semester_code'},
            {'name': 'semester_name', 'type': 'varchar(200)', 'name_in_sql': 'semester_name'},
            {'name': 'semester_type', 'type': 'varchar(200)', 'name_in_sql': 'semester_type'},
            {'name': 'semester_type_code', 'type': 'integer', 'name_in_sql': 'semester_type_code'},
            {'name': 'semester_year', 'type': 'integer', 'name_in_sql': 'semester_year'},
            {'name': 'semester_year_code', 'type': 'integer', 'name_in_sql': 'semester_year_code'}
        ]
    }

    case_3 = {
        "sql": """
        SELECT dwd_student_paper_scores.coursecode AS "课程代码", 
            dwd_student_paper_scores.is_pass AS "是否通过", 
            dwd_student_paper_scores.major_code AS "专业代码", 
            dwd_student_paper_scores.major_name AS "专业名称", 
            dwd_student_paper_scores.name AS "课程名称", 
            dwd_student_paper_scores.score AS "得分", 
            dwd_student_paper_scores.scoredescription AS "违纪代码", 
            dwd_student_paper_scores.semester AS "学期代码", 
            dwd_student_paper_scores.specialtylevel AS "专业层次", 
            dwd_student_paper_scores.studentnumber AS "学号", 
            dwd_student_paper_scores.studenttype AS "学生类型", 
            dwd_student_paper_scores.teachingschoolcode AS "教学机构代码", 
            dwd_student_paper_scores.violation_description AS "违纪描述", 
            dim_semester.semester_code AS "学期代码", 
            dim_semester.semester_name AS "学期名称", 
            dim_semester.semester_type AS "学期类型", 
            dim_semester.semester_type_code AS "学期类型代码", 
            dim_semester.semester_year AS "学年", 
            dim_semester.semester_year_code AS "学年代码"
        FROM vdm_maria_6nmp7j5l.default.dwd_student_paper_scores
        INNER JOIN vdm_maria_6nmp7j5l.default.dim_semester
        ON dwd_student_paper_scores.semester = dim_semester.semester_code
        WHERE dim_semester.semester_name = '2021年秋'
        LIMIT 2
        """,
        'data': [
            ['04020', '1', '03010100', '法学', '管理英语4', 74.0, '0', '211', '2', '1880201200014', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21],
            ['04020', '0', '03010100', '法学', '管理英语4', 52.0, '0', '211', '2', '1880201200022', 2001, '8020200', '没有违纪', 211, '2021年秋', '秋', 1, 2021, 21]
        ],
        'columns': [
            {'name': '课程代码', 'type': 'varchar(200)', 'name_in_sql': '课程代码'},
            {'name': '是否通过', 'type': 'varchar(200)', 'name_in_sql': '是否通过'},
            {'name': '专业代码', 'type': 'varchar(200)', 'name_in_sql': '专业代码'},
            {'name': '专业名称', 'type': 'varchar(200)', 'name_in_sql': '专业名称'},
            {'name': '课程名称', 'type': 'varchar(200)', 'name_in_sql': '课程名称'},
            {'name': '得分', 'type': 'double', 'name_in_sql': '得分'},
            {'name': '违纪代码', 'type': 'varchar(200)', 'name_in_sql': '违纪代码'},
            {'name': '学期代码', 'type': 'varchar(200)', 'name_in_sql': '学期代码'},
            {'name': '专业层次', 'type': 'varchar(200)', 'name_in_sql': '专业层次'},
            {'name': '学号', 'type': 'varchar(200)', 'name_in_sql': '学号'},
            {'name': '学生类型', 'type': 'integer', 'name_in_sql': '学生类型'},
            {'name': '教学机构代码', 'type': 'varchar(200)', 'name_in_sql': '教学机构代码'},
            {'name': '违纪描述', 'type': 'varchar(200)', 'name_in_sql': '违纪描述'},
            {'name': '学期代码', 'type': 'integer', 'name_in_sql': '学期代码'},
            {'name': '学期名称', 'type': 'varchar(200)', 'name_in_sql': '学期名称'},
            {'name': '学期类型', 'type': 'varchar(200)', 'name_in_sql': '学期类型'},
            {'name': '学期类型代码', 'type': 'integer', 'name_in_sql': '学期类型代码'},
            {'name': '学年', 'type': 'integer', 'name_in_sql': '学年'},
            {'name': '学年代码', 'type': 'integer', 'name_in_sql': '学年代码'}
        ]
    }

    case_4 = {
        "sql": """
        SELECT coursecode AS "课程代码", 
            is_pass AS "是否通过", 
            major_code AS "专业代码", 
            major_name AS "专业名称", 
            name AS "课程名称", 
            score AS "得分", 
            scoredescription AS "违纪代码", 
            semester AS "学期代码", 
            specialtylevel AS "专业层次", 
            studentnumber AS "学号", 
            studenttype AS "学生类型", 
            teachingschoolcode AS "教学机构代码", 
            violation_description AS "违纪描述"
        FROM vdm_maria_6nmp7j5l.default.dwd_student_paper_scores
        WHERE semester = '211'
        LIMIT 2
        """,
        'data': [
            ['04020', '1', '03010100', '法学', '管理英语4', 74.0, '0', '211', '2', '1880201200014', 2001, '8020200', '没有违纪'],
            ['04020', '0', '03010100', '法学', '管理英语4', 52.0, '0', '211', '2', '1880201200022', 2001, '8020200', '没有违纪']
        ],
        'columns': [
            {'name': '课程代码', 'type': 'varchar(200)', 'name_in_sql': '课程代码'},
            {'name': '是否通过', 'type': 'varchar(200)', 'name_in_sql': '是否通过'},
            {'name': '专业代码', 'type': 'varchar(200)', 'name_in_sql': '专业代码'},
            {'name': '专业名称', 'type': 'varchar(200)', 'name_in_sql': '专业名称'},
            {'name': '课程名称', 'type': 'varchar(200)', 'name_in_sql': '课程名称'},
            {'name': '得分', 'type': 'double', 'name_in_sql': '得分'},
            {'name': '违纪代码', 'type': 'varchar(200)', 'name_in_sql': '违纪代码'},
            {'name': '学期代码', 'type': 'varchar(200)', 'name_in_sql': '学期代码'},
            {'name': '专业层次', 'type': 'varchar(200)', 'name_in_sql': '专业层次'},
            {'name': '学号', 'type': 'varchar(200)', 'name_in_sql': '学号'},
            {'name': '学生类型', 'type': 'integer', 'name_in_sql': '学生类型'},
            {'name': '教学机构代码', 'type': 'varchar(200)', 'name_in_sql': '教学机构代码'},
            {'name': '违纪描述', 'type': 'varchar(200)', 'name_in_sql': '违纪描述'}
        ]
    }

    # 从数据构建图
    # graph = build_graph(case_1["sql"], case_1["columns"], case_1["data"])
    # graph = build_graph(case_2["sql"], case_2["columns"], case_2["data"])
    # graph = build_graph(case_3["sql"], case_3["columns"], case_3["data"])
    graph = build_graph(case_4["sql"], case_4["columns"], case_4["data"])

    # 打印结果
    print(json.dumps(graph, indent=2, ensure_ascii=False))


