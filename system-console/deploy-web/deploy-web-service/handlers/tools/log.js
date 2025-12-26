import { configData, fetchParse, getUTCTime } from "./index";
import { v4 as uuidv4 } from "uuid";

/**
 * 日志级别
 */
export const Level = {
    ALL: 0, // 所有
    INFO: 1, // 信息
    WARN: 2, // 警告
};

// 登录操作
export const LoginOps = {
    ALL: 0, // 所有操作
    LOGIN: 1, // 登录操作
    LOGOUT: 2, // 退出操作
    AUTHENICATION: 3, // 认证操作
    OTHER: 127, // 其它操作
};

/**
 * 日志类型
 */
export const LogType = {
    // 管理日志
    Management: "management",
    // 登录日志
    Login: "login",
    // 操作日志
    Operation: "operation",
};

/**
 * 用户类型
 */
export const UserType = {
    // 实名用户
    AuthenticatedUser: "authenticated_user",
    // 匿名用户
    AnonymousUser: "anonymous_user",
    // 应用账户
    App: "app",
    // 内部服务
    InternalService: "internal_service",
};

const log = async (
    req,
    { logType, level, opType, msg = "", exMsg = "", userId }
) => {
    const { "audit-log": auditLog } = configData.Module2Config;
    const { headers } = req;

    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime =
        new Date(Date.now() - tzoffset).toISOString().slice(0, 19) + "+08:00";

    const clientIP = headers["x-real-ip"]
        ? headers["x-real-ip"]
        : headers["X-Forwarded-For"]
        ? headers["X-Forwarded-For"]
        : "";

    const payload = {
        user_id: userId,
        user_type: UserType.AuthenticatedUser,
        level,
        op_type: opType,
        date: getUTCTime(localISOTime) * 1000,
        ip: clientIP,
        mac: "",
        msg: msg.trim(),
        ex_msg: exMsg.trim(),
        user_agent: "",
        additional_info: "",
        out_biz_id: uuidv4(),
    };
    return await fetchParse(
        `${auditLog.protocol}://${auditLog.host}:${auditLog.port}/api/audit-log/v1/log/${logType}`,
        {
            timeout: 6 * 1000,
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
};

export const loginLog = async (req, params) => {
    return await log(req, {
        ...params,
        logType: LogType.Login,
    });
};
