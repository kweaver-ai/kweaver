import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { TaskInfo } from "../task-info";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const mockData = {
    id: "437520153039627828",
    title: "数据原",
    description: "等待",
    status: "normal",
    steps: [],
    created_at: 1670311933,
    updated_at: 1670898331,
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

describe("TaskInfo", () => {
    it("渲染 TaskInfo", () => {
        renders(<TaskInfo />);

        expect(screen.getByText("详细信息")).toBeInTheDocument();
        expect(screen.getByText("编辑任务")).toBeInTheDocument();
        expect(screen.getByText("任务名称：")).toBeInTheDocument();
        expect(screen.getByText("任务描述：")).toBeInTheDocument();
        expect(screen.getByText("任务状态：")).toBeInTheDocument();
        expect(screen.getByText("创建时间：")).toBeInTheDocument();
        expect(screen.getByText("更新时间：")).toBeInTheDocument();
        expect(screen.getAllByText("---")).toHaveLength(5);
    });

    it("加载数据", () => {
        renders(<TaskInfo taskInfo={mockData} />);

        expect(screen.getByText("数据原")).toBeInTheDocument();
        expect(screen.getByText("等待")).toBeInTheDocument();
        expect(screen.getByText("启用中")).toBeInTheDocument();
        // expect(screen.getByText("2022/12/06 15:32")).toBeInTheDocument();
        // expect(screen.getByText("2022/12/13 10:25")).toBeInTheDocument();
        expect(screen.queryByText("---")).toBeNull();
    });

    it("编辑按钮跳转", async () => {
        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={document.body}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <MemoryRouter initialEntries={["/details/testId"]}>
                    <Routes>
                        <Route
                            path="/details/:id"
                            element={<TaskInfo taskInfo={mockData} />}
                        />
                        <Route
                            path="/edit/:id"
                            element={<div>Edit Panel</div>}
                        />
                    </Routes>
                </MemoryRouter>
            </MicroAppProvider>
        );
        const button = screen.getByRole("button");
        userEvent.click(button);
        expect(await screen.findByText("Edit Panel")).toBeInTheDocument();
    });
});
