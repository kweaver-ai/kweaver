import { Typography } from "antd";
import { useContext } from "react";
import { useInfoModal } from "./use-info-modal";
import { find } from "lodash";
import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles.module.less";

export interface Item {
    id: string;
    name: string;
    size: number;
    [key: string]: any;
}

interface IError {
    cause: string;
    code: number;
    message: string;
}

interface OpenDocDownloadItem {
    status: "completed" | "failure";
    error?: IError;
    id: string;
    name: string;
}

const getName = (id: string, items: Item[]) => {
    return find(
        items.map((item) => ({ ...item, id: item.id.slice(-32) })),
        ["id", id]
    )?.name;
};

export function useDownloadInfo() {
    const { microWidgetProps, modal } = useContext(MicroAppContext);
    const infoModal = useInfoModal();
    const t = useTranslate();

    const getErrorDetail = (error: any) => {
        const { code = 0 } = error;
        switch (code) {
            // 文档不存在
            case 404002005:
                return t("err.404002005", "顶级文档库不存在。");
            case 404002006:
                return t(
                    "err.404002006.download",
                    "文件不存在, 可能其所在路径发生变更。"
                );
            case 403001002:
                return t("err.403001002.download", "您对该文件没有下载权限。");
            case 403001203:
                return t("err.readPolicy.info", "当前文档受策略管控。");
            case 403002065:
                return t("err.403002065.download", "您的密级不足");
            case 403002153:
                return t("err.403002153.download", "您今日下载次数已达上限。");
            case 404002017:
                return t("err.404002017.download", "目标站点已经离线。");
            case 500000000:
                return t("err.500000000", "服务异常");
            default:
                return t("err.unknown", "未知错误");
        }
    };

    return function modalInfo(docs: OpenDocDownloadItem[], items: Item[]) {
        const errDocs = docs.filter((item) => item.status === "failure");
        const errors = errDocs.map((item) => item?.error).filter(Boolean);

        const code = errors?.length
            ? errors.reduce(
                  (pre: number, item) => (item?.code === pre ? pre : 0),
                  errors[0]!.code
              )
            : "";
        // 错误原因全部相同只提示一次
        if (code) {
            if (code === 403001203) {
                infoModal("policy");
                return;
            }
            microWidgetProps?.components?.messageBox({
                type: "info",
                title: t("taskFiles.downloadErrorTitle", "无法执行下载操作"),
                message: getErrorDetail(errors[0]),
                okText: t("ok"),
            });
        } else {
            // 列出所有原因
            modal.info({
                title: t("taskFiles.downloadErrorTitle", "无法执行下载操作"),
                closable: false,
                centered: true,
                transitionName: "",
                width: 440,
                okText: t("ok", "确定"),
                okButtonProps: {
                    className: "automate-oem-primary-btn",
                },
                className: styles["not-allowed-modal"],
                content: (
                    <div className={styles["not-allowed-content"]}>
                        {errDocs.map((item: OpenDocDownloadItem) => (
                            <>
                                <div className={styles["not-allowed-item"]}>
                                    <div
                                        className={
                                            styles[
                                                "not-allowed-item-name-wrapper"
                                            ]
                                        }
                                    >
                                        <Typography.Text
                                            ellipsis
                                            title={
                                                item.name ||
                                                getName(item.id, items)
                                            }
                                            className={
                                                styles["not-allowed-item-name"]
                                            }
                                        >
                                            {item.name ||
                                                getName(item.id, items)}
                                        </Typography.Text>
                                        <span
                                            className={
                                                styles["not-allowed-item-name"]
                                            }
                                        >
                                            {t("colon", "：")}
                                        </span>
                                    </div>
                                    <div>
                                        <Typography.Text
                                            ellipsis
                                            title={getErrorDetail(item.error)}
                                            className={
                                                styles[
                                                    "not-allowed-item-reason"
                                                ]
                                            }
                                        >
                                            {getErrorDetail(item.error)}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </>
                        ))}
                    </div>
                ),
            });
        }
    };
}
