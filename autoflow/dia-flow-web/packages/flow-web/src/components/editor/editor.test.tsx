/* eslint-disable testing-library/no-unnecessary-act */
import "../../matchMedia.mock";
import "../../element-scroll-polyfill";
import { MicroAppProvider } from "@applet/common";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ExtensionProvider } from "../extension-provider";
import { Editor } from "./editor";
import zhCN from "../../locales/zh-cn.json";
import zhTW from "../../locales/zh-tw.json";
import enUS from "../../locales/en-us.json";
import viVN from "../../locales/vi-vn.json";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

describe("Editor", () => {
    it("渲染 Editor", async () => {
        const container = document.body;
        Object.defineProperty(window, "ANT_PREFIX", {
            writable: true,
            value: "CONTENT_AUTOMATION_NEW-ant",
        });

        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={container}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
                platform="client"
            >
                <ExtensionProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Editor />}></Route>
                        </Routes>
                    </BrowserRouter>
                </ExtensionProvider>
            </MicroAppProvider>
        );

        const start = await screen.findByText("开始任务");
        expect(start).toBeInTheDocument();

        const end = await screen.findByText("结束任务");
        expect(end).toBeInTheDocument();

        const step1 = await screen.findByText("1. 选择触发器");
        expect(step1).toBeInTheDocument();

        const step2 = await screen.findByText("2. 选择执行操作");
        expect(step2).toBeInTheDocument();

        fireEvent.click(step1);

        const triggerConfigTitle = await screen.findByText("选择触发器");
        expect(triggerConfigTitle).toBeInTheDocument();

        // await act(async () => {
        //     fireEvent.click(screen.getByText("手动触发"));
        // });

        // await act(async () => {
        //     fireEvent.click(screen.getByText("手动触发"));
        // });

        // await act(async () => {
        //     fireEvent.click(screen.getByText("确定"));
        // });

        // expect(screen.getByText("1. 手动触发")).toBeInTheDocument();
    });
});
