import { Typography } from "antd";
import { ExecutorActionDto } from "../../models/executor-action-dto";
import { ExecutorActionInputProps } from "../extension";
import styles from "./custom-executor-input.module.less";
import { useTranslate } from "@applet/common";

export function customExecutorInput(action: ExecutorActionDto) {
    return ({ input }: ExecutorActionInputProps) => {
        const t = useTranslate();
        if (!action.inputs?.length) {
            return null;
        }

        return (
            <table>
                <tbody>
                    {action.inputs.map((actionInput) => {
                        return (
                            <tr>
                                <td className={styles.label}>
                                    <Typography.Paragraph
                                        ellipsis={{
                                            rows: 2,
                                        }}
                                        className="applet-table-label"
                                        title={actionInput.name}
                                    >
                                        {actionInput.name}
                                    </Typography.Paragraph>
                                    {t("colon", "：")}
                                </td>
                                <td>{String(input?.[actionInput.key] || "")}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };
}
