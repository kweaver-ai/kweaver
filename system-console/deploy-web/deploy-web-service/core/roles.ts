import { isArray } from "lodash";

/**
 * 用户角色
 */
export const Roles = {
    /**
     * 超级管理员
     */
    SuperAdmin: "super_admin",

    /**
     * 系统管理员
     */
    SystemAdmin: "sys_admin",

    /**
     * 安全管理员
     */
    Security: "sec_admin",

    /**
     * 审计管理员
     */
    Audit: "audit_admin",

    /**
     * 组织管理员
     */
    OrgManager: "org_manager",

    /**
     * 组织审计员
     */
    OrgAudit: "org_audit",

    /**
     * 普通用户
     */
    NormalUser: "normal_user",
};

export const getFirstPagePathname = (result) => {
    if (
        [Roles.SuperAdmin, Roles.SystemAdmin].some((item) => {
            // 兼容旧API，旧api直接返回对象，新api用数组返回多个对象
            return isArray(result.text)
                ? result.text[0].roles.includes(item)
                : result.text.roles.includes(item);
        })
    ) {
        return "/deploy/information-security/auth/user-org";
    } else if (
        [Roles.Security, Roles.OrgManager].some((item) => {
            // 兼容旧API，旧api直接返回对象，新api用数组返回多个对象
            return isArray(result.text)
                ? result.text[0].roles.includes(item)
                : result.text.roles.includes(item);
        })
    ) {
        return "/deploy/information-security/auth/user-org";
    } else {
        return "/deploy/information-security/audit/auditlog";
    }
};
