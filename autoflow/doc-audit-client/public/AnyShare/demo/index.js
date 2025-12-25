const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

app.use(express.static(path.resolve(__dirname, "../../build")));

app.use(
    "/api",
    createProxyMiddleware({
        secure: false,
        target: `https://10.2.177.29/api/`,
        pathRewrite: { "^/api": "/" },
        changeOrigin: true,
        rejectUnauthorized: false,
    })
);

app.use(
    "/foxit",
    createProxyMiddleware({
        secure: false,
        target: `https://10.2.177.29/anyshare/static/foxit/`,
        pathRewrite: { "^/foxit": "/" },
        changeOrigin: true,
        rejectUnauthorized: false,
    })
);

app.listen(3000);
