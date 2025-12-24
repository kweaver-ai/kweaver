import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { Card as TaskCard, getContent } from "../task-card";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../delete-task-modal", () => ({
    DeleteModal: () => <div>DeleteModal</div>,
}));

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={{}}
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            {children}
        </MicroAppProvider>
    );

describe("TaskCard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染 TaskCard", async () => {
        const props = {
            task: {
                id: "436468279192610312",
                title: "卡片",
                actions: [
                    "@anyshare-trigger/upload-file",
                    "@internal/text/join",
                    "@anyshare/file/rename",
                    "@control/flow/branches",
                    "@anyshare/file/getpath",
                    "@anyshare/folder/addtag",
                ],
                created_at: 1669684967,
                updated_at: 1669684967,
                status: "stopped",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("已停用")).toBeInTheDocument();
        expect(screen.getByText("卡片")).toBeInTheDocument();
        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        expect(screen.queryByText("运行")).not.toBeInTheDocument();
        await userEvent.click(screen.getByText("删除"));
        expect(screen.getByText("DeleteModal")).toBeInTheDocument();
    });

    it("手动任务运行", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceDagIdPost"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: {},
                status: 200,
                statusText: "OK",
            } as any)
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.resolve({
                data: {},
                status: 200,
                statusText: "OK",
            } as any)
        );
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("手动任务")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        const runBtn = screen.getByText("运行");
        expect(runBtn).toBeInTheDocument();
        await userEvent.click(runBtn);
        const switchBtn = screen.getByRole("switch");
        await userEvent.click(switchBtn);
        expect(props.onChange).toHaveBeenCalled();
    });

    it("运行失败-任务不存在", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceDagIdPost"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.TaskNotFound" },
                },
                status: 404,
                statusText: "Not Found",
            } as any)
        );
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("手动任务")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        await userEvent.click(screen.getByText("运行"));
    });

    it("运行失败-任务未启用", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceDagIdPost"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: {
                        code: "ContentAutomation.Forbidden.DagStatusNotNormal",
                    },
                },
            } as any)
        );
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("手动任务")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        await userEvent.click(screen.getByText("运行"));
    });

    it("运行失败-不能手动运行", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceDagIdPost"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: {
                        code: "ContentAutomation.Forbidden.ErrorIncorretTrigger",
                    },
                },
            } as any)
        );
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("手动任务")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        await userEvent.click(screen.getByText("运行"));
    });

    it("切换状态失败", async () => {
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.reject({
                response: { data: { code: "ContentAutomation.TaskNotFound" } },
                status: 503,
                statusText: "Service Unavailable",
            } as any)
        );
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                </Routes>
            </MemoryRouter>
        );

        const switchBtn = screen.getByRole("switch");
        await userEvent.click(switchBtn);
        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("查看任务详情", async () => {
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                    <Route path="/details/:id" element={<div>Details</div>} />
                </Routes>
            </MemoryRouter>
        );

        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        await userEvent.click(screen.getByText("查看"));
        expect(await screen.findByText("Details")).toBeInTheDocument();
    });

    it("编辑任务", async () => {
        const props = {
            task: {
                id: "440571625650283983",
                title: "手动任务",
                actions: [
                    "@trigger/manual",
                    "@anyshare/file/remove",
                    "@internal/text/split",
                ],
                created_at: 1672130752,
                updated_at: 1672130970,
                status: "normal",
            },
            onChange: jest.fn(),
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<TaskCard {...props} />} />
                    <Route path="/edit/:id" element={<div>Editor</div>} />
                </Routes>
            </MemoryRouter>
        );

        const more = screen.getAllByRole("button")[0];
        await userEvent.click(more);
        await userEvent.click(screen.getByText("编辑"));
        expect(await screen.findByText("Editor")).toBeInTheDocument();
    });
});

describe("getContent", () => {
    getContent(
        ["@trigger/manual", "@internal/text/split", "@control/flow/branches"],
        360
    );
    getContent(
        ["@trigger/manual", "@internal/text/split", "@control/flow/branches"],
        120
    );
});
