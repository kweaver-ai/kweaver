import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { LogCard } from "../log-card";
import { ExpandStatus } from "../../../pages/log-panel";
import { ExtensionProvider } from "../../extension-provider";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={{}}
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            <ExtensionProvider>{children}</ExtensionProvider>
        </MicroAppProvider>,
        { wrapper: BrowserRouter }
    );

describe("LogCard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    it("渲染 LogCard", async () => {
        const props = {
            log: {
                id: "440672730942039608",
                operator: "@trigger/manual",
                started_at: 1672191015,
                status: "success",
                inputs: null,
                outputs: {
                    create_time: 1669709955461938,
                    creator: "test",
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    editor: "test",
                    id: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    modified: 1670833677796287,
                    name: "新建文件夹 (2)",
                    path: "test/新建文件夹 (2)",
                    size: -1,
                },
            },
            expandStatus: ExpandStatus.ExpandAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        const collapseBtn = screen.getByText("收起");
        expect(collapseBtn).toBeInTheDocument();
        await userEvent.click(collapseBtn);
        const expandBtn = screen.getByText("展开");
        expect(expandBtn).toBeInTheDocument();
        await userEvent.click(expandBtn);
        expect(collapseBtn).toBeInTheDocument();
        expect(screen.getByText("无输入数据")).toBeInTheDocument();
    });

    it("查看输出", async () => {
        const props = {
            log: {
                id: "440672730942039608",
                operator: "@anyshare-trigger/upload-file",
                started_at: 1672191015,
                status: "undo",
                inputs: null,
                outputs: {
                    create_time: 1669709955461938,
                    creator: "test",
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    editor: "test",
                    id: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    modified: 1670833677796287,
                    name: "新建文件夹 (2)",
                    path: "test/新建文件夹 (2)",
                    size: -1,
                },
            },
            expandStatus: ExpandStatus.ExpandAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        const outputTab = screen.getByText("输出数据");
        expect(outputTab).toBeInTheDocument();
        await userEvent.click(outputTab);
        expect(screen.queryByText("无输出数据")).not.toBeInTheDocument();
        const rawOutput = screen.getByText("原始数据");
        expect(rawOutput).toBeInTheDocument();
        await userEvent.click(rawOutput);
        expect(screen.getByText("1669709955461938")).toBeInTheDocument();
    });

    it("查看输入", async () => {
        const props = {
            log: {
                id: "440672730958816824",
                operator: "@control/flow/branches",
                started_at: 1672191015,
                status: "fail",
                inputs: {
                    depth: -1,
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    order: "asc",
                },
                outputs: {
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    path: "test",
                },
            },
            expandStatus: ExpandStatus.ExpandAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        expect(screen.getByText("分支执行")).toBeInTheDocument();
        const inputTab = screen.getByText("输入数据");
        expect(inputTab).toBeInTheDocument();
        await userEvent.click(inputTab);
        expect(screen.queryByText("无输入数据")).not.toBeInTheDocument();
    });

    it("展开/收起", async () => {
        const props = {
            log: {
                id: "440672730958816824",
                operator: "@anyshare/file/getpath",
                started_at: 1672191015,
                status: "fail",
                inputs: {
                    depth: -1,
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    order: "asc",
                },
                outputs: {
                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
                    path: "test",
                },
            },
            expandStatus: ExpandStatus.CollapseAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        const expand = screen.getByText("展开");
        expect(expand).toBeInTheDocument();
        await userEvent.click(expand);
        expect(screen.queryByText("展开")).not.toBeInTheDocument();
        await userEvent.click(screen.getByText("收起"));
        expect(expand).toBeInTheDocument();
        expect(props.onExpandStatusChange).toHaveBeenCalledTimes(2);
    });

    it("文本分割", async () => {
        const props = {
            log: {
                id: "440710560577775055",
                operator: "@internal/text/split",
                started_at: 1672213564,
                status: "success",
                inputs: {
                    separator: "，",
                    text: "asd",
                },
                outputs: {
                    slices: '{"0":"asd"}',
                },
            },
            expandStatus: ExpandStatus.ExpandAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        expect(screen.getByText(/asd/)).toBeInTheDocument();
    });

    it("授权过期", async () => {
        const props = {
            log: {
                id: "441695450282616351",
                operator: "@trigger/manual",
                started_at: 1672800604,
                status: "failed",
                inputs: null,
                outputs: "token not exist",
            },
            expandStatus: ExpandStatus.ExpandAll,
            onExpandStatusChange: jest.fn(),
        };
        renders(<LogCard {...props} />);
        expect(screen.getByText("无输入数据")).toBeInTheDocument();
    });
});
