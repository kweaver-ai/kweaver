# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from af_agent.tools.base_tools.sql_helper import SQLHelperTool, CommandType
from af_agent.datasource.db_base import DataSource
from af_agent.errors import SQLHelperException


class MockDataSource(DataSource):
    """Mock data source for testing"""
    
    def __init__(self):
        self.tables = ["test_table"]
        self.metadata = [
            {
                "id": "test_id_1",
                "name": "测试表1",
                "description": "这是一个测试表",
                "type": "data_view"
            },
            {
                "id": "test_id_2", 
                "name": "测试表2",
                "description": "这是另一个测试表",
                "type": "data_view"
            }
        ]
        self.query_results = {
            "SELECT * FROM test_table LIMIT 5": {
                "data": [
                    {"id": 1, "name": "测试数据1", "value": 100},
                    {"id": 2, "name": "测试数据2", "value": 200},
                    {"id": 3, "name": "测试数据3", "value": 300}
                ],
                "columns": [
                    {"name": "id", "type": "int"},
                    {"name": "name", "type": "string"},
                    {"name": "value", "type": "int"}
                ]
            },
            "SELECT COUNT(*) FROM test_table": {
                "data": [{"count": 3}],
                "columns": [{"name": "count", "type": "int"}]
            }
        }
    
    def test_connection(self) -> bool:
        return True
    
    def query(self, query: str, as_gen=True, as_dict=True) -> dict:
        return self.query_results.get(query, {"data": [], "columns": []})
    
    async def query_async(self, query: str, as_gen=True, as_dict=True) -> dict:
        return self.query_results.get(query, {"data": [], "columns": []})
    
    def get_metadata(self, identities=None) -> list:
        return self.metadata
    
    async def get_metadata_async(self, identities=None) -> list:
        return self.metadata
    
    def get_rule_base_params(self):
        return {}
    
    def get_sample(self, identities=None, num: int = 5, as_dict: bool = False) -> list:
        return []
    
    def query_correction(self, query: str) -> str:
        return query
    
    def close(self):
        pass
    
    def get_description(self) -> dict:
        return {"description": "Mock data source for testing"}
    
    def set_tables(self, tables: list):
        self.tables = tables
    
    def get_tables(self) -> list:
        return self.tables


class TestSQLHelperTool:
    """Test SQL Helper Tool"""
    
    def setup_method(self):
        """Setup test environment"""
        self.mock_llm = Mock()
        self.mock_prompt_manager = Mock()
        self.data_source = MockDataSource()
        
        self.tool = SQLHelperTool.from_data_source(
            data_source=self.data_source,
            llm=self.mock_llm,
            prompt_manager=self.mock_prompt_manager
        )
    
    def test_init(self):
        """Test tool initialization"""
        assert self.tool.name == "sql_helper"
        assert "专门用于调用 SQL 语句的工具" in self.tool.description
        assert self.tool.data_source == self.data_source
    
    def test_get_desc_from_datasource(self):
        """Test getting description from data source"""
        self.tool.get_desc_from_datasource = True
        self.tool._get_desc_from_datasource(True)
        
        # Check if description contains data source info
        assert "包含的视图信息" in self.tool.description
    
    @pytest.mark.asyncio
    async def test_get_metadata(self):
        """Test getting metadata"""
        result = await self.tool._get_metadata()
        
        assert result["command"] == CommandType.GET_METADATA.value
        assert "metadata" in result
        assert "message" in result
        assert len(result["metadata"]) == 2
        assert result["metadata"][0]["id"] == "test_id_1"
        assert result["metadata"][0]["name"] == "测试表1"
    
    @pytest.mark.asyncio
    async def test_execute_sql_success(self):
        """Test successful SQL execution"""
        sql = "SELECT * FROM test_table LIMIT 5"
        result = await self.tool._execute_sql(sql)
        
        assert result["command"] == CommandType.EXECUTE_SQL.value
        assert result["sql"] == sql
        assert "data" in result
        assert "data_desc" in result
        assert "message" in result
        assert len(result["data"]) == 3
        assert result["data_desc"]["return_records_num"] == 3
        assert result["data_desc"]["real_records_num"] == 3
    
    @pytest.mark.asyncio
    async def test_execute_sql_with_data_title(self):
        """Test SQL execution with data_title parameter"""
        sql = "SELECT * FROM test_table LIMIT 5"
        data_title = "用户查询结果"
        result = await self.tool._execute_sql(sql, data_title)
        
        assert result["command"] == CommandType.EXECUTE_SQL.value
        assert result["sql"] == sql
        assert result["data_title"] == data_title
        assert "data" in result
        assert "data_desc" in result
        assert "message" in result
        assert len(result["data"]) == 3
    
    @pytest.mark.asyncio
    async def test_execute_sql_empty_result(self):
        """Test SQL execution with empty result"""
        sql = "SELECT * FROM non_existent_table"
        result = await self.tool._execute_sql(sql)
        
        assert result["command"] == CommandType.EXECUTE_SQL.value
        assert result["sql"] == sql
        assert result["data"] == []
        assert result["data_desc"]["return_records_num"] == 0
        assert result["data_desc"]["real_records_num"] == 0
        assert "无返回数据" in result["message"]
    
    @pytest.mark.asyncio
    async def test_execute_sql_empty_sql(self):
        """Test SQL execution with empty SQL"""
        with pytest.raises(SQLHelperException) as exc_info:
            await self.tool._execute_sql("")
        
        assert "SQL 语句不能为空" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_execute_sql_whitespace_sql(self):
        """Test SQL execution with whitespace-only SQL"""
        with pytest.raises(SQLHelperException) as exc_info:
            await self.tool._execute_sql("   ")
        
        assert "SQL 语句不能为空" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_arun_get_metadata(self):
        """Test async run with get_metadata command"""
        result = await self.tool._arun(command=CommandType.GET_METADATA.value)
        
        assert result["command"] == CommandType.GET_METADATA.value
        assert "metadata" in result
    
    @pytest.mark.asyncio
    async def test_arun_execute_sql(self):
        """Test async run with execute_sql command"""
        sql = "SELECT COUNT(*) FROM test_table"
        result = await self.tool._arun(
            command=CommandType.EXECUTE_SQL.value,
            sql=sql
        )
        
        assert result["command"] == CommandType.EXECUTE_SQL.value
        assert result["sql"] == sql
        assert "data" in result
    
    @pytest.mark.asyncio
    async def test_arun_execute_sql_with_data_title(self):
        """Test async run with execute_sql command and data_title"""
        sql = "SELECT COUNT(*) FROM test_table"
        data_title = "统计结果"
        result = await self.tool._arun(
            command=CommandType.EXECUTE_SQL.value,
            sql=sql,
            data_title=data_title
        )
        
        assert result["command"] == CommandType.EXECUTE_SQL.value
        assert result["sql"] == sql
        assert result["data_title"] == data_title
        assert "data" in result
    
    @pytest.mark.asyncio
    async def test_arun_invalid_command(self):
        """Test async run with invalid command"""
        with pytest.raises(SQLHelperException) as exc_info:
            await self.tool._arun(command="invalid_command")
        
        assert "不支持的命令类型" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_arun_no_data_source(self):
        """Test async run with no data source"""
        self.tool.data_source.set_tables([])
        
        with pytest.raises(SQLHelperException) as exc_info:
            await self.tool._arun(command=CommandType.GET_METADATA.value)
        
        assert "数据源为空" in str(exc_info.value)
    
    def test_handle_result_get_metadata(self):
        """Test handle_result for get_metadata"""
        from af_agent.tools.base import ToolMultipleResult
        
        log = {}
        ans_multiple = ToolMultipleResult()
        
        # Mock session to return metadata result
        mock_result = {
            "command": CommandType.GET_METADATA.value,
            "metadata": [{"id": "test_id", "name": "测试表"}],
            "message": "成功获取元数据信息"
        }
        
        self.tool.session.get_agent_logs = Mock(return_value=mock_result)
        
        self.tool.handle_result(log, ans_multiple)
        
        assert "result" in log
        assert len(ans_multiple.text) > 0
        assert len(ans_multiple.cites) > 0
    
    def test_handle_result_execute_sql(self):
        """Test handle_result for execute_sql"""
        from af_agent.tools.base import ToolMultipleResult
        
        log = {}
        ans_multiple = ToolMultipleResult()
        
        # Mock session to return SQL execution result
        mock_result = {
            "command": CommandType.EXECUTE_SQL.value,
            "sql": "SELECT * FROM test_table",
            "data": [{"id": 1, "name": "测试"}],
            "message": "SQL 执行成功"
        }
        
        self.tool.session.get_agent_logs = Mock(return_value=mock_result)
        
        self.tool.handle_result(log, ans_multiple)
        
        assert "result" in log
        assert len(ans_multiple.table) > 0
        assert len(ans_multiple.new_table) > 0
        assert len(ans_multiple.text) > 0
    
    def test_handle_result_execute_sql_with_data_title(self):
        """Test handle_result for execute_sql with data_title"""
        from af_agent.tools.base import ToolMultipleResult
        
        log = {}
        ans_multiple = ToolMultipleResult()
        
        # Mock session to return SQL execution result with data_title
        mock_result = {
            "command": CommandType.EXECUTE_SQL.value,
            "sql": "SELECT * FROM test_table",
            "data_title": "用户查询结果",
            "data": [{"id": 1, "name": "测试"}],
            "message": "SQL 执行成功"
        }
        
        self.tool.session.get_agent_logs = Mock(return_value=mock_result)
        
        self.tool.handle_result(log, ans_multiple)
        
        assert "result" in log
        assert len(ans_multiple.table) > 0
        assert len(ans_multiple.new_table) > 0
        assert len(ans_multiple.text) > 0
        
        # Check that the table title includes the data_title
        table_item = ans_multiple.new_table[0]
        assert "用户查询结果" in table_item["title"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
