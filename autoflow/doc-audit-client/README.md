# blueland-plateform-preview：页面预览

## 开发与调试

参考 [插件开发手册（AnyShareFE）](https://confluence.aishu.cn/pages/viewpage.action?pageId=110292058)

CONFIG:

```json
[
    {
        "functionid": "doc-audit-client_dev",
        "icon": "http://localhost:1005/taskbar-audit.svg",
        "command": "docAuditClient_dev",
        "locales": {
            "zh-cn": "审核待办-dev",
            "en-us": "审核待办-dev",
            "zh-tw": "审核待办-dev"
        },
        "entry": "http://localhost:1005/doc-audit-client/ ",
        "route": "/doc-audit-client",
        "homepage": "/doc-audit-client",
        "renderType": "route",
        "renderTo": ["applist"],
        "platforms": ["browser", "electron"]
    }
]
```

### 接入任意审核插件的套壳调试
```json
{
    "entry": "http://localhost:1005/doc-audit-client/",
    "name": "securitylevel",
    "category_belong": "control",
    "label": {
        "en-us": "Security Setting",
        "zh-tw": "定密",
        "zh-cn": "定密"
    },
    "audit_type": "security_classification_approval"
}
```