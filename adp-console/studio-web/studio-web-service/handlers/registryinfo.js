import logger from "../common/logger.js";
import { verify } from "./proxyroutes";
import { configData } from "./tools/index.js";

const serviceName = "workstation";

/**
 * 代理过滤函数
 * @param {*} pathname url
 * @param {*} req 请求体
 * @returns
 */
async function filter(pathname, req) {
    if (String(req.method).toLowerCase() === "get") {
        return true;
    } else {
        return await verify(req);
    }
}

/**
 * 代理 options
 */
const options = () => {
    const config = configData.Module2Config[serviceName];
    return {
        target: `${config.protocol}://${config.host}:${config.port}`,
        pathRewrite: function (path, req) {
            if (path.indexOf("studioweb") !== -1) {
                return path.replace("studioweb", serviceName);
            } else {
                return path.replace("studio-web-service", serviceName);
            }
        },
        logLevel: "info",
        changeOrigin: true,
        onError: (err, req, res) => {
            logger.info(`error message: ${err}`);
            logger.info(`original service: workstation`);
            res.json(err);
            res.status(500);
            res.end();
        },
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
                let bodyData = JSON.stringify(req.body);
                proxyReq.setHeader("Content-Type", "application/json");
                proxyReq.setHeader(
                    "Content-Length",
                    Buffer.byteLength(bodyData)
                );
                // stream the content
                proxyReq.write(bodyData);
            }
        },
    };
};

//导出对象
export { filter, options };
