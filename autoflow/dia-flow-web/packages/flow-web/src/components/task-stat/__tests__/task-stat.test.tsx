import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TaskStat, getUnfinishedCount } from "../task-stat";
import { message, Modal } from "antd";
import userEvent from "@testing-library/user-event";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../stat-records", () => ({
    StatRecords({ refresh }: any) {
        return (
            <div>
                StatRecords
                <button onClick={() => refresh()}>Refresh</button>
            </div>
        );
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
                        toast: {
                            error: (content: string) => message.error(content),
                            warning: (content: string) =>
                                message.warning(content),
                            success: (content: string) =>
                                message.success(content),
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

describe("TaskStat", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it("渲染 TaskStat", async () => {
        jest.spyOn(API.axios, "get").mockImplementation(
            (url, params) => {
                if (url.endsWith('count')) {
                    if (params?.params?.type === 'success') {
                        return Promise.resolve({ data: { count: 1 } })
                    }

                    if (params?.params?.type === 'failed') {
                        return Promise.resolve({ data: { count: 1 } })
                    }

                    return Promise.resolve({ data: { count: 2 } })
                }

                if (url.endsWith('results')) {
                    return Promise.resolve({
                        data: {
                            limit: 20,
                            page: 0,
                            results: [
                                {
                                    id: "441689104569099807",
                                    status: "success",
                                    started_at: 1672796821,
                                    ended_at: 1672800604,
                                },
                                {
                                    id: "441689108729849375",
                                    status: "failed",
                                    started_at: 1672796824,
                                    ended_at: 1672800606,
                                },
                            ],
                            total: 2,
                        },
                        status: 200,
                        statusText: "OK",
                    } as any)
                }

                return Promise.resolve()
            }
        );

        const handleDisable = jest.fn();

        renders(
            <MemoryRouter initialEntries={["/edit/2315112"]}>
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<TaskStat handleDisable={handleDisable} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("运行统计")).toBeInTheDocument();
        expect(screen.getByText("任务运行总次数")).toBeInTheDocument();
        expect(screen.getByText("任务运行成功次数")).toBeInTheDocument();
        expect(screen.getByText("任务运行失败次数")).toBeInTheDocument();
        expect(await screen.findAllByText("1")).toHaveLength(2);
        expect(await screen.findByText("2")).toBeInTheDocument();
        await userEvent.click(screen.getByText("Refresh"));

        expect(screen.getByText("StatRecords")).toBeInTheDocument();
    });

    it("加载数据", async () => {
        jest.spyOn(API.axios, "get").mockImplementation(
            (url, params) => {
                if (url.endsWith('count')) {
                    if (params?.params?.type === 'success') {
                        return Promise.resolve({ data: { count: 1 } })
                    }

                    if (params?.params?.type === 'failed') {
                        return Promise.resolve({ data: { count: 1 } })
                    }

                    return Promise.resolve({ data: { count: 3 } })
                }

                if (url.endsWith('results')) {
                    return Promise.resolve({
                        data: {
                            limit: 20,
                            page: 0,
                            results: [
                                {
                                    id: "441689104569099807",
                                    status: "success",
                                    started_at: 1672796821,
                                    ended_at: 1672800604,
                                },
                                {
                                    id: "441689108729849375",
                                    status: "running",
                                    started_at: 1672796824,
                                    ended_at: 1672800606,
                                },
                                {
                                    id: "441689108729849375",
                                    status: "failed",
                                    started_at: 1672796824,
                                    ended_at: 1672800606,
                                },
                            ],
                            total: 3,
                        },
                        status: 200,
                        statusText: "OK",
                    } as any)
                }

                return Promise.resolve()
            }
        );

        jest.spyOn(API.automation, "dagDagIdResultsGet").mockImplementation(
            () =>
                Promise.resolve({
                    data: {
                        limit: 20,
                        page: 0,
                        progress: {
                            total: 3,
                            success: 1,
                            failed: 1,
                        },
                        results: [
                            {
                                id: "441689104569099807",
                                status: "success",
                                started_at: 1672796821,
                                ended_at: 1672800604,
                            },
                            {
                                id: "441689108729849375",
                                status: "running",
                                started_at: 1672796824,
                                ended_at: 1672800606,
                            },
                            {
                                id: "441689108729849375",
                                status: "failed",
                                started_at: 1672796824,
                                ended_at: 1672800606,
                            },
                        ],
                        total: 3,
                    },
                    status: 200,
                    statusText: "OK",
                } as any)
        );
        const handleDisable = jest.fn();

        renders(
            <MemoryRouter
                initialEntries={[
                    "/edit/234125?order=desc&page=0&sortby=ended_at&status=success",
                ]}
            >
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<TaskStat handleDisable={handleDisable} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findAllByText("1")).toHaveLength(2);
        expect(await screen.findByText("3")).toBeInTheDocument();
    });

    it("翻页后数据为空", async () => {
        jest.spyOn(API.axios, "get").mockImplementation(
            (url, params) => {
                if (url.endsWith('count')) {
                    if (params?.params?.type === 'success') {
                        return Promise.resolve({ data: { count: 10 } })
                    }

                    if (params?.params?.type === 'failed') {
                        return Promise.resolve({ data: { count: 9 } })
                    }

                    return Promise.resolve({ data: { count: 19 } })
                }

                if (url.endsWith('results')) {
                    return Promise.resolve({
                        data: {
                            limit: 20,
                            page: 1,
                            results: [],
                            total: 19,
                        },
                        status: 200,
                        statusText: "OK",
                    } as any)
                }

                return Promise.resolve()
            }
        );

        const handleDisable = jest.fn();

        renders(
            <MemoryRouter initialEntries={["/edit/4125"]}>
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<TaskStat handleDisable={handleDisable} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("19")).toBeInTheDocument();
    });

    it("加载错误", async () => {
        jest.spyOn(API.axios, "get").mockImplementation(
            () => {
                return Promise.reject({
                    response: {
                        data: { code: 500, message: "Internal Error" },
                        status: 500,
                    },
                    status: 500,
                    statusText: "Internal Server Error",
                } as any)
            }
        );
        const handleDisable = jest.fn();

        renders(
            <MemoryRouter
                initialEntries={[
                    "/edit/234sa125?order=desc&page=0&sortby=ended_at&status=success",
                ]}
            >
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<TaskStat handleDisable={handleDisable} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText("3")).not.toBeInTheDocument();
    });

    it("任务不存在", async () => {
        jest.spyOn(API.automation, "dagDagIdResultsGet").mockImplementationOnce(
            () =>
                Promise.reject({
                    response: {
                        data: {
                            code: "ContentAutomation.TaskNotFound",
                            message: "该任务已不存在。",
                        },
                        status: 404,
                    },
                    status: 404,
                    statusText: "Not Found",
                } as any)
        );

        jest.spyOn(API.axios, "get").mockImplementation(
            () => {
                return Promise.reject({
                    response: {
                        data: {
                            code: "ContentAutomation.TaskNotFound",
                            message: "该任务已不存在。",
                        },
                        status: 404,
                    },
                    status: 404,
                    statusText: "Not Found",
                } as any)
            }
        );
        const handleDisable = jest.fn();
        renders(
            <MemoryRouter
                initialEntries={[
                    "/edit/41235?order=desc&page=0&sortby=ended_at&status=success%2Crunning",
                ]}
            >
                <Routes>
                    <Route
                        path="/edit/:id"
                        element={<TaskStat handleDisable={handleDisable} />}
                    />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText("3")).not.toBeInTheDocument();
        expect(await screen.findByText("该任务已不存在。")).toBeInTheDocument();
        await userEvent.click(screen.getByText("返回任务列表"));
        // expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("判断未完成任务数 getUnfinishedCount", () => {
        const res1 = [
            {
                id: "437495997136922149",
                status: "success",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
            {
                id: "437495997136922149",
                status: "failed",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
            {
                id: "437495997136922149",
                status: "canceled",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
        ];
        expect(getUnfinishedCount(res1)).toBe(0);

        const res2 = [
            {
                id: "437495997136922149",
                status: "failed",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
            {
                id: "437495997136922149",
                status: "running",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
            {
                id: "437495997136922149",
                status: "scheduled",
                started_at: 1670297535,
                ended_at: 1670297547,
            },
        ];
        expect(getUnfinishedCount(res2)).toBe(2);
    });
});
