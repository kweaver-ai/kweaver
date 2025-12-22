#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 text2sql_parser.py 功能
"""

import sys
import os
import json

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from data_retrieval.parsers.text2sql_parser import JsonText2SQLRuleBaseParser, RuleBaseSource, MysqlKeyword


def create_test_source():
    """创建测试用的数据源"""
    tables = [
        "vdm_maria_jfsalikv.default.supply_chain",
        "vdm_maria_jfsalikv.default.t_sales_2025"
    ]
    
    en2types = {
        "vdm_maria_jfsalikv.default.supply_chain": {
            "date": "date",
            "area_2_province": "string",
            "bo_2_category": "string",
            "brand": "string"
        },
        "vdm_maria_jfsalikv.default.t_sales_2025": {
            "date": "date",
            "area_2_province": "string",
            "bo_2_category": "string",
            "brand": "string",
            "target_blitz": "number"
        }
    }
    
    return RuleBaseSource(tables=tables, en2types=en2types)


def test_sql_parsing():
    """测试 SQL 解析功能"""
    print("=== 测试 SQL 解析功能 ===")
    
    # 创建解析器实例
    source = create_test_source()
    parser = JsonText2SQLRuleBaseParser(source, sql_limit=100)
    
    # 测试 SQL
    test_sql = '''SELECT DATE_TRUNC('month', T2."date") AS "月份", SUM(T2."target_blitz") AS "战斗目标" 
FROM vdm_maria_jfsalikv.default."supply_chain" T1 
JOIN vdm_maria_jfsalikv.default."t_sales_2025" T2 
ON T1."date" = T2."date" AND T1."area_2_province" = T2."area_2_province" 
AND T1."bo_2_category" = T2."bo_2_category" AND T1."brand" = T2."brand" 
GROUP BY DATE_TRUNC('month', T2."date")'''
    
    print(f"原始 SQL:\n{test_sql}")
    print("\n" + "="*50)
    
    # 测试各种检查方法
    print("\n1. 测试 _check_limit:")
    result = parser._check_limit(test_sql)
    print(f"结果: {result}")
    
    print("\n2. 测试 _check_space:")
    result = parser._check_space(test_sql)
    print(f"结果: {result}")
    
    print("\n3. 测试 _check_punctuation:")
    result = parser._check_punctuation(test_sql)
    print(f"结果: {result}")
    
    print("\n4. 测试 _check_table:")
    result = parser._check_table(test_sql)
    print(f"结果: {result}")
    
    print("\n5. 测试 _check_in:")
    result = parser._check_in(test_sql)
    print(f"结果: {result}")
    
    print("\n6. 测试 format_sql:")
    result = parser.format_sql(test_sql)
    print(f"结果:\n{result}")


def test_parse_result():
    """测试完整的结果解析"""
    print("\n=== 测试完整的结果解析 ===")
    
    # 创建解析器实例
    source = create_test_source()
    parser = JsonText2SQLRuleBaseParser(source, sql_limit=100)
    
    # 模拟 LLM 返回的结果
    mock_result = [
        type('Generation', (), {
            'text': '''```sql
SELECT DATE_TRUNC('month', T2."date") AS "月份", SUM(T2."target_blitz") AS "战斗目标" 
FROM vdm_maria_jfsalikv.default."supply_chain" T1 
JOIN vdm_maria_jfsalikv.default."t_sales_2025" T2 
ON T1."date" = T2."date" AND T1."area_2_province" = T2."area_2_province" 
AND T1."bo_2_category" = T2."bo_2_category" AND T1."brand" = T2."brand" 
GROUP BY DATE_TRUNC('month', T2."date")
```

{
    "sql": "SELECT DATE_TRUNC('month', T2.\"date\") AS \"月份\", SUM(T2.\"target_blitz\") AS \"战斗目标\" FROM vdm_maria_jfsalikv.default.\"supply_chain\" T1 JOIN vdm_maria_jfsalikv.default.\"t_sales_2025\" T2 ON T1.\"date\" = T2.\"date\" AND T1.\"area_2_province\" = T2.\"area_2_province\" AND T1.\"bo_2_category\" = T2.\"bo_2_category\" AND T1.\"brand\" = T2.\"brand\" GROUP BY DATE_TRUNC('month', T2.\"date\")",
    "explanation": "这条SQL查询的目的是按月统计销售目标数据。它通过连接supply_chain表和t_sales_2025表，按照日期、省份、类别和品牌进行匹配，然后按月份分组计算目标销售总额。"
}'''
        })()
    ]
    
    print("模拟 LLM 返回结果:")
    print(mock_result[0].text)
    print("\n" + "="*50)
    
    # 解析结果
    result = parser.parse_result(mock_result)
    
    print("\n解析后的结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))


def test_column_type_detection():
    """测试列类型检测功能"""
    print("\n=== 测试列类型检测功能 ===")
    
    # 创建解析器实例
    source = create_test_source()
    parser = JsonText2SQLRuleBaseParser(source, sql_limit=100)
    
    test_sql = '''SELECT DATE_TRUNC('month', T2."date") AS "月份", SUM(T2."target_blitz") AS "战斗目标" 
FROM vdm_maria_jfsalikv.default."supply_chain" T1 
JOIN vdm_maria_jfsalikv.default."t_sales_2025" T2 
ON T1."date" = T2."date" AND T1."area_2_province" = T2."area_2_province" 
AND T1."bo_2_category" = T2."bo_2_category" AND T1."brand" = T2."brand" 
GROUP BY DATE_TRUNC('month', T2."date")'''
    
    # 测试不同类型的列
    test_columns = [
        'T2."date"',
        'T2."target_blitz"',
        'T1."area_2_province"',
        'DATE_TRUNC(\'month\', T2."date")'
    ]
    
    for column in test_columns:
        try:
            column_type = parser.get_column_type(column, test_sql)
            print(f"列 {column} 的类型: {column_type}")
        except Exception as e:
            print(f"列 {column} 类型检测失败: {e}")


def test_edge_cases():
    """测试边界情况"""
    print("\n=== 测试边界情况 ===")
    
    # 创建解析器实例
    source = create_test_source()
    parser = JsonText2SQLRuleBaseParser(source, sql_limit=100)
    
    # 测试空 SQL
    print("1. 测试空 SQL:")
    try:
        result = parser._check_limit("")
        print(f"结果: {result}")
    except Exception as e:
        print(f"错误: {e}")
    
    # 测试包含 IN 子句的 SQL
    print("\n2. 测试包含 IN 子句的 SQL:")
    in_sql = '''SELECT * FROM vdm_maria_jfsalikv.default."t_sales_2025" 
WHERE "date" IN ('2025-01-01', '2025-01-02', '2025-01-03')'''
    
    result = parser._check_in(in_sql)
    print(f"结果: {result}")
    
    # 测试包含函数调用的 SQL
    print("\n3. 测试包含函数调用的 SQL:")
    func_sql = '''SELECT YEAR(T2."date") AS "年份", SUM(T2."target_blitz") AS "战斗目标" 
FROM vdm_maria_jfsalikv.default."t_sales_2025" T2 
WHERE YEAR(T2."date") IN (2024, 2025)'''
    
    result = parser._check_in(func_sql)
    print(f"结果: {result}")


def test_mysql_keywords():
    """测试 MySQL 关键字"""
    print("\n=== 测试 MySQL 关键字 ===")
    
    print("MySQL 关键字:")
    print(f"from_select: {MysqlKeyword.from_select}")
    print(f"from_in: {MysqlKeyword.from_in}")
    print(f"from_date: {MysqlKeyword.from_date}")
    print(f"datatime: {MysqlKeyword.datatime}")


if __name__ == "__main__":
    # 运行所有测试
    test_sql_parsing()
    test_parse_result()
    test_column_type_detection()
    test_edge_cases()
    test_mysql_keywords()
    
    print("\n=== 所有测试完成 ===")
