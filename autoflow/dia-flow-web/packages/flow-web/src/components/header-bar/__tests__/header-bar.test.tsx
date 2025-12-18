import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MicroAppProvider, API } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { EditorPanel } from "../../../pages/editor-panel";
import { message, Modal } from "antd";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../auth-expiration", () => ({
    AuthExpiration() {
        return <div>mock-auth-expiration</div>;
    },
}));

jest.mock("../../editor", () => ({
    Editor({ value, onChange }: any) {
        return (
            <div>
                editor
                <div>节点长度：{value?.length}</div>
                <button
                    onClick={() =>
                        onChange &&
                        onChange([
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/file/remove",
                                dataSource: {
                                    parameters: {},
                                },
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/B3DF9352A9F3490B989CAB0B225124D7",
                                },
                            },
                            {
                                id: "2",
                                title: "",
                                operator: "@internal/text/split",
                                dataSource: {
                                    parameters: {},
                                },
                                parameters: {
                                    separator: ",",
                                    text: "sda",
                                },
                            },
                        ])
                    }
                >
                    编辑节点
                </button>
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

describe("HeaderBar", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染 HeaderBar", async () => {
        jest.spyOn(API.automation, "dagSuggestnameNameGet").mockImplementation(
            () =>
                Promise.resolve({
                    data: {
                        name: "未命名自动任务(1)",
                    },
                    status: 200,
                    statusText: "OK",
                } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<EditorPanel />} />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(
            await screen.findByText("未命名自动任务(1)")
        ).toBeInTheDocument();
        expect(screen.getByTitle("返回任务列表")).toBeInTheDocument();
        expect(screen.queryByTitle("任务详情")).not.toBeInTheDocument();
        expect(screen.queryByTitle("任务设置")).not.toBeInTheDocument();
        expect(screen.getByText("保存")).toBeInTheDocument();

        await userEvent.click(screen.getByTitle("返回任务列表"));
        // expect(await screen.findByText(/Home/)).toBeInTheDocument();
    });

    it("返回任务详情页", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹标签",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/152D3310E2904CCC9CF014465E106479",
                                    name: "的撒",
                                    ondup: 3,
                                },
                            },
                            {
                                id: "2",
                                title: "",
                                operator: "@anyshare/folder/addtag",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/48C3212E3B0543298EAFAD49AF40620E",
                                    tags: "{{__1.name}}",
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                    status: 200,
                    statusText: "OK",
                }) as any
        );
        renders(
            <MemoryRouter initialEntries={["/edit/123?back=details"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                    <Route path="/details/:id" element={<div>Details</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByTitle("文件夹标签")).toBeInTheDocument();
        expect(screen.getByTitle("任务详情")).toBeInTheDocument();
        expect(screen.getByTitle("任务设置")).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("返回任务详情"));
        // expect(await screen.findByText(/Details/)).toBeInTheDocument();
    });

    it("编辑节点后保存成功", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹标签",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    id: "",
                                    operator: "",
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/F89D3B501ECF42F3BDB0F3DE76C23258",
                                    name: "XXX项目",
                                    ondup: 2,
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                    status: 200,
                    statusText: "OK",
                }) as any
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementation(() =>
            Promise.resolve({
                data: {},
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/edit/211314"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        await userEvent.click(screen.getByText("编辑节点"));
        await userEvent.click(screen.getByText("保存"));
        expect(screen.getByText("保存成功")).toBeInTheDocument();
    });

    it("编辑节点后保存失败-服务错误", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹标签",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    id: "",
                                    operator: "",
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/F89D3B501ECF42F3BDB0F3DE76C23258",
                                    name: "XXX项目",
                                    ondup: 2,
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: 500000000 },
                    status: 500,
                },
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/edit/32141"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        await userEvent.click(screen.getByText("编辑节点"));
        await userEvent.click(screen.getByText("保存"));
        expect(screen.getByText("无法连接服务器")).toBeInTheDocument();
    });

    it("编辑任务信息后点击保存成功", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹编辑",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    id: "",
                                    operator: "",
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/F89D3B501ECF42F3BDB0F3DE76C23258",
                                    name: "XXX项目",
                                    ondup: 2,
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementation(() =>
            Promise.resolve({
                data: {},
                status: 200,
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/edit/3125"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByTitle("文件夹编辑")).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("任务设置"));
        expect(screen.getByText("保存任务设置")).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "修改名称");
        const detailsInput = screen.getByPlaceholderText("请填写任务描述");
        await userEvent.type(detailsInput, "一段描述");
        expect(screen.getByText("启用中")).toBeInTheDocument();
        await userEvent.click(screen.getByText("确定"));
        expect(
            await screen.findByTitle("文件夹编辑修改名称")
        ).toBeInTheDocument();
    });

    it("编辑任务名称后点击保存失败-服务错误", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹编辑",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    id: "",
                                    operator: "",
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/F89D3B501ECF42F3BDB0F3DE76C23258",
                                    name: "XXX项目",
                                    ondup: 2,
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: 500000000 },
                    status: 500,
                },
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/edit/12314"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByTitle("文件夹编辑")).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("任务设置"));
        expect(screen.getByText("保存任务设置")).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "加上文件夹名称");
        await userEvent.click(screen.getByText("确定"));
        expect(await screen.findByTitle("文件夹编辑")).toBeInTheDocument();
    });

    it("编辑任务名称后点击保存失败-重名", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹编辑",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                                dataSource: {
                                    id: "",
                                    operator: "",
                                    parameters: {},
                                },
                            },
                            {
                                id: "1",
                                title: "",
                                operator: "@anyshare/folder/create",
                                parameters: {
                                    docid: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/F89D3B501ECF42F3BDB0F3DE76C23258",
                                    name: "XXX项目",
                                    ondup: 2,
                                },
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.DuplicatedName" },
                    status: 400,
                },
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/edit/41235"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByTitle("文件夹编辑")).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("任务设置"));
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "加上文件夹名称");
        await userEvent.click(screen.getByText("确定"));
        expect(screen.getByText("任务名称")).toBeInTheDocument();
        await userEvent.click(screen.getByText("取消"));
        expect(screen.queryByTitle("任务名称")).not.toBeInTheDocument();
    });

    it("参数错误", async () => {
        jest.spyOn(API.automation, "dagDagIdPut").mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.InvalidParameter" },
                    status: 400,
                },
            } as any)
        );
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "435928181568988672",
                        title: "文件夹编辑",
                        description: "dsad",
                        status: "normal",
                        steps: [],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        renders(
            <MemoryRouter initialEntries={["/edit/2321"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByTitle("文件夹编辑")).toBeInTheDocument();
        await userEvent.click(screen.getByText("保存"));
        expect(await screen.findByText(/请检查参数。/)).toBeInTheDocument();
    });

    it("新建任务后点击保存", async () => {
        jest.spyOn(
            API.automation,
            "dagSuggestnameNameGet"
        ).mockImplementationOnce(() =>
            Promise.resolve({
                data: {
                    name: "未命名自动任务",
                },
                status: 200,
                statusText: "OK",
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        await userEvent.click(screen.getByText("保存"));
        expect(screen.getByText("保存任务设置")).toBeInTheDocument();
    });

    it("编辑节点不保存点击返回", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {
                        id: "4359281815689128672",
                        title: "文件夹标签",
                        description: "dsad",
                        status: "normal",
                        steps: [
                            {
                                id: "0",
                                title: "",
                                operator: "@trigger/manual",
                            },
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                    status: 200,
                    statusText: "OK",
                }) as any
        );
        renders(
            <MemoryRouter initialEntries={["/edit/23412"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByText(/节点长度：1/)).toBeInTheDocument();
        await userEvent.click(screen.getByText("编辑节点"));
        expect(await screen.findByText(/节点长度：3/)).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("返回任务列表"));
        expect(
            await screen.findByText("返回将导致编辑内容丢失，确定返回吗？")
        ).toBeInTheDocument();
    });
});

describe("模板新建", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });
    it("选择模板文件自动归档", async () => {
        jest.spyOn(
            API.automation,
            "dagSuggestnameNameGet"
        ).mockImplementationOnce((data: string) =>
            Promise.resolve({
                response: {
                    data: { name: "文件自动归档" },
                    status: 200,
                    statusText: "OK",
                },
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/new?template=0"]}>
                <Routes>
                    <Route path="/new" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("未命名自动任务")).not.toBeInTheDocument();
    });

    it("获取建议名接口失败", async () => {
        jest.spyOn(
            API.automation,
            "dagSuggestnameNameGet"
        ).mockImplementationOnce(() =>
            Promise.reject({
                response: {
                    data: { code: 500000000 },
                    status: 500,
                },
            } as any)
        );
        renders(
            <MemoryRouter initialEntries={["/new?template=0"]}>
                <Routes>
                    <Route path="/new" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByText("未命名自动任务")).toBeInTheDocument();
    });

    it("不存在的模板", async () => {
        renders(
            <MemoryRouter initialEntries={["/new?template=8"]}>
                <Routes>
                    <Route path="/new" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("未命名自动任务")).toBeInTheDocument();
    });
});
