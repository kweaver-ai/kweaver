export type Space = {
    /**
     * buffer
     */
    buffer: {
        /**
         * buff 信息
         */
        type: string;
        /**
         * 数据信息
         */
        data: Array<number>;
    };
    /**
     * 偏移量
     */
    offset: number;
};

/**
 * 角色信息
 */
export type Role = {
    /**
     * id
     */
    id: string;
    /**
     * 名称
     */
    name: string;
    /**
     * 描述
     */
    description: string;
    /**
     * 创建者id
     */
    creatorId: null | string;
    /**
     * 显示名称
     */
    displayName: null | string;
};

/**
 * 对象存储信息
 */
export type OSS = {
    /**
     * id
     */
    ossId: string | null;
    /**
     * 名称
     */
    ossName: string | null;
    /**
     * 站点名称
     */
    siteName: string | null;
    /**
     * 是否开启
     */
    enabled: string | null;
    /**
     * 类型
     */
    type: string | null;
};

export type User = {
    /**
     * 登录名称
     */
    loginName: string;
    /**
     * 显示名
     */
    displayName: string;
    /**
     * 邮箱
     */
    email: string;
    /**
     * 用户类型
     */
    userType: number;
    /**
     * 部门id
     */
    departmentIds: Array<string>;
    /**
     * 部门名称
     */
    departmentNames: Array<string>;
    /**
     * 用户状态
     */
    status: number;
    /**
     * 已使用空间
     */
    usedSize: Space;
    /**
     *
     */
    priority: number;
    /**
     * 密级
     */
    csfLevel: number;
    /**
     * 是否管控密码
     */
    pwdControl: boolean;
    /**
     * 对象存储信息
     */
    ossInfo: OSS;
    /**
     * 用户空间
     */
    space: Space;
    /**
     * 空间限制信息
     */
    limitSpaceInfo: {
        limitUserSpace: Space;
        allocatedLimitUserSpace: Space;
        limitDocSpace: Space;
        allocatedLimitDocSpace: Space;
    };
    /**
     * 创建时间
     */
    createTime: Space;
    /**
     * 冻结状态
     */
    freezeStatus: boolean;
    /**
     * 电话
     */
    telNumber: null | string;
    /**
     * 角色信息
     */
    roles: Array<Role>;
    /**
     * 过期时间
     */
    expireTime: number;
    /**
     * 标准
     */
    remark: null | string;
    /**
     * 神风证信息
     */
    idcardNumber: string;
};

/**
 * 用户信息
 */
export interface UserInfo {
    /**
     * id
     */
    id: string;
    /**
     * 用户信息
     */
    user: User;
    /**
     * 是否是原始密码
     */
    originalPwd: boolean;
    /**
     * 密码
     */
    password: null | string;
    /**
     * 直属领导信息
     */
    directDeptInfo: null | string;
}
