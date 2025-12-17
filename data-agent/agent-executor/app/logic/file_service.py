import datetime
import hashlib
import re
from io import StringIO

from fastapi import UploadFile
from tika import parser

from app.common import errors
from app.common.errors import CodeException
from app.common.stand_log import StandLogger
from app.driven.ad.model_factory_service import model_factory_service
from app.driven.anyshare.docset_service import docset_service
from app.driven.infrastructure.opensearch import opensearch_engine
from app.utils.regex_rules import RegexPatterns


class FileService(object):
    def __init__(self):
        # opensearch中存储文件全文的索引名
        self.file_index_name = "agent_temp_files_full_text"

    async def upload_file(self, file: UploadFile) -> dict:
        """上传文件"""
        # 文件信息
        file_size = file.size
        file_name = file.filename
        file_bytes = await file.read()
        file_md5 = hashlib.md5(file_bytes).hexdigest()
        parsed = parser.from_buffer(file_bytes)
        if parsed.get("content") is None:
            raise CodeException(errors.AgentExecutor_File_ParseError())
        file_content = parsed["content"].strip()
        file_token_size = int(len(file_content) / 1.5)
        # 写入opensearch
        if not (await opensearch_engine.is_index_exists(self.file_index_name)):
            index_body = {
                "settings": {"number_of_shards": 1, "number_of_replicas": 0},
                "mappings": {
                    "properties": {
                        "upload_time": {"type": "date"},
                        "content": {"type": "text"},
                        "doc_name": {"type": "text"},
                        "doc_md5": {"type": "keyword"},
                        "token_size": {"type": "integer"},
                    }
                },
            }
            await opensearch_engine.create_index(self.file_index_name, index_body)
        body = {
            "doc_name": file_name,
            "doc_md5": file_md5,
            "content": file_content,
            "token_size": file_token_size,
            "upload_time": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        }
        await opensearch_engine.insert_data(self.file_index_name, body, doc_id=file_md5)
        # 返回
        res = {
            "id": file_md5,
            "name": file_name,
            "size": file_size,
            "token_size": file_token_size,
        }
        return res

    async def delete_temp_file(self):
        """删除agent的临时文件"""
        # 当前时间前24小时
        delete_time = datetime.datetime.now() - datetime.timedelta(days=1)
        delete_time = delete_time.strftime("%Y-%m-%dT%H:%M:%S")
        delete_body = {
            "query": {
                "range": {
                    "upload_time": {
                        "lt": delete_time,
                    }
                }
            }
        }
        await opensearch_engine.delete_by_query(self.file_index_name, delete_body)

    async def check_token_num(self, file_ids: list[str], agent_config: dict) -> str:
        """判断大模型是否可以处理文件的所有内容，如果不能，则返回提示信息"""
        # 获取文件的变量名
        file_var_name = ""
        for input_field in agent_config.get("input", {}).get("fields", []):
            if input_field.get("type") == "file":
                file_var_name = input_field.get("name")
                break
        # 没有文件变量
        if not file_var_name:
            StandLogger.info("agent配置中不存在文件变量，无法判断文件是否可以处理")
            return ""
        # 找到agent配置中使用了文件的大模型
        llm_names = set()
        for block in agent_config.get("logic_block", []):
            if block.get("type") == "llm_block":
                if block.get("mode") == "expert":
                    para_list = re.findall(
                        RegexPatterns.Simple_variable_with_dollar_sign,
                        block.get("dolphin", [])[0]["value"],
                    )
                else:
                    para_list = re.findall(
                        RegexPatterns.Variable_in_curly_braces,
                        block.get("user_prompt", ""),
                    )
                    para_list.extend(
                        re.findall(
                            RegexPatterns.Variable_in_curly_braces,
                            block.get("system_prompt", ""),
                        )
                    )
                for para in para_list:
                    if para == file_var_name:
                        llm_config = block.get("llm_config", {})
                        llm_name = llm_config.get(
                            "llm_model_name", llm_config.get("name", "")
                        )
                        if llm_name:
                            llm_names.add(llm_name)
                        break
        # 没有配置大模型
        if not llm_names:
            StandLogger.info("agent配置中不存在大模型，无法判断文件是否可以处理")
            return ""
        context_size = 0
        for llm_name in llm_names:
            try:
                llm_config = await model_factory_service.get_llm_config(llm_name)
                max_tokens_length = llm_config["max_tokens_length"]
            except Exception:
                max_tokens_length = 0
            if context_size == 0:
                context_size = max_tokens_length
            else:
                context_size = min(context_size, max_tokens_length)
        if context_size == 0:
            StandLogger.info(
                "大模型配置中不存在max_tokens_length，无法判断文件是否可以处理"
            )
            return ""
        supported_files_tokens = context_size / 2
        # 获取文件的token数量
        docs = await opensearch_engine.get_doc_by_ids(self.file_index_name, file_ids)
        file_tokens = 0
        for doc in docs:
            file_tokens += doc.get("_source", {}).get("token_size", 0)

        if file_tokens < supported_files_tokens:
            StandLogger.info("文件token数量小于大模型支持的最大token数量，可以处理")
            return ""
        else:
            return "仅阅读全部文件的{}%，请删减后运行".format(
                int(supported_files_tokens / file_tokens * 100)
            )

    async def get_file_content(self, file_infos, headers):
        """
                获取文件内容
                修改 file_infos，在其中加上 content 字段

                file_infos = [
            {
                "file_source": "as",
                "ds_id": "1",
                "address": "https://XXX",
                "port": "443",
                "fields": [
                    {
                        "name": "科技期刊低被引论文的界定与评价方法探究——以《期刊引用报告》凝聚态物理学65种期刊为例.pdf",
                        "path": "path",
                        "source": "gns://A123F3C38C7B48B09C5C24C06ABD098F/C802CD2F0E594857B3A0851C557812B7/525F15FAA5A14428B43D40DC9FFD5E23",
                        ++ "content": "file_content"
                    }
                ]
            }
        ]
                file_infos = [
            {
                "file_source": "local",
                "id": "e96e3dd2e32c1f6380d7d48d5c9a6504",
                "name": "《2024加拿大留学报告》发布.txt",
                ++ "content": "file_content"
            }
        ]
        """
        StandLogger.info_log("开始获取文件内容")
        for file_info in file_infos:
            if file_info.get("file_source") == "as":
                for doc in file_info.get("fields", []):
                    if doc.get("content") is not None:
                        continue
                    doc_id = doc["source"].split("/")[-1]
                    doc_name = doc["name"]
                    file_content = await docset_service.get_full_text(doc_id)
                    doc["content"] = file_content
            elif file_info.get("file_source") == "local":
                if file_info.get("content") is not None:
                    continue
                doc_name = file_info.get("name")
                file_index_name = "agent_temp_files_full_text"
                file_content = await opensearch_engine.get_doc_by_ids(
                    file_index_name, [file_info.get("id", "")]
                )
                file_content = file_content[0].get("_source", {}).get("content", "")
                file_info["content"] = file_content
        StandLogger.info_log("获取文件内容结束")

    async def get_file_content_text(self, file_infos, headers):
        """
        获取文件内容, 返回文件内容字符串
        """
        await self.get_file_content(file_infos, headers)
        file_content = StringIO()
        for file_info in file_infos:
            if file_info.get("file_source") == "as":
                for doc in file_info.get("fields", []):
                    file_content.write(doc.get("content", ""))
            elif file_info.get("file_source") == "local":
                file_content.write(file_info.get("content", ""))
        return file_content.getvalue()

    async def get_file_content_text_with_name(self, file_infos, headers):
        """
        获取文件内容, 返回文件内容字符串, 包含文件名
        """
        await self.get_file_content(file_infos, headers)
        file_content = StringIO()
        for file_info in file_infos:
            if file_info.get("file_source") == "as":
                for doc in file_info.get("fields", []):
                    file_content.write(
                        f"《{doc.get('name', '')}》全文：\n{doc.get('content', '')}\n\n"
                    )
            elif file_info.get("file_source") == "local":
                file_content.write(
                    f"《{file_info.get('name', '')}》全文：\n{file_info.get('content', '')}\n\n"
                )
        return file_content.getvalue()


file_service = FileService()
