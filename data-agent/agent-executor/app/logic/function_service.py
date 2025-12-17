import ast
import asyncio
import inspect
import io
import json
import sys
import traceback
from typing import List, get_type_hints

import app.common.stand_log as log_oper
from app.common import errors
from app.common.errors import CodeException
from app.common.stand_log import StandLogger
from app.utils.common import func_judgment


class CodeChecker(ast.NodeVisitor):
    """检查代码中是否包含禁止的导入"""

    FORBIDDEN_MODULES = ["os", "sys", "app", "requests"]

    def visit_Import(self, node):
        # 检查是否导入了不允许的模块
        for alias in node.names:
            if alias.name.split(".")[0] in self.FORBIDDEN_MODULES:
                raise SyntaxError(
                    f"Import of {alias.name} is not allowed",
                    (None, node.lineno, node.col_offset, None),
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        # 检查是否从某个模块导入了不允许的模块
        if node.module and node.module.split(".")[0] in self.FORBIDDEN_MODULES:
            raise SyntaxError(
                f"Import from {node.module} is not allowed",
                (None, node.lineno, node.col_offset, None),
            )
        self.generic_visit(node)


class TeeStdout:
    """读取标准输入，并将其内容返回，同时还会将内容输出到标准输出"""

    def __init__(self):
        self.original_stdout = sys.stdout
        self.alternative_stdout = io.StringIO()

    def __enter__(self):
        self.original_stdout = sys.stdout
        sys.stdout = self  # 将 sys.stdout 指向当前实例
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        sys.stdout = self.original_stdout  # 恢复原始的 sys.stdout

    def write(self, message):
        self.original_stdout.write(message)  # 写入原始的 sys.stdout
        self.alternative_stdout.write(message)  # 写入 StringIO 对象

    def get_value(self):
        """返回捕获到的标准输出"""
        out = self.alternative_stdout.getvalue()
        self.reset()
        return out

    def reset(self):
        """重置捕获器以便再次捕获"""
        self.alternative_stdout.truncate(0)
        self.alternative_stdout.seek(0)


class FunctionService(object):
    @staticmethod
    def check_forbidden_actions(node):
        """检查代码中是否包含禁止的操作"""
        # 创建一个访问者对象并遍历AST
        checker = CodeChecker()
        checker.visit(node)

    def compile_and_check(self, code: str):
        try:
            # 解析代码为AST
            tree = ast.parse(code)
            # 检查禁止的导入
            self.check_forbidden_actions(tree)
            # 编译AST
            compiled_code = compile(tree, "<string>", "exec")
            return compiled_code
        except SyntaxError as e:
            StandLogger.error(f"Invalid syntax in the code provided: {repr(e)}")
            raise

    def get_main_func(self, code: str) -> callable:
        try:
            compiled_code = self.compile_and_check(code)
            globals_dict = {}
            exec(compiled_code, globals_dict)

            if "main" not in globals_dict:
                raise SyntaxError("No main function defined.")
            if not callable(globals_dict["main"]):
                raise SyntaxError("main is not a function.")

            main_func = globals_dict["main"]
            return main_func
        except ModuleNotFoundError as e:
            err = {
                "details": f"缺乏第三方依赖{e.name}，请联系AnyDTA团队",
                "row": None,
                "column": None,
                "code": None,
            }
            error_log = log_oper.get_error_log(
                err, sys._getframe(), traceback.format_exc()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise CodeException(errors.AgentExecutor_Function_CodeError(), err)
        except SyntaxError as e:
            err = {
                "details": e.msg,
                "row": e.lineno,
                "column": e.offset,
                "code": e.text,
            }
            error_log = log_oper.get_error_log(
                err, sys._getframe(), traceback.format_exc()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise CodeException(errors.AgentExecutor_Function_CodeError(), err)
        except Exception as e:
            # err = f"Error occurred while processing the code: \n{repr(e)}"
            traceback_list = traceback.extract_tb(sys.exc_info()[2])
            file_name, line_number, func_name, line_text = traceback_list[-1]
            err = {
                "details": repr(e),
                "row": line_number,
                "column": None,
                "code": line_text,
            }
            error_log = log_oper.get_error_log(
                err, sys._getframe(), traceback.format_exc()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise CodeException(errors.AgentExecutor_Function_CodeError(), err)

    @staticmethod
    def get_function_params(func: callable) -> List[dict]:
        """获取函数的参数信息"""
        params = inspect.signature(func).parameters

        # 获取类型注解
        type_hints = get_type_hints(func)

        # 初始化参数列表
        param_list = []

        # 遍历每个参数
        for name, param in params.items():
            # 忽略所有带有 * 和 ** 的参数
            if param.kind in (param.VAR_POSITIONAL, param.VAR_KEYWORD):
                continue

            param_dict = {"name": name}
            # 获取参数类型
            param_type = None
            if type_hints.get(name):
                param_type = type_hints.get(name).__name__
            elif param.default is not param.empty:
                param_type = type(param.default).__name__
            if param_type:
                # 需要判断是否为基础数据类型，或者转为json格式的数据类型
                # 但是现在不需要输入参数的数据类型，所以暂时不需要过多的处理
                param_dict["type"] = param_type

            # 获取参数默认值
            if param.default is not param.empty:
                try:
                    param_dict["default"] = json.dumps(
                        param.default, ensure_ascii=False
                    )
                except (TypeError, ValueError):
                    # 默认值不是基础数据类型，则不处理
                    pass

            # 添加到参数列表
            param_list.append(param_dict)

        return param_list

    async def get_main_func_params(self, code: str) -> List[dict]:
        main_func = self.get_main_func(code)
        return self.get_function_params(main_func)

    async def run_code(self, code: str, input_values: dict):
        """
        运行代码

        Args:
             code: 函数代码
             input_values: 输入参数 例: {"main_arg": value}
        """
        with TeeStdout() as tee:
            main_func = self.get_main_func(code)

            # 检查输入参数是否符合函数定义
            main_func_inputs = {
                param["name"]: param for param in self.get_function_params(main_func)
            }
            # if len(main_func_inputs) != len(input_values):
            #     raise CodeException(errors.AgentExecutor_Function_InputError(),
            #                         f"main() takes {len(main_func_inputs)} positional arguments but {len(input_values)} was given")
            for input_name in input_values:
                if input_name not in main_func_inputs:
                    raise CodeException(
                        errors.AgentExecutor_Function_InputError(),
                        f"main() got an unexpected keyword argument '{input_name}'",
                    )
            for input_name in main_func_inputs:
                if (
                    "default" not in main_func_inputs[input_name]
                    and input_name not in input_values
                ):
                    raise CodeException(
                        errors.AgentExecutor_Function_InputError(),
                        f"main() missing 1 required positional argument: '{input_name}'",
                    )

            # 运行函数
            asynchronous, stream = func_judgment(main_func)
            try:
                if not stream:
                    if not asynchronous:
                        main_ret = main_func(**input_values)
                    else:
                        main_ret = await main_func(**input_values)
                    self.check_output(main_ret)
                    # res = self.get_code_output(output_names, main_ret)
                    print_output = tee.get_value()
                    yield main_ret, print_output
                else:
                    if not asynchronous:
                        for main_ret in main_func(**input_values):
                            self.check_output(main_ret)
                            # yield self.get_code_output(output_names, main_ret)
                            print_output = tee.get_value()
                            yield main_ret, print_output
                    else:
                        async for main_ret in main_func(**input_values):
                            self.check_output(main_ret)
                            # yield self.get_code_output(output_names, main_ret)
                            print_output = tee.get_value()
                            yield main_ret, print_output
            except CodeException as e:
                # err = repr(e)
                traceback_list = traceback.extract_tb(sys.exc_info()[2])
                file_name, line_number, func_name, line_text = traceback_list[-1]
                err = {
                    "details": repr(e),
                    "row": line_number,
                    "column": None,
                    "code": line_text,
                }
                error_log = log_oper.get_error_log(
                    err, sys._getframe(), traceback.format_exc()
                )
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                print_output = tee.get_value()
                yield e, print_output
                return
            except Exception as e:
                # err = f"Error occurred while running the code: \n{repr(e)}"
                # err = repr(e)
                traceback_list = traceback.extract_tb(sys.exc_info()[2])
                file_name, line_number, func_name, line_text = traceback_list[-1]
                err = {
                    "details": repr(e),
                    "row": line_number,
                    "column": None,
                    "code": line_text,
                }
                error_log = log_oper.get_error_log(
                    err, sys._getframe(), traceback.format_exc()
                )
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                print_output = tee.get_value()
                yield (
                    CodeException(errors.AgentExecutor_Function_RunError(), err),
                    print_output,
                )
                return

    @staticmethod
    def check_output(output):
        """检查函数的输出是否为有效的JSON对象"""
        try:
            json.dumps(output, ensure_ascii=False)
        except (TypeError, ValueError):
            raise CodeException(
                errors.AgentExecutor_Function_OutputError(),
                "The output of the function is not a valid JSON object.",
            )

    @staticmethod
    def get_code_output(output_names: list, func_ret):
        """将函数的返回值转换为字典"""
        res = {output_name: "" for output_name in output_names}
        if isinstance(func_ret, tuple):
            for i, main_res in enumerate(func_ret):
                res[output_names[i]] = main_res
        else:
            res[output_names[0]] = func_ret
        return res


function_service = FunctionService()

if __name__ == "__main__":
    file_path = "/data/hsq/agent-executor/myTest.py"
    file_code = open(file_path).read()

    async def main():
        input_values = {}
        async for item, print_output in function_service.run_code(
            file_code, input_values
        ):
            if isinstance(item, Exception):
                print("error: ", item)
            else:
                print("run code res: {}".format(item))

    async def main2():
        params = await function_service.get_main_func_params(file_code)
        print(params)

    asyncio.run(main())
