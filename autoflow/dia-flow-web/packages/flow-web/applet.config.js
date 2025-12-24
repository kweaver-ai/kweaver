const path = require("path");

/**@type {import("react-scripts/config/webpack.config").AppletConfig} */
module.exports = {
    library: "content-automation-[name]",
    entry(paths) {
        return [
            {
                name: "main",
                template: paths.appHtml,
                entry: paths.appIndexJs,
                htmlFilename: "index.html",
            },
            {
                name: "guide",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/guide.tsx"),
                htmlFilename: "guide.html",
            },
            {
                name: "plugin",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/plugin.tsx"),
                htmlFilename: "plugin.html",
            },
            {
                name: "new",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/policy.tsx"),
                htmlFilename: "policy.html",
            },
            {
                name: "dataStudio",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/data-studio.tsx"),
                htmlFilename: "dataStudio.html",
            },
            {
                name: "form",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/form.tsx"),
                htmlFilename: "form.html",
            },
            {
                name: "fileTrigger",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/file-trigger.tsx"),
                htmlFilename: "fileTrigger.html",
            },
            {
                name: "assistant",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/assistant.tsx"),
                htmlFilename: "assistant.html"
            },
            {
                name: "operatorFlow",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/operator-flow.tsx"),
                htmlFilename: "operatorFlow.html",
            },
            {
                name: "operatorFlowDetail",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/operator-flow-detail.tsx"),
                htmlFilename: "operatorFlowDetail.html",
            },
            {
                name: "workflow",
                template: paths.appHtml,
                entry: path.resolve(paths.appSrc, "./plugins/workflow.tsx"),
                htmlFilename: "workflow.html",
            },
        ];
    },
};
