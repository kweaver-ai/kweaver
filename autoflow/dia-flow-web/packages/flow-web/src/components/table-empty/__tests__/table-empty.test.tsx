import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { Empty, getLoadStatus, LoadStatus } from "../table-empty";

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

describe("Empty", () => {
    it("测试getLoadStatus", () => {
        expect(getLoadStatus({ isLoading: true })).toBe("loading");
        expect(getLoadStatus({ isLoading: false, error: { code: 500 } })).toBe(
            "error"
        );
        expect(
            getLoadStatus({
                isLoading: false,
                data: [],
                keyword: "1",
            })
        ).toBe("searchEmpty");
        expect(
            getLoadStatus({
                isLoading: false,
                data: [],
                filter: ["success", "fail"],
            })
        ).toBe("filterEmpty");
        expect(getLoadStatus({ isLoading: false, data: [] })).toBe("empty");
        expect(
            getLoadStatus({ isLoading: false, data: [{ id: 1 }, { id: 2 }] })
        ).toBe("loaded");
    });

    it("渲染Empty", () => {
        renders(<Empty height={10} loadStatus={LoadStatus.Empty} />);
        expect(screen.getByText("列表为空")).toBeInTheDocument();
    });

    it("SearchEmpty", () => {
        renders(<Empty height={10} loadStatus={LoadStatus.SearchEmpty} />);
        expect(screen.getByText("抱歉，没有找到相关内容")).toBeInTheDocument();
    });

    it("FilterEmpty", () => {
        renders(<Empty height={10} loadStatus={LoadStatus.FilterEmpty} />);
        expect(
            screen.getByText("抱歉，没有与筛选匹配的结果")
        ).toBeInTheDocument();
    });

    it("Error", () => {
        renders(<Empty height={10} loadStatus={LoadStatus.Error} />);
        expect(screen.getByText("抱歉，无法完成加载")).toBeInTheDocument();
    });

    it("Loaded", () => {
        renders(<Empty height={10} loadStatus={LoadStatus.Loaded} />);
        expect(screen.queryByRole("列表为空")).not.toBeInTheDocument();
    });
});
