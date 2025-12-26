const fetch = require("node-fetch");
const yaml = require("yaml");
const {
    logout,
    login,
    refreshToken,
    oauthLoginCallback,
    oauthLogoutCallback,
    getUserInfoByToken,
} = require("../auth");
const Oauth = require("../oauth");
const Tools = require("../tools/index");
const Log = require("../tools/log");
import { res } from "../mockPath/db.mock";

jest.mock("node-fetch");
jest.mock("../oauth.js");
// jest.mock("../tools/index.js");

const req = [
    {
        // 0
        cookies: {
            "deploy.oauth2_token": "testing",
        },
        session: {
            clustertoken: "b",
            token: {
                id_token: "a",
            },
        },
    },
    {
        // 1
        cookies: {
            "deploy.oauth2_token": "testing",
            clustersid: "id",
        },
        session: {
            clustertoken: "testing",
            token: {
                id_token: "a",
            },
            destroy: (call) => {
                call("err");
            },
        },
    },
    {
        // 2
        sessionID: "id",
        query: {
            lang: "zh-cn",
            host: "10.4.65.33",
            port: 443,
            state: "zhal",
        },
        cookies: {
            clustersid: "id",
        },
        session: {
            regenerate: jest.fn(() => {}),
        },
    },
    {
        // 3
        query: {
            code: "a",
            state: "b",
        },
        session: {
            state: "c",
            serviceConfig: {},
        },
    },
    {
        // 4
        query: {
            code: "a",
            state: "b",
            error: "request_forbidden",
        },
        session: {
            state: "b",
            serviceConfig: {},
        },
    },
    {
        // 5
        cookies: {
            oauth2_authentication_session: "",
        },
        query: {
            code: "a",
            state: "b",
        },
        session: {
            state: "b",
            serviceConfig: {
                publicHost: "10.2.36.3",
                publicPort: "443",
            },
        },
    },
    {
        // 6
        query: {
            state: "a",
        },
        session: {
            state: "b",
            token: {
                access_token: "c",
            },
        },
    },
    {
        // 7
        query: {
            state: "a",
        },
        session: {
            state: "a",
            token: {
                access_token: "c",
            },
            destroy: (call) => {
                call("err");
            },
        },
    },
    {
        // 8
        query: {
            state: "a",
        },
        session: {
            state: "a",
            token: {
                access_token: "c",
            },
            destroy: (call) => {
                call();
            },
        },
    },
    {
        // 9
        session: {
            user: {
                user: "me",
            },
            clustertoken: "a",
        },
        cookies: {
            "deploy.oauth2_token": "c",
        },
    },
    {
        //10
        session: {
            user: {
                user: "me",
            },
            clustertoken: "a",
        },
        cookies: {
            "deploy.oauth2_token": "a",
        },
    },
    {
        //11
        cookies: {
            "deploy.oauth2_token": "testing",
        },
        session: {
            clustertoken: null,
            token: {
                id_token: "a",
            },
        },
    },
    {
        //12
        cookies: {
            "deploy.oauth2_token": "eq",
        },
        session: {
            clustertoken: "eq",
            token: undefined,
        },
    },
    {
        //13
        sessionID: "id",
        cookies: {
            clustersid: "id",
        },
        session: {
            regenerate: jest.fn(() => {}),
        },
    },
    {
        // 14
        cookies: {
            oauth2_authentication_session: "x-x-x-x-x",
        },
        query: {
            code: "a",
            state: "b",
        },
        session: {
            state: "b",
            serviceConfig: {
                publicHost: "10.2.36.3",
                publicPort: "443",
            },
        },
    },
    {
        //15
        session: null,
        cookies: {
            "deploy.oauth2_token": "a",
        },
    },
    {
        //16
        session: {
            token: null,
        },
    },
    {
        //17
        session: {
            token: { refresh_token: "x-x-x" },
        },
    },
];

describe("logout", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("token不一致", async () => {
        await logout(req[0], res);
        expect(res.status.mock.calls[0][0]).toBe(403);
        expect(res.json.mock.calls[0][0]).toBe(null);
    });

    it("tokens不存在", async () => {
        await logout(req[11], res);
        expect(res.status.mock.calls[0][0]).toBe(200);
        expect(res.json.mock.calls[0][0]).toBe(null);
    });

    it("token一致, 且revokeUser成功", async () => {
        const mockRevokeUser = jest.spyOn(Oauth, "revokeUser");
        mockRevokeUser.mockResolvedValue({});
        await logout(req[1], res);
        expect(res.status.mock.calls[0][0]).toBe(200);
    });

    it("报错", async () => {
        await logout(req[12], res);
        expect(res.status.mock.calls[0][0]).toBe(500);
    });
});

describe("login", () => {
    beforeEach(() => {});

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("报错", async () => {
        await login(req[13], res);
        expect(res.status.mock.calls[0][0]).toBe(500);
    });

    it("正常登录", async () => {
        let mockFetchParse, mockIniFileReader, mockParse;

        mockFetchParse = jest.spyOn(Tools, "fetchParse");
        mockIniFileReader = jest.spyOn(Tools, "iniFileReader");
        mockParse = jest.spyOn(yaml, "parse");
        const obj = {
            hydra: "a",
            "deploy-web": {
                oauthClientID: "b",
                oauthClientSecret: "c",
            },
            "oauth2-ui": "d",
            "deploy-service": {
                protocol: "http",
                host: req[2].query.host,
                port: req[2].query.port,
            },
        };
        mockFetchParse.mockResolvedValueOnce({
            text: { host: req[2].query.host, port: req[2].query.port },
        });
        mockParse.mockReturnValue(obj);
        mockIniFileReader.mockReturnValue(obj);
        await login(req[2], res);
        expect(res.redirect.mock.calls[0][0]).toBe(301);
    });
});

describe("oauthLoginCallback", () => {
    let mockCode2Token,
        mockToken2Userid,
        mockUserid2Userinfo,
        mockFetchParse,
        mockLog;

    beforeEach(() => {
        mockCode2Token = jest.spyOn(Oauth, "code2Token");
        mockToken2Userid = jest.spyOn(Oauth, "token2Userid");
        mockUserid2Userinfo = jest.spyOn(Oauth, "userid2Userinfo");
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
        mockLog = jest.spyOn(Log, "loginLog");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("state不一致", async () => {
        await oauthLoginCallback(req[3], res);
        expect(res.redirect.mock.calls[0][0]).toBe(301);
        expect(res.redirect.mock.calls[0][1]).toBe(
            "/deploy/?error=different_state"
        );
    });

    it("存在error", async () => {
        await oauthLoginCallback(req[4], res);
        expect(res.redirect.mock.calls[0][0]).toBe(301);
        expect(res.redirect.mock.calls[0][1]).toBe(
            "/deploy/?error=request_forbidden"
        );
    });

    it("成功调用, 且用户角色为 super_admin, sys_admin", async () => {
        // hydra步骤保证正确
        mockCode2Token.mockResolvedValue({
            text: { access_token: "a", id_token: "b" },
        });
        mockToken2Userid.mockResolvedValue({ text: { sub: "c" } });
        mockUserid2Userinfo.mockResolvedValue({ userInfo: {} });

        // 角色验证
        mockFetchParse.mockResolvedValueOnce({
            text: [{ roles: ["super_admin"] }],
        });
        // mockFetchParse.mockResolvedValueOnce({
        //     text: [{ roles: ["super_admin"] }],
        // });
        // 可观测性日志
        // 登录日志
        await oauthLoginCallback(req[5], res);
        expect(res.status.mock.calls[0][0]).toBe(200);
        // expect(res.redirect.mock.calls[0][1]).toBe("/deploy/home");
        jest.clearAllMocks();
    });

    it("成功调用, 且用户角色为普通用户", async () => {
        // hydra步骤保证正确
        mockCode2Token.mockResolvedValue({
            text: { access_token: "a", id_token: "b" },
        });
        mockToken2Userid.mockResolvedValue({ text: { sub: "c" } });
        mockUserid2Userinfo.mockResolvedValue({ userInfo: {} });
        // 角色验证
        mockFetchParse.mockResolvedValueOnce({ text: { roles: ["normal"] } });
        // mockFetchParse.mockResolvedValueOnce({ text: [{ roles: ["normal"] }] });
        await oauthLoginCallback(req[5], res);
        expect(res.redirect.mock.calls[0][0]).toBe(301);
        expect(res.redirect.mock.calls[0][1]).toBe(
            "/deploy/?error=permission_denied"
        );
    });

    it("成功调用, 且用户角色为普通用户, oauth2_authentication_session存在", async () => {
        // hydra步骤保证正确
        mockCode2Token.mockResolvedValue({
            text: { access_token: "a", id_token: "b" },
        });
        mockToken2Userid.mockResolvedValue({ text: { sub: "c" } });
        mockUserid2Userinfo.mockResolvedValue({ userInfo: {} });
        // 角色验证
        mockFetchParse.mockResolvedValueOnce({ text: { roles: ["normal"] } });
        // mockFetchParse.mockResolvedValueOnce({ text: [{ roles: ["normal"] }] });
        await oauthLoginCallback(req[14], res);
        expect(res.redirect.mock.calls[0][0]).toBe(301);
        expect(res.redirect.mock.calls[0][1]).toBe(
            "/deploy/?error=keep_me_logged_in"
        );
    });

    it("userid2Userinfo调用失败", async () => {
        mockCode2Token.mockResolvedValue({
            text: { access_token: "a", id_token: "b" },
        });
        mockToken2Userid.mockResolvedValue({ text: { sub: "c" } });
        mockUserid2Userinfo.mockRejectedValue({});
        oauthLoginCallback(req[5], res).catch(() => {
            expect(res.redirect.mock.calls[0][0]).toBe(500);
        });
    });
});

// describe("oauthLogoutCallback", () => {
//     let mockCode2Token;

//     beforeEach(() => {
//         mockCode2Token = jest.spyOn(Oauth, "code2Token");
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("state不一致", async () => {
//         await oauthLogoutCallback(req[6], res);
//         expect(res.status.mock.calls[0][0]).toBe(403);
//     });
// });

describe("getUserInfoByToken", () => {
    it("token不一致", async () => {
        getUserInfoByToken(req[9], res);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });

    it("token一致", async () => {
        getUserInfoByToken(req[10], res);
        expect(res.status.mock.calls[0][0]).toBe(200);
    });

    it("报错", async () => {
        getUserInfoByToken(req[15], res);
        expect(res.status.mock.calls[0][0]).toBe(500);
    });
});

describe("refreshToken", () => {
    let mockTokenRefresh;

    beforeEach(() => {
        mockTokenRefresh = jest.spyOn(Oauth, "tokenRefresh");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("token不存在", async () => {
        await refreshToken(req[16], res);
        expect(res.status.mock.calls[0][0]).toBe(500);
    });

    it("更新token成功", async () => {
        mockTokenRefresh.mockResolvedValueOnce({
            text: { access_token: "", id_token: "", refresh_token: "" },
        });
        await refreshToken(req[17], res);
        expect(res.status.mock.calls[0][0]).toBe(200);
    });

    it("更新token失败", async () => {
        mockTokenRefresh.mockRejectedValueOnce({
            text: { access_token: "", id_token: "", refresh_token: "" },
        });
        await refreshToken(req[17], res);
        expect(res.status.mock.calls[0][0]).toBe(500);
    });
});
