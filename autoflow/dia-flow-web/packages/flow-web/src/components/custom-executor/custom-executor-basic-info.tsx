import {
    useIntl,
    FormatDateOptions as IntlFormatDateOptions,
} from "react-intl";
import { ExecutorDto } from "../../models/executor-dto";
import styles from "./custom-executor-basic-info.module.less";
import { useTranslate } from "@applet/common";

const FormatDateOptions: IntlFormatDateOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
};

export interface CustomExecutorBasicInfoProps {
    executor: ExecutorDto;
}

export function CustomExecutorBasicInfo({
    executor,
}: CustomExecutorBasicInfoProps) {
    const t = useTranslate("customExecutor");
    const intl = useIntl();

    return (
        <table className={styles.BasicInfos}>
            <tbody>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorName", "节点名称"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>{executor.name}</td>
                </tr>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorDescription", "节点描述"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>
                        <div className={styles.Description}>
                            {executor.description}
                        </div>
                    </td>
                </tr>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorAccessors", "可见范围"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>
                        {executor.accessors
                            ?.map((a) => a.name)
                            .join(t("separator", "、"))}
                    </td>
                </tr>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorStatus", "状态"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>
                        {executor.status === 0
                            ? t("executorStatus.disabled", "已停用")
                            : t("executorStatus.enabled", "启用中")}
                    </td>
                </tr>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorCreatedAt", "创建时间"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>
                        {executor.created_at
                            ? intl.formatDate(
                                  executor.created_at,
                                  FormatDateOptions
                              )
                            : null}
                    </td>
                </tr>
                <tr>
                    <td className={styles.LabelCol}>
                        {t("colon", "{label}:", {
                            label: t("executorUpdatedAt", "更新时间"),
                        })}
                    </td>
                    <td className={styles.ValueCol}>
                        {executor.updated_at
                            ? intl.formatDate(
                                  executor.updated_at,
                                  FormatDateOptions
                              )
                            : null}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}
