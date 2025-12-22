# -*- coding:utf-8 -*-
from dataclasses import dataclass, field
from typing import List, Union

from fastapi import Body
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import pymysql, re

class TableRequest(BaseModel):
    host: str
    user: str
    password: str
    database: str
    table_name: str
    port: int = 3306
    get_samples: bool = True  # 新增参数，控制是否获取样本值

def get_create_table_statement(params: TableRequest = Body(...)):
    """
    获取指定表的建表语句（CREATE TABLE），并在每个字段的注释中添加三个去重样本值
    
    参数:
        params (TableRequest): 包含数据库连接信息和表名的请求参数
    
    返回:
        str: 包含样本值的建表语句（CREATE TABLE ...）
    """
    try:
        # 建立数据库连接
        connection = pymysql.connect(
            host=params.host,
            user=params.user,
            password=params.password,
            database=params.database,
            port=params.port,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # 使用 SHOW CREATE TABLE 获取建表语句
            sql = f"SHOW CREATE TABLE `{params.table_name}`"
            cursor.execute(sql)
            result = cursor.fetchone()
            
            if result:
                create_table_sql = result[1]
                print(create_table_sql)
                
                # 仅在需要时获取样本值
                if params.get_samples:
                    # 获取字段列表
                    cursor.execute(f"SHOW COLUMNS FROM `{params.table_name}`")
                    columns = cursor.fetchall()
                    
                    # 处理每个字段
                    for column in columns:
                        field_name = column[0]
                        # 获取三个去重样本值
                        cursor.execute(f"SELECT DISTINCT `{field_name}` FROM `{params.table_name}` LIMIT 3")
                        samples = [str(row[0]) for row in cursor.fetchall()]
                        
                        # 在字段定义末尾添加样本值注释
                        if samples:
                            # 查找字段定义的正则表达式，匹配到字段定义的末尾
                            field_pattern = re.compile(rf"(`{field_name}`.*?,)", re.DOTALL)
                            # 替换字段定义，在末尾添加注释
                            create_table_sql = field_pattern.sub(
                                rf"\1  # 部分样本值: {', '.join(samples)}", 
                                create_table_sql
                            )
                
                return create_table_sql
            else:
                print(f"表 {params.table_name} 不存在")
                return None
                
    except pymysql.Error as e:
        print(f"数据库错误: {e}")
        return None
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == '__main__':
    pass
