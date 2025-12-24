import { FC, useContext } from "react";
import moment from "moment";
import { Button } from "antd";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";
import { useNavigate, useParams } from "react-router";
import { DagDetail } from "@applet/api/lib/content-automation";
import { MicroAppContext, useTranslate } from "@applet/common";
import { FormOutlined } from "@applet/icons";
import styles from "./task-info.module.less";

interface TaskInfoProps {
    taskInfo?: DagDetail
}

export const TaskInfo: FC<TaskInfoProps> = ({ taskInfo }: TaskInfoProps) => {
    const t = useTranslate();
    const navigate = useNavigate();
    const { id = "" } = useParams<{ id: string }>();
    const [params] = useSearchParams();
    const from = params.get("back") || "";
    const { microWidgetProps } = useContext(MicroAppContext);
    const lang = microWidgetProps?.language?.getLanguage;

    const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
        if (!timestamp) {
            return "";
        }
        return moment(timestamp * 1000).format(format);
    };

    return (
        <div className={styles["details-container"]}>
            <div className={styles["table-wrapper"]}>
                <table style={{ width: "100%", tableLayout: "fixed" }}>
                    <thead>
                        <tr>
                            <th
                                className={clsx(styles["title"], {
                                    [styles["title-en"]]: lang === "en-us",
                                })}
                            >
                                {t("title.detail", "详细信息")}
                            </th>
                            <th className={styles["content"]}></th>
                            <th rowSpan={5} className={styles["btn-wrapper"]}>
                                <Button
                                    icon={
                                        <FormOutlined
                                            style={{ fontSize: "13px" }}
                                        />
                                    }
                                    type="link"
                                    onClick={() =>
                                        navigate(
                                            `/edit/${id}?back=${[
                                                "details",
                                                ...from.split(","),
                                            ].join(",")}`
                                        )
                                    }
                                    hidden={microWidgetProps?.selectoperator?.dag_id}
                                >
                                    {t("task.edit", "编辑任务")}
                                </Button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td
                                className={clsx(styles["label"], {
                                    [styles["label-en"]]: lang === "en-us",
                                })}
                            >
                                {t("taskInfo.name", "任务名称：")}
                            </td>
                            <td className={styles["content"]}>
                                <div
                                    className={styles["name"]}
                                    title={taskInfo?.title}
                                >
                                    {taskInfo?.title || "---"}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td
                                className={clsx(styles["label"], {
                                    [styles["label-en"]]: lang === "en-us",
                                })}
                            >
                                {t("taskInfo.detail", "任务描述：")}
                            </td>
                            <td className={styles["content"]}>
                                <div
                                    className={styles["detail"]}
                                    title={taskInfo?.description}
                                >
                                    {taskInfo?.description || "---"}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td
                                className={clsx(styles["label"], {
                                    [styles["label-en"]]: lang === "en-us",
                                })}
                            >
                                {t("taskInfo.status", "任务状态：")}
                            </td>
                            <td className={styles["content"]}>
                                <span
                                    title={
                                        taskInfo?.status
                                            ? t(
                                                  `task.status.${taskInfo?.status}`,
                                                  "---"
                                              )
                                            : "---"
                                    }
                                >
                                    {taskInfo?.status
                                        ? t(
                                              `task.status.${taskInfo?.status}`,
                                              "---"
                                          )
                                        : "---"}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td
                                className={clsx(styles["label"], {
                                    [styles["label-en"]]: lang === "en-us",
                                })}
                            >
                                {t("taskInfo.created_at", "创建时间：")}
                            </td>
                            <td className={styles["content"]}>
                                <span title={formatTime(taskInfo?.created_at)}>
                                    {formatTime(taskInfo?.created_at) || "---"}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td
                                className={clsx(styles["label"], {
                                    [styles["label-en"]]: lang === "en-us",
                                })}
                            >
                                {t("taskInfo.updated_at", "更新时间：")}
                            </td>
                            <td className={styles["content"]}>
                                <span title={formatTime(taskInfo?.updated_at)}>
                                    {formatTime(taskInfo?.updated_at) || "---"}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
