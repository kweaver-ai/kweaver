/**@type {import("react-scripts/config/webpack.config").AppletConfig} */
module.exports = {
    entry(paths) {
        return [
            {
                name: "main",
                template: paths.appHtml,
                entry: paths.appIndexJs,
                htmlFilename: "index.html",
            },
        ];
    },
};
