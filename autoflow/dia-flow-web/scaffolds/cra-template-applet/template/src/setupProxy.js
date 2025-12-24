/* eslint-disable @typescript-eslint/no-var-requires */

const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    const { DEBUG_PROXY = `https://anyshare.aishu.cn` } = process.env;

    app.use(
        "/api",
        createProxyMiddleware({
            secure: false,
            target: `${DEBUG_PROXY}`,
            changeOrigin: true,
            rejectUnauthorized: false,
        })
    );
};
