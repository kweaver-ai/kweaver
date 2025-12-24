import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ErrorPopover } from "./error-popover";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../locales/zh-cn.json";
import zhTW from "../../locales/zh-tw.json";
import enUS from "../../locales/en-us.json";
import viVN from "../../locales/vi-vn.json";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

describe("ErrorPopover", () => {
    it("render ErrorPopover", async () => {
        const container = document.body;
        const onClick = jest.fn();
        render(
            <div onClick={onClick}>
                <MicroAppProvider
                    microWidgetProps={{}}
                    container={container}
                    translations={translations}
                    prefixCls="CONTENT_AUTOMATION_NEW-ant"
                    iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
                >
                    <ErrorPopover code="INVALID_OPERATOR" />
                </MicroAppProvider>
            </div>
        );

        const errorPopoverIcon = await screen.findByTestId(
            "error-popover-icon"
        );
        fireEvent.mouseEnter(errorPopoverIcon);
        const content = await waitFor(() =>
            screen.findByText("该操作未设置完成")
        );
        expect(content).toBeInTheDocument();

        fireEvent.click(errorPopoverIcon);
        expect(onClick).toBeCalledTimes(0);
    });

    it("节点参数错误", async () => {
        const container = document.body;
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={container}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <ErrorPopover code="INVALID_PARAMETERS" />
            </MicroAppProvider>
        );

        const errorPopoverIcon = await screen.findByTestId(
            "error-popover-icon"
        );
        fireEvent.mouseEnter(errorPopoverIcon);
        const content = await waitFor(() =>
            screen.findByText("配置不完整，请检查")
        );
        expect(content).toBeInTheDocument();
    });
});
