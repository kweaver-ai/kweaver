# <APP_NAME>

## 脚本

### `pnpm --filter <APP_NAME> start`

启动本地调试服务，[https://localhost:<PORT>](https://localhost:<PORT>)

### `pnpm --filter <APP_NAME> test`

在交互模式下运行测试

### `pnpm --filter <APP_NAME> build`

在 `build` 目录生成用于发布的代码

## 开发与调试

参考 [插件开发手册（AnyShareFE）](https://confluence.aishu.cn/pages/viewpage.action?pageId=110292058)

CONFIG:

```json
[
    {
        "functionid": "<APP_NAME>_dev",
        "icon": "https://localhost:<PORT>/logo512.png",
        "command": "<APP_NAME>_dev",
        "locales": {
            "zh-cn": "<APP_NAME>",
            "en-us": "<APP_NAME>",
            "zh-tw": "<APP_NAME>"
        },
        "entry": "https://localhost:<PORT>",
        "route": "/home",
        "homepage": "/home",
        "renderType": "route",
        "renderTo": ["taskbar"],
        "contextmenuConfig": {
            "isSupportAllFile": false,
            "isSupportFolder": true,
            "isSupportMultiChoice": false,
            "supportExtensions": []
        },
        "platforms": ["browser", "electron"]
    }
]
```

### 在浏览器中查看

1. 访问 AnyShare 网页或打开 AnyShare 客户端

2. 打开开发者工具
    * `F12`
    * `Cmd + Option + I` for macOS
    * `Ctrl + Shift + I` for Windows

3. 在 `sessionStorage` 配置 `anyshare.client.microwidget.devTool.config` 值为上述 `CONFIG`
    
3. 刷新页面查看

## 发布

### 生成 <APP_NAME> 发布包

Azure Pipelines YAML 文件：[<APP_NAME>.yaml](../../pipelines/<APP_NAME>.yaml)

1. 在浏览器中打开 [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_build?definitionScope=%5C%E5%B7%A5%E4%BD%9C%E4%B8%AD%E5%BF%83%E7%A0%94%E5%8F%91%E9%83%A8](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_build?definitionScope=%5C%E5%B7%A5%E4%BD%9C%E4%B8%AD%E5%BF%83%E7%A0%94%E5%8F%91%E9%83%A8)

2. 新建管道，依次选择 【`Azure Repos Git`】【`ContentApplets`】【`现有 Azure Pipelines YAML 文件`】 

    * 分支：根据需求决定
    * 路径：`/pipelines/<APP_NAME>.yaml`


### 添加发布包到 `AppletStatic`

仓库： [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppletStatic](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppletStatic)

创建需求分支，在 `azure-pipeline.yml` 文件的 `parameters` 字段中添加以下代码：

```yaml
  - name: <APP_NAME>
    default: latest
```

### 添加项目配置到 `AppStoreConfig`

参考 [https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppStoreConfig](https://devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/AppStoreConfig)