# vue-admin-template

**The current version is `v4.0+` build on `vue-cli`.**

## Build Setup

```bash
# clone the project
git clone https://github.com/PanJiaChen/vue-admin-template.git

# enter the project directory
cd vue-admin-template

# install dependency
npm install

# develop
npm run dev
```

This will automatically open http://localhost:9528

## Build

```bash
# build for test environment
npm run build:stage

# build for production environment
npm run build:prod
```

## Advanced

```bash
# preview the release environment effect
npm run preview

# preview the release environment effect + static resource analysis
npm run preview -- --report

# code format check
npm run lint

# code format check and auto fix
npm run lint -- --fix
```

### 任意审核接入参数

```js
arbitrailyAudit {
    /**
     * 插件展示内容
     */
    visit: 'preview' | 'new' | 'update' ;

    /**
     * 审核流程类型
     */
    process_type?: string;

    /**
     * 如果是预览或编辑，则传入审核流程key
     */
    process_def_key?: string;

    /**
     * 如果是预览或编辑，则传入审核流程id
     */
    process_def_id?: string;

    /**
     * 当为编辑状态且没有传入process_def_id时生效
     */
    configData?: object;

    /**
     * 是否直接生成流程，默认为true
     */
    saveFlow?: boolean;

    /**
     * 仅保存流程时是否弹出名称输入框，默认为true
     */
    allowEditName?: boolean;

    /**
     * 预览画布高度颜色配置,高度单位为px
     */
    previewBox?: {
        height: number;
        background: string;
    };

    /**
     * 关闭插件时的回调
     */
    onCloseAuditFlow?: () => void;

    /**
     * 保存审核流程或模板时的回调
     */
    onSaveAuditFlow?: (params: {
        /**
         * 流程id
         */
        process_def_id?: string;

        /**
         * 流程key
         */
        process_def_key: string;

        /**
         * 流程名称
         */
        process_def_name: string;

        /**
         * 新建编辑审核流程参数,当saveFlow为false返回
         */
        process_data?: {
            /**
             * 新建编辑审核流程类型
             */
            type: 'update' | 'new'
            /**
             * 流程信息
             */
            configData: object

        };
        /**
         * 返回一个随机key,如 Process_PRhyySvH
         */
        generateKey: () => string
    }) => void;
}
```
