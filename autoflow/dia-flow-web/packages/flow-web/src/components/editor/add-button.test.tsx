/* eslint-disable testing-library/no-unnecessary-act */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AddButton } from "./add-button";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../locales/zh-cn.json";
import zhTW from "../../locales/zh-tw.json";
import enUS from "../../locales/en-us.json";
import viVN from "../../locales/vi-vn.json";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

describe("AddButton", () => {
    it("render AddButton", async () => {
        const onAddBranch = jest.fn();
        const onAddStep = jest.fn();
        const onAddLoop = jest.fn();
        const container = document.body;

        render(
            <MicroAppProvider
                microWidgetProps={{}}
                container={container}
                translations={translations}
                prefixCls="CONTENT_AUTOMATION_NEW-ant"
                iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
            >
                <AddButton
                    onAddBranch={onAddBranch}
                    onAddStep={onAddStep}
                    onAddLoop={onAddLoop}
                />
            </MicroAppProvider>
        );

        const addButton = await screen.findByTestId("editor-add-button");

        expect(addButton).toBeInTheDocument();

        await act(async () => {
            fireEvent.mouseEnter(addButton);
        });

        const addStepButton = await screen.findByText("操作");
        const addBranchButton = await screen.findByText("分支");

        expect(addStepButton).toBeInTheDocument();
        expect(addBranchButton).toBeInTheDocument();

        fireEvent.click(addStepButton);
        expect(onAddStep).toBeCalled();
        fireEvent.click(addBranchButton);
        expect(onAddBranch).toBeCalled();
    });
});
