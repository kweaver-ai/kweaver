/*******************************************************************************************
ShareMgnt.thrift
    Copyright (c) Eisoo Software, Inc.(2013 - 2014), All rights reserved

Purpose:
        sharemgnt 管理服务接口.
        提供发送邮件

Author:
    ouandyang

Creating Time:
    2021-07-13
*******************************************************************************************/
namespace java com.aishu.wf.core.thrift.sharemgnt
include "EThriftException.thrift"


// 部门信息
struct ncTUsrmDepartmentInfo {
    1: string departmentId;                                     // 部门id
    2: string departmentName;                                   // 部门名称
    3: string parentDepartId;                                   // 父部门id
    4: string parentDepartName;                                 // 父部门名称
    5: list<ncTUsrmGetUserInfo> responsiblePersons;             // 部门管理员
    6: ncTUsrmOSSInfo ossInfo;                                   // 对象存储信息
    7: optional list<string> subDepartIds;                      // 子部门id
    8: string email;                                            // 部门邮箱地址
    9: optional string parentPath;                              // 父部门路径
}

// 用户节点信息
struct ncTUsrmGetUserInfo {
    1: required string id;                      // 用户id
    2: ncTUsrmUserInfo user;                    // 用户基本信息
    3: optional bool originalPwd;               // 是否为初始密码
    4: optional string password;                // 用户密码
    5: ncTUsrmDirectDeptInfo directDeptInfo;    // 直属部门信息
}

//对象存储信息
struct ncTUsrmOSSInfo {
    1: string ossId;                            // 对象存储ID
    2: string ossName;                          // 对象存储名称
    3: string siteName;                         // 对象存储归属站点名称
    4: bool enabled;                            // 对象存储状态
    5: i32 type,                                // 0 表示当前站点配置、管理的对象存储，1 表示分站点同步到总站点的对象存储
}

// 用户基本信息
struct ncTUsrmUserInfo {
    1: required string loginName;                   // 用户名称
    2: optional string displayName;                 // 显示名
    3: optional string email;                       // 邮箱
    4: optional i64 space;                          // 配额空间，单位Bytes，默认5GB，最小1GB
    5: optional ncTUsrmUserType userType;           // 用户类型
    6: required list<string> departmentIds;         // 所属部门id，-1时表示为未分配用户
    7: optional list<string> departmentNames;       // 所属部门名称
    8: optional ncTUsrmUserStatus status;           // 用户状态
    9: optional i64 usedSize;                       // 已使用配额空间,单位Bytes
    10: optional i32 priority;                      // 排序优先级
    11: optional i32 csfLevel;                      // 用户密级
    12: required bool pwdControl;                   // 密码管控
    13: optional ncTUsrmOSSInfo ossInfo;             // 对象存储信息
    14: optional ncTLimitSpaceInfo limitSpaceInfo;  // 管理员限额信息
    15: optional i64 createTime;                    // 用户创建时间
    16: optional bool freezeStatus;                 // 用户冻结状态，true:冻结 false:未冻结
    17: optional string telNumber;                  // 手机号
    18: optional list<ncTRoleInfo> roles;           // 用户角色
    19: optional i32 expireTime;                    // 用户账号有效期(单位：秒), 默认为 -1, 永久有效
    20: optional string remark;                     // 备注
    21: optional string idcardNumber;               // 身份证号
}

// 直属部门信息
struct ncTUsrmDirectDeptInfo {
    1: string departmentId;                                     // 部门id
    2: string departmentName;                                   // 部门名称
    3: list<ncTSimpleUserInfo> responsiblePersons;              // 管理员信息
}

// 定义简单的用户信息
struct ncTSimpleUserInfo {
    1: string id;
    2: string displayName;
    3: string loginName;
    4: ncTUsrmUserStatus status;
}

// 用户状态
enum ncTUsrmUserStatus {
    NCT_STATUS_ENABLE = 0,          // 启用
    NCT_STATUS_DISABLE = 1,         // 禁用
    NCT_STATUS_DELETE = 2,          // 用户被第三方系统删除
}

// 用户类型
enum ncTUsrmUserType {
    NCT_USER_TYPE_LOCAL = 1,        // 本地用户
    NCT_USER_TYPE_DOMAIN = 2,       // 域用户
    NCT_USER_TYPE_THIRD = 3,        // 第三方验证用户
}

// 用户角色信息
struct ncTRoleInfo
{
    1: string name;                 // 名称
    2: string description;          // 描述
    3: string creatorId;            // 创建者id
    4: string id;                   // 角色id标识
    5: string displayName;          // 显示名
}

// 管理员限额信息
struct ncTLimitSpaceInfo {
    1: optional i64 limitUserSpace                 // 用户限额，默认为-1(无限制)
    2: optional i64 allocatedLimitUserSpace        // 已分配的用户限额,默认0
    3: optional i64 limitDocSpace                  // 文档库限额，默认为-1(无限制)
    4: optional i64 allocatedLimitDocSpace         // 已分配的文档库限额，默认0
}

/**
 * sharemgnt 管理服务接口
 */
service sharemgnt {

    /**
     * 13.4 使用smtp发送邮件
     * @param toEmailList: 目标邮件列表
     * @param subject:     邮件主题
     * @param subject:     邮件内容
     * @throw 转抛内部调用异常
     */
    void SMTP_SendEmail (1: list<string> toEmailList, 2: string subject, 3: string content)
                            throws (1: EThriftException.ncTException exp),
	// 13.7 使用smtp发送带附件图片邮件
    // toEmailList:目标邮件列表
    // subject:邮件主题
    // content:邮件内容
    // image:邮件附件(图片)
    void SMTP_SendEmailWithImage(1: list<string> toEmailList, 2: string subject, 3: string content, 4: binary image) throws(1: EThriftException.ncTException exp)

    /**
     * 三权分立是否开启
     * @throw 转抛内部调用异常
     */
    bool Usrm_GetTriSystemStatus () throws (1: EThriftException.ncTException exp),

    /**
     * 2.37 批量根据部门ID(组织ID)获取部门（组织）父路经
     * @throw 转抛内部调用异常
     */
    list<ncTUsrmDepartmentInfo> Usrm_GetDepartmentParentPath(1:list<string> departIds) 
                            throws (1: EThriftException.ncTException exp),
							
	// 3.5、根据用户id获取详细信息
    ncTUsrmGetUserInfo Usrm_GetUserInfo(1: string userId) throws(1: EThriftException.ncTException exp)

    
}
