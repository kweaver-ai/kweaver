import React, { useContext, useEffect, useState } from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import empty from "../../assets/empty.png";
import styles from "./disable-tip.module.less";
import { isFunction } from "lodash";
import { Badge, Space } from "antd";
import useSWR from "swr";
import AuditSVG from "../../assets/audit.svg";
import FlowsSVG from "../../assets/workflows.svg";

export const DisableTip = () => {
    const t = useTranslate();
    const [hasAudit, setHasAudit] = useState(false);
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);

    const navigateToMicro = (command: string) => {
        microWidgetProps?.history?.navigateToMicroWidget({
            command,
            isNewTab: true,
            isClose: false,
        });
    };

    const { data: count = { docAuditClient: 0 } } = useSWR(
        ["getCount", hasAudit],
        async () => {
            if (hasAudit) {
                try {
                    const {
                        data: { count = 0 },
                    } = await API.axios.get(
                        `${prefixUrl}/api/doc-audit-rest/v1/doc-audit/tasks/count`
                    );
                    return { docAuditClient: count };
                } catch (error) {
                    return { docAuditClient: 0 };
                }
            }
        },
        {
            revalidateOnFocus: hasAudit,
        }
    );

    useEffect(() => {
        const getApps = async () => {
            if (isFunction(microWidgetProps?.config?.getMicroWidgetByCommand)) {
                const docAuditApp = (
                    microWidgetProps?.config?.getMicroWidgetByCommand as any
                )({
                    command: "docAuditClient",
                });
                if (docAuditApp) {
                    setHasAudit(true);
                }
            }
        };
        getApps();
    }, []);

    return (
        <div className={styles["not-enable"]}>
            {hasAudit && (
                <div className={styles["container"]}>
                    <Space size={16}>
                        <Badge
                            count={count.docAuditClient}
                            overflowCount={99}
                            size="small"
                            color="#FF4D4F"
                            className={styles["extra-btn-badge"]}
                        >
                            <div
                                className={styles["card"]}
                                onClick={() =>
                                    navigateToMicro("docAuditClient")
                                }
                            >
                                <img src={AuditSVG} alt="" />
                                <span>{t("nav.docAudit", "审核待办")}</span>
                            </div>
                        </Badge>
                        <div
                            className={styles["card"]}
                            onClick={() =>
                                navigateToMicro("workflowManageClient")
                            }
                        >
                            <img src={FlowsSVG} alt="" />
                            <span> {t("nav.workflowClient", "审核模板")}</span>
                        </div>
                    </Space>
                </div>
            )}
            {!hasAudit && (
                <>
                    <div className={styles["img-wrapper"]}>
                        <img
                            className={styles["img"]}
                            src={empty}
                            alt="empty"
                        />
                    </div>
                    <div className={styles["tip"]}>
                        {t("noContent", "暂无内容")}
                    </div>
                </>
            )}
        </div>
    );
};
