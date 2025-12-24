const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    // oauthui的接口不走这边，所以无法做全流程
    app.use(
        ["/api", "/interface", "/oauth2"],
        createProxyMiddleware({
            target: "https://10.4.30.19:443",
            changeOrigin: true,
            secure: false,
            cookieDomainRewrite: {
                "https://10.4.30.19": "https://localhost",
            },
            logLevel: "debug",
            onProxyRes(proxyRes, req, res) {
                console.log(proxyRes.headers["set-cookie"]);
            },
        })
    );
};
