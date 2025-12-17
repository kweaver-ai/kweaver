import logging
import time

import arrow

# from exporter.resource.resource import log_resource
from fastapi import Request

from app.common.config import Config
from app.utils.common import GetCallerInfo, IsInPod
from app.domain.enum.common.user_account_header_key import get_user_account_id

# from tlogging import SamplerLogger
import os

from logging.handlers import TimedRotatingFileHandler

"""
标准日志StandLog类
"""

SYSTEM_LOG = "SystemLog"
BUSINESS_LOG = "BusinessLog"

CREATE = "create"  # 新建
DELETE = "delete"  # 删除
DOWNLOAD = "download"  # 下载
UPDATE = "update"  # 修改
UPLOAD = "upload"  # 上传
LOGIN = "login"  # 登录

# supervisord程序的标准输出流
LOG_FILE = "/dev/fd/1"

LOG_DIR = "log"
LOG_FORMATTER = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class StandLog_logging(object):
    _info_logger: logging.Logger = None
    _fastapi_logger: logging.Logger = None
    _basic_config_initialized = False

    def __init__(self):
        try:
            if not os.path.exists(LOG_DIR):
                os.makedirs(LOG_DIR)

            if self._info_logger is None:
                self._info_logger = logging.getLogger("agent-executor")
                self._info_logger.setLevel(Config.app.get_stdlib_log_level())
                self._info_logger.propagate = False

                file_handler = TimedRotatingFileHandler(
                    "log/agent-executor.log",
                    when="midnight",
                    interval=1,
                    backupCount=30,  # 保留30天的日志
                )

                file_handler.setFormatter(LOG_FORMATTER)

                # 添加处理器到日志记录器
                self._info_logger.addHandler(file_handler)
            if self._fastapi_logger is None:
                self._fastapi_logger = logging.getLogger("fastapi")
                self._fastapi_logger.setLevel(Config.app.get_stdlib_log_level())
                self._fastapi_logger.propagate = False

                # 创建文件处理器，每天午夜滚动日志文件
                file_handler = TimedRotatingFileHandler(
                    "log/requests.log",
                    when="midnight",
                    interval=1,
                    backupCount=30,  # 保留30天的日志
                )
                file_handler.setLevel(Config.app.get_stdlib_log_level())
                file_handler.setFormatter(LOG_FORMATTER)

                # 添加处理器到日志记录器
                self._fastapi_logger.addHandler(file_handler)

        except Exception as e:
            print("-----------------------------------logger  init error :", e)

    def get_request_logger(self):
        return self._fastapi_logger

    def console_request_log(self, req_info: dict):
        log_str = "\n" + "=" * 80 + "\n"
        log_str += "请求开始: \n"
        if "request_id" in req_info:
            log_str += f"🟢 request_id: {req_info['request_id']}\n"
        if "client" in req_info:
            log_str += f"🟢 请求客户端：{req_info['client']}\n"
        if "method" in req_info:
            log_str += f"🟢 请求方法: {req_info['method']} \n"
        if "headers" in req_info:
            log_str += f"🟢 请求头: {req_info['headers']} \n"
        if "path" in req_info:
            log_str += f"🟢 请求路径: {req_info['path']} \n"

        if "query_params" in req_info:
            log_str += f"🟢 请求参数: {req_info['query_params']} \n"

        if "body" in req_info:
            log_str += f"🟢 请求体: {req_info['body']} \n"

        # 生成一个第一的完整的curl
        curl_command = self._generate_curl_command(req_info)
        log_str += f"🟢 CURL命令: {curl_command}\n"

        log_str += "=" * 80 + "\n"

        self._fastapi_logger.info(log_str)

    def _generate_curl_command(self, req_info: dict) -> str:
        """
        根据请求信息生成完整的curl命令
        @param req_info: 包含请求信息的字典
        @return: curl命令字符串
        """
        from urllib.parse import urlencode

        def escape_single_quote(s: str) -> str:
            """转义单引号，用于 shell 单引号字符串中"""
            # 在单引号字符串中，单引号需要用 '\'' 来转义
            return s.replace("'", "'\\''")

        curl_parts = ["curl"]

        # 添加请求方法
        method = req_info.get("method", "GET").upper()
        if method != "GET":
            curl_parts.append(f"-X {method}")

        # 添加请求头
        headers = req_info.get("headers", {}) or {}
        has_gzip_encoding = False
        for key, value in headers.items():
            # 跳过一些常见的由代理添加的头部
            if key.lower() in ["host", "connection", "content-length"]:
                continue
            # 检查是否有 gzip 编码
            if key.lower() == "accept-encoding" and "gzip" in str(value).lower():
                has_gzip_encoding = True
                continue  # 跳过 accept-encoding，使用 --compressed 代替
            curl_parts.append(
                f"-H '{escape_single_quote(key)}: {escape_single_quote(str(value))}'"
            )

        # 如果原始请求使用 gzip，添加 --compressed 选项
        if has_gzip_encoding:
            curl_parts.append("--compressed")

        # 添加请求体
        body = req_info.get("body", "")
        if body and method in ["POST", "PUT", "PATCH"]:
            # 如果body是字典，转换为JSON字符串
            if isinstance(body, dict):
                import json

                body = json.dumps(body, ensure_ascii=False)

            # 确保 body 是字符串
            body_str = str(body) if body else ""

            # 检查是否需要添加 Content-Type 头
            # 如果原始请求没有 Content-Type，但 body 看起来是 JSON，则添加 application/json
            # 这样可以避免 curl 默认使用 application/x-www-form-urlencoded
            has_content_type = any(k.lower() == "content-type" for k in headers.keys())
            if not has_content_type and body_str.strip().startswith(("{", "[")):
                curl_parts.append("-H 'Content-Type: application/json'")

            curl_parts.append(f"-d '{escape_single_quote(body_str)}'")

        # 构建完整URL
        path = req_info.get("path", "/")
        query_params = req_info.get("query_params", {})
        client = req_info.get("client", "")

        # 从headers中获取host信息，尝试不同的键名格式
        host_header = headers.get("host", "") or headers.get("Host", "")

        # 构建URL：优先使用host头（包含端口），否则使用client
        if host_header:
            url = (
                host_header
                if host_header.startswith(("http://", "https://"))
                else f"http://{host_header}"
            )
        elif client:
            url = (
                client
                if client.startswith(("http://", "https://"))
                else f"http://{client}"
            )
        else:
            url = "http://localhost"

        # 添加路径（确保URL不以http://或https://结尾才添加路径）
        if not url.endswith(path):
            url = f"{url}{path}"

        # 添加查询参数（使用 urlencode 正确编码特殊字符）
        if query_params:
            query_string = urlencode(query_params)
            url += f"?{query_string}"

        curl_parts.append(f"'{escape_single_quote(url)}'")

        return " ".join(curl_parts)

    def __need_print(self, etype):
        if IsInPod():
            if etype == SYSTEM_LOG:
                need_print = Config.app.enable_system_log
                return need_print == "true"
        return True

    def debug(self, body, etype=SYSTEM_LOG):
        if self.__need_print(etype):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.debug(f"{caller_filename}:{caller_lineno} " + str(body))

    def info(self, body, etype=SYSTEM_LOG):
        if self.__need_print(etype):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.info(f"{caller_filename}:{caller_lineno} " + str(body))

    def warn(self, body, etype=SYSTEM_LOG):
        if self.__need_print(etype):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.warning(f"{caller_filename}:{caller_lineno} " + str(body))

    def error(self, body, etype=SYSTEM_LOG):
        if self.__need_print(etype):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.error(f"{caller_filename}:{caller_lineno} " + str(body))

    def fatal(self, body, etype=SYSTEM_LOG):
        if self.__need_print(etype):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.fatal(f"{caller_filename}:{caller_lineno} " + str(body))

    def info_log(self, body):
        """INFO级别的日志打印（不遵循标准规则，特殊的系统日志）"""
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.info(f"{caller_filename}:{caller_lineno} " + str(body))

    def debug_log(self, body):
        """DEBUG级别的日志打印（不遵循标准规则，特殊的系统日志）"""
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.debug(f"{caller_filename}:{caller_lineno} " + str(body))


def get_error_log(message, caller_frame, caller_traceback=""):
    """
    获取待打印的错误日志
    @message:实际内容(字符串类型)
    @caller_frame:调用者上下文（请使用sys._getframe()）
    @caller_traceback:调用者当前堆栈信息（请使用traceback.format_exc()，调用位置不在except Exception：下，请不要传参）
    """
    log_info = {}
    log_info["message"] = message
    log_info["caller"] = (
        caller_frame.f_code.co_filename + ":" + str(caller_frame.f_lineno)
    )
    log_info["stack"] = caller_traceback
    log_info["time"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time()))
    return log_info


def get_operation_log(
    request: Request,
    operation: str,
    object_id,
    target_object: dict,
    description: str,
    object_type: str = "kg",
) -> dict:
    """
    获取待打印的用户行为日志
    @user_name: 用户名
    @operation: 操作类型(CREATE, DELETE, DOWNLOAD, UPDATE, UPLOAD, LOGIN)
    @object_id: 操作对象id（也可以是一个列表）
    @target_object: 操作结果对象，类型为dict
    @description: 行为描述（传参只应包括具体动作，例如：修改了知识图谱{id=3}，结果为{name:"知识图谱2"}）
    @object_type: 操作对象类型(知识网络:kn, 知识图谱:kg, 数据源:ds, 词库:lexicon, 函数:function, 本体:otl)
    """
    user_id = get_user_account_id(request.headers)
    user_name = request.headers.get("username")
    agent_type = request.headers.get("User-Agent")
    ip = request.headers.get("X-Forwarded-For")
    agent = {"type": agent_type, "ip": ip}
    operator = {
        "type": "authenticated_user",
        "id": user_id,
        "name": user_name,
        "agent": agent,
    }
    object_info = {"id": object_id, "type": object_type}
    now_time = arrow.now().format("YYYY-MM-DD HH:mm:ss")
    description = (
        "用户{id=%s,name=%s}在客户端{ip=%s,type=%s}"
        % (user_id, user_name, ip, agent_type)
        + description
    )
    operation_log = {
        "operator": operator,
        "operation": operation,
        "object": object_info,
        "targetObject": target_object,
        "description": description,
        "time": now_time,
    }
    return operation_log


# StandLogger = StandLog()
StandLogger = StandLog_logging()
