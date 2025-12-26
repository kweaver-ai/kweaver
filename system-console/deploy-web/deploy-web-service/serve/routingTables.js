import {
    login,
    logout,
    refreshToken,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
} from "../handlers/auth";
import { interfaceProxy } from "../handlers/proxyroutes";
import { getOemconfig } from "../handlers/oemconfig";

export const resgisterRouting = (app) => {
    app.get("/interface/deployweb/login", login);
    app.get("/interface/deployweb/oauth/login/callback", oauthLoginCallback);
    //interfaceProxy为鉴权，在此以上写的接坣丝进行鉴权
    app.all("/interface/deployweb/*", interfaceProxy);
    app.post("/interface/deployweb/logout", logout);
    app.get("/interface/deployweb/refreshtoken", refreshToken);
    app.get("/interface/deployweb/oauth/logout/callback", oauthLogoutCallback);
    app.get(
        "/interface/deployweb/oauth/getUserInfoByToken",
        getUserInfoByToken
    );
    app.get("/api/deploy-web-service/v1/oemconfig", getOemconfig);
};
