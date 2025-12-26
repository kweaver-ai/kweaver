// 模块id
const ModuleID = "030";

/**
 * code转字符串
 */
const ErrorCodeMessage = {
    ["404" + ModuleID + "001"]: "The target module of the query does not exist",
    ["404" + ModuleID + "002"]:
        "The queried configuration information does not exist",
    ["500" + ModuleID + "001"]: "The database cannot be linked",
    ["500" + ModuleID + "002"]:
        "There are unresolved characters in the parameter",
    ["500" + ModuleID + "003"]: "A value is required for section",
    ["500" + ModuleID + "004"]: "The table cannot be linked",
    ["500" + ModuleID + "005"]: "Failed to get configuration information",
    ["500" + ModuleID + "006"]: "Failed to set configuration information",
    ["500" + ModuleID + "007"]: "Value failed validation",
    ["500" + ModuleID + "008"]: "Data is no JSON",
};

/**
 * 创建错误返回对象
 * @param {*} status 错误状态码
 * @param {*} code 错误id
 * @param {*} detail detail
 * @returns
 */
export const createError = (error, status, code, detail) => {
    let errid, errmsg;

    if (error && String(error.errno) === "1045") {
        errid = "500" + ModuleID + "001";
        errmsg = ErrorCodeMessage[errid];
    } else if (error && String(error.errno) === "1064") {
        errid = "500" + ModuleID + "002";
        errmsg = ErrorCodeMessage[errid];
    } else if (error && String(error.errno) === "1146") {
        errid = "500" + ModuleID + "004";
        errmsg = ErrorCodeMessage[errid];
    } else {
        errid = String(status) + ModuleID + String(code);
        errmsg = ErrorCodeMessage[errid];
    }

    return {
        message: errmsg ? errmsg : "",
        code: errid ? errid : "",
        detail: errmsg ? errmsg : detail,
    };
};
