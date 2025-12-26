import fetch from "node-fetch";
import logger from "../common/logger";
import {
    agent,
    configData,
    // getNamespace,
} from "./tools/index.js";
import * as _ from "lodash";

let IsDeployed = false;

/**
 * 以下接口不需要检查权限
 */
const PostWhiteList = [
    "/interface/deployweb/login",
    "/interface/deployweb/refreshtoken",
    "/interface/deployweb/v1/oemconfig",
    "/interface/deployweb/oauth/login/callback",
    "/interface/deployweb/oauth/logout/callback",
    "/api/deployweb/deploy-manager/v1/access-addr/app",
];

/**
 * 记录rest日志
 * @param {*} req
 * @param {*} msg
 */
const restfulRecorder = (ecode, req, msg) => {
    if (ecode === 200 || ecode === 302) {
        logger.info("requst succeeded: " + req.originalUrl);
    } else {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${msg}`);
        logger.info(
            `original url: ${req.originalUrl.replace("deployweb/", "")};`
        );
        logger.info(`original service: ${req.originalUrl.split("/")[3]}`);
    }
};

/**
 * 记录thrift日志
 * @param {*} req
 * @param {*} msg
 */
const thriftRecorder = (ecode, req, msg) => {
    if (ecode === 200 || ecode === 302) {
        logger.info("requst succeeded: " + req.originalUrl);
    } else {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${msg}`);
        logger.info(`original service: ${req.params.module}`);
    }
};

/**
 * 验证当前用户本地sid和session是否一致
 * @param {*} request
 */
const verify = async function (req) {
    // 鉴权统一由代理层负责
    return true;
    // const [firstArg, methodName, ...last] = _.values(req.body);
    // const { lang, host, port, state } = req.query;

    // if (
    //     !PostWhiteList.some(
    //         (method) => method === methodName || method === req.path
    //     )
    // ) {
    //     const serviceConfig = getServiceConfig(host, port);
    //     const { deployweb } = serviceConfig;
    //     const oauthClientID = deployweb ? deployweb.oauthClientID : "";
    //     const tokenc = req.cookies["deploy.oauth2_token"];
    //     if (!tokenc) {
    //         return false;
    //     } else if (oauthClientID) {
    //         try {
    //             const {
    //                 text: { client_id: clientId, active },
    //             } = await token2Userid(serviceConfig, tokenc);
    //             return active && clientId === oauthClientID;
    //         } catch (err) {
    //             logger.error(err);
    //             return false;
    //         }
    //     } else {
    //         return false;
    //     }
    // } else {
    //     return true;
    // }
};

async function interfaceProxy(req, res, next) {
    if (!(await verify(req))) {
        res.status(403).json(null);
    } else {
        next();
    }
}

async function restfulProxy(req, res) {
    let response;

    if (!(await verify(req))) {
        logger.info("requst 403 forbidden: " + req.originalUrl);
        res.status(403).json(null);
    } else {
        const isSendBody = ["head", "get"].includes(
            req.method.toLocaleLowerCase()
        );
        const config = configData.Module2Config[req.originalUrl.split("/")[3]];
        try {
            const playload = isSendBody
                ? config.protocol === "https"
                    ? {
                          agent,
                          timeout: 0,
                          method: req.method,
                      }
                    : {
                          timeout: 0,
                          method: req.method,
                      }
                : config.protocol === "https"
                ? {
                      agent,
                      timeout: 0,
                      method: req.method,
                      body: JSON.stringify(req.body),
                  }
                : {
                      timeout: 0,
                      method: req.method,
                      body: JSON.stringify(req.body),
                  };
            let result;
            if (req.originalUrl.split("/")[3] !== "proton-exporter") {
                result = await fetch(
                    `${config.protocol}://${config.host}:${
                        config.port
                    }${req.originalUrl.replace("deployweb/", "")}`,
                    req.originalUrl.split("/")[3] !== "deploy-auth"
                        ? playload
                        : {
                              ...playload,
                              headers: {
                                  Authorization:
                                      req?.headers?.authorization || "",
                              },
                          }
                );
            } else {
                // 只处理proton-exporter
                result = await fetch(
                    `${config.protocol}://${config.host}:${
                        config.port
                    }${req.originalUrl.replace(
                        "api/deployweb/proton-exporter/v1/",
                        ""
                    )}`,
                    playload
                );
            }
            res.status(result.status);
            const ret = new Function(
                "console",
                "Error",
                "res",
                "req",
                "require",
                "Buffer",
                "exports",
                "__filename",
                "process",
                "setInterval",
                "setImmediate",
                "setTimeout",
                "TextDecoder",
                "TextEncoder",
                "URL",
                "URLSearchParams",
                "return " + (await result.text())
            )(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
            response = ret;
            restfulRecorder(result.status, req, response);
        } catch (err) {
            restfulRecorder(500, req, err);
            if (err && err["code"] === "ECONNREFUSED") {
                res.status(502);
                response = {
                    type: "system",
                    code: "ECONNREFUSED",
                    message: "error forwarding port",
                };
            } else {
                res.status(500);
                response = err;
            }
        } finally {
            res.json(response);
        }
    }
}

async function thriftProxy(req, res) {
    let response;
    if (!(await verify(req))) {
        logger.info("requst 403 forbidden: " + req.originalUrl);
        res.status(403).json(null);
    } else {
        try {
            logger.info("Forwarding requst start: " + req.originalUrl);
            const result = await fetch(
                `http://127.0.0.1:18008/${req.params.module}`,
                {
                    timeout: 0,
                    method: "POST",
                    body: JSON.stringify(req.body),
                }
            );
            logger.info("Forwarding requst end: " + req.originalUrl);
            res.status(result.status);
            // 不用JSON.parse： thrift协议将 {"i64": -1} 构造成  {"i64": -00000001}， 导致浏览器client使用JSON.parse()解析时报错
            // 不用eval：参数传入js代码会被运行
            const ret = new Function(
                "console",
                "Error",
                "res",
                "req",
                "require",
                "Buffer",
                "exports",
                "__filename",
                "process",
                "setInterval",
                "setImmediate",
                "setTimeout",
                "TextDecoder",
                "TextEncoder",
                "URL",
                "URLSearchParams",
                "return " + (await result.text())
            )(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
            response = ret;
            thriftRecorder(result.status, req, response);
        } catch (err) {
            thriftRecorder(500, req, err);
            res.status(500);
            response = err;
        } finally {
            res.set("Content-Type", "application/vnd.apache.thrift.json");
            res.json(response);
        }
    }
}

export { verify, restfulProxy, thriftProxy, interfaceProxy };
