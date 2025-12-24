import { Select } from "antd";
import { Extension } from "../../components/extension";
import { ApprovalExecutorAction } from "./approval-executor-action";
import AuditSVG from "./assets/audit.svg"
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";

const extension: Extension = {
    name: "workflow",
    types: [
        {
            type: "approval-result",
            name: "types.approval-result",
            components: {
                Input: ({ t, ...props }: any) => {
                    return (
                        <Select {...props}>
                            {["pass", "reject", "undone"].map((result) => (
                                <Select.Option key={result}>
                                    {t(result)}
                                </Select.Option>
                            ))}
                        </Select>
                    );
                },
            },
        },
    ],
    comparators: [
        {
            name: "cmp.eq",
            type: "approval-result",
            operator: "@workflow/cmp/approval-eq",
        },
        {
            name: "cmp.neq",
            type: "approval-result",
            operator: "@workflow/cmp/approval-neq",
        },
    ],
    executors: [
        {
            name: "EApproval",
            description: "EApprovalDescription",
            icon: AuditSVG,
            actions: [ApprovalExecutorAction],
        },
    ],
    translations: {
        enUS,
        zhCN,
        zhTW,
        viVN
    },
};

export default extension;
