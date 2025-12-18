import clsx from "clsx";
import { FlowLinkColored } from "@applet/icons";
import { Button } from "antd";
import { MicroAppContext, useTranslate, API } from "@applet/common";
import styles from "./styles/interactive-create.module.less";
import { TriggerSelect } from "./trigger-select";
import { ExecutorSelect } from "./executor-select";
import { useContext, useState } from "react";
import { useHandleErrReq } from "../../utils/hooks";
import { useNavigate } from "react-router-dom";
import { ServiceConfigContext } from "../config-provider";

export const InteractiveCreate = () => {
    const [trigger, setTrigger] = useState("");
    const [executor, setExecutor] = useState("");
    const { microWidgetProps } = useContext(MicroAppContext);
    const { config, onChangeConfig } = useContext(ServiceConfigContext);
    const handleErr = useHandleErrReq();
    const navigate = useNavigate();
    const t = useTranslate();

    const handleCreate = async () => {
        const template = {
            title: "",
            description: "",
            steps: [
                {
                    id: "0",
                    title: "",
                    operator: trigger,
                    parameters: undefined,
                },
                {
                    id: "1",
                    title: "",
                    operator: executor,
                    parameters: undefined,
                },
            ],
            status: "normal",
        };
        try {
            const data = await API.automation.dagsGet();
            if (data?.data?.total && data?.data?.total >= 50) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title.create", "无法新建自动任务"),
                    message: t(
                        "err.tasksExceeds",
                        "您新建的自动任务数已达上限。（最多允许新建50个）"
                    ),
                    okText: t("ok", "确定"),
                });
                return;
            }
        } catch (error: any) {
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                onChangeConfig({ ...config, isServiceOpen: false });
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title.create", "无法新建自动任务"),
                    message: t("notEnable", "当前工作流未开启，请联系管理员"),
                    okText: t("ok", "确定"),
                });
                return;
            }
            handleErr({ error: error?.response });
            return;
        }
        try {
            const jsonText = JSON.stringify(template);
            const templateId = Math.random().toString(36).slice(2, 7);
            sessionStorage.setItem(`automateTemplate-${templateId}`, jsonText);
            navigate(`/new?model=${templateId}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={styles["interactive"]}>
            <div className={styles["title-group"]}>
                <div className={styles["title-1"]}>
                    {t("interactive.title", "工作流-自动化业务流程处理")}
                </div>
                <div className={styles["title-2"]}>
                    {t(
                        "interactive.subtitle",
                        "通过可视化的方式创建合规的自动化流程"
                    )}
                </div>
            </div>
            <div className={styles["create-group"]}>
                <TriggerSelect onChange={(operator) => setTrigger(operator)} />
                <div className={styles["divider"]}>
                    <div className={styles["flow-icon"]}>
                        <FlowLinkColored />
                    </div>
                </div>
                <ExecutorSelect
                    onChange={(operator) => setExecutor(operator)}
                />
            </div>
            <div className={styles["button-wrapper"]}>
                <Button
                    key="new"
                    size="small"
                    type="primary"
                    className={clsx(
                        styles["button"],
                        "automate-oem-primary-btn"
                    )}
                    onClick={handleCreate}
                >
                    {t("createNew", "立即新建")}
                </Button>
            </div>
        </div>
    );
};
