// dip5.0版本仅有超级管理员、组织管理员和组织审计管理员
export enum SystemRoleType {
    /*
     * 超级管理员
     */
    Supper = "7dcfcc9c-ad02-11e8-aa06-000c29358ad6",

    /**
     * 系统管理员
     */
    Admin = "d2bd2082-ad03-11e8-aa06-000c29358ad6",

    /**
     * 安全管理员
     */
    Securit = "d8998f72-ad03-11e8-aa06-000c29358ad6",

    /**
     * 审计管理员
     */
    Audit = "def246f2-ad03-11e8-aa06-000c29358ad6",

    /**
     * 组织管理员
     */
    OrgManager = "e63e1c88-ad03-11e8-aa06-000c29358ad6",

    /**
     * 门户管理员
     */
    PortalManager = "6da85392c000-60aa-8e11-30da-88c1e36e",

    /**
     * 组织审计员
     */
    OrgAudit = "f06ac18e-ad03-11e8-aa06-000c29358ad6",

    /**
     * 共享审核员
     */
    SharedApprove = "f58622b2-ad03-11e8-aa06-000c29358ad6",

    /**
     * 文档审核员
     */
    DocApprove = "fb648fac-ad03-11e8-aa06-000c29358ad6",

    /**
     * 定密审核员
     */
    CsfApprove = "01a78ac2-ad04-11e8-aa06-000c29358ad6",
}

/**
 * 用户角色
 */
export enum UserRole {
    /**
     * 超级管理员
     */
    Super = "super_admin",

    /**
     * 系统管理员
     */
    Admin = "sys_admin",

    /**
     * 安全管理员
     */
    Security = "sec_admin",

    /**
     * 审计管理员
     */
    Audit = "audit_admin",

    /**
     * 组织管理员
     */
    OrgManager = "org_manager",

    /**
     * 组织审计员
     */
    OrgAudit = "org_audit",

    /**
     * 普通用户
     */
    NormalUser = "normal_user",
}

/**
 * 系统角色id与用户角色的映射
 */
export const SysUserRoles = {
    [SystemRoleType.Supper]: UserRole.Super,
    [SystemRoleType.Admin]: UserRole.Admin,
    [SystemRoleType.Securit]: UserRole.Security,
    [SystemRoleType.Audit]: UserRole.Audit,
    [SystemRoleType.OrgManager]: UserRole.OrgManager,
    [SystemRoleType.OrgAudit]: UserRole.OrgAudit,
};

// 内置账号名称（三权分立）
export const defaultAccountNames = ["system", "admin", "security", "audit"];
