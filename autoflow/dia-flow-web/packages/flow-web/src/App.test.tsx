import "./matchMedia.mock";
import React from "react";
import { render } from "@testing-library/react";
import App from "./App";
import { MicroAppProvider } from "@applet/common";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("./components/oem-provider", () => ({
    OemConfigProvider({ children }: any) {
        return children;
    },
}));

describe("App", () => {
    it("渲染 APP", () => {
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls={"ant"}
                iconPrefixCls={"anticon"}
            >
                <App />
            </MicroAppProvider>
        );
    });

    it("isDialogMode", () => {
        render(
            <MicroAppProvider
                microWidgetProps={
                    {
                        config: {
                            systemInfo: { isDialogMode: true },
                        },
                    } as any
                }
                container={document.body}
                translations={translations}
                prefixCls={"ant"}
                iconPrefixCls={"anticon"}
            >
                <App />
            </MicroAppProvider>
        );
    });

    it("electron", () => {
        render(
            <MicroAppProvider
                microWidgetProps={
                    {
                        config: {
                            systemInfo: { platform: "electron" },
                        },
                        history: {
                            getBasePath: "file#anyshare",
                        },
                    } as any
                }
                container={document.body}
                translations={translations}
                prefixCls={"ant"}
                iconPrefixCls={"anticon"}
            >
                <App />
            </MicroAppProvider>
        );
    });
});
