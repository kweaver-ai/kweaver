const {
    verify,
    thriftProxy,
    restfulProxy,
    interfaceProxy,
} = require("../proxyroutes");
const Oauth = require("../oauth");
const Tools = require("../tools/index");
import { res } from "../mockPath/db.mock";
jest.mock("../oauth.js");
jest.mock("node-fetch");

const query = {
    lang: "zh-cn",
    host: "127.0.0.1",
    port: "8080",
    state: new Date().getTime(),
};
const cookies = {
    "deploy.oauth2_token": "a",
};
const req = [
    {
        body: {
            a: "zhal",
            b: "get_cluster_version",
        },
        cookies: {
            "deploy.oauth2_token": "",
        },
        query,
    },
    {
        body: {
            a: "zhal",
            b: "zhall",
        },
        session: {
            serviceConfig: {
                deployweb: {
                    oauthClientID: "c",
                },
            },
        },
        cookies,
        query,
    },
    {
        body: {
            a: "zhal",
            b: "zhall",
        },
        session: {
            serviceConfig: {
                deployweb: {
                    oauthClientID: "a",
                },
            },
        },
        cookies,
        query,
    },
    {
        body: {
            a: "zhal",
            b: "get_cluster_version",
        },
        method: "Get",
        originalUrl: "/api/deployweb/cms",
        session: {
            serviceConfig: {
                deployweb: {
                    oauthClientID: "c",
                },
            },
        },
        query,
    },
    {
        body: ["a", "Log"],
        session: {
            serviceConfig: {
                deployweb: {
                    oauthClientID: "c",
                },
            },
        },
        cookies,
        params: {
            module: "EACPLog",
        },
        query,
    },
    {
        body: ["a", "Log"],
        session: {
            serviceConfig: {
                deployweb: {
                    oauthClientID: "c",
                },
            },
        },
        params: {
            module: "",
        },
        cookies,
        query,
    },
    {
        body: {
            a: "zhal",
            b: "zhall",
        },
        session: {
            a: "",
        },
        cookies,
        query,
    },
];

jest.spyOn(Tools, "iniFileReader").mockReturnValue({
    hydra: "a",
    "deploy-web": {
        oauthClientID: "b",
        oauthClientSecret: "c",
    },
    "oauth2-ui": "d",
});
jest.spyOn(Tools, "getServiceConfigBase").mockReturnValue(() => () => ({
    hydra: "a",
    "oauth2-ui": "d",
    deployweb: {
        oauthClientID: new Date().getTime(),
        oauthClientSecret: new Date().getTime(),
        host: "127.0.0.1",
        port: 443,
    },
}));

describe("verify", () => {
    let mockToken2Userid, mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
        mockToken2Userid = jest.spyOn(Oauth, "token2Userid");
        mockFetchParse.mockResolvedValue({
            text: { installed_version: "111" },
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("参数为 req[0]", async () => {
        const ret = await verify(req[0]);
        expect(ret).toBe(true);
    });

    // it("参数为 req[0]", async () => {
    //     const ret = await verify(req[0]);
    //     expect(ret).toBe(false);
    // });

    // it("参数为 req[6]", async () => {
    //     const ret = await verify(req[6]);
    //     expect(ret).toBe(false);
    // });

    // it("参数为 req[1]", async () => {
    //     mockToken2Userid.mockResolvedValue({
    //         text: { client_id: "c", active: true },
    //     });
    //     const ret = await verify(req[1]);
    //     expect(ret).toBe(false);
    // });

    // it("参数为 req[2]", async () => {
    //     mockToken2Userid.mockRejectedValue({});
    //     const ret = await verify(req[2]);
    //     expect(ret).toBe(false);
    // });
});

// describe("interfaceProxy", () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("req[2], res", async () => {
//         await interfaceProxy(req[2], res);
//         expect(res.status.mock.calls[0][0]).toBe(403);
//     });
// });

// describe("restfulProxy", () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("req[2], res", async () => {
//         await restfulProxy(req[2], res);
//         expect(res.status.mock.calls[0][0]).toBe(403);
//     });

//     // it('req[3], res, fetch请求成功', async () => {
//     //     const response = Promise.resolve({
//     //         status: 200,
//     //         text: async () => { }
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     await restfulProxy(req[3], res)
//     //     expect(res.status.mock.calls[0][0]).toBe(200)
//     // });

//     // it('req[3], res, fetch请求失败', async () => {
//     //     const response = Promise.reject({
//     //         code: 'ECONNREFUSED'
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     restfulProxy(req[3], res)
//     //         .catch((res) => {
//     //             expect(res.status.mock.calls[0][0]).toBe(502)
//     //         })
//     // });

//     // it('req[3], res, fetch请求失败, 且code 不等于ECONNREFUSED', async () => {
//     //     const response = Promise.reject({
//     //         code: 'error'
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     restfulProxy(req[3], res)
//     //         .catch((res) => {
//     //             expect(res.status.mock.calls[0][0]).toBe(500)
//     //         })
//     // });
// });

// describe("thriftProxy", () => {
//     let mockToken2Userid;

//     beforeEach(() => {
//         mockToken2Userid = jest.spyOn(Oauth, "token2Userid");
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it("req[2], res", async () => {
//         await thriftProxy(req[2], res);
//         expect(res.status.mock.calls[0][0]).toBe(403);
//     });

//     // it('req[4], res', async () => {
//     //     mockToken2Userid.mockResolvedValue({ text: { client_id: 'c', active: true } })
//     //     const response = Promise.resolve({
//     //         status: 200,
//     //         text: async () => { }
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     await thriftProxy(req[4], res)
//     //     expect(res.json.mock.calls[0][0]).toBe(null)
//     // });

//     // it('req[5], res,', async () => {
//     //     mockToken2Userid.mockResolvedValue({ text: { client_id: 'c', active: true } })
//     //     const response = Promise.resolve({
//     //         status: 200,
//     //         text: async () => { }
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     await thriftProxy(req[5], res)
//     //     expect(res.status.mock.calls[0][0]).toBe(200)
//     // });

//     // it('req[5], res,', async () => {
//     //     mockToken2Userid.mockResolvedValue({ text: { client_id: 'c', active: true } })
//     //     const response = Promise.reject({
//     //         status: 500
//     //     })
//     //     fetch.mockImplementation(async () => await response)
//     //     await thriftProxy(req[5], res)
//     //     expect(res.status.mock.calls[0][0]).toBe(500)
//     // });
// });
