import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MicroAppProvider, API } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { EditorPanel, reducer } from "../editor-panel";
import userEvent from "@testing-library/user-event";
import { Modal } from "antd";

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
jest.mock("../../../components/editor", () => ({
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
jest.mock("../../../components/header-bar", () => ({
    HeaderBar() {
        return <div>header-bar</div>;
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

describe("EditorPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染EditorPanel", async () => {
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
                        ],
                        created_at: 1669363044,
                        updated_at: 1669692230,
                    },
                }) as any
        );
        renders(
            <MemoryRouter initialEntries={["/edit/435928181568988672"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                </Routes>
            </MemoryRouter>
        );
        // expect(screen.getByText("mock-auth-expiration")).toBeInTheDocument();
        expect(screen.getByText("header-bar")).toBeInTheDocument();
        expect(screen.getByText("editor")).toBeInTheDocument();
        expect(await screen.findByText(/节点长度：1/)).toBeInTheDocument();
        await userEvent.click(screen.getByText("编辑节点"));
        expect(await screen.findByText(/节点长度：3/)).toBeInTheDocument();
    });

    it("加载错误", async () => {
        jest.spyOn(API.automation, "dagDagIdGet").mockImplementation(
            () =>
                Promise.reject({
                    response: {
                        data: {
                            code: "ContentAutomation.TaskNotFound",
                        },
                    },
                }) as any
        );
        renders(
            <MemoryRouter initialEntries={["/edit/435928181568988672"]}>
                <Routes>
                    <Route path="/edit/:id" element={<EditorPanel />} />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("editor")).toBeInTheDocument();
        expect(await screen.findByText("该任务已不存在。")).toBeInTheDocument();
        await userEvent.click(screen.getByText("返回任务列表"));
        // expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("reducer", () => {
        const initial = reducer(undefined, {
            type: "initial",
            initialValue: {
                steps: [
                    {
                        id: "0",
                        title: "",
                        operator: "@trigger/manual",
                    },
                ],
            },
        });
        expect(initial).toEqual({
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
            ],
        });

        const newTitle = reducer(initial, {
            type: "title",
            title: "newTitle",
        });
        expect(newTitle).toEqual({
            title: "newTitle",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
            ],
        });

        const newDescription = reducer(newTitle, {
            type: "description",
            description: "一段描述",
        });
        expect(newDescription).toEqual({
            title: "newTitle",
            description: "一段描述",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
            ],
        });

        const newStatus = reducer(newDescription, {
            type: "status",
            status: "stopped",
        });
        expect(newStatus).toEqual({
            title: "newTitle",
            description: "一段描述",
            status: "stopped",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
            ],
        });

        const newSteps = reducer(newStatus, {
            type: "steps",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
                {
                    id: "2",
                    title: "",
                    operator: "@internal/text/split",
                    dataSource: {
                        id: "",
                        title: "",
                        operator: "",
                        parameters: {},
                    },
                    parameters: {
                        separator: ",",
                        text: "sda",
                    },
                },
            ],
        });
        expect(newSteps).toEqual({
            title: "newTitle",
            description: "一段描述",
            status: "stopped",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: "@trigger/manual",
                },
                {
                    id: "2",
                    title: "",
                    operator: "@internal/text/split",
                    dataSource: {
                        id: "",
                        title: "",
                        operator: "",
                        parameters: {},
                    },
                    parameters: {
                        separator: ",",
                        text: "sda",
                    },
                },
            ],
        });

        // expect(
        //     reducer(newSteps, {
        //         type: "other" as any,
        //     })
        // ).toHaveErrorMessage("Unexpected action");
    });
});
