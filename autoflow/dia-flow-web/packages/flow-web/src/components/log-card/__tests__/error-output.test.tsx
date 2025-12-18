import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { ErrorOutput } from "../error-output";

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

describe("ErrorOutput", () => {
    it("内部错误", () => {
        const outputs = {};
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("服务器内部错误。")).toBeInTheDocument();
    });

    it("ContentAutomation.UnAuthorization", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.UnAuthorization",
            errordetails: {
                doc: {
                    docid: "gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35",
                    docname: "Test",
                },
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("授权已过期。")).toBeInTheDocument();
    });

    it("ContentAutomation.NoPermission", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.NoPermission",
            errordetails: {
                doc: {
                    docid: "gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35",
                    docname: "Test",
                },
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("您对文档“Test”没有显示权限。")
        ).toBeInTheDocument();
    });

    it("ContentAutomation.FileSizeExceed", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.FileSizeExceed",
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("文件已超过100M文件大小的限制。")
        ).toBeInTheDocument();
    });

    it("ContentAutomation.NotContainPageData", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.NotContainPageData",
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("只支持Word和PDF类型的文件")
        ).toBeInTheDocument();
    });

    it("403001002", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "没有权限操作目标对象 (gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35)。（错误提供者：EVFS，错误值：16778263，错误位置：ncEVFSCopyManager.cpp:807）",
                code: 403001002,
                message: "没有权限操作目标位置的对象。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("没有权限执行此操作。")).toBeInTheDocument();
    });

    it("403002056", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "没有权限操作目标对象 (gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35)。（错误提供者：EVFS，错误值：16778263，错误位置：ncEVFSCopyManager.cpp:807）",
                code: 403002056,
                message: "没有权限操作目标位置的对象。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("没有权限操作目标位置的对象。")
        ).toBeInTheDocument();
    });

    it("403001108", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "没有权限操作目标对象 (gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35)。（错误提供者：EVFS，错误值：16778263，错误位置：ncEVFSCopyManager.cpp:807）",
                code: 403001108,
                message: "您对该文档密级权限不足。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("您对该文档密级权限不足。")
        ).toBeInTheDocument();
    });

    it("403002065", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "您对该文档密级权限不足。",
                code: 403002065,
                message: "您对该文档密级权限不足。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("您对该文档密级权限不足。")
        ).toBeInTheDocument();
    });

    it("403002039", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "存在同类型的同名文件名。",
                code: 403002039,
                message: "存在同类型的同名文件名。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("存在同类型的同名文件名。")
        ).toBeInTheDocument();
    });

    it("403002040", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "存在同类型的同名文件，但无修改权限。",
                code: 403002040,
                message: "存在同类型的同名文件，但无修改权限。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("存在同类型的同名文件，但无修改权限。")
        ).toBeInTheDocument();
    });

    it("400000000", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "参数错误。",
                code: 400000000,
                message: "参数错误。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("参数错误。")).toBeInTheDocument();
    });

    it("404002005", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "顶级文档库不存在。",
                code: 404002005,
                message: "顶级文档库不存在。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("顶级文档库不存在。")).toBeInTheDocument();
    });

    it("404002006", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "请求的文件或目录不存在。",
                code: 404002006,
                message: "请求的文件或目录不存在。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(
            screen.getByText("请求的文件或目录不存在。")
        ).toBeInTheDocument();
    });

    it("403001171", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "您的账号已被冻结。",
                code: 403001171,
                message: "您的账号已被冻结。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("您的账号已被冻结。")).toBeInTheDocument();
    });

    it("403001203", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "当前文档受策略管控。",
                code: 403001203,
                message: "当前文档受策略管控。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("当前文档受策略管控。")).toBeInTheDocument();
    });

    it("403001031", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "当前文档已被锁定。",
                code: 403001031,
                message: "当前文档已被锁定。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("当前文档已被锁定。")).toBeInTheDocument();
    });

    it("400002012", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: '名称不能包含 \\ / : * ? " < > | 特殊字符。',
                code: 400002012,
                message: '名称不能包含 \\ / : * ? " < > | 特殊字符。',
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText(/名称不能包含/)).toBeInTheDocument();
    });

    it("404003032", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "该编目模板已被删除。",
                code: 404003032,
                message: "该编目模板已被删除。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("该编目模板已被删除。")).toBeInTheDocument();
    });

    it("404003036", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "该编目的属性已被变更。",
                code: 404003036,
                message: "该编目的属性已被变更。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("该编目的属性已被变更。")).toBeInTheDocument();
    });

    it("其他错误", () => {
        const outputs = {
            description: "请求因服务器内部错误导致异常",
            errorcode: "ContentAutomation.InternalError.ErrorDepencyService",
            errordetails: {
                cause: "没有权限操作目标对象 (gns://B25E576A7904405D8920CDCD64CA1134/05653A929F874DE38392F99268D29C35)。（错误提供者：EVFS，错误值：16778263，错误位置：ncEVFSCopyManager.cpp:807）",
                code: 503,
                message: "没有权限操作目标位置的对象。",
            },
            solution: "请提交工单或联系技术支持工程师",
        };
        renders(<ErrorOutput error={outputs} />);
        expect(screen.getByText("服务器内部错误。")).toBeInTheDocument();
    });
});
