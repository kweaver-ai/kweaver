import { render, screen } from "@testing-library/react";
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

jest.mock("../../table-empty", () => ({
    Empty({ emptyText }: { emptyText: string }) {
        return <div>{emptyText}</div>;
    },
    getLoadStatus() {
        return "empty";
    },
}));

jest.mock("../../../extensions/templates", () => ({
    taskTemplates: [],
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

describe("TemplateSelectModal-2", () => {
    it("无模板", async () => {
        const props = {
            onClose: jest.fn(),
        };
        renders(<TemplateSelectModal {...props} />);

        expect(screen.getByText("模板为空")).toBeInTheDocument();
    });
});
