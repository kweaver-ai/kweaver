import { isArray } from "lodash";
import { isIPV6 } from "../common/ip";
import { Roles, getFirstPagePathname } from "../core/roles";
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

/**
 * 登录接口
 */
const login = async (req: any, res: any) => {
    try {
        const {
            lang,
            state,
            "x-forwarded-prefix": forwardedPrefix,
            product,
        } = req.query;
        const prefix = URLPrefixFormatter(
            forwardedPrefix,
            URL_PREFIX_MODE.tail
        );
        const { clustersid } = req.cookies;
        req.session.regenerate(() => {});
        const {
            hydra,
            "deploy-web": deployweb,
            "deploy-manager": deployManager,
        } = configData.Module2Config!;
        const { oauthClientID, oauthClientSecret } = deployweb;
        const { host, port, scheme = "https" } = configData.accessAddr;
        req.session.state = state;
        req.session.lang = lang;
        const redirectUri =
            `${scheme}://${isIPV6(host) ? `[${host}]` : host}:${port}${
                prefix ? prefix : ""
            }/oauth2/auth` +
            `?redirect_uri=${scheme}://${
                isIPV6(host) ? `[${host}]` : host
            }:${port}${
                prefix ? prefix : ""
            }/interface/deployweb/oauth/login/callback` +
            `&x-forwarded-prefix=${prefix ? prefix : ""}` +
            `&client_id=${oauthClientID}` +
            `&scope=openid+offline+all` +
            `&response_type=code` +
            `&state=${state}` +
            `&lang=${lang}` +
            `&product=${product}`;
        req.session.serviceConfig = {
            hydra,
            deployweb: {
                oauthClientID,
                oauthClientSecret,
                host,
                port,
                scheme,
            },
        };

        res.cookie("deploy.origin_uri", redirectUri, { secure: true });
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
        res.redirect(
            301,
            `${prefix ? prefix : ""}/deploy/?error=different_state`
        );
    } else if (error) {
        res.redirect(301, `${prefix ? prefix : ""}/deploy/?error=${error}`);
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
            res.cookie("deploy.oauth2_token", access_token, { secure: true });
            res.cookie("deploy.id_token", id_token, { secure: true });
            res.cookie("deploy.refresh_token", refresh_token, { secure: true });

            const config = configData.Module2Config!["user-management"];
            const result = await fetchParse(
                `${config.protocol}://${config.host}:${config.port}/api/user-management/v1/users/${userid}/roles`,
                {}
            );
            const { oauth2_authentication_session } = req.cookies;

            if (
                result &&
                result.text &&
                [
                    Roles.SuperAdmin,
                    Roles.SystemAdmin,
                    Roles.Security,
                    Roles.Audit,
                    Roles.OrgManager,
                    Roles.OrgAudit,
                ].some((item) => {
                    // 兼容旧API，旧api直接返回对象，新api用数组返回多个对象
                    return isArray(result.text)
                        ? result.text[0].roles.includes(item)
                        : result.text.roles.includes(item);
                })
            ) {
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
                            "登录 系统工作台 成功",
                            "登入 系統工作台 成功",
                            "Log in to System Console successfully",
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
                        client_type: "deploy_web",
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
                res.status(200).send(`
                    <html>
                        <head>
                            <script>
                            window.top.location.href = '${
                                prefix ? prefix : ""
                            }${getFirstPagePathname(result)}';
                            </script>
                        </head>
                        <body></body>
                    </html>
                `);
            } else if (oauth2_authentication_session) {
                logger.error("客户端勾选了记住密码");
                res.redirect(
                    301,
                    `${prefix ? prefix : ""}/deploy/?error=keep_me_logged_in`
                );
            } else {
                // 记录登录失败日志
                logger.error("没有权限登录");
                try {
                    await loginLog(req, {
                        userId: userid,
                        level: Level.INFO,
                        opType: LoginOps.LOGIN,
                        msg: getLocale(lang, [
                            "当前账号不是管理员账号，无法登录系统工作台",
                            "當前帳戶不是管理員帳戶，無法登入系統工作台",
                            "This account is not for Admin, cannot log in to System Console",
                        ]),
                        exMsg: "",
                    });
                } catch (err) {
                    logger.error(err);
                }
                res.redirect(
                    301,
                    `${prefix ? prefix : ""}/deploy/?error=permission_denied`
                );
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
    const { clustertoken: tokens, serviceConfig, state, token } = req.session;
    const tokenc = req.cookies["deploy.oauth2_token"];
    const { clustersid } = req.cookies;
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
                clustersid,
                req.sessionID,
                prefix
            );
            req.session.destroy((err) => {});
            res.clearCookie("clustersid");
            res.clearCookie("deploy.oauth2_token");
            res.clearCookie("deploy.id_token");
            res.clearCookie("deploy.refresh_token");
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
        const tokenc = req.cookies["deploy.oauth2_token"];
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

/**
 * 更新token
 */
const refreshToken = async (req: any, res: any) => {
    const { serviceConfig, token } = req.session;
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
            res.cookie("deploy.oauth2_token", access_token, { secure: true });
            res.cookie("deploy.id_token", id_token, { secure: true });
            res.cookie("deploy.refresh_token", refresh_token, { secure: true });
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

module.exports = {
    login,
    logout,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
    refreshToken,
};
