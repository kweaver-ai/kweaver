import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import lodash from "lodash";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider, API } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { DeleteModal } from "../delete-task-modal";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const mockModalInfo = jest
    .fn()
    .mockImplementation(
        ({
            type,
            title,
            message,
            okText,
            onOk,
        }: {
            type: string;
            okText?: string;
            cancelText?: string;
            title: string;
            message?: string;
            onOk?: (data?: { checkboxChecked?: boolean }) => void;
        }) => onOk && onOk()
    );

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={{
                components: {
                    messageBox: mockModalInfo,
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

describe("DeleteModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染 DeleteModal", () => {
        const props = {
            isModalVisible: true,
            onDeleteSuccess: jest.fn(),
            onCancel: jest.fn(),
            taskId: "7ecd372c-6588-11ed-82dd-aadebb5b99ee",
        };
        renders(<DeleteModal {...props} />);

        expect(screen.getByText("确认删除")).toBeInTheDocument();
        expect(screen.getByText("确定要删除该任务吗？")).toBeInTheDocument();
        expect(
            screen.getByText("删除后，任务将无法恢复。")
        ).toBeInTheDocument();
        const cancel = screen.getByText("取消");
        userEvent.click(cancel);
        expect(props.onCancel).toHaveBeenCalled();
    });

    it("删除操作", async () => {
        jest.spyOn(API.automation, "dagDagIdDelete").mockImplementationOnce(
            () =>
                Promise.resolve({
                    data: {},
                    status: 200,
                    statusText: "OK",
                } as any)
        );
        jest.spyOn(lodash, "debounce").mockImplementationOnce(
            ((fn: any, _time: number) => fn) as any
        );
        const props = {
            isModalVisible: true,
            onDeleteSuccess: jest.fn(),
            onCancel: jest.fn(),
            taskId: "7ecd372c-6588-11ed-82dd-aadebb5b99ee",
        };
        renders(<DeleteModal {...props} />);

        const ok = screen.getByText("确定");
        await userEvent.click(ok);
        expect(props.onDeleteSuccess).toHaveBeenCalled();
    });

    it("删除操作失败", async () => {
        jest.spyOn(API.automation, "dagDagIdDelete").mockImplementationOnce(
            () =>
                Promise.reject({
                    response: {
                        data: {
                            code: "ContentAutomation.TaskNotFound",
                        },
                    },
                } as any)
        );
        jest.spyOn(lodash, "debounce").mockImplementationOnce(
            ((fn: any, _time: number) => fn) as any
        );
        const props = {
            isModalVisible: true,
            onDeleteSuccess: jest.fn().mockImplementation(() => { }),
            onCancel: jest.fn(),
            taskId: "7ecd372c-6588-11ed-82dd-aadebb5b99ee",
        };
        renders(<DeleteModal {...props} />);

        const ok = screen.getByText("确定");
        await userEvent.click(ok);
        expect(mockModalInfo).toHaveBeenCalled();
        // expect(props.onDeleteSuccess).toHaveBeenCalled();
    });

    it("服务内部错误", async () => {
        jest.spyOn(API.automation, "dagDagIdDelete").mockImplementationOnce(
            () =>
                Promise.reject({
                    response: {
                        data: {
                            code: 500,
                        },
                    },
                } as any)
        );
        jest.spyOn(lodash, "debounce").mockImplementationOnce(
            ((fn: any, _time: number) => fn) as any
        );
        const props = {
            isModalVisible: true,
            onDeleteSuccess: jest.fn(),
            onCancel: jest.fn(),
            taskId: "7ecd372c-6588-11ed-82dd-aadebb5b99ee",
        };
        renders(<DeleteModal {...props} />);

        const ok = screen.getByText("确定");
        await userEvent.click(ok);
        expect(props.onDeleteSuccess).not.toHaveBeenCalled();
        expect(mockModalInfo).not.toHaveBeenCalled();
    });
});
