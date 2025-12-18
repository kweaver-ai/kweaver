import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { AuthCallBack } from "../auth-callback";

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

describe("AuthCallBack", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it("渲染AuthCallBack", () => {
        renders(
            <MemoryRouter initialEntries={["/auth?lang=zh-cn"]}>
                <Routes>
                    <Route path="/auth" element={<AuthCallBack />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("授权成功！")).toBeInTheDocument();
    });

    it("繁体提示", () => {
        const location = {
            ...window.location,
            search: "?lang=zh-tw",
        };
        Object.defineProperty(window, "location", {
            writable: true,
            value: location,
        });
        renders(
            <MemoryRouter initialEntries={["/auth?lang=zh-tw"]}>
                <Routes>
                    <Route path="/auth" element={<AuthCallBack />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("授權成功！")).toBeInTheDocument();
    });

    it("英文提示", () => {
        const location = {
            ...window.location,
            search: "?lang=en-us",
        };
        Object.defineProperty(window, "location", {
            writable: true,
            value: location,
        });
        renders(
            <MemoryRouter initialEntries={["/auth?lang=en-us"]}>
                <Routes>
                    <Route path="/auth" element={<AuthCallBack />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText("Authorized!")).toBeInTheDocument();
    });

    it("跳转首页", async () => {
        renders(
            <MemoryRouter initialEntries={["/other"]}>
                <Routes>
                    <Route path="/" element={<div>Home</div>} />
                    <Route path="*" element={<AuthCallBack />} />
                </Routes>
            </MemoryRouter>
        );
        expect(await screen.findByText("Home")).toBeInTheDocument();
    });
});
