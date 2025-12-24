import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { useHandleErrReq } from "../use-handleErrReq";

function HandleErr(error: any) {
    const handleErr = useHandleErrReq();
    handleErr(error);
    return null;
}

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

global.alert = jest.fn();

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={
                {
                    components: {
                        toast: {
                            warning: (content: string) => {
                                alert(content);
                            },
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
        </MicroAppProvider>,
        { wrapper: BrowserRouter }
    );

describe("useHandleErrReq", () => {
    it("断网", () => {
        Object.defineProperty(navigator, "onLine", {
            writable: true,
            value: false,
        });
        renders(
            <HandleErr
                error={{
                    status: 500,
                    data: { code: "ContentAutomation.InternalError" },
                }}
            />
        );
        expect(global.alert).toBeCalledWith("无法连接网络");
        Object.defineProperty(navigator, "onLine", {
            writable: true,
            value: true,
        });
    });

    it("服务器内部错误", () => {
        renders(
            <HandleErr
                error={{
                    status: 500,
                    data: { code: "ContentAutomation.InternalError" },
                }}
            />
        );
        expect(global.alert).toBeCalledWith("服务器内部错误");
    });

    it("ContentAutomation.UnAuthorization", () => {
        renders(
            <HandleErr
                error={{
                    data: { code: "ContentAutomation.UnAuthorization" },
                }}
            />
        );
        expect(global.alert).not.toBeCalled();
    });

    it("401", () => {
        renders(
            <HandleErr
                error={{
                    status: 401,
                    data: { code: "ContentAutomation.UnAuthorization" },
                }}
            />
        );
        expect(global.alert).not.toBeCalled();
    });

    it("403001002", () => {
        renders(
            <HandleErr
                error={{
                    status: 403,
                    data: { code: 403001002, message: "权限不足" },
                }}
            />
        );
        expect(global.alert).toBeCalledWith("权限不足");
    });

    it("503", () => {
        renders(
            <HandleErr
                error={{
                    status: 503,
                }}
            />
        );
        expect(global.alert).toBeCalledWith("无法连接服务器");
    });
});
