import { Typography } from "antd";
import { useContext } from "react";
import clsx from "clsx";
import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles/params-form.module.less";

interface IDocItem {
    name: string;
    size: number;
    code?: number | string;
    cause?: string;
}

export function useSourceIsNotAllowed() {
    const { modal } = useContext(MicroAppContext);
    const { microWidgetProps } = useContext(MicroAppContext);
    const t = useTranslate();
    const isInElectron =
        microWidgetProps?.config.systemInfo.platform === "electron";

    // 跳转审核
    const navigateToMicro = (command: string, path?: string) => {
        microWidgetProps?.history?.navigateToMicroWidget({
            command,
            path,
            isNewTab: true,
            isClose: true,
        });
    };

    const getErrorDetail = (doc: IDocItem) => {
        switch (doc.code) {
            case 400055026:
                return t("err.perm.upload", "此文档正在上传处理中...");
            case 404002006:
                return t("err.404002006", "当前文档已不存在或其路径发生变更。");
            case "ContentAutomation.InvalidParameter":
                return t(
                    "err.perm.reSubmit",
                    "管理员已变更申请流程，请重新提交申请。"
                );
            case 400055025:
                return t("err.perm.apply", "此文档权限你已申请。");
            default:
                return doc?.cause;
        }
    };

    return function modalInfo(docs: IDocItem[] = [], onClose?: () => void) {
        let allSameFlag = false;
        let message = <div>{docs[0]?.cause}</div>;

        if (docs[0].code === "ContentAutomation.InvalidParameter") {
            allSameFlag = true;
            message = (
                <div>
                    {t(
                        "err.perm.reSubmit",
                        "管理员已变更申请流程，请重新提交申请。"
                    )}
                </div>
            );
        }
        if (!allSameFlag && docs?.length > 1) {
            // 列出所有原因
            modal.info({
                title: t("err.perm.notAllowed", "以下文件无法进行权限申请"),
                closable: false,
                centered: true,
                transitionName: "",
                width: 440,
                okText: t("ok", "确定"),
                onOk: () => {
                    onClose && onClose();
                },
                okButtonProps: {
                    className: "automate-oem-primary-btn",
                },
                className: styles["not-allowed-modal"],
                wrapClassName: clsx({
                    "adapt-to-electron": isInElectron,
                }),
                maskStyle: isInElectron ? { top: "52px" } : undefined,
                content: (
                    <div className={styles["not-allowed-content"]}>
                        {docs.map((item: any) => (
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
                                            title={item.name}
                                            className={
                                                styles["not-allowed-item-name"]
                                            }
                                        >
                                            {item.name}
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
                                            title={getErrorDetail(item)}
                                            className={
                                                styles[
                                                    "not-allowed-item-reason"
                                                ]
                                            }
                                        >
                                            {getErrorDetail(item)}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </>
                        ))}
                    </div>
                ),
            });
        } else {
            if (docs[0].code === 400055025) {
                message = (
                    <div>
                        <span>
                            {t(
                                "err.perm.link.go",
                                "此文档权限你已申请，可前往"
                            )}
                            <span
                                className={styles["link"]}
                                onClick={() =>
                                    navigateToMicro(
                                        "docAuditClient",
                                        "?target=apply"
                                    )
                                }
                            >
                                {t("link.apply", "【我的申请】")}
                            </span>
                            {t("perm.link.view", "查看进度")}
                        </span>
                    </div>
                );
            } else {
                message = <div>{getErrorDetail(docs[0])}</div>;
            }

            modal.info({
                title: t("err.operation.title", "无法执行此操作"),
                closable: false,
                centered: true,
                transitionName: "",
                width: 440,
                okText: t("ok", "确定"),
                onOk: () => {
                    onClose && onClose();
                },
                okButtonProps: {
                    className: "automate-oem-primary-btn",
                },
                className: styles["not-allowed-modal"],
                wrapClassName: clsx({
                    "adapt-to-electron": isInElectron,
                }),
                maskStyle: isInElectron ? { top: "52px" } : undefined,
                content: message,
            });
        }
    };
}
