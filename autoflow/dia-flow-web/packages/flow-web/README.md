# content-automation-new

## 脚本

### `pnpm --filter content-automation-new start`

启动本地调试服务，[https://localhost:3045](https://localhost:3045)

### `pnpm --filter content-automation-new test`

在交互模式下运行测试

### `pnpm --filter content-automation-new build`

在 `build` 目录生成用于发布的代码

## 开发与调试

参考 [插件开发手册（AnyShareFE）](https://confluence.aishu.cn/pages/viewpage.action?pageId=110292058)

CONFIG:

```json
[
    {
        "functionid": "content-automation-new_dev",
        "icon": "https://localhost:3045/automation.svg",
        "command": "content-automation-new_dev",
        "locales": {
            "zh-cn": "自动化-dev",
            "en-us": "Automate-dev",
            "zh-tw": "自動化-dev"
        },
        "entry": "https://localhost:3045",
        "route": "/automate",
        "homepage": "/automate",
        "renderType": "route",
        "renderTo": ["taskbar"],
        "platforms": ["browser", "electron"]
    },
    {
        "functionid": "work-center-guide",
        "icon": "https://localhost:3045/automation.svg",
        "command": "work-center-guide",
        "locales": {
            "zh-cn": "快速入门",
            "en-us": "快速入门-en",
            "zh-tw": "快速入门-tw"
        },
        "entry": "https://localhost:3045",
        "route": "/",
        "homepage": "/guide",
        "renderType": "route",
        "renderTo": ["fullscreen"],
        "platforms": ["browser", "electron"]
    },
    {
        "functionid": "file-trigger-dev",
        "icon": "https://localhost:3045/flow.svg",
        "command": "file-trigger-dev",
        "locales": {
            "zh-cn": "选择工作流程-zh",
            "en-us": "选择工作流程-en",
            "zh-tw": "选择工作流程-tw"
        },
        "entry": "https://localhost:3045/fileTrigger.html",
        "route": "/",
        "homepage": "/list",
        "renderType": "dialog",
        "renderTo": ["contextmenu"],
        "contextmenuConfig": {
            "isSupportMultiChoice": false,
            "isSupportAllFile": true,
            "isSupportFolder": false
        },
        "platforms": ["browser", "electron"]
    }
]

[
    {
        "functionid": "work-center-policy",
        "icon": "https://localhost:3045/automation.svg",
        "command": "work-center-policy",
        "locales": {
            "zh-cn": "安全策略-zh",
            "en-us": "安全策略-en",
            "zh-tw": "安全策略-tw"
        },
        "entry": "https://localhost:3045/policy.html",
        "route": "/policy",
        "homepage": "/policy",
        "renderType": "route",
        "renderTo": ["applist"],
        "platforms": ["browser", "electron"]
    }
]

[
    {
        "functionid": "work-center-form",
        "icon": "https://localhost:3045/automation.svg",
        "command": "work-center-form",
        "locales": {
            "zh-cn": "预设执行参数-zh",
            "en-us": "预设执行参数-en",
            "zh-tw": "预设执行参数-tw"
        },
        "entry": "https://localhost:3045/form.html",
        "route": "/",
        "homepage": "/form",
        "renderType": "dialog",
        "renderTo": ["custom"],
        "platforms": ["browser", "electron"]
    }
]

[
    {
        "functionid": "data-studio",
        "icon": "https://localhost:3045/automation.svg",
        "command": "dataStudio",
        "locales": {
            "zh-cn": "数据分析-zh",
            "en-us": "数据分析-en",
            "zh-tw": "数据分析-tw"
        },
        "entry": "https://localhost:3045/dataStudio.html",
        "route": "/",
        "homepage": "/dataStudio",
        "renderType": "route",
        "renderTo": ["taskbar"],
        "platforms": ["browser", "electron"]
    }
]

[
    {
        "functionid": "operator-flow",
        "icon": "https://localhost:3045/automation.svg",
        "command": "operatorFlow",
        "locales": {
            "zh-cn": "算子编排-zh",
            "en-us": "算子编排-en",
            "zh-tw": "算子编排-tw"
        },
        "entry": "https://localhost:3045/operatorFlow.html",
        "route": "/",
        "homepage": "/operatorFlow",
        "renderType": "route",
        "renderTo": ["taskbar"],
        "platforms": ["browser", "electron"]
    }
]

{
    "entry": "https://localhost:3045/plugin.html",
    "name": "security_policy_perm",
    "category_belong": "security_policy_perm",
    "label": {
        "en-us": "自动化",
        "zh-tw": "自动化",
        "zh-cn": "自动化"
    },
    "audit_type": ["security_policy_perm","security_policy_upload","automation"]
}
```

#### 安全策略插件支持传入的参数

```js
interface props {
    ...... : any;  //控制台提供的插件Context 字段
    "dagId": string //工作流程ID，当同时传入value时，dagId不生效
    "type":"preview" | "new" | "update"
    "mode": string;  //策略管控行为的类型   perm 权限申请 upload 上传审核
    "value"?: IStep[]  //节点信息
    "onChange": (params:{
        value: IStep[],
        onVerify?: () => Promise<boolean>
    }) => void;    //返回配置的节点信息和校验方法
    "container"?: HTMLElement   //插件加载位置，默认为document.body
    "forbidForm"?: boolean    // 预设执行参数节点 不允许添加任何参数
}
```

### 在浏览器中查看

1. 访问 AnyShare 网页或打开 AnyShare 客户端

2. 打开开发者工具

   - `F12`
   - `Cmd + Option + I` for macOS
   - `Ctrl + Shift + I` for Windows

3. 在 `sessionStorage` 配置 `anyshare.client.microwidget.devTool.config` 值为上述 `CONFIG`
4. 刷新页面查看

## 发布

### 生成 content-automation-new 发布包

Azure Pipelines YAML 文件：[content-automation-new.yaml](../../pipelines/content-automation-new.yaml)

1. 在浏览器中打开 [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/\_build?definitionScope=%5C%E5%B7%A5%E4%BD%9C%E4%B8%AD%E5%BF%83%E7%A0%94%E5%8F%91%E9%83%A8](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_build?definitionScope=%5C%E5%B7%A5%E4%BD%9C%E4%B8%AD%E5%BF%83%E7%A0%94%E5%8F%91%E9%83%A8)

2. 新建管道，依次选择 【`Azure Repos Git`】【`ContentApplets`】【`现有 Azure Pipelines YAML 文件`】

   - 分支：根据需求决定
   - 路径：`/pipelines/content-automation-new.yaml`

### 添加发布包到 `AppletStatic`

仓库： [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/\_git/AppletStatic](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppletStatic)

创建需求分支，在 `azure-pipeline.yml` 文件的 `parameters` 字段中添加以下代码：

```yaml
- name: content-automation-new
  default: latest
```

### 添加项目配置到 `AppStoreConfig`

参考 [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/\_git/AppStoreConfig](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppStoreConfig)

### 工作助手

```json
{
  "name": "content-automation-new",
  "buildinkey": "content-automation-assistant",
  "command": "content-automation-assistant",
  "contextmenuConfig": {},
  "functionid": "content-automation-assistant-dev",
  "entry": "https://localhost:3045/assistant.html",
  "icon": "https://10.4.71.139:443/applet/app/content-automation-new/automation.svg",
  "locales": {
    "zh-cn": "工作助手",
    "zh-tw": "工作助手",
    "en-us": "Work Assistant"
  },
  "platforms": [
    "browser",
    "electron"
  ],
  "provider": "cli_240715xapp1foinoll1us71",
  "route": "/automate",
  "homepage": "/automate",
  "renderTo": [
    "sidebar"
  ],
  "renderType": "component",
  "openmethodConfig": {},
  "ECMAScriptVersion": "es5",
  "libraryName": "content-automation-assistant",
  "appcategory": {},
  "funccategory": {
    "zh-cn": "其他",
    "zh-tw": "其他",
    "en-us": "other"
  },
  "appVersion": "",
  "componentConfig": {},
  "sidebarConfig": {
    "position": "tab",
    "isSupportAllFile": true,
    "isFullPanel": true,
    "isSupportFolder": true,
    "notDisplayedAsPanel": true,
    "tabLocales": {
      "zh-cn": "工作助手",
      "zh-tw": "工作助手",
      "en-us": "Work Assistant"
    }
  },
  "selectIcon": "https://10.4.71.139:443/applet/app/content-automation-new/selectAutomation.svg",
  "description": {},
  "guideConfig": {
    "title": {},
    "content": {}
  }
}
```
