const { personalization, imageToBase64, setOemConfig } = require("../oem");
const Personalization = require("../personalization");
import { res } from "../mockPath/db.mock";
const OemTools = require("../oemTools");
const path = require("path");

jest.mock("../oemTools.js");
jest.mock("../personalization");

const req = [
    {
        query: {
            section: "a",
        },
    },
    {
        body: {
            oemInfo: {
                section: "anyshare",
                option: "agreementText",
                value: "",
            },
        },
    },
    {
        files: [
            {
                buffer: "zzz",
                path: path.resolve(__dirname, "../views/tray.ini"),
            },
        ],
    },
    {
        files: [
            {
                path: "../views/tray.ini",
            },
        ],
    },
    {
        query: {
            platform: "android",
            host: "10.2.3.3",
        },
    },
    {
        query: {
            platform: "ios",
            host: "10.2.3.3",
        },
    },
    {
        query: {
            platform: "mac",
            host: "10.2.3.3",
        },
    },
    {
        query: {
            platform: "windows",
            host: "10.2.3.3",
        },
    },
    {
        query: {
            platform: "",
        },
    },
];
const ret = [
    [
        {
            errID: 10086,
        },
    ],
    [
        {
            section: "anyshare",
            option: "agreementText",
            value: "",
        },
    ],
];

describe("oem", () => {
    let mockGetOemConfig, mockColorPalette, mockCreateOemZip;

    beforeEach(() => {
        mockGetOemConfig = jest.spyOn(OemTools, "getOemConfig");
        mockColorPalette = jest.spyOn(Personalization, "colorPalette");
        mockCreateOemZip = jest.spyOn(Personalization, "createOemZip");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("imageToBase64", () => {
        it("参数为 req[2], res", async () => {
            await imageToBase64(req[2], res);
            expect(res.status.mock.calls[0][0]).toBe(200);
        });

        it("参数为 req[3], res", async () => {
            await imageToBase64(req[3], res);
            expect(res.status.mock.calls[0][0]).toBe(500);
        });
    });

    describe("personalization", () => {
        it("参数为 req[4], res", async () => {
            mockGetOemConfig.mockResolvedValue(ret[1]);
            await personalization(req[4], res);
            expect(res.set.mock.calls[1][1]).toBe(
                "attachment; filename=android.json"
            );
        });

        it("参数为 req[5], res", async () => {
            mockGetOemConfig.mockResolvedValue(ret[1]);
            await personalization(req[5], res);
            expect(res.set.mock.calls[1][1]).toBe(
                "attachment; filename=ios.json"
            );
        });

        it("参数为 req[6], res", async () => {
            mockGetOemConfig.mockResolvedValue(ret[1]);
            mockColorPalette.mockReturnValue("#6775CD");
            await personalization(req[6], res);
            expect(res.set.mock.calls[1][1]).toBe(
                "attachment; filename=mac.json"
            );
        });

        it("参数为 req[7], res", async () => {
            mockGetOemConfig.mockResolvedValue(ret[1]);
            mockCreateOemZip.mockResolvedValue({});
            await personalization(req[7], res);
        });

        it("参数为 req[8], res", async () => {
            mockGetOemConfig.mockResolvedValue(ret[1]);
            await personalization(req[8], res);
            expect(res.status.mock.calls[0][0]).toBe(500);
        });
    });
});
