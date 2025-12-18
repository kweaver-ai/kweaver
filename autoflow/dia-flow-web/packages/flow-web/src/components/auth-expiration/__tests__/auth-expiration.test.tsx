import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { API, MicroAppProvider, useTranslate } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { adaptUI, AuthExpiration } from "../auth-expiration";
import { useEffect, useRef } from "react";

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
        </MicroAppProvider>,
        { wrapper: BrowserRouter }
    );

const TestDom = () => {
    const t = useTranslate();
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) {
            adaptUI(ref.current, t);
        }
    });
    return (
        <div ref={ref}>
            <div className="logo-wrapper">
                <img src="" alt="" />
            </div>
            <div className="title-wrapper">Content Portal</div>
            <div className="signin-content"><form className="ant-form ant-form-horizontal"><div className="ant-row ant-form-item"><div className="ant-col ant-form-item-control"><div className="ant-form-item-control-input"><div className="ant-form-item-control-input-content"><span className="input-item signin-item ant-input-affix-wrapper"><span className="ant-input-prefix"><span role="img" aria-label="account" className="anticon anticon-account icon"><svg viewBox="0 0 13 14" focusable="false" className="" data-icon="account" width="1em" height="1em" fill="currentColor" aria-hidden="true"><g fill-rule="evenodd" fill="none" id="页面-3" opacity=".6" stroke-width="1" stroke="none"><g fill="#6C798C" id="web端登录+修改密码" transform="translate(-716 -272)"><g id="编组-4" transform="translate(140 79)"><g id="图层-8备份-6"><g id="编组-3" transform="translate(560 105)"><g id="Group-3"><g id="Group-4" transform="translate(0 79)"><g id="编组-5" transform="translate(16 9)"><circle cx="6.18" cy="3.71" id="椭圆形" r="3.71"></circle><path d="M12.35 14c0-3.64-2.76-6.59-6.17-6.59S0 10.36 0 14" id="路径"></path></g></g></g></g></g></g></g></g></svg></span></span><input type="text" autoComplete="off" name="account" className="ant-input" placeholder="Enter your account" value="test1" /></span></div></div></div></div><div className="ant-row ant-form-item"><div className="ant-col ant-form-item-control"><div className="ant-form-item-control-input"><div className="ant-form-item-control-input-content"><span className="ant-input-password input-item signin-item ant-input-affix-wrapper"><span className="ant-input-prefix"><span role="img" aria-label="password" className="anticon anticon-password icon"><svg viewBox="0 0 12 14" focusable="false" className="" data-icon="password" width="1em" height="1em" fill="currentColor" aria-hidden="true"><g fill-rule="evenodd" fill="none" id="页面-3" opacity=".6" stroke-width="1" stroke="none"><g fill-rule="nonzero" fill="#6C798C" id="web端登录+修改密码" transform="translate(-716 -320)"><g id="编组-4" transform="translate(140 79)"><g id="图层-8备份-6"><g id="编组-3" transform="translate(560 105)"><g id="Group-3"><g id="Group-4-Copy" transform="translate(0 127)"><g id="编组" transform="translate(16 9)"><path d="M10.76 5.88H1.02c-.56 0-1.01.45-1.01 1v6.06c0 .55.45 1 1 1h9.75c.56 0 1.01-.45 1.01-1V6.89c0-.56-.45-1-1-1zM5.9 12.8a1.43 1.43 0 01-.55-2.74V7.88a.54.54 0 111.1 0v2.17a1.43 1.43 0 01-.55 2.74z" id="形状"></path><path d="M9.7 5.93H8.61V3.81a2.72 2.72 0 10-5.44 0v2.12h-1.1V3.81a3.81 3.81 0 017.63 0v2.12z" id="路径"></path></g></g></g></g></g></g></g></g></svg></span></span><input type="password" autoComplete="off" name="password" placeholder="Enter your password" className="ant-input" /></span></div></div></div></div><div className="ant-row ant-form-item"><div className="ant-col ant-form-item-control"><div className="ant-form-item-control-input"><div className="ant-form-item-control-input-content"><div className="remember-password"><label className="remember-password-text ant-checkbox-wrapper"><span className="ant-checkbox"><input type="checkbox" name="remember" className="ant-checkbox-input" value="" /><span className="ant-checkbox-inner"></span></span><span>Keep me logged in</span></label></div></div></div></div></div><div className="ant-row ant-form-item"><div className="ant-col ant-form-item-control"><div className="ant-form-item-control-input"><div className="ant-form-item-control-input-content"><button type="button" className="ant-btn oem-button as-components-oem-background-color ant-btn-primary"><span>Log In</span></button></div></div></div></div></form></div>
        </div>
    );
};

describe("AuthExpiration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("渲染AuthExpiration类型为toast", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.resolve({
                data: {
                    status: false,
                    url: "192.168.124.90:443/oauth2/auth?client_id=b0b3a7c5-83d5-48f9-bcb9-55aa0849fa49&redirect_uri=https://192.168.124.90:443/api/automation/v1/oauth2/callback&response_type=code&scope=openid offline all&state=aHR0cHM6Ly8xOTIuMTY4LjEyNC45MC9hcHBsZXQvYXBwL2NvbnRlbnQtYXV0b21hdGlvbi1uZXcvYXV0aD9sYW5nPXpoLWNu",
                },
            })
        );
        renders(<AuthExpiration type="toast" />);

        const button = await screen.findByText(/重新授权/);
        expect(button).toBeInTheDocument();
        userEvent.click(button);
        expect(await screen.findByTitle("login")).toBeInTheDocument();
    });

    it("渲染AuthExpiration类型为modal", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.resolve({
                data: {
                    status: false,
                    url: "192.168.124.90:443/oauth2/auth?client_id=b0b3a7c5-83d5-48f9-bcb9-55aa0849fa49&redirect_uri=https://192.168.124.90:443/api/automation/v1/oauth2/callback&response_type=code&scope=openid offline all&state=aHR0cHM6Ly8xOTIuMTY4LjEyNC45MC9hcHBsZXQvYXBwL2NvbnRlbnQtYXV0b21hdGlvbi1uZXcvYXV0aD9sYW5nPXpoLWNu",
                },
            })
        );
        jest.spyOn(API.efast, "eacpV1UserGetPost").mockImplementation(() =>
            Promise.resolve({ data: { account: "test" } } as any)
        );
        renders(<AuthExpiration type="modal" />);

        expect(await screen.findByText("自动化")).toBeInTheDocument();
        const button = await screen.findByText(/确认授权/);
        expect(button).toBeInTheDocument();
        userEvent.click(button);
        expect(button).not.toBeInTheDocument();
    });

    it("获取授权状态为空", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.resolve({
                data: {
                    status: "",
                },
            })
        );
        renders(<AuthExpiration type="toast" />);
        expect(screen.queryByText(/重新授权/)).not.toBeInTheDocument();
    });

    it("获取授权状态失败", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: { code: 500 },
                },
            })
        );
        renders(<AuthExpiration type="modal" />);
        expect(screen.queryByText("自动化")).not.toBeInTheDocument();
    });

    it("无法连接服务器", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.reject({
                response: {
                    data: { code: "FileCollector.InternalError" },
                },
            })
        );
        renders(<AuthExpiration type="modal" />);
        expect(screen.queryByText("自动化")).not.toBeInTheDocument();
    });

    it("关闭modal", async () => {
        jest.spyOn(API.axios, "post").mockImplementation(() =>
            Promise.resolve({
                data: {
                    status: false,
                    url: "192.168.124.90:443/oauth2/auth?client_id=b0b3a7c5-83d5-48f9-bcb9-55aa0849fa49&redirect_uri=https://192.168.124.90:443/api/automation/v1/oauth2/callback&response_type=code&scope=openid offline all&state=aHR0cHM6Ly8xOTIuMTY4LjEyNC45MC9hcHBsZXQvYXBwL2NvbnRlbnQtYXV0b21hdGlvbi1uZXcvYXV0aD9sYW5nPXpoLWNu",
                },
            })
        );
        jest.spyOn(API.efast, "eacpV1UserGetPost").mockImplementation(() =>
            Promise.resolve({ data: { account: "test" } } as any)
        );
        renders(<AuthExpiration type="modal" />);
        expect(await screen.findByText("自动化")).toBeInTheDocument();
        const buttons = await screen.findAllByRole("img");
        await userEvent.click(buttons[0]);
        expect(screen.queryByText("自动化")).not.toBeInTheDocument();
    });

    it("AdaptUI", async () => {
        renders(<TestDom />);
        expect(screen.queryByText("Content Portal")).not.toBeInTheDocument();
        expect(await screen.findByText("确认授权")).toBeInTheDocument();
    });
});
