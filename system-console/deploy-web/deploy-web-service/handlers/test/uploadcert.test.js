import { res } from "../mockPath/db.mock";
import { uploadcert } from "../uploadcert";
const multiparty = require("multiparty");
const Tools = require("../tools/index");
const fs = require("fs");

// jest.mock("../../common/logger.js");
jest.mock("../tools/index.js", () => {
    const originalModule = jest.requireActual("../tools/index.js");
    return {
        __esModule: true,
        configData: originalModule.configData,
        fetchParse: jest.fn(() => {}),
    };
});

jest.mock("multiparty", () => {
    const mForm = {
        multiples: false,
        parse: jest.fn(),
    };
    return {
        Form: jest.fn(() => mForm),
    };
});

const req = [
    {
        query: {
            certType: "a",
        },
        session: {
            clustertoken: "a",
        },
        cookies: {
            "deploy.oauth2_token": "b",
        },
    },
    {
        query: {
            certType: "a",
        },
        session: {
            clustertoken: "a",
        },
        cookies: {
            "deploy.oauth2_token": "a",
        },
    },
];

const files = [
    {
        cert_key: [
            {
                path: "upload",
            },
        ],
        cert_crt: [
            {
                path: "upload",
            },
        ],
    },
];

const fields = {
    accountType: "moderator",
    title: "Title",
};

describe("uploadcert", () => {
    let mockFetchParse;

    beforeEach(() => {
        mockFetchParse = jest.spyOn(Tools, "fetchParse");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // it("参数为 req[0], res, tokens不等于tokenc", async () => {
    //     await uploadcert(req[0], res);
    //     expect(res.status.mock.calls[0][0]).toBe(403);
    // });

    it("参数为 req[1], res, form.parse成功, readFile成功, fetchParse成功", async () => {
        let form = new multiparty.Form({});
        let originalCallback;
        form.parse.mockImplementation((req, callback) => {
            originalCallback = callback;
        });
        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify("mockData"));
        });
        mockFetchParse.mockResolvedValueOnce({ message: "success" });
        await uploadcert(req[1], res);
        await originalCallback(null, fields, files[0]);
    });

    it("参数为 req[1], res, form.parse成功, readFile成功, fetchParse失败", async () => {
        const form = new multiparty.Form({});
        let originalCallback;
        form.parse.mockImplementation((req, callback) => {
            originalCallback = callback;
        });
        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify("mockData"));
        });
        mockFetchParse.mockRejectedValueOnce({ error: "error" });
        await uploadcert(req[1], res);
        await originalCallback(null, fields, files[0]);
    });

    it("参数为 req[1], res, form.parse成功, readFile失败", async () => {
        const form = new multiparty.Form({});
        let originalCallback;
        form.parse.mockImplementation((req, callback) => {
            originalCallback = callback;
        });
        fs.readFile = jest.fn((path, encode, callback) => {
            return callback("error", {});
        });
        await uploadcert(req[1], res);
        await originalCallback(null, fields, files[0]);
    });

    it("参数为 req[1], res, form.parse失败", async () => {
        const form = new multiparty.Form({});
        let originalCallback;
        form.parse.mockImplementation((req, callback) => {
            originalCallback = callback;
        });
        await uploadcert(req[1], res);
        await originalCallback("error", fields, files[0]);
    });
});
