from gettext import gettext as _l

AgentExecutor_Function_CodeError = {
    "ErrorCode": "AgentExecutor.InternalError.ParseCodeError",
    "Description": _l("There's an error in the code. "),
    "Solution": _l("Please check the code."),
}
AgentExecutor_Function_InputError = {
    "ErrorCode": "AgentExecutor.InternalError.RunCodeError",
    "Description": _l("Incorrect input parameters. "),
    "Solution": _l("Please check the input arguments."),
}
AgentExecutor_Function_RunError = {
    "ErrorCode": "AgentExecutor.InternalError.RunCodeError",
    "Description": _l("Code Execution Failure"),
    "Solution": _l("Please check the code."),
}
AgentExecutor_Function_OutputError = {
    "ErrorCode": "AgentExecutor.InternalError.RunCodeError",
    "Description": _l("Return of the function is not JSON serializable"),
    "Solution": _l("Please check the code."),
}
