import { API, MicroAppContext, useTranslate } from "@applet/common";
import useSize from "@react-hook/size";
import { useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Card as AntCard, Typography } from "antd";
import styles from "./styles/category-card.module.less";
import { getContent } from "../task-card";
import { ITemplate } from "../../extensions/templates";
import {
    ExtensionContext,
    useExtensionTranslateFn,
} from "../extension-provider";
import { DoubleRightOutlined } from "@ant-design/icons";
import { useHandleErrReq } from "../../utils/hooks";
import { ServiceConfigContext } from "../config-provider";
import { isFunction } from "lodash";

interface CategoryCardProps {
    template: ITemplate;
}

export const CategoryCard = ({ template }: CategoryCardProps) => {
    const navigate = useNavigate();
    const t = useTranslate();
    const container = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const [width] = useSize(container);
    const { triggers, executors, globalConfig } = useContext(ExtensionContext);
    const { microWidgetProps } = useContext(MicroAppContext);
    const { config, onChangeConfig } = useContext(ServiceConfigContext);
    const handleErr = useHandleErrReq();
    const et = useExtensionTranslateFn();

    const getBoxText = (template: ITemplate) => {
        const text = template.actions
            .map((operator) => {
                switch (true) {
                    // 定时任务
                    case operator.indexOf("@trigger/cron") > -1:
                        return t("create.clock", "定时触发");
                    // 文件、文件夹
                    case operator.indexOf("@anyshare-trigger/") > -1:
                        return t("card.event", "事件触发");
                    // 分支
                    case operator.indexOf("branches") > -1:
                        return t("card.branches", "分支");
                    default:
                        if (triggers[operator]) {
                            return et(
                                triggers[operator][
                                    triggers[operator].length - 1
                                ].name,
                                isFunction(triggers[operator][0].name)
                                    ? (triggers[operator][0].name as any)(
                                          globalConfig
                                      )
                                    : triggers[operator][0].name,
                                ""
                            );
                        }
                        if (executors[operator]) {
                            return et(
                                executors[operator][
                                    executors[operator].length - 1
                                ].name,
                                isFunction(executors[operator][0].name)
                                    ? (executors[operator][0].name as any)(
                                          globalConfig
                                      )
                                    : executors[operator][0].name,
                                ""
                            );
                        }
                        return "";
                }
            })
            .filter(Boolean);

        return text.join(" + ");
    };

    const handleClick = async () => {
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
        const path = location.pathname;
        if (path === "/") {
            navigate(`/new?template=${template?.templateId}`);
        } else {
            navigate(
                `/new?template=${template?.templateId}&back=${btoa(path)}`
            );
        }
    };

    return (
        <AntCard className={styles["card"]} onClick={() => handleClick()}>
            <div className={styles["card-content"]} ref={container}>
                {getContent(template.actions, width)}
            </div>
            <div className={styles["card-description"]}>
                <div>
                    <Typography.Text
                        ellipsis
                        className={styles["title"]}
                        title={template.title}
                    >
                        {template.title}
                    </Typography.Text>
                </div>
                <div>
                    <Typography.Text
                        ellipsis
                        className={styles["description"]}
                        title={template.description}
                    >
                        {template.description}
                    </Typography.Text>
                </div>
            </div>
            <div className={styles["card-footer"]}>
                <div className={styles["content-text"]}>
                    <Typography.Text
                        ellipsis
                        className={styles["description"]}
                        title={getBoxText(template)}
                    >
                        {getBoxText(template)}
                    </Typography.Text>
                </div>

                <div className={styles["arrow"]}>
                    <DoubleRightOutlined />
                </div>
            </div>
        </AntCard>
    );
};
