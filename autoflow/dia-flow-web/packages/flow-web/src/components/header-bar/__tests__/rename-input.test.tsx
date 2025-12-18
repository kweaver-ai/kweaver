import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { RenameInput } from "../rename-input";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const mockWarn = jest.fn();
const mockSuccess = jest.fn();
const mockError = jest.fn();

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
                    toast: {
                        warning: mockWarn,
                        success: mockSuccess,
                        error: mockError,
                    },
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

describe("RenameInput", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染 RenameInput", async () => {
        const props = {
            name: "test",
            onSuccess: jest.fn(),
            onCancel: jest.fn(),
        };
        renders(<RenameInput {...props} />);
        const input = screen.getByDisplayValue("test");
        expect(input).toBeInTheDocument();
        await userEvent.type(input, "     ");
        await userEvent.type(input, "/asd");
        const okBtn = screen.getAllByRole("img")[0];
        await userEvent.click(okBtn);
        await userEvent.clear(input);
        await userEvent.type(input, "重命名");
        expect(screen.getByDisplayValue("重命名")).toBeInTheDocument();
        await userEvent.click(okBtn);
        expect(props.onSuccess).toHaveBeenCalled();
        await userEvent.click(screen.getAllByRole("img")[1]);
        expect(props.onCancel).toHaveBeenCalled();
    });
});
