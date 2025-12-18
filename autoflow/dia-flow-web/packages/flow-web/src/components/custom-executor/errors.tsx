import { MicroAppContext, useTranslate } from "@applet/common";
import { useCallback, useContext } from "react";
import { useNavigate } from "react-router";

let forbiddenModal = false;
let executorNotFoundModal = false;

export function useCustomExecutorErrorHandler() {
    const { modal } = useContext(MicroAppContext);
    const navigate = useNavigate();
    const t = useTranslate("customExecutor");
    return useCallback(async (error) => {
        switch (error?.response?.data?.code) {
            case "ContentAutomation.Forbidden": {
                if (!forbiddenModal) {
                    forbiddenModal = true;
                    await modal.info({
                        title: t("errorTitle", `无法执行此操作`),
                        content: t("forbiddenMessage", `管理员已限制您使用`),
                        transitionName: "",
                        okText: t("ok", "确定"),
                        cancelText: t("cancel", "取消"),
                        onOk() {
                            forbiddenModal = false;
                            navigate("/");
                        },
                        onCancel() {
                            forbiddenModal = false;
                            navigate("/");
                        },
                    });
                }
                return;
            }
            case "ContentAutomation.ExecutorNotFound": {
                if (!executorNotFoundModal) {
                    executorNotFoundModal = true;
                    await modal.info({
                        title: t(`errorTitle`, "无法执行此操作"),
                        content: t(`executorNotFoundMessage`, "此节点已不存在"),
                        transitionName: "",
                        okText: t("ok", "确定"),
                        cancelText: t("cancel", "取消"),
                        onOk() {
                            forbiddenModal = false;
                            navigate("/nav/executors");
                        },
                        onCancel() {
                            forbiddenModal = false;
                            navigate("/nav/executors");
                        },
                    });
                }
                return;
            }
        }
    }, []);
}
