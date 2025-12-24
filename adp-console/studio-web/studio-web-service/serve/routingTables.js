import proxy from "http-proxy-middleware";
import {
    loginBySSO,
    login,
    logout,
    refreshToken,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
    getUserInfoByQueryToken,
    loginByInternalSSO,
} from "../handlers/auth";
import {
    filter as registryInfoFilter,
    options as registryInfoOptions,
} from "../handlers/registryinfo";
import { test } from "../handlers/test";
import { interfaceProxy } from "../handlers/proxyroutes";

export const resgisterRouting = (app) => {
    app.get("/interface/studioweb/sso", loginBySSO);
    app.get("/interface/studioweb/internalSSO", loginByInternalSSO);
    app.get("/interface/studioweb/login", login);
    app.get("/interface/studioweb/oauth/login/callback", oauthLoginCallback);
    app.get(
        "/interface/studioweb/oauth/getUserInfoByQueryToken",
        getUserInfoByQueryToken
    );
    app.all("/api/studio-web-service/v1/*", interfaceProxy);
    app.use("/api/studio-web-service/v1/webapp/*", (...args) =>
        proxy(registryInfoFilter, registryInfoOptions())(...args)
    );
    app.use("/api/studio-web-service/v1/webapp", (...args) =>
        proxy(registryInfoFilter, registryInfoOptions())(...args)
    );
    app.use("/api/studio-web-service/v1/webappconfig/*", (...args) =>
        proxy(registryInfoFilter, registryInfoOptions())(...args)
    );
    app.use("/api/studio-web-service/v1/webappconfig", (...args) =>
        proxy(registryInfoFilter, registryInfoOptions())(...args)
    );

    app.get("/interface/studioweb/test", test);
    //interfaceProxy为鉴权，在此以上写的接坣丝进行鉴权
    app.all("/interface/studioweb/*", interfaceProxy);
    app.post("/interface/studioweb/logout", logout);
    app.get("/interface/studioweb/refreshtoken", refreshToken);
    app.get("/interface/studioweb/oauth/logout/callback", oauthLogoutCallback);
    app.get(
        "/interface/studioweb/oauth/getUserInfoByToken",
        getUserInfoByToken
    );
};
