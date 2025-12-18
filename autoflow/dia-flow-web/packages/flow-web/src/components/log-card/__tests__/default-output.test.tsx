import { render, screen } from "@testing-library/react";
import "../../../matchMedia.mock";
import { DefaultFormattedOutput } from "../default-output";

describe("DeleteModal", () => {
    it("测试DefaultFormattedOutput", () => {
        const outputData = {
            id: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC568C26AD3E3",
            path: "test",
            name: "测试日志",
            create_time: 1670898331000000,
            creator: "Admin",
        };
        const outputs = [
            {
                key: ".id",
                name: "DListFilesOutputId",
            },
            {
                key: ".name",
                name: "DListFilesOutputName",
            },
            {
                key: ".path",
                name: "DListFilesOutputPath",
            },
            {
                key: ".create_time",
                name: "DListFilesOutputCreateTime",
            },
            {
                key: ".creator",
                name: "DListFilesOutputCreator",
            },
        ];
        render(
            DefaultFormattedOutput({
                t: (t: string) => t,
                outputData,
                outputs,
            })
        );
        expect(screen.getByText("测试日志")).toBeInTheDocument();
    });

    it("修改时间为空", () => {
        const outputData = {
            id: "gns://5B4B8E14FE734367B3F56D1CB09ADFA9/793A4BD1E34B4DB180FAC268C26AD3E3",
            path: "test/111",
            name: "测试日志",
            modified: undefined,
            creator: "Admin",
        };
        const outputs = [
            {
                key: ".id",
                name: "",
            },
            {
                key: ".name",
                name: "",
            },
            {
                key: ".path",
                name: "",
            },
            {
                key: ".modified",
                name: "",
            },
        ];
        render(
            DefaultFormattedOutput({
                t: (t: string) => t,
                outputData,
                outputs,
            })
        );
        expect(screen.queryByText("测试日志")).not.toBeInTheDocument();
    });
});
