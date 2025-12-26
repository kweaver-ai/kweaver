const {
    code2Token,
    token2Userid,
    userid2Userinfo,
    tokenRefresh,
    revokeToken,
    revokeUser,
} = require("../oauth");
const fetch = require("node-fetch");
const Tools = require("../tools/index");

jest.mock("node-fetch");
jest.mock("../tools/index.js");

const conf = {
    hydra: {},
    deployweb: {},
    "oauth2-ui": "d",
};

const serviceConfig = {
    hydra: {},
    deployweb: {},
};

describe("code2Token", () => {
    let mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('参数为 conf, "es", "a"', async () => {
        mockFetchParse.mockResolvedValueOnce({ message: "success" });
        await code2Token(conf, "es", "a");
    });

    it('参数为 conf, "es", "a"', async () => {
        mockFetchParse.mockRejectedValueOnce({ message: "error" });
        code2Token(conf, "es", "a").catch((err) => {});
    });
});

describe("token2Userid", () => {
    let mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('参数为 conf, "ts"', async () => {
        mockFetchParse.mockResolvedValueOnce({ message: "success" });
        await token2Userid(conf, "ts");
    });

    it('参数为 conf, "ts"', async () => {
        mockFetchParse.mockRejectedValueOnce({ message: "error" });
        token2Userid(conf, "ts").catch((err) => {});
    });
});

describe("revokeToken", () => {
    let mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('参数为 conf, "ws"', async () => {
        mockFetchParse.mockResolvedValueOnce({ message: "success" });
        await revokeToken(conf, "ts");
    });

    it('参数为 conf, "ws"', async () => {
        mockFetchParse.mockRejectedValueOnce({ message: "error" });
        revokeToken(conf, "ts").catch((err) => {});
    });
});

describe("revokeUser", () => {
    it('参数为 serviceConfig, "a", "a", "a", "a", "a"', async () => {
        jest.useFakeTimers();
        const response = Promise.resolve({
            status: 200,
        });
        fetch.mockImplementation(async () => await response);
        revokeUser(serviceConfig, "a", "a", "a", "a", "a");
        jest.runAllTimers();
    });
});

// describe("userid2Userinfo", () => {
//     let mockFetchParse;

//     beforeEach(() => {
//         mockFetchParse = jest.spyOn(Tools, "fetchParse");
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it('参数为 conf, "ms"', async () => {
//         const mockThriftConnection = {
//             on: jest.fn(),
//             end: jest.fn(),
//         };
//         const mockThrift = {
//             createConnection: jest.fn(() => mockThriftConnection),
//         };
//         jest.mock("thrift", () => mockThrift);
//         userid2Userinfo(conf, "ms");
//     });
// });

describe("tokenRefresh", () => {
    let mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("成功", async () => {
        mockFetchParse.mockResolvedValueOnce(1);
        const ret = await tokenRefresh(conf, "ts");
        expect(ret).toBe(1);
    });

    it("失败", async () => {
        mockFetchParse.mockRejectedValueOnce(0);
        await tokenRefresh(conf, "ts").catch((err) => expect(err).toBe(0));
    });
});
