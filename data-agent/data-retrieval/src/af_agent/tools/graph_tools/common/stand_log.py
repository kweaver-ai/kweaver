import logging
import time

import arrow
from fastapi import Request
from af_agent.tools.graph_tools.common.config import Config
from af_agent.tools.graph_tools.utils.common import GetCallerInfo, IsInPod

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

#
# class StandLog(object):
#     _info_logger = None
#
#     def __init__(self):
#         try:
#             # print 只允许在此（日志对象初始化时）使用
#             print("-----------------------------------标准输出工具初始化-----------------------------------")
#             # stand_logger = SamplerLogger(resource=log_resource())
#             # # 赋值"TraceLevel",表示所有等级日志都输出
#             # stand_logger.loglevel = "TraceLevel"
#             # self._stand_logger = stand_logger
#             self._stand_logger = None
#
#             print("-----------------------------------INFO级别日志输出工具初始化-----------------------------------")
#             if self._info_logger is None:
#                 self._info_logger = logging.getLogger(__name__)
#                 # 输出到标准输出，并设置格式
#                 logging.basicConfig(format='%(asctime)s %(filename)s %(levelname)s %(message)s',
#                                     level=logging.DEBUG)
#         except Exception as e:
#             print("-----------------------------------stad_log init error :", e)
#
#     def stand_log_shutdown(self):
#         if self._stand_logger:
#             self._stand_logger.shutdown()
#
#     # 后续等AR那边完成工具改造后，该强制推送函数应该删除
#     def __notify(self):
#         stand_logger = SamplerLogger(resource=log_resource())
#         # 赋值"TraceLevel",表示所有等级日志都输出
#         stand_logger.loglevel = "TraceLevel"
#         self._stand_logger = stand_logger
#
#     def __need_print(self, etype):
#         if IsInPod():
#             if etype == SYSTEM_LOG:
#                 need_print = Config.ENABLE_SYSTEM_LOG
#                 return need_print == "true"
#         return True
#
#     def trace(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.trace(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def debug(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.debug(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def info(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.info(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def warn(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.warn(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def error(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.error(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def fatal(self, log_info, etype=SYSTEM_LOG):
#         if self.__need_print(etype):
#             self.__notify()
#             self._stand_logger.fatal(log_info, etype=etype)
#             self.stand_log_shutdown()
#
#     def info_log(self, body):
#         """ INFO级别的日志打印（不遵循标准规则，特殊的系统日志） """
#         if self.__need_print(SYSTEM_LOG):
#             caller_filename, caller_lineno = GetCallerInfo()
#             self._info_logger.info(f"{caller_filename}:{caller_lineno} " + str(body))
#
#     def debug_log(self, body):
#         """ DEBUG级别的日志打印（不遵循标准规则，特殊的系统日志） """
#         if self.__need_print(SYSTEM_LOG):
#             caller_filename, caller_lineno = GetCallerInfo()
#             self._info_logger.debug(f"{caller_filename}:{caller_lineno} " + str(body))


class StandLog_logging(object):
    _info_logger = None
    _basic_config_initialized = False

    def __init__(self):
        try:
            print(
                "-----------------------------------INFO级别日志输出工具初始化-----------------------------------"
            )
            if self._info_logger is None:
                self._info_logger = logging.getLogger(__name__)
                # 只在第一次初始化时配置basicConfig，避免被其他日志系统覆盖
                if not StandLog_logging._basic_config_initialized:
                    logging.basicConfig(
                        format="%(asctime)s %(filename)s %(levelname)s %(message)s",
                        level=getattr(logging, Config.LOG_LEVEL.upper()),
                        force=True,  # 强制重新配置，覆盖之前的配置
                    )
                    StandLog_logging._basic_config_initialized = True
        except Exception as e:
            print("-----------------------------------stad_log init error :", e)

    def __need_print(self, etype):
        if IsInPod():
            if etype == SYSTEM_LOG:
                need_print = Config.ENABLE_SYSTEM_LOG
                return need_print == "true"
        return True

    def debug(self, body, etype=SYSTEM_LOG):
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.debug(f"{caller_filename}:{caller_lineno} " + str(body))

    def info(self, body, etype=SYSTEM_LOG):
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.info(f"{caller_filename}:{caller_lineno} " + str(body))

    def warn(self, body, etype=SYSTEM_LOG):
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.warning(f"{caller_filename}:{caller_lineno} " + str(body))

    def error(self, body, etype=SYSTEM_LOG, exc_info=None):
        if self.__need_print(SYSTEM_LOG):
            caller_filename, caller_lineno = GetCallerInfo()
            self._info_logger.error(f"{caller_filename}:{caller_lineno} " + str(body), exc_info=exc_info)

    def fatal(self, body, etype=SYSTEM_LOG):
        if self.__need_print(SYSTEM_LOG):
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
    user_id = request.headers.get("userId")
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