import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { DocList } from "../doc-list";

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

describe("已选文档列表展示", () => {
    const mockAddFn = jest.fn();
    const mockChangeFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("文件展示", () => {
        const mockData = [
            {
                id: "gns://C18C3BF866C64C47893B1972A8C24B5C",
                path: "我的文档库/test",
                name: "test",
            },
        ];
        renders(
            <DocList
                data={mockData}
                selectType={1}
                onAdd={mockAddFn}
                onChange={mockChangeFn}
            />
        );
        expect(screen.getByText("我的文档库/test")).toBeInTheDocument();
        expect(screen.getByText("添加更多文件")).toBeInTheDocument();
    });

    it("文件夹展示", () => {
        const mockData = [
            {
                id: "gns://C18C3BF866C64C47893B1972A8C24B5C",
                path: "我的文档库",
                name: "我的文档库",
            },
        ];
        renders(
            <DocList
                data={mockData}
                selectType={2}
                onAdd={mockAddFn}
                onChange={mockChangeFn}
            />
        );
        expect(screen.getByText("我的文档库")).toBeInTheDocument();
        expect(screen.getByText("添加更多文件夹")).toBeInTheDocument();
    });

    it("删除操作", async () => {
        const mockData = [
            {
                id: "gns://C18C3BF866C64C47893B1972A8C24B5C",
                path: "我的文档库",
                name: "我的文档库",
            },
        ];
        renders(
            <DocList
                data={mockData}
                selectType={2}
                onAdd={mockAddFn}
                onChange={mockChangeFn}
            />
        );
        expect(screen.getByText("我的文档库")).toBeInTheDocument();
        await userEvent.click(screen.getByTitle("删除"));
        expect(mockChangeFn).toBeCalled();
    });

    it("添加操作", async () => {
        const mockData = [
            {
                id: "gns://C18C3BF866C64C47893B1972A8C24B5C",
                path: "我的文档库",
                name: "我的文档库",
            },
        ];
        renders(
            <DocList
                data={mockData}
                selectType={2}
                onAdd={mockAddFn}
                onChange={mockChangeFn}
            />
        );
        await userEvent.click(screen.getByText("添加更多文件夹"));
        expect(mockAddFn).toBeCalled();
    });
});
