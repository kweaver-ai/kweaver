export const microWidgetConfig: any[] = [
    {
        name: "information-security",
        orderIndex: 10000,
        parent: "root",
        app: {
            textZHCN: "信息安全管理",
            textZHTW: "信息安全管理",
            textENUS: "Information Security",
            icon: "",
            pathname: "/information-security",
            roles: [
                "Supper",
                "Admin",
                "Securit",
                "Audit",
                "OrgManager",
                "OrgAudit",
            ],
        },
        subapp: {
            children: {
                auth: {
                    name: "auth",
                    parent: "information-security",

                    orderIndex: 1000,
                    app: {
                        textZHCN: "统一身份认证",
                        textZHTW: "統一身份認證",
                        textENUS: "Unified Authentication",
                        type: "directory",
                        icon: "//ip:port/deploy/static/media/auth.svg",
                        pathname: "/information-security/auth",
                        roles: ["Supper", "Admin", "Securit", "OrgManager"],
                    },
                    subapp: {
                        children: {
                            "user-org": {
                                app: {
                                    // icon: "//ip:port/isfweb/icons/user-org.svg",
                                    textZHCN: "账户",
                                    textZHTW: "賬戶",
                                    textENUS: "Account",
                                    pathname:
                                        "/information-security/auth/user-org",
                                    roles: [
                                        "Supper",
                                        "Admin",
                                        "Securit",
                                        "OrgManager",
                                    ],
                                },
                                name: "user-org",
                                orderIndex: 1000,
                                parent: "auth",
                                subapp: {
                                    activeRule: "/",
                                    baseRouter: "",
                                    children: {},
                                    entry: "//ip:port/isfweb/userorgmgnt.html",
                                },
                            },
                            "cert-manage": {
                                app: {
                                    // icon: "//ip:port/isfweb/icons/cert-manage.svg",
                                    textZHCN: "认证",
                                    textZHTW: "認證",
                                    textENUS: "Authentication",
                                    pathname:
                                        "/information-security/auth/cert-manage",
                                    roles: ["Supper", "Admin", "Securit"],
                                },
                                name: "cert-manage",
                                orderIndex: 2000,
                                parent: "auth",
                                subapp: {
                                    activeRule: "/",
                                    baseRouter: "",
                                    children: {},
                                    entry: "//ip:port/isfweb/certifictionmgnt.html",
                                },
                            },
                        },
                    },
                },
                security: {
                    name: "security",
                    parent: "information-security",
                    orderIndex: 2000,
                    app: {
                        textZHCN: "角色与访问策略",
                        textZHTW: "角色與訪問策略",
                        textENUS: "Role and Access Policy",
                        type: "directory",
                        icon: "//ip:port/deploy/static/media/role-policy.svg",
                        pathname: "/information-security/role-policy",
                        roles: ["Supper", "Securit"],
                    },
                    subapp: {
                        children: {
                            "role-manage": {
                                app: {
                                    // icon: "//ip:port/isfweb/icons/role-manage.svg",
                                    pathname:
                                        "/information-security/role-policy/role-manage",
                                    textZHCN: "角色管理",
                                    textZHTW: "角色管理",
                                    textENUS: "Role Management",
                                    roles: ["Supper", "Securit"],
                                },
                                name: "role-manage",
                                orderIndex: 1000,
                                parent: "security",
                                subapp: {
                                    activeRule: "/",
                                    baseRouter: "",
                                    children: {},
                                    entry: "//ip:port/isfweb/rolemgnt.html",
                                },
                            },
                        },
                    },
                },
                audit: {
                    name: "audit",
                    parent: "information-security",
                    orderIndex: 3000,
                    app: {
                        textZHCN: "日志及审计",
                        textZHTW: "日誌及審計",
                        textENUS: "Audit",
                        type: "directory",
                        icon: "//ip:port/deploy/static/media/audit.svg",
                        pathname: "/information-security/audit",
                        roles: ["Supper", "Securit", "Audit", "OrgAudit"],
                    },
                    subapp: {
                        children: {
                            auditlog: {
                                app: {
                                    // icon: "//ip:port/isfweb/icons/auditlog.svg",
                                    textZHCN: "审计日志",
                                    textZHTW: "審計日誌",
                                    textENUS: "Audit Log",
                                    pathname:
                                        "/information-security/audit/auditlog",
                                    roles: [
                                        "Supper",
                                        "Securit",
                                        "Audit",
                                        "OrgAudit",
                                    ],
                                },
                                name: "auditlog",
                                orderIndex: 1000,
                                parent: "audit",
                                subapp: {
                                    activeRule: "/",
                                    baseRouter: "",
                                    children: {},
                                    entry: "//ip:port/isfweb/auditlog.html",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    {
        name: "model-authorization",
        parent: "root",
        orderIndex: 14000,
        app: {
            textZHCN: "模型",
            textZHTW: "模型",
            textENUS: "Model",
            pathname: "/model-authorization",
        },
        subapp: {
            children: {
                "mf-model-manager/prompt/list1": {
                    parent: "model-authorization",
                    name: "mf-model-manager/prompt/list1",
                    orderIndex: 14100,
                    app: {
                        textZHCN: "提示词工程",
                        textZHTW: "提示詞工程",
                        textENUS: "Prompt Project",
                        icon: "//ip:port/deploy/static/media/prompt-project.svg",
                        pathname:
                            "/model-authorization/mf-model-manager/prompt/list1",
                    },
                    subapp: {
                        entry: "//ip:port/mf-model-manager/index.html",
                        baseRouter: "",
                        activeRule: "/",
                        children: {},
                    },
                },
                "mf-model-manager/model/list2": {
                    parent: "model-authorization",
                    name: "mf-model-manager/model/list2",
                    orderIndex: 14200,
                    app: {
                        textZHCN: "模型管理",
                        textZHTW: "模型管理",
                        textENUS: "Model Management",
                        icon: "//ip:port/deploy/static/media/model-manager.svg",
                        pathname:
                            "/model-authorization/mf-model-manager/model/list2",
                    },
                    subapp: {
                        entry: "//ip:port/mf-model-manager/index.html",
                        baseRouter: "",
                        activeRule: "/",
                        children: {},
                    },
                },
                "mf-model-manager/model/quota": {
                    parent: "model-authorization",
                    name: "mf-model-manager/model/quota",
                    orderIndex: 14300,
                    app: {
                        textZHCN: "配额管理",
                        textZHTW: "配額管理",
                        textENUS: "Quota Management",
                        icon: "//ip:port/deploy/static/media/model-quota.svg",
                        pathname:
                            "/model-authorization/mf-model-manager/model/quota",
                    },
                    subapp: {
                        entry: "//ip:port/mf-model-manager/index.html",
                        baseRouter: "",
                        activeRule: "/",
                        children: {},
                    },
                },
                "mf-model-manager/model/default": {
                    parent: "model-authorization",
                    name: "mf-model-manager/model/default",
                    orderIndex: 14400,
                    app: {
                        textZHCN: "默认模型",
                        textZHTW: "默认模型",
                        textENUS: "Default Model",
                        icon: "//ip:port/deploy/static/media/model-default.svg",
                        pathname:
                            "/model-authorization/mf-model-manager/model/default",
                    },
                    subapp: {
                        entry: "//ip:port/mf-model-manager/index.html",
                        baseRouter: "",
                        activeRule: "/",
                        children: {},
                    },
                },
                "mf-model-manager/model/statistics": {
                    parent: "model-authorization",
                    name: "mf-model-manager/model/statistics",
                    orderIndex: 14500,
                    app: {
                        textZHCN: "模型统计",
                        textZHTW: "模型统计",
                        textENUS: "Model Statistics",
                        icon: "//ip:port/deploy/static/media/model-statistics.svg",
                        pathname:
                            "/model-authorization/mf-model-manager/model/statistics",
                    },
                    subapp: {
                        entry: "//ip:port/mf-model-manager/index.html",
                        baseRouter: "",
                        activeRule: "/",
                        children: {},
                    },
                },
            },
        },
    },
    {
        name: "public-service",
        orderIndex: 14000,
        parent: "root",
        app: {
            textZHCN: "公共服务",
            textZHTW: "公共服务",
            textENUS: "Public Service",
            icon: "",
            pathname: "/public-service",
        },
        subapp: {
            children: {
                "management/list": {
                    app: {
                        icon: "//ip:port/deploy/static/media/business-domain-management.svg",
                        textZHCN: "业务域管理",
                        textZHTW: "業務域管理",
                        textENUS: "Business Domain",
                        pathname: "/public-service/management/list",
                    },
                    name: "management/list",
                    orderIndex: 1000,
                    parent: "public-service",
                    subapp: {
                        activeRule: "/",
                        baseRouter: "",
                        children: {},
                        entry: "//ip:port/business-system-frontend/index.html",
                    },
                },
                mailconfig: {
                    app: {
                        icon: "//ip:port/deploy/static/media/mail.svg",
                        textZHCN: "邮件服务",
                        textZHTW: "郵件服務",
                        textENUS: "Mail Service",
                        pathname: "/public-service/mailconfig",
                    },
                    name: "mailconfig",
                    orderIndex: 2000,
                    parent: "public-service",
                    subapp: {
                        activeRule: "/",
                        baseRouter: "",
                        children: {},
                        entry: "//ip:port/isfweb/mailconfig.html",
                    },
                },
                "third-party-messaging-plugin": {
                    app: {
                        icon: "//ip:port/deploy/static/media/third-party-messaging-plugin.svg",
                        textZHCN: "第三方消息插件",
                        textZHTW: "第三方消息插件",
                        textENUS: "Third-party Messaging Plugin",
                        pathname:
                            "/public-service/third-party-messaging-plugin",
                    },
                    name: "third-party-messaging-plugin",
                    orderIndex: 3000,
                    parent: "public-service",
                    subapp: {
                        activeRule: "/",
                        baseRouter: "",
                        children: {},
                        entry: "//ip:port/isfweb/third-party-messaging-plugin.html",
                    },
                },
            },
        },
    },
];
