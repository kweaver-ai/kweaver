import { formatSize } from "@applet/common";
import { Typography } from "antd";
import { isArray } from "lodash";
import moment from "moment";
import { ExecutorActionOutputProps, Output } from "../extension";
import styles from "./log-card.module.less";

export const formatTime = (timestamp?: number | string, format = "YYYY/MM/DD HH:mm") => {
    if (!timestamp) {
        return "";
    }
    return moment(typeof timestamp === 'string' ? timestamp : timestamp / 1000).format(format);
};

export const DefaultFormattedOutput = ({
    t,
    outputData,
    outputs,
}: ExecutorActionOutputProps) => (
    <table>
        <tbody>
            {outputs &&
                isArray(outputs) &&
                outputs.map((item: Output) => {
                    let label = item?.name ? t(item.name) : "";
                    const key = item.key.replace(".", "");
                    if (key === "docid" || key === "id" || key === "new_id") {
                        // 文件gns
                        if (item?.name !== 'FileOutputGns') {
                            label = label + t("id", "ID");
                        }
                    }
                    let value =
                        typeof outputData[key] === "string"
                            ? outputData[key]
                            : JSON.stringify(outputData[key]);
                    if (key === "create_time" || key === "modify_time") {
                        value = formatTime(value);
                    }
                    if (key === "size") {
                        value = formatSize(value, 2);
                    }
                    if (label) {
                        return (
                            <tr>
                                <td className={styles.label}>
                                    <Typography.Paragraph
                                        ellipsis={{
                                            rows: 2,
                                        }}
                                        className="applet-table-label"
                                        title={label}
                                    >
                                        {label}
                                    </Typography.Paragraph>
                                    {t("colon", "：")}
                                </td>
                                <td>{value}</td>
                            </tr>
                        );
                    }
                    return null;
                })}
        </tbody>
    </table>
);
