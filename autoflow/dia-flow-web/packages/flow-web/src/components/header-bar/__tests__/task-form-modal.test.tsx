import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TaskFormModal } from "../task-form-modal";
import { message, Modal } from "antd";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

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

describe("TaskFormModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染 TaskFormModal", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.resolve({
                data: {},
                status: 200,
            } as any)
        );
        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                    <Route path="/edit/:id" element={<div>Edit</div>} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("保存任务设置")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "修改名称/|");
        await userEvent.click(screen.getByText("确定"));
        expect(props.onClose).not.toHaveBeenCalled();
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "新任务名称");
        const detailsInput = screen.getByPlaceholderText("请填写任务描述");
        await userEvent.type(detailsInput, "一段描述");
        userEvent.click(screen.getByText("确定"));
        await userEvent.click(screen.getByText("确定"));
        // expect(await screen.findByText(/Edit/)).toBeInTheDocument();
        // expect(await screen.findByText(/保存成功/)).toBeInTheDocument();
    });

    it("取消", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.resolve({
                data: {},
                status: 200,
            } as any)
        );
        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("保存任务设置")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "新任务名称");
        const detailsInput = screen.getByPlaceholderText("请填写任务描述");
        await userEvent.type(detailsInput, "一段描述");
        expect(screen.getByDisplayValue("一段描述")).toBeInTheDocument();
        await userEvent.click(screen.getByText("取消"));
        expect(props.onClose).toHaveBeenCalled();
    });

    it("您输入的名称已存在", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.DuplicatedName" },
                    status: 400,
                },
            } as any)
        );

        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "新任务名称");
        await userEvent.click(screen.getByText("确定"));
        expect(props.onClose).not.toHaveBeenCalled();
        expect(
            await screen.findByText(/您输入的名称已存在/)
        ).toBeInTheDocument();
    });

    it("请检查参数。", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: { code: "ContentAutomation.InvalidParameter" },
                    status: 400,
                },
            } as any)
        );

        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "新任务名称");
        await userEvent.click(screen.getByText("确定"));
        expect(props.onClose).not.toHaveBeenCalled();
        expect(await screen.findByText(/请检查参数。/)).toBeInTheDocument();
    });

    it("新建的自动任务数已达上限", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: {
                        code: "ContentAutomation.Forbidden.NumberOfTasksLimited",
                    },
                    status: 400,
                },
            } as any)
        );

        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "新任务名称");
        await userEvent.click(screen.getByText("确定"));
        expect(props.onClose).not.toHaveBeenCalled();
        expect(
            await screen.findByText(
                /您新建的自动任务数已达上限。（最多允许新建50个）/
            )
        ).toBeInTheDocument();
    });

    it("内部错误", async () => {
        jest.spyOn(API.automation, "dagPost").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: { code: 500000000 },
                    status: 500,
                },
            } as any)
        );

        const props = {
            visible: true,
            onClose: jest.fn(),
        };
        renders(
            <MemoryRouter initialEntries={["/new"]}>
                <Routes>
                    <Route path="/new" element={<TaskFormModal {...props} />} />
                </Routes>
            </MemoryRouter>
        );
        const nameInput = screen.getByPlaceholderText("请填写任务名称");
        await userEvent.type(nameInput, "新任务名称");
        await userEvent.click(screen.getByText("确定"));
        expect(props.onClose).not.toHaveBeenCalled();
    });
});
