import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { LogPanel } from "../log-panel";
import { Modal } from "antd";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../../components/log-card", () => ({
    LogCard({ expandStatus }: any) {
        return (
            <div>
                LogCard
                <span>{expandStatus === "expandAll" ? "收起" : "展开"}</span>
            </div>
        );
    },
}));

jest.mock("../../../components/auth-expiration", () => ({
    AuthExpiration() {
        return <div>mock-auth-expiration</div>;
    },
}));

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={
                {
                    components: {
                        messageBox: ({
                            type,
                            title,
                            message,
                            okText,
                            onOk,
                        }: any) => {
                            Modal.info({
                                title,
                                content: message,
                                okText,
                                onOk,
                            });
                        },
                    },
                } as any
            }
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            {children}
        </MicroAppProvider>
    );

describe("LogPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it("渲染LogPanel", async () => {
        jest.spyOn(
            API.automation,
            "dagDagIdResultResultIdGet"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: [],
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/details/2315/log/4215"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByTitle("返回任务详情")).toBeInTheDocument();
        expect(screen.getByText("单次运行日志")).toBeInTheDocument();
        // expect(screen.getByText("mock-auth-expiration")).toBeInTheDocument();
        const empty = await screen.findByText("日志为空");
        expect(empty).toBeInTheDocument();
        await userEvent.click(empty, { button: 2 });
        expect(screen.queryByText("全部折叠")).not.toBeInTheDocument();
    });

    it("返回按钮", async () => {
        renders(
            <MemoryRouter initialEntries={["/details/123/log/321"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                    <Route path="/details/123" element={<div>Details</div>} />
                </Routes>
            </MemoryRouter>
        );
        const back = screen.getByTitle("返回任务详情");
        expect(back).toBeInTheDocument();
        userEvent.click(back);
        expect(await screen.findByText("Details")).toBeInTheDocument();
    });

    it("渲染数据", async () => {
        jest.spyOn(
            API.automation,
            "dagDagIdResultResultIdGet"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: [
                    {
                        id: "441683693883385375",
                        operator: "@trigger/manual",
                        started_at: 1672793596,
                        status: "success",
                        inputs: null,
                        outputs: {
                            create_time: 1669777314119211,
                            creator: "test",
                            docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3/42CBBC49DB7441D3BB71FEE69166F6ED",
                            editor: "test",
                            id: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3/42CBBC49DB7441D3BB71FEE69166F6ED",
                            modified: 1669777314119211,
                            name: "box (2).png",
                            path: "test/新建文件夹 (2)/box (2).png",
                            size: 6982,
                        },
                    },
                    {
                        id: "441683693883450911",
                        operator: "@control/flow/branches",
                        started_at: 1672793596,
                        status: "success",
                        inputs: null,
                        outputs: null,
                    },
                    {
                        id: "441683693883516447",
                        operator: "@anyshare/file/remove",
                        started_at: 1672793596,
                        status: "undo",
                        inputs: null,
                        outputs: null,
                    },
                ],
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/details/432/log/3214"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("日志为空")).not.toBeInTheDocument();
        expect(await screen.findAllByText("LogCard")).toHaveLength(3);
        const card = screen.getAllByText("LogCard")[0];
        await userEvent.click(card, { button: 2 });
        expect(screen.getByText("全部折叠")).toBeInTheDocument();
        expect(screen.getByText("全部展开")).toBeInTheDocument();
        await fireEvent.click(screen.getByText("全部折叠"));
        expect(await screen.findAllByText("展开")).toHaveLength(3);
        await userEvent.click(card, { button: 2 });
        await fireEvent.click(screen.getByText("全部展开"));
        expect(await screen.findAllByText("收起")).toHaveLength(3);
    });

    it("该任务已不存在。", async () => {
        jest.spyOn(
            API.automation,
            "dagDagIdResultResultIdGet"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: { data: { code: "ContentAutomation.TaskNotFound" } },
                status: 404,
                statusText: "Not Found",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/details/34122/log/121512"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("LogCard")).not.toBeInTheDocument();
        expect(screen.queryByText("LogCard")).not.toBeInTheDocument();
        expect(await screen.findByText("该任务已不存在。")).toBeInTheDocument();
        await userEvent.click(await screen.findByText("返回任务列表"));
        // expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("任务实例不存在", async () => {
        jest.spyOn(
            API.automation,
            "dagDagIdResultResultIdGet"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.DagInsNotFound" },
                },
                status: 404,
                statusText: "Not Found",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/details/2314/log/1412"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                    <Route path="/details/2314" element={<div>Details</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("LogCard")).not.toBeInTheDocument();
        expect(
            await screen.findByText("该运行记录已不存在。")
        ).toBeInTheDocument();
        await userEvent.click(await screen.findByText("返回任务详情"));
        expect(await screen.findByText("Details")).toBeInTheDocument();
    });

    it("内部错误", async () => {
        jest.spyOn(
            API.automation,
            "dagDagIdResultResultIdGet"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: 500000000 },
                    status: 500,
                },
                status: 400,
                statusText: "Internal Error",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/details/2314/log/1412"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("LogCard")).not.toBeInTheDocument();
    });
});
