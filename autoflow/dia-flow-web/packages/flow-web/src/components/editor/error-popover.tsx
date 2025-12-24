import { ExclamationCircleFilled } from "@ant-design/icons";
import { stopPropagation, useTranslate } from "@applet/common";
import { Popover } from "antd";
import { FC } from "react";
import styles from "./editor.module.less";
import { StepErrCode } from "./expr";

export const ErrorPopover: FC<{
    code: StepErrCode;
}> = ({ code }) => {
    const t = useTranslate();
    return (
        <div className={styles.stepErrorIcon} onClick={stopPropagation}>
            <Popover
                content={() => {
                    switch (code) {
                        case "INVALID_OPERATOR":
                            return t(
                                "editor.validateStep.invalidOperator",
                                "该操作未设置完成"
                            );
                        case "INVALID_PARAMETERS":
                            return t(
                                "editor.validateStep.invalidParameters",
                                "节点参数错误"
                            );
                        default:
                            return null;
                    }
                }}
                placement="topLeft"
                showArrow={false}
            >
                <ExclamationCircleFilled data-testid="error-popover-icon" />
            </Popover>
        </div>
    );
};
