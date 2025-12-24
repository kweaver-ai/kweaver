import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { API, MicroAppProvider } from "@applet/common";
import userEvent from "@testing-library/user-event";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { StatRecords } from "../stat-records";

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
            {children}
        </MicroAppProvider>
    );

describe("StatRecords", () => {
    it("渲染 StatRecords", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceInstanceIdPut"
        ).mockImplementation(() =>
            Promise.resolve({
                data: {},
                status: 200,
            } as any)
        );
        const props = {
            data: {
                limit: 20,
                page: 0,
                progress: {
                    total: 5,
                    success: 1,
                    failed: 1,
                },
                results: [
                    {
                        id: "439662567804134861",
                        status: "success",
                        started_at: 1671588911,
                        ended_at: 1671588932,
                    },
                    {
                        id: "439662316145894862",
                        status: "running",
                        started_at: 1671588761,
                        ended_at: 1671588782,
                    },
                    {
                        id: "437363351064962593",
                        status: "failed",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962594",
                        status: "canceled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962595",
                        status: "scheduled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                ],
                total: 5,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/12742"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<div>LogPanel</div>}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("单次运行状态")).toBeInTheDocument();
        expect(screen.getByText("开始时间")).toBeInTheDocument();
        expect(screen.getByText("结束时间")).toBeInTheDocument();
        expect(screen.getByText("操作")).toBeInTheDocument();
        expect(screen.getByText("运行成功")).toBeInTheDocument();
        // expect(screen.getByText("2022/12/21 10:13")).toBeInTheDocument();
        expect(screen.getByText("20条/页")).toBeInTheDocument();
        expect(screen.getByText(/共 5 条/)).toBeInTheDocument();

        const cancel = screen.getAllByText("取消运行")[1];
        expect(cancel).toBeInTheDocument();
        userEvent.dblClick(cancel);
        await userEvent.click(cancel);
        expect(props.refresh).toHaveBeenCalled();

        const view = screen.getAllByText("查看日志")[0];
        expect(view).toBeInTheDocument();
        await userEvent.click(view);
        expect(await screen.findByText("LogPanel")).toBeInTheDocument();
    });

    it("列表为空", async () => {
        const props = {
            data: {
                limit: 20,
                page: 0,
                progress: {
                    total: 0,
                    success: 0,
                    failed: 0,
                },
                results: [],
                total: 0,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/36612"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("列表为空")).toBeInTheDocument();
        expect(screen.queryByText(/共 0 条/)).not.toBeInTheDocument();
    });

    it("加载中", async () => {
        const props = {
            data: undefined,
            isLoading: true,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/13215"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText("列表为空")).not.toBeInTheDocument();
        expect(screen.queryByText(/共 1 条/)).not.toBeInTheDocument();
    });

    it("取消任务运行失败", async () => {
        jest.spyOn(
            API.automation,
            "runInstanceInstanceIdPut"
        ).mockImplementation(() =>
            Promise.reject({
                reponse: { data: { code: 500000000 }, status: 500 },
                status: 500,
            } as any)
        );
        const props = {
            data: {
                limit: 20,
                page: 0,
                progress: {
                    total: 2,
                    success: 0,
                    failed: 0,
                },
                results: [
                    {
                        id: "439662316145894862",
                        status: "running",
                        started_at: 1671588761,
                        ended_at: 1671588782,
                    },
                ],
                total: 2,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/321451"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const cancel = screen.getByText("取消运行");
        expect(cancel).toBeInTheDocument();
        userEvent.dblClick(cancel);
        await userEvent.click(cancel);
        expect(props.refresh).toHaveBeenCalled();
    });

    it("选择展示条数", async () => {
        const props = {
            data: {
                limit: 20,
                page: 0,
                progress: {
                    total: 1,
                    success: 1,
                    failed: 1,
                },
                results: [
                    {
                        id: "439662567804134861",
                        status: "success",
                        started_at: 1671588911,
                        ended_at: 1671588932,
                    },
                ],
                total: 1,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/21512"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("20条/页")).toBeInTheDocument();
        await userEvent.click(screen.getByText("20条/页"));
        expect(screen.getByText("5条/页")).toBeInTheDocument();
        expect(screen.getByText("10条/页")).toBeInTheDocument();
        expect(screen.getByText("50条/页")).toBeInTheDocument();
        await userEvent.click(screen.getByText("5条/页"));
    });

    it("翻页", async () => {
        const props = {
            data: {
                limit: 5,
                page: 0,
                progress: {
                    total: 8,
                    success: 1,
                    failed: 2,
                },
                results: [
                    {
                        id: "439662567804134861",
                        status: "success",
                        started_at: 1671588911,
                        ended_at: 1671588932,
                    },
                    {
                        id: "439662316145894862",
                        status: "running",
                        started_at: 1671588761,
                        ended_at: 1671588782,
                    },
                    {
                        id: "437363351064962593",
                        status: "failed",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962594",
                        status: "canceled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962595",
                        status: "scheduled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                ],
                total: 8,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/21342?limit=5&page=0"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("5条/页")).toBeInTheDocument();
        expect(screen.getByText("运行成功")).toBeInTheDocument();
        const next = screen.getByTitle("下一页");
        await userEvent.click(next);
    });

    it("排序", async () => {
        const props = {
            data: {
                limit: 5,
                page: 0,
                progress: {
                    total: 8,
                    success: 1,
                    failed: 2,
                },
                results: [
                    {
                        id: "439662567804134861",
                        status: "success",
                        started_at: 1671588911,
                        ended_at: 1671588932,
                    },
                    {
                        id: "439662316145894862",
                        status: "running",
                        started_at: 1671588761,
                        ended_at: 1671588782,
                    },
                    {
                        id: "437363351064962593",
                        status: "failed",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962594",
                        status: "canceled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                    {
                        id: "437363351064962595",
                        status: "scheduled",
                        started_at: 1670218471,
                        ended_at: 1670218492,
                    },
                ],
                total: 8,
            },
            isLoading: false,
            error: undefined,
            refresh: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/details/312412?limit=5&page=0"]}>
                <Routes>
                    <Route
                        path="/details/:id"
                        element={<StatRecords {...props} />}
                    />
                </Routes>
            </MemoryRouter>
        );
        const start = screen.getByText("开始时间");
        await userEvent.click(start);
        await userEvent.click(start);
        expect(screen.getByText("结束时间")).toBeInTheDocument();
    });
});
