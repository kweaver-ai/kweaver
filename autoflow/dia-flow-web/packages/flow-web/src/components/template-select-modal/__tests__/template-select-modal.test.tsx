import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TemplateSelectModal } from "../template-select-modal";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

jest.mock("../../template-card", () => ({
    TemplateCard() {
        return <div>TemplateCard</div>;
    },
}));

jest.mock("../../../extensions/templates", () => ({
    taskTemplates: [
        {
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
        },
        {
            templateId: "1",
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
        },
    ],
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
        </MicroAppProvider>,
        { wrapper: BrowserRouter }
    );

describe("TemplateSelectModal", () => {
    it("渲染 TemplateSelectModal", async () => {
        const props = {
            onClose: jest.fn(),
        };
        renders(<TemplateSelectModal {...props} />);
        expect(screen.getByText("选择模板")).toBeInTheDocument();
        expect(screen.getAllByText("TemplateCard")).toHaveLength(2);

        const button = screen.getByRole("button");
        userEvent.click(button);
        expect(props.onClose).toHaveBeenCalled();
    });
});
