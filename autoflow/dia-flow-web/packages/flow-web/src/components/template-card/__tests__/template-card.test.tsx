import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TemplateCard } from "../template-card";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const templates = {
    templateId: "0",
    title: "template.archiving",
    actions: ["@trigger/manual", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            operator: "@trigger/manual",
            dataSource: {
                id: "9",
                operator: "@anyshare-data/list-files",
                parameters: {
                    docid: undefined,
                },
            },
        },
    ],
};
const renders = () =>
    render(
        <MicroAppProvider
            microWidgetProps={{}}
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route
                        path="/"
                        element={<TemplateCard template={templates} />}
                    />
                    <Route path="/new" element={<div>New Panel</div>} />
                </Routes>
            </MemoryRouter>
        </MicroAppProvider>
    );

describe("TemplateCard", () => {
    it("渲染 TemplateCard", () => {
        renders();

        expect(screen.getByText("使用")).toBeInTheDocument();
    });

    it("使用模板", async () => {
        renders();

        const button = screen.getByRole("button");
        userEvent.click(button);
        expect(await screen.findByText("New Panel")).toBeInTheDocument();
    });
});
