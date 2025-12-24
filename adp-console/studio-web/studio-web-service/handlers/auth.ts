import { isArray } from "lodash";
import { isIPV6 } from "../common/ip";
import { Roles } from "../core/roles";
import {
    fetchParse,
    configData,
    getRealIP,
    URLPrefixFormatter,
    URL_PREFIX_MODE,
} from "./tools/index.js";
import {
    code2Token,
    token2Userid,
    userid2Userinfo,
    revokeUser,
    revokeToken,
    tokenRefresh,
} from "./oauth.js";
import { getLocale } from "./tools/locale";
import { Level, LoginOps, loginLog } from "./tools/log";
import logger from "../common/logger";
import {
    SystemRoleType,
    getIsDefaultAccountName,
} from "../handlers/tools/roles";
import { loginErr } from "./assets/error.js";
import { encodeBase64Fn } from "./tools/sso.js";

/**
 * 登录接口
 */
const login = async (req: any, res: any) => {
    try {
        const {
            lang,
            state,
            integrated,
            "x-forwarded-prefix": forwardedPrefix,
            product,
        } = req.query;
        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        const {
            text: { host, port, scheme = "https" },
        } = await fetchParse(
            `${deployManager.protocol}://${deployManager.host}:${deployManager.port}/api/deploy-manager/v1/access-addr/app`,
            {
                timeout: 0,
                method: "GET",
                headers: {
                    sessionID: req.sessionID,
                    Cookie: `clustersid=${studioclustersid}`,
                },
            }
        );
        req.session.state = state;
        req.session.lang = lang;
        req.session.integrated = integrated;
        const redirectUri =
            `${scheme}://${isIPV6(host) ? `[${host}]` : host}:${port}${
                prefix ? prefix : ""
            }/oauth2/auth` +
            `?redirect_uri=${scheme}://${
                isIPV6(host) ? `[${host}]` : host
            }:${port}${
                prefix ? prefix : ""
            }/interface/studioweb/oauth/login/callback` +
            `&x-forwarded-prefix=${prefix ? prefix : ""}` +
            `&client_id=${oauthClientID}` +
            `&scope=openid+offline+all` +
            `&response_type=code` +
            `&state=${state}` +
            `&lang=${lang}` +
            `&product=${product}`;
        req.session.serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };

        res.cookie("studio.origin_uri", redirectUri, { secure: true });
        res.redirect(301, redirectUri);
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${err}`);
        logger.info(`original service: deploy-service;oauth2-ui`);
        res.set("Content-Type", "application/json");
        res.status(500);
        res.json(err);
    } finally {
        res.end();
    }
};

/**
 * 登录成功回调
 */
const oauthLoginCallback = async (req: any, res: any) => {
    const { code, state, error = "" } = req.query;
    const forwardedPrefix = req.cookies && req.cookies["X-Forwarded-Prefix"];
    const prefix = URLPrefixFormatter(forwardedPrefix, URL_PREFIX_MODE.tail);
    const { serviceConfig, state: states, lang } = req.session;

    if (state !== states) {
        const newPathname = `${
            prefix ? prefix : ""
        }/studio/?error=different_state`;
        if (req.session.integrated === "true") {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    // 仅在 iframe 内部跳转
                    window.parent.location.href = '${newPathname}&redirect=true';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        } else {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    window.top.location.href = '${newPathname}';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        }
    } else if (error) {
        const newPathname = `${prefix ? prefix : ""}/studio/?error=${error}`;
        if (req.session.integrated === "true") {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    // 仅在 iframe 内部跳转
                    window.parent.location.href = '${newPathname}&redirect=true';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        } else {
            res.status(200).send(`
            <html>
                <head>
                    <script>
                    window.top.location.href = '${newPathname}';
                    </script>
                </head>
                <body></body>
            </html>
        `);
        }
    } else {
        try {
            const {
                text: { access_token, id_token, refresh_token },
            } = await code2Token(serviceConfig, code, prefix);
            // token 换 userid
            const {
                text: { sub: userid },
            } = await token2Userid(serviceConfig, access_token);
            // userid 换 userinfo
            const userInfo = await userid2Userinfo(userid);

            req.session.user = userInfo;
            req.session.token = { access_token, id_token, refresh_token };
            req.session.clustertoken = access_token;
            res.cookie("studio.oauth2_token", access_token, { secure: true });
            res.cookie("studio.id_token", id_token, { secure: true });
            res.cookie("studio.refresh_token", refresh_token, { secure: true });

            if (!getIsDefaultAccountName(userInfo)) {
                res.cookie("client.oauth2_token", access_token, {
                    secure: true,
                });
                res.cookie("id_token", id_token, { secure: true });
                res.cookie("client.oauth2_refresh_token", refresh_token, {
                    secure: true,
                });
            }

            const config = configData.Module2Config!["user-management"];
            const result = await fetchParse(
                `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
                {}
            );
            const { oauth2_authentication_session } = req.cookies;

            if (result && result.text) {
                const { "deploy-manager": deployManager, eacp } =
                    configData.Module2Config!;
                try {
                    // 记录登录日志
                    logger.info("记录audit-log登录日志");
                    await loginLog(req, {
                        userId: userid,
                        level: Level.INFO,
                        opType: LoginOps.LOGIN,
                        msg: getLocale(lang, [
                            "登录 工作站 成功",
                            "登入 工作站 成功",
                            "Log in to Studio successfully",
                        ]),
                        exMsg: "",
                    });
                    logger.info("记录audit-log登录日志完成");
                    logger.info("记录可观测性登录日志");
                    // 记录可观测性日志
                    // getRealIP
                    const payload = {
                        id: userid,
                        udid: "",
                        client_type: "console_web",
                        ip: getRealIP(req.headers),
                    };
                    await fetchParse(
                        `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                        {
                            timeout: 6 * 1000,
                            method: "POST",
                            body: JSON.stringify(payload),
                        }
                    );
                    logger.info("记录可观测性登录日志完成");
                } catch (err) {
                    logger.error(err);
                }
                logger.info("登录成功");
                const previousUrl = req.cookies["studio.previous_url"];
                const newPathname =
                    previousUrl && req.session.integrated
                        ? previousUrl
                        : `${prefix ? prefix : ""}/studio/home`;
                if (req.session.integrated === "true") {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            // 仅在 iframe 内部跳转
                            window.parent.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                } else {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            window.top.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                }
            } else if (oauth2_authentication_session) {
                logger.error("客户端勾选了记住密码");
                const newPathname = `${
                    prefix ? prefix : ""
                }/studio/?error=keep_me_logged_in`;
                if (req.session.integrated === "true") {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            // 仅在 iframe 内部跳转
                            window.parent.location.href = '${newPathname}&redirect=true';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                } else {
                    res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            window.top.location.href = '${newPathname}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
                }
            }
        } catch (err) {
            logger.info(`requst failed: ${req.originalUrl};`);
            logger.info(`error message: ${err}`);
            logger.info(`original service: hydra;oauth2-ui`);
            res.status(
                err.status ||
                    parseInt(
                        String(err.status_code || err.code).substring(0, 3)
                    ) ||
                    500
            );
            res.set("Content-Type", "application/json");
            res.json(err);
        }
    }
    res.end();
};

/**
 * 登出成功回调
 */
const oauthLogoutCallback = async (req: any, res: any) => {
    const stateq = req.query.state;

    if (!stateq) {
        res.set("Content-Type", "application/json");
        res.status(403).json(null);
    } else {
        res.set("Content-Type", "application/json");
        res.status(200).json(null);
    }
    res.end();
};

/**
 * 登出接口
 */
const logout = async (req: any, res: any) => {
    const {
        clustertoken: tokens,
        serviceConfig,
        state,
        token,
        user: userInfo,
    } = req.session;
    const tokenc = req.cookies["studio.oauth2_token"];
    const { studioclustersid } = req.cookies;
    const forwardedPrefix = req.cookies && req.cookies["X-Forwarded-Prefix"];
    const prefix = URLPrefixFormatter(forwardedPrefix, URL_PREFIX_MODE.tail);

    let ret = null;
    try {
        if (!tokens) {
            res.status(200);
        } else if (tokens !== tokenc) {
            res.status(403);
        } else {
            const { id_token, access_token } = token;
            await revokeToken(serviceConfig, access_token);
            await revokeUser(
                serviceConfig,
                id_token,
                state,
                studioclustersid,
                req.sessionID,
                prefix
            );
            req.session.destroy((err) => {});
            res.clearCookie("studioclustersid");
            res.clearCookie("studio.oauth2_token");
            res.clearCookie("studio.id_token");
            res.clearCookie("studio.refresh_token");

            if (!getIsDefaultAccountName(userInfo)) {
                res.clearCookie("client.oauth2_token");
                res.clearCookie("id_token");
                res.clearCookie("client.oauth2_refresh_token");
            }

            res.status(200);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.info(`error message: ${err}`);
        logger.info(`original service: deploy-service;oauth2-ui`);
        res.set("Content-Type", "application/json");
        res.status(500);
        ret = err;
    } finally {
        res.json(ret);
        res.end();
    }
};

/**
 * 获取用户信息
 */
const getUserInfoByToken = async (req: any, res: any) => {
    let ret;
    try {
        const { user, clustertoken: tokens } = req.session;
        const tokenc = req.cookies["studio.oauth2_token"];
        if (tokens !== tokenc) {
            ret = null;
            res.status(403);
        } else {
            ret = user;
            res.status(200);
        }
    } catch (err) {
        res.status(500);
        ret = err;
    } finally {
        res.set("Content-Type", "application/json");
        res.json(ret);
        res.end();
    }
};

const getUserInfoByQueryToken = async (req: any, res: any) => {
    let ret;
    try {
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        const {
            text: { host, port, scheme = "https" },
        } = await fetchParse(
            `${deployManager.protocol}://${deployManager.host}:${deployManager.port}/api/deploy-manager/v1/access-addr/app`,
            {
                timeout: 0,
                method: "GET",
                headers: {
                    sessionID: req.sessionID,
                    Cookie: `clustersid=${studioclustersid}`,
                },
            }
        );
        req.session.serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const access_token = req.cookies["studio.oauth2_token"];
        const refresh_token = req.cookies["studio.refresh_token"];
        const {
            text: { sub: userid },
        } = await token2Userid(req.session.serviceConfig, access_token);
        // userid 换 userinfo
        const userInfo = await userid2Userinfo(userid);
        req.session.user = userInfo;
        req.session.token = { access_token, refresh_token };
        req.session.clustertoken = access_token;
        req.session.integrated = "true";

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }

        ret = userInfo;
        res.status(200);
    } catch (err) {
        res.status(403);
        ret = err;
    } finally {
        res.set("Content-Type", "application/json");
        res.json(ret);
        res.end();
    }
};

/**
 * 更新token
 */
const refreshToken = async (req: any, res: any) => {
    const { serviceConfig, token, user: userInfo } = req.session;
    if (!token) {
        res.set("Content-Type", "application/json");
        res.status(500);
        res.json("token refresh failed");
        res.end();
    } else {
        let ret = null;
        try {
            const { refresh_token: refreshTokens } = token;
            const {
                text: { access_token, id_token, refresh_token },
            } = await tokenRefresh(serviceConfig, refreshTokens);
            req.session.token = { access_token, id_token, refresh_token };
            req.session.clustertoken = access_token;
            res.cookie("studio.oauth2_token", access_token, { secure: true });
            res.cookie("studio.id_token", id_token, { secure: true });
            res.cookie("studio.refresh_token", refresh_token, { secure: true });

            if (!getIsDefaultAccountName(userInfo)) {
                res.cookie("client.oauth2_token", access_token, {
                    secure: true,
                });
                res.cookie("id_token", id_token, { secure: true });
                res.cookie("client.oauth2_refresh_token", refresh_token, {
                    secure: true,
                });
            }
            res.status(200);
        } catch (err) {
            logger.info(`requst failed: ${req.originalUrl};`);
            logger.info(`error message: ${err}`);
            logger.info(`original service: hydra;oauth2-ui`);
            ret = err;
            res.status(500);
        } finally {
            res.set("Content-Type", "application/json");
            res.json(ret);
            res.end();
        }
    }
};

/**
 * 单点登录接口
 */
const loginBySSO = async (req: any, res: any) => {
    try {
        logger.info("开始单点登录");
        const {
            credential,
            "x-forwarded-prefix": forwardedPrefix,
            redirect_url,
        } = req.query;

        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        logger.info("开始获取访问地址");
        const {
            text: { host, port, scheme = "https" },
        } = await fetchParse(
            `${deployManager.protocol}://${deployManager.host}:${deployManager.port}/api/deploy-manager/v1/access-addr/app`,
            {
                timeout: 0,
                method: "GET",
                headers: {
                    sessionID: req.sessionID,
                    Cookie: `clustersid=${studioclustersid}`,
                },
            }
        );
        logger.info("获取访问地址成功");

        const payload = {
            client_id: oauthClientID,
            redirect_uri: `${scheme}://${host}:${port}${prefix}/interface/studioweb/oauth/login/callback`,
            response_type: "code",
            scope: "offline openid all",
            credential: JSON.parse(credential.replace(/\'/g, '"')),
            udids: [],
        };
        logger.info("payload", payload);
        logger.info("开始根据第三方认证获取code");
        const {
            text: { code },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/sso`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        logger.info("根据第三方认证获取code成功，code为", code);
        const serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const {
            text: { access_token, id_token, refresh_token },
        } = await code2Token(serviceConfig, code, prefix);
        // token 换 userid
        const {
            text: { sub: userid },
        } = await token2Userid(serviceConfig, access_token);
        // userid 换 userinfo
        const userInfo = await userid2Userinfo(userid);
        logger.info("获取useinfo成功", userInfo);

        req.session.serviceConfig = serviceConfig;
        req.session.integrated = "false";
        req.session.user = userInfo;
        req.session.token = { access_token, id_token, refresh_token };
        req.session.clustertoken = access_token;
        res.cookie("studio.oauth2_token", access_token, { secure: true });
        res.cookie("studio.id_token", id_token, { secure: true });
        res.cookie("studio.refresh_token", refresh_token, { secure: true });

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("id_token", id_token, { secure: true });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }
        const config = configData.Module2Config!["user-management"];
        const result = await fetchParse(
            `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
            {}
        );
        const { oauth2_authentication_session } = req.cookies;

        if (result && result.text) {
            const { "deploy-manager": deployManager, eacp } =
                configData.Module2Config!;
            try {
                // 记录登录日志
                logger.info("记录audit-log登录日志");
                await loginLog(req, {
                    userId: userid,
                    level: Level.INFO,
                    opType: LoginOps.LOGIN,
                    msg: "登录 工作站 成功",
                    exMsg: "",
                });
                logger.info("记录audit-log登录日志完成");
                logger.info("记录可观测性登录日志");
                // 记录可观测性日志
                // getRealIP
                const payload = {
                    id: userid,
                    udid: "",
                    client_type: "console_web",
                    ip: getRealIP(req.headers),
                };
                await fetchParse(
                    `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                    {
                        timeout: 6 * 1000,
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );
                logger.info("记录可观测性登录日志完成");
            } catch (err) {
                logger.error(err);
            }
            logger.info("登录成功");
            res.redirect(301, redirect_url);
        } else if (oauth2_authentication_session) {
            logger.error("客户端勾选了记住密码");
            const newPathname = `${
                prefix ? prefix : ""
            }/studio/?error=keep_me_logged_in`;

            res.redirect(301, newPathname);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.error(`error message: ${err}`);
        logger.info(`original service: hydra;oauth2-ui;authentication`);
        res.status(
            err.status ||
                parseInt(String(err.status_code || err.code).substring(0, 3)) ||
                500
        );

        // 使用静态HTML而不是模板引擎
        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <img width="200" src="${loginErr}"/>
                <div class="text-tip">出错啦！</div>
                <div class="text">内部错误。</div>
            </div>
        </body>
        </html>
                `);
    } finally {
        res.end();
    }
};

/**
 * 单点登录接口(公司内部凭据)
 */
const loginByInternalSSO = async (req: any, res: any) => {
    try {
        logger.info("开始单点登录");
        const {
            "x-forwarded-prefix": forwardedPrefix,
            redirect_url,
            product,
            refreshToken,
            token,
        } = req.query;

        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { studioclustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "studio-web": studioweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = studioweb;
        logger.info("开始获取访问地址");
        const {
            text: { host, port, scheme = "https" },
        } = await fetchParse(
            `${deployManager.protocol}://${deployManager.host}:${deployManager.port}/api/deploy-manager/v1/access-addr/app`,
            {
                timeout: 0,
                method: "GET",
                headers: {
                    sessionID: req.sessionID,
                    Cookie: `clustersid=${studioclustersid}`,
                },
            }
        );
        logger.info("获取访问地址成功");
        logger.info(`校验${product} token是否有效`);
        const {
            text: { sub: productuserid },
        } = await token2Userid({ hydra, studioweb: {} }, token);
        if (!productuserid || productuserid === "undefined") {
            throw new Error(`校验${product} token失败`);
        }
        logger.info(
            `校验${product || "dip"}token成功,用户id为${productuserid}`
        );
        logger.info(
            `开始根据refreshtoken获取登录凭据，refreshtoken为${refreshToken}`
        );
        const {
            text: { ticket },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/ticket`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify({
                    refresh_token: encodeBase64Fn(refreshToken),
                    client_id: oauthClientID,
                }),
            }
        );

        logger.info(`获取登录凭据成功`);

        const payload = {
            client_id: oauthClientID,
            redirect_uri: `${scheme}://${host}:${port}${prefix}/interface/studioweb/oauth/login/callback`,
            response_type: "code",
            scope: "offline openid all",
            credential: {
                id: "aishu",
                params: {
                    ticket: encodeBase64Fn(ticket),
                },
            },
            udids: [],
        };
        logger.info("payload", payload);
        logger.info("开始根据登录凭据获取code");
        const {
            text: { code },
        } = await fetchParse(
            `${scheme}://${host}:${port}${prefix}/api/authentication/v1/sso`,
            {
                timeout: 6 * 1000,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        logger.info("根据第三方认证获取code成功，code为", code);
        const serviceConfig = {
            hydra,
            studioweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };
        const {
            text: { access_token, id_token, refresh_token },
        } = await code2Token(serviceConfig, code, prefix);
        // token 换 userid
        const {
            text: { sub: userid },
        } = await token2Userid(serviceConfig, access_token);
        // userid 换 userinfo
        const userInfo = await userid2Userinfo(userid);
        logger.info("获取useinfo成功", userInfo);

        req.session.serviceConfig = serviceConfig;
        req.session.integrated = "false";
        req.session.user = userInfo;
        req.session.token = { access_token, id_token, refresh_token };
        req.session.clustertoken = access_token;
        res.cookie("studio.oauth2_token", access_token, { secure: true });
        res.cookie("studio.id_token", id_token, { secure: true });
        res.cookie("studio.refresh_token", refresh_token, { secure: true });

        if (!getIsDefaultAccountName(userInfo)) {
            res.cookie("client.oauth2_token", access_token, {
                secure: true,
            });
            res.cookie("id_token", id_token, { secure: true });
            res.cookie("client.oauth2_refresh_token", refresh_token, {
                secure: true,
            });
        }
        const config = configData.Module2Config!["user-management"];
        const result = await fetchParse(
            `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
            {}
        );

        if (result && result.text) {
            const { "deploy-manager": deployManager, eacp } =
                configData.Module2Config!;
            try {
                // 记录登录日志
                logger.info("记录audit-log登录日志");
                await loginLog(req, {
                    userId: userid,
                    level: Level.INFO,
                    opType: LoginOps.LOGIN,
                    msg: "登录 工作站 成功",
                    exMsg: "",
                });
                logger.info("记录audit-log登录日志完成");
                logger.info("记录可观测性登录日志");
                // 记录可观测性日志
                // getRealIP
                const payload = {
                    id: userid,
                    udid: "",
                    client_type: "console_web",
                    ip: getRealIP(req.headers),
                };
                await fetchParse(
                    `${eacp.protocol}://${eacp.privateHttpHost}:${eacp.privateHttpPort}/api/eacp/v1/auth1/login-log`,
                    {
                        timeout: 6 * 1000,
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );
                logger.info("记录可观测性登录日志完成");
            } catch (err) {
                logger.error(err);
            }
            logger.info("登录成功");
            res.redirect(301, redirect_url);
        } else {
            res.status(500);

            // 使用静态HTML而不是模板引擎
            res.set("Content-Type", "text/html; charset=utf-8");
            res.send(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                    .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                    .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img width="200" src="${loginErr}"/>
                    <div class="text-tip">出错啦！</div>
                    <div class="text">内部错误。</div>
                </div>
            </body>
            </html>
                    `);
        }
    } catch (err) {
        logger.info(`requst failed: ${req.originalUrl};`);
        logger.error(`error message: ${err}`);
        logger.info(`original service: hydra;oauth2-ui;authentication`);
        res.status(
            err.status ||
                parseInt(String(err.status_code || err.code).substring(0, 3)) ||
                500
        );

        // 使用静态HTML而不是模板引擎
        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .container {width: 400px; margin: 125px auto 0 auto; text-align: center; }
                .text { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; }
                .text-tip { color: rgba(0, 0, 0, 0.65); font-size: 13px; text-align: center; line-height: 20px; padding: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <img width="200" src="${loginErr}"/>
                <div class="text-tip">出错啦！</div>
                <div class="text">内部错误。</div>
            </div>
        </body>
        </html>
                `);
    } finally {
        res.end();
    }
};

module.exports = {
    login,
    logout,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
    refreshToken,
    getUserInfoByQueryToken,
    loginBySSO,
    loginByInternalSSO,
};
