import { Tooltip } from "antd";
import { isFunction } from "lodash";
import { useCallback, useContext } from "react";
import clsx from "clsx";
import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles.module.less";

export function useInfoModal() {
    const { modal, microWidgetProps } = useContext(MicroAppContext);
    const t = useTranslate();
    const isInElectron =
        microWidgetProps?.config.systemInfo.platform === "electron";

    return useCallback((type = "perm", onOk?: () => void) => {
        modal.info({
            title: t("err.operation.title", "无法执行此操作"),
            content: (
                <>
                    <div className={styles["content"]}>
                        {type === "perm"
                            ? t("err.403001203", "您对当前文档没有相应的权限。")
                            : t("err.readPolicy.info", "当前文档受策略管控。")}
                    </div>
                    <div className={styles["extra"]}>
                        <Tooltip
                            overlayClassName={styles["tooltip"]}
                            trigger="click"
                            placement="bottomLeft"
                            title={
                                <span className={styles["describe"]}>
                                    {type === "perm"
                                        ? t("err.403001203.describe")
                                        : t("err.readPolicy.describe")}
                                </span>
                            }
                        >
                            {type === "perm"
                                ? t("err.403001203.extra", "为什么我无法操作？")
                                : t(
                                      "err.readPolicy.extra",
                                      "为什么会受策略管控？"
                                  )}
                        </Tooltip>
                    </div>
                </>
            ),
            className: styles["modal"],
            width: 420,
            maskClosable: false,
            okText: t("ok") + " ",
            okButtonProps: {
                className: "automate-oem-primary-btn",
            },
            onOk: () => {
                if (isFunction(onOk)) {
                    onOk();
                }
            },
            centered: true,
            transitionName: "",
            wrapClassName: clsx({
                "adapt-to-electron": isInElectron,
            }),
            maskStyle: isInElectron ? { top: "52px" } : undefined,
        });
    }, []);
}
