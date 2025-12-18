import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { AsFileSelect } from "../as-file-select";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../doc-list", () => ({
    DocList: () => <div>DocList</div>,
}));

const mockDoclibs = [
    {
        doc_libs: [
            {
                id: "gns://C18C3BF866C64C47893B1972A8C24B5C",
                name: "test",
                type: "user_doc_lib",
            },
        ],
        id: "user_doc_lib",
        name: "我的文档库",
    },
    {
        id: "custom_doc_lib",
        name: "文档库",
        subtypes: [
            {
                doc_libs: [
                    {
                        attr: 83907924,
                        id: "gns://D1F7AE8999DE4F3280E19F326625DDDB",
                        name: "kcoss",
                        rev: "8ee9c638-81be-4b67-9ef6-8600f228ae98",
                        type: "custom_doc_lib",
                    },
                ],
                id: "54425A761CC54DC6A990DA3C9EFB328D",
                name: "默认自定义文档库",
            },
        ],
    },
];

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={{
                contextMenu: {
                    selectFn: () =>
                        Promise.resolve([
                            {
                                docid: "gns://E4810EBBD0B446128152EF16D6A32ADE/4E6D82942BB84FAE8C581A72FFFB5FFE",
                                name: "NewDoc",
                                size: 12,
                            },
                        ]),
                } as any,
            }}
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            {children}
        </MicroAppProvider>,
        { wrapper: BrowserRouter }
    );

describe("文件选择", () => {
    const mockChangFn = jest.fn();

    beforeEach(() => {
        jest.spyOn(
            API.efast,
            "efastV1ClassifiedEntryDocLibsGet"
        ).mockImplementation(() =>
            Promise.resolve({
                data: mockDoclibs,
                status: 200,
                statusText: "OK",
            } as any)
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("选择文件", async () => {
        jest.spyOn(
            API.efast,
            "efastV1FileConvertpathPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { namepath: "test/Mark.md" },
                status: 200,
                statusText: "OK",
            } as any)
        );
        jest.spyOn(
            API.efast,
            "eacpV1Perm1CheckPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { result: 0 },
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <AsFileSelect
                title="选择文件"
                key="files"
                selectType={1}
                allowClear
                omitUnavailableItem
                omittedMessage="已过滤不存在的文件"
                placeholder="请选择文件"
                selectButtonText="选择"
            />
        );
        const input = screen.getByPlaceholderText("请选择文件");
        expect(input).toBeInTheDocument();
        const selectButton = screen.getAllByRole("button");
        await userEvent.click(selectButton[1]);
        expect(await screen.findByPlaceholderText("请选择文件")).toHaveValue();
    });

    it("文件多选", async () => {
        jest.spyOn(
            API.efast,
            "efastV1FileConvertpathPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { namepath: "test/aa.md" },
                status: 200,
                statusText: "OK",
            } as any)
        );
        jest.spyOn(
            API.efast,
            "eacpV1Perm1CheckPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { result: 0 },
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <AsFileSelect
                value={[
                    "gns://C18C3BF866C64C47893B1972A8C24B5C/F4534A44FF114EBEABA680612138C1D1",
                ]}
                onChange={mockChangFn}
                title="选择文件"
                key="files"
                selectType={1}
                multiple
                multipleMode="tags"
                omitUnavailableItem
                omittedMessage="已过滤不存在的文件"
                placeholder="请选择文件"
                selectButtonText="选择"
            />
        );
        const selectButton = screen.getByText("选择");
        await userEvent.click(selectButton);
        expect(mockChangFn).toHaveBeenCalled();
    });
});

describe("文件夹选择", () => {
    const mockChangFn = jest.fn();

    beforeEach(() => {
        jest.spyOn(
            API.efast,
            "efastV1ClassifiedEntryDocLibsGet"
        ).mockImplementation(() =>
            Promise.resolve({
                data: mockDoclibs,
                status: 200,
                statusText: "OK",
            } as any)
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("选择文件夹", async () => {
        jest.spyOn(
            API.efast,
            "efastV1FileConvertpathPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { namepath: "test/Folder" },
                status: 200,
                statusText: "OK",
            } as any)
        );
        jest.spyOn(
            API.efast,
            "eacpV1Perm1CheckPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { result: 0 },
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <AsFileSelect
                title="选择文件夹"
                key="files"
                selectType={2}
                omitUnavailableItem
                omittedMessage="已过滤不存在的文件夹"
                placeholder="请选择文件夹"
                selectButtonText="选择"
            />
        );
        expect(screen.getByPlaceholderText("请选择文件夹")).toBeInTheDocument();
        const selectButton = screen.getByText("选择");
        await userEvent.click(selectButton);
        expect(
            await screen.findByPlaceholderText("请选择文件夹")
        ).toHaveValue();
    });

    it("文件夹多选", async () => {
        jest.spyOn(
            API.efast,
            "efastV1FileConvertpathPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { namepath: "test/Folder" },
                status: 200,
                statusText: "OK",
            } as any)
        );
        jest.spyOn(
            API.efast,
            "eacpV1Perm1CheckPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: { result: 0 },
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <AsFileSelect
                value={[
                    "gns://D1F7AE8999DE4F3280E19F326625DDDB/21534A44FF114EBEABA680612138C1D1",
                ]}
                onChange={mockChangFn}
                title="选择文件夹"
                key="files"
                selectType={2}
                omitUnavailableItem
                omittedMessage="已过滤不存在的文件夹"
                multiple
                multipleMode="list"
                placeholder="请选择文件夹"
                selectButtonText="选择"
            />
        );
        expect(await screen.findByText("DocList")).toBeInTheDocument();
    });
});
