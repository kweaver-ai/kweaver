import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { LogPanel } from "../log-panel";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../../components/log-card", () => ({
    LogCard() {
        return <div>LogCard</div>;
    },
}));

jest.mock("../../../components/table-empty", () => ({
    Empty({ emptyText }: { emptyText: string }) {
        return <div>{emptyText}</div>;
    },
}));

jest.mock("../../../components/auth-expiration", () => ({
    AuthExpiration() {
        return <div>mock-auth-expiration</div>;
    },
}));

jest.mock("swr", () => () => ({
    isValidating: true,
    data: undefined,
}));

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

describe("LogPanel-2", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it("加载中", () => {
        renders(
            <MemoryRouter initialEntries={["/details/112/log/332"]}>
                <Routes>
                    <Route
                        path="/details/:id/log/:recordId"
                        element={<LogPanel />}
                    />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.queryByText("LogCard")).not.toBeInTheDocument();
        expect(screen.queryByText("日志为空")).not.toBeInTheDocument();
    });
});
