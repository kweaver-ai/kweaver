import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { API, MicroAppProvider } from "@applet/common";
import { DagDetail } from "@applet/api/lib/content-automation";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TaskPanel } from "../task-panel";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../../components/auth-expiration", () => ({
    AuthExpiration() {
        return <div>mock-auth-expiration</div>;
    },
}));
jest.mock("../../../components/task-info", () => ({
    TaskInfo({ taskInfo }: { taskInfo?: DagDetail }) {
        return (
            <div>
                <div>mock-task-info</div>
                <div>{taskInfo?.description}</div>
            </div>
        );
    },
}));

jest.mock("../../../components/task-stat", () => ({
    TaskStat() {
        return <div>mock-task-stat</div>;
    },
}));

describe("TaskPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it("渲染 TaskPanel", () => {
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <MemoryRouter initialEntries={["/details/1314"]}>
                    <Routes>
                        <Route path="/details/:id" element={<TaskPanel />} />
                        <Route path="/" element={<div>Home</div>} />
                        <Route path="/edit/:id" element={<div>Edit</div>} />
                    </Routes>
                </MemoryRouter>
            </MicroAppProvider>
        );

        const back = screen.getByTitle("返回任务列表");
        expect(back).toBeInTheDocument();

        // expect(screen.getByText("mock-auth-expiration")).toBeInTheDocument();
        expect(screen.getByText("mock-task-info")).toBeInTheDocument();
        expect(screen.getByText("mock-task-stat")).toBeInTheDocument();

        userEvent.click(back);
        expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("返回编辑页", () => {
        const location = {
            ...window.location,
            search: "?back=edit",
        };
        Object.defineProperty(window, "location", {
            writable: true,
            value: location,
        });
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <MemoryRouter initialEntries={["/details/241?back=edit"]}>
                    <Routes>
                        <Route path="/details/:id" element={<TaskPanel />} />
                        <Route path="/edit/:id" element={<div>Edit</div>} />
                    </Routes>
                </MemoryRouter>
            </MicroAppProvider>
        );
        const back = screen.getByTitle("返回任务设置");
        expect(back).toBeInTheDocument();

        userEvent.click(back);
        expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("跳转回编辑页", () => {
        const location = {
            ...window.location,
            search: "?back=edit,details",
        };
        Object.defineProperty(window, "location", {
            writable: true,
            value: location,
        });
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <MemoryRouter
                    initialEntries={["/details/241?back=edit,details"]}
                >
                    <Routes>
                        <Route path="/details/:id" element={<TaskPanel />} />
                        <Route path="/edit/:id" element={<div>Edit</div>} />
                    </Routes>
                </MemoryRouter>
            </MicroAppProvider>
        );
        const back = screen.getByTitle("返回任务设置");
        expect(back).toBeInTheDocument();

        userEvent.click(back);
        expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("swr请求数据", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(() =>
            Promise.resolve({
                data: {
                    id: "437520153039627828",
                    title: "数据原",
                    description: "等待description",
                    status: "normal",
                    steps: [],
                    created_at: 1670311933,
                    updated_at: 1670898331,
                },
                status: 200,
                statusText: "OK",
            } as any)
        );
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <MemoryRouter initialEntries={["/details/123"]}>
                    <Routes>
                        <Route path="/details/:id" element={<TaskPanel />} />
                    </Routes>
                </MemoryRouter>
            </MicroAppProvider>
        );
        expect(await screen.findByText("数据原")).toBeInTheDocument();
        expect(await screen.findByText("等待description")).toBeInTheDocument();
    });
});
