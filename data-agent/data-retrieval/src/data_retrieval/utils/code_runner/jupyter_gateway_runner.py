# -*- coding: utf-8 -*-
import traceback
import importlib.util
import uuid
import requests
import json
import time
from typing import Any, Optional, Dict, Union, List
import websocket

from data_retrieval.logs.logger import logger
from data_retrieval.errors import PythonCodeError
from data_retrieval.utils.code_runner.base_runner import BaseCodeRunner
from data_retrieval.utils.code_runner.exec_runner import ExecRunner
from data_retrieval.settings import get_settings


class JupyterGatewayRunner(BaseCodeRunner):
    """基于Jupyter Gateway的代码执行器，使用WebSocket连接"""
    
    # 存储kernel连接的字典，键为kernel_id
    _kernels = {}
    _max_output_lines = 100
    _max_output_length = 5000
    
    def __init__(self, kernel_id: Optional[str] = "", gateway_url: Optional[str] = None):
        """
        初始化Jupyter Gateway执行器
        
        Args:
            kernel_id: kernel的ID，如果为空字符串则创建新的kernel
            gateway_url: Jupyter Gateway的URL，如果为None则从设置中获取
        """
        settings = get_settings()
        self.gateway_url = gateway_url or settings.JUPYTER_GATEWAY_URL
        
        # 确保gateway_url没有尾部斜杠
        if self.gateway_url and self.gateway_url.endswith('/'):
            self.gateway_url = self.gateway_url[:-1]
            
        self.session, self._id = self._get_or_create_kernel(kernel_id)
        self.ws = None
        # 存储代码及其结果/错误的字典列表
        self.code_history: List[Dict[str, Any]] = [] 
    
    @staticmethod
    def is_jupyter_gateway_available() -> bool:
        """检查Jupyter Gateway所需依赖是否可用"""
        return (importlib.util.find_spec("requests") is not None and 
                importlib.util.find_spec("websocket") is not None)
    
    def get_id(self) -> str:
        """获取执行器ID"""
        return self._id if self._id else ""
    
    def get_working_context(self, output_limit: int = -1, output_lines_limit: int = -1) -> str:
        """获取此 Runner 实例执行的代码历史及其结果"""
        if not self.code_history:
            return "(No history recorded for this session)"
        
        def compress_output_text(output_text: str) -> str:
            # 保留前后的内容
            if output_limit == -1:
                return output_text
            else:
                return output_text[:output_limit//2] + "..." + output_text[-output_limit//2:]
            
        def compress_output_lines(output_lines: List[str]) -> List[str]:
            if output_lines_limit == -1:
                return output_lines
            else:
                return output_lines[:output_lines_limit//2] + ["..."] + output_lines[-output_lines_limit//2:]
        
        output_lines = ["--- Code History & Outcomes (Current Session) ---"]
        for i, entry in enumerate(self.code_history):
            code = entry.get('code', '(Code not recorded)')
            outcome = entry.get('outcome', {})
            status = outcome.get('status', 'unknown')
            
            output_lines.append(f"\n[Execution {i+1}] Code:")
            output_lines.append(f"{code.strip()}")
            output_lines.append(f"\n[Execution {i+1}] Outcome ({status}):")
            
            if status == 'success':
                result_repr = repr(outcome.get('result'))
                output_text = outcome.get('output', '')
                output_text = compress_output_text(output_text)

                output_lines.append(f"  Result: {result_repr}")
                output_lines.append(f"  Output:\n{output_text}")
            elif status == 'error':
                error_type = outcome.get('error_type', 'UnknownError')
                error_msg = outcome.get('error_message', '(No message)')
                output_text = outcome.get('output', '(No output before error)') # Output might contain the traceback
                output_text = compress_output_text(output_text)
                output_lines.append(f"  Error Type: {error_type}")
                output_lines.append(f"  Error Message: {error_msg}")
                output_lines.append(f"  Output (including error details):\n{output_text}")
            else:
                output_lines.append("  (Outcome details not available)")

        # TODO: 这里需要压缩 output_lines 的长度，需要按照行数和字符
        output_lines = compress_output_lines(output_lines)
        return "\n".join(output_lines)
    
    def _get_or_create_kernel(self, kernel_id: Optional[str] = ""):
        """
        获取指定ID的kernel，如果不存在则创建新的
        
        Args:
            kernel_id: kernel的ID，如果为空字符串则创建新的kernel
            
        Returns:
            kernel会话和kernel_id
        """
        if not JupyterGatewayRunner.is_jupyter_gateway_available():
            logger.warning("依赖未安装，无法连接到Jupyter Gateway")
            return None, None

        # 如果未提供gateway_url，则无法连接
        if not self.gateway_url:
            logger.warning("未提供Jupyter Gateway URL，无法连接到Jupyter Gateway")
            return None, None
        
        def _check_kernel_id(kernel_id: str):
            # 到 gateway 查看 kernel_id 是否存在
            kernel_url = f"{self.gateway_url}/api/kernels/{kernel_id}"
            response = requests.get(
                kernel_url,
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                return True
            else:
                return False
        
        try:
            # 如果指定了ID但连接不存在，或者没有指定ID，创建新的连接
            if kernel_id == "" or not _check_kernel_id(kernel_id):
                if kernel_id == "":
                    # 创建新的kernel
                    kernel_url = f"{self.gateway_url}/api/kernels"
                    logger.debug(f"创建kernel: {kernel_url}")
                    
                    kernel_data = {
                        "name": "python3"
                    }
                    
                    response = requests.post(
                        kernel_url, 
                        json=kernel_data,
                        verify=False,
                        timeout=10
                    )
                    
                    if response.status_code != 201 and response.status_code != 200:
                        logger.error(f"创建Jupyter Gateway kernel失败，状态码: {response.status_code}, 内容: {response.text}")
                        return None, None
                    
                    try:
                        kernel_info = response.json()
                        kernel_id = kernel_info["id"]
                    except Exception as e:
                        logger.error(f"解析kernel信息失败: {str(e)}, 响应内容: {response.text}")
                        return None, None
                    
                    # 存储kernel信息
                    JupyterGatewayRunner._kernels[kernel_id] = {
                        "kernel_id": kernel_id,
                        "gateway_url": self.gateway_url
                    }
                    
                    logger.debug(f"创建了新的Jupyter Gateway kernel，ID: {kernel_id}")
                else:
                    if kernel_id not in JupyterGatewayRunner._kernels:
                        # 存储kernel信息
                        JupyterGatewayRunner._kernels[kernel_id] = {
                            "kernel_id": kernel_id,
                            "gateway_url": self.gateway_url
                        }
                    
                    logger.debug(f"连接到现有的Jupyter Gateway kernel，ID: {kernel_id}")
            
            return JupyterGatewayRunner._kernels[kernel_id], kernel_id
        
        except Exception as e:
            error_msg = f"创建或连接Jupyter Gateway kernel失败: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            return None, None
    
    def _connect_websocket(self):
        """连接WebSocket"""
        try:            
            if not self._id:
                logger.error("未找到有效的kernel ID，无法创建WebSocket连接")
                return False
            
            ws_url = f"ws://{self.gateway_url.replace('http://', '')}/api/kernels/{self._id}/channels"
            if self.gateway_url.startswith("https://"):
                ws_url = f"wss://{self.gateway_url.replace('https://', '')}/api/kernels/{self._id}/channels"
                
            logger.debug(f"连接WebSocket: {ws_url}")
            
            self.ws = websocket.create_connection(
                ws_url,
                sslopt={"cert_reqs": 0},
                timeout=30
            )
            
            return True
        except Exception as e:
            logger.error(f"连接WebSocket失败: {str(e)}")
            return False
    
    def _close_websocket(self):
        """关闭WebSocket连接"""
        if self.ws:
            try:
                self.ws.close()
                self.ws = None
                logger.debug("已关闭WebSocket连接")
            except Exception as e:
                logger.error(f"关闭WebSocket连接失败: {str(e)}")
    
    def run(self, code: str, data: Optional[Dict] = None, **namespace_kwargs) -> Dict[str, Any]:
        """
        使用Jupyter Gateway执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            namespace_kwargs: 其他要添加到kernel命名空间的变量
            
        Returns:
            包含代码执行结果、完整输出和kernel_id的字典
        """
        original_code = code # 保存原始用户代码以供记录
        max_retries = 1  # 最多重试次数
        retry_count = 0
        last_exception = None
        
        # 这些变量需要在循环外定义，以便在 finally 或 except 块中访问
        result = None 
        collected_outputs = []
        full_output_str = ""
        outcome_status = 'unknown' # 用于记录最终状态

        try:
            while retry_count <= max_retries:
                # 重置每次尝试的状态变量
                result = None 
                collected_outputs = []
                execution_error = None
                is_retry = retry_count > 0

                try:
                    # 检查Jupyter Gateway是否可用 (只在首次尝试时检查并可能回退)
                    if not is_retry and (not self.session or not JupyterGatewayRunner.is_jupyter_gateway_available()):
                        logger.warning("Jupyter Gateway未安装或连接不可用，回退到ExecRunner")
                        try:
                            exec_result = ExecRunner.static_run(code, data, **namespace_kwargs)
                            outcome = {"status": "success", "result": exec_result, "output": str(exec_result), "kernel_id": self._id}
                            self.code_history.append({'code': original_code, 'outcome': outcome})
                            return outcome # 直接返回成功结果
                        except Exception as exec_e:
                            # ExecRunner 也可能失败
                            outcome = {"status": "error", "error_type": type(exec_e).__name__, "error_message": str(exec_e), "output": traceback.format_exc(), "kernel_id": self._id}
                            self.code_history.append({'code': original_code, 'outcome': outcome})
                            raise PythonCodeError(reason="ExecRunner代码执行失败", detail=exec_e) # 重新抛出包装后的错误
                    
                    # --- WebSocket 连接与执行 --- 
                    if not self.ws:
                        logger.info(f"尝试连接 WebSocket (尝试次数 {retry_count + 1})")
                        if not self._connect_websocket():
                            raise ConnectionError("WebSocket连接尝试失败")
                    
                    session_id = str(uuid.uuid4())
                    assign_msg_id = str(uuid.uuid4())

                    # # 单独执行赋值代码，否则数据量过大
                    # if data is not None: 
                    #     assign_code = "data = " + json.dumps(data) + "\n"
                    #     message = {
                    #         "channel": "shell",
                    #         "header": {"msg_id": assign_msg_id, "username": "user", "session": session_id, "msg_type": "execute_request", "version": "5.3"},
                    #         "parent_header": {}, "metadata": {},
                    #         "content": {"code": assign_code, "silent": False}
                    #     }
                    
                    #     self.ws.send(json.dumps(message))
                    #     logger.debug(f"赋值代码已发出: {assign_msg_id} (尝试次数 {retry_count + 1})")

                    full_code = ""
                    if data:
                        full_code = "data = " + json.dumps(data, ensure_ascii=False) + "\n"
                    for key, value in namespace_kwargs.items():
                        try:
                            if isinstance(value, (str, int, float, bool, type(None))):
                                full_code += f"{key} = {repr(value)}\n" # Use repr for better accuracy
                            else:
                                full_code += f"{key} = {json.dumps(value, ensure_ascii=False)}\n"
                        except TypeError:
                             logger.warning(f"无法序列化变量 {key}，跳过")
                    full_code += code

                    msg_id = str(uuid.uuid4())
                    message = {
                        "channel": "shell",
                        "header": {"msg_id": msg_id, "username": "user", "session": session_id, "msg_type": "execute_request", "version": "5.3"},
                        "parent_header": {}, "metadata": {},
                        "content": {"code": full_code, "silent": False}
                    }
                    
                    self.ws.send(json.dumps(message))
                    logger.debug(f"已发送代码执行请求，消息ID: {msg_id} (尝试次数 {retry_count + 1})")
                    
                    # --- 处理响应 --- 
                    timeout = time.time() + 30  # 30秒超时
                    while time.time() < timeout:
                        try:
                            response = self.ws.recv()
                            response_data = json.loads(response)
                            msg_type = response_data.get("msg_type")
                            parent = response_data.get("parent_header", {})
                            content = response_data.get("content", {})
                            
                            channel = response_data.get("channel")

                            if channel != "iopub":
                                continue

                            if msg_type == "execute_result":
                                if parent.get("msg_id") == assign_msg_id:
                                    # 赋值代码执行结果
                                    assign_result = content.get("data", {})
                                    if "text/plain" in assign_result:
                                        assign_result = assign_result["text/plain"]
                                        logger.debug(f"赋值代码执行结果: {assign_result}")
                                        continue
                                if parent.get("msg_id") == msg_id:
                                    result_data = content.get("data", {})
                                    if "text/plain" in result_data:
                                        text_result = result_data["text/plain"]
                                        collected_outputs.append(text_result)
                                    try:
                                        import ast
                                        result = ast.literal_eval(text_result)
                                    except: result = text_result # Keep original if eval fails
                            elif msg_type == "stream":
                                if parent.get("msg_id") == msg_id:
                                    text = content.get("text", "")
                                    collected_outputs.append(text)
                            elif msg_type == "display_data":
                                if parent.get("msg_id") == msg_id:
                                    result_data = content.get("data", {})
                                    if "text/plain" in result_data: collected_outputs.append(result_data["text/plain"])
                            elif msg_type == "status" and content.get("execution_state") == "idle":
                                if parent.get("msg_id") == msg_id:
                                    break # Exit inner loop on idle
                            elif msg_type == "error":
                                if parent.get("msg_id") == msg_id:
                                    ename = content.get("ename", "Error")
                                evalue = content.get("evalue", "")
                                tb = content.get("traceback", [])
                                import re
                                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                                formatted_tb = "\n".join([ansi_escape.sub('', line) for line in tb])
                                error_output = f"ERROR: {ename}: {evalue}\n{formatted_tb}"
                                collected_outputs.append(f"\n{error_output}\n")
                                execution_error = Exception(f"{ename}: {evalue}") # Record error
                        
                        except websocket.WebSocketTimeoutException:
                            logger.warning("WebSocket接收超时")
                            execution_error = TimeoutError("代码执行超时") 
                            break 
                        except websocket.WebSocketConnectionClosedException as conn_closed_err:
                            logger.error(f"WebSocket连接在接收时关闭: {conn_closed_err}")
                            self.ws = None
                            raise conn_closed_err # Propagate to retry logic
                        except json.JSONDecodeError as json_err:
                            logger.error(f"解析WebSocket消息失败: {json_err}")
                            execution_error = json_err 
                            break
                        except Exception as e:
                            logger.error(f"处理WebSocket消息时发生意外错误: {str(e)}")
                            execution_error = e 
                            break 

                    # --- 尝试完成 --- 
                    full_output_str = "".join(collected_outputs) # Combine output here
                    if execution_error:
                         # If an error occurred during processing, raise it to be caught below
                         # Append error to output string if not already there
                         if str(execution_error) not in full_output_str:
                             full_output_str += f"\nPROCESSING ERROR: {str(execution_error)}"
                         raise execution_error 
                    else:
                        # Successful execution for this attempt
                        outcome_status = 'success'
                        break # Exit the while retry_count loop successfully

                except websocket.WebSocketConnectionClosedException as conn_closed_err:
                    logger.warning(f"捕获到连接关闭异常 (尝试次数 {retry_count + 1})，准备重试...")
                    last_exception = conn_closed_err
                    retry_count += 1
                    self.ws = None # Mark connection as closed
                    if retry_count <= max_retries:
                        time.sleep(0.5 * retry_count)
                        continue # Go to next iteration of the while loop
                    else:
                        logger.error(f"连接关闭，达到最大重试次数 ({max_retries})，放弃执行")
                        outcome_status = 'error'
                        last_exception = PythonCodeError(reason="Jupyter Gateway连接失败 (已重试)", detail=last_exception)
                        break # Exit retry loop, will go to finally block

                except Exception as e:
                    # Catch other exceptions during setup or execution for this attempt
                    logger.error(f"执行过程中发生未处理的异常 (尝试次数 {retry_count + 1}): {e}")
                    last_exception = e
                    outcome_status = 'error' 
                    break # Exit retry loop, will go to finally block
            
            # End of while retry_count loop
            # This point is reached if execution succeeded (outcome_status='success')
            # or if retries exhausted / non-retryable error occurred (outcome_status='error')

        finally:
            # --- Record History and Return/Raise --- 
            # This block executes whether the try block completed successfully or raised an exception
            self._close_websocket()
            logger.debug(f"Entering finally block. Detected outcome_status: {outcome_status}")
            full_output_str = "".join(collected_outputs) # Ensure latest output is used
            
            if outcome_status == 'success':
                final_outcome = {
                    "status": "success", 
                    "result": result, 
                    "output": full_output_str.strip(), 
                    "kernel_id": self._id
                }
                logger.debug(f"Recording successful outcome: {final_outcome}")
                self.code_history.append({'code': original_code, 'outcome': final_outcome})
                return final_outcome
            else:
                # Status is 'error' or 'unknown' (if loop finished unexpectedly)
                if last_exception is None:
                    last_exception = Exception("未知执行错误或重试循环异常结束")
                
                # Include partial output in error details if not already there
                error_detail = str(last_exception)
                if isinstance(last_exception, PythonCodeError) and isinstance(last_exception.detail, str):
                    error_detail = last_exception.detail # Use detail from PythonCodeError if available
                
                # Avoid duplicating output if it's already in the error detail
                if full_output_str and error_detail and full_output_str not in error_detail:
                     # Add marker only if output is substantial and not just the error message itself
                     if len(full_output_str.strip()) > len(str(last_exception)) + 20:
                         error_detail += f"\n--- Partial Output ---\n{full_output_str.strip()}"
                     elif full_output_str.strip() != str(last_exception).strip(): # Add if different from error
                         error_detail += f"\n(Output: {full_output_str.strip()})" 
                
                final_outcome = {
                    "status": "error",
                    "error_type": type(last_exception).__name__, 
                    "error_message": str(last_exception).split('\n')[0], # Get first line of error
                    "output": full_output_str.strip(), # Record whatever output was gathered
                    "kernel_id": self._id
                }
                logger.debug(f"Recording error outcome: {final_outcome}")
                self.code_history.append({'code': original_code, 'outcome': final_outcome})
                
                # Wrap the exception if it's not already a PythonCodeError
                if isinstance(last_exception, PythonCodeError):
                    logger.error(f"Raising existing PythonCodeError: {last_exception.reason}")
                    raise last_exception
                else:
                    wrapped_exception = PythonCodeError(reason=f"Jupyter Gateway代码执行失败 ({type(last_exception).__name__})", detail=error_detail)
                    logger.error(f"Raising wrapped exception: {wrapped_exception.reason}")
                    raise wrapped_exception
    
    def close(self) -> bool:
        """
        关闭当前kernel
        
        Returns:
            是否成功关闭
        """
        # 先关闭WebSocket连接
        self._close_websocket()
        
        if self._id in JupyterGatewayRunner._kernels:
            try:
                kernel_info = JupyterGatewayRunner._kernels[self._id]
                kernel_id = kernel_info["kernel_id"]
                gateway_url = kernel_info["gateway_url"]
                
                # 删除kernel
                kernel_url = f"{gateway_url}/api/kernels/{kernel_id}"
                response = requests.delete(kernel_url, verify=False, timeout=10)
                
                if response.status_code >= 400:
                    logger.warning(f"关闭kernel时遇到HTTP错误: {response.status_code}, {response.text}")
                
                del JupyterGatewayRunner._kernels[self._id]
                logger.debug(f"关闭了Jupyter Gateway kernel，ID: {self._id}")
                self.session = None

                # 清空历史记录
                self.code_history = [] 
                return True
            except Exception as e:
                logger.error(f"关闭Jupyter Gateway kernel失败: {str(e)}")
                return False
        return False
    
    @staticmethod
    def static_run(code: str, data: Optional[Dict] = None, kernel_id: Optional[str] = "", 
                   gateway_url: Optional[str] = None, **namespace_kwargs) -> Dict[str, Any]:
        """
        静态方法，使用Jupyter Gateway执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            kernel_id: 指定要使用的kernel ID，如果为空字符串则使用新的kernel
            gateway_url: Jupyter Gateway的URL
            namespace_kwargs: 其他要添加到kernel命名空间的变量
            
        Returns:
            包含代码执行结果和kernel_id的字典
        """
        # static_run 无法维护实例级别的历史记录
        # 如果需要历史记录，必须使用实例方法
        logger.warning("使用 static_run 时，无法记录代码执行历史上下文")
        runner = JupyterGatewayRunner(
            kernel_id=kernel_id, 
            gateway_url=gateway_url
        )
        # 静态方法返回的结果不包含显式的 'status'
        return runner.run(code, data, **namespace_kwargs)
            
    @staticmethod
    def close_kernel(kernel_id: str) -> bool:
        """
        关闭并删除指定ID的kernel
        
        Args:
            kernel_id: 要关闭的kernel ID
            
        Returns:
            是否成功关闭
        """
        if kernel_id in JupyterGatewayRunner._kernels:
            try:
                # 获取与 kernel_id 关联的 runner 实例（如果有的话）来关闭 websocket
                # ... (静态方法无法访问实例的 ws 或 history) ...
                pass

                kernel_info = JupyterGatewayRunner._kernels[kernel_id]
                gateway_url = kernel_info["gateway_url"]
                
                kernel_url = f"{gateway_url}/api/kernels/{kernel_id}"
                response = requests.delete(kernel_url, verify=False, timeout=10)
                
                if response.status_code >= 400:
                    logger.warning(f"关闭kernel时遇到HTTP错误: {response.status_code}, {response.text}")
                
                del JupyterGatewayRunner._kernels[kernel_id]
                logger.debug(f"关闭了Jupyter Gateway kernel，ID: {kernel_id}")
                return True
            except Exception as e:
                logger.error(f"关闭Jupyter Gateway kernel失败: {str(e)}")
                return False
        return False
        
    @staticmethod
    def close_all_kernels() -> int:
        """
        关闭所有kernel
        
        Returns:
            关闭的kernel数量
        """
        count = 0
        all_kernel_ids = list(JupyterGatewayRunner._kernels.keys())
        for kernel_id in all_kernel_ids:
            if JupyterGatewayRunner.close_kernel(kernel_id):
                count += 1
        logger.debug(f"关闭了所有Jupyter Gateway kernel，共{count}个")
        return count
    

_JUPYTER_GATEWAY_RUNNER = None

def get_runner(gateway_url: str = "", kernel_id: Optional[str] = "") -> JupyterGatewayRunner:
    """获取Jupyter Gateway执行器"""
    global _JUPYTER_GATEWAY_RUNNER
    if _JUPYTER_GATEWAY_RUNNER is None:
        _JUPYTER_GATEWAY_RUNNER = JupyterGatewayRunner(gateway_url=gateway_url, kernel_id=kernel_id)
    logger.warning("get_runner 返回的是单例 JupyterGatewayRunner，可能共享 kernel 和历史")
    return _JUPYTER_GATEWAY_RUNNER
