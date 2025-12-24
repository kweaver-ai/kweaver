import { Form, Popover, Select, Typography } from "antd";
import { useTranslate, stopPropagation } from "@applet/common";
import styles from "./styles/interactive-select.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
    AutomationFileTriggerColored,
    AutomationFormTriggerColored,
    AutomationManualColored,
    TriggerClockColored,
    TriggerEventColored,
    TriggerManualColored,
} from "@applet/icons";
import { useCallback, useContext, useMemo } from "react";
import { isFunction } from "lodash";
import {
    ExtensionContext,
    useExtensionTranslateFn,
} from "../extension-provider";

interface TriggerSelectProps {
    onChange: (operator: string) => void;
}

export const TriggerSelect = ({ onChange }: TriggerSelectProps) => {
    const [form] = Form.useForm();
    const currentMethod = Form.useWatch("triggerMethod", form);
    const t = useTranslate();
    const et = useExtensionTranslateFn();
    const { triggers, globalConfig } = useContext(ExtensionContext);

    const triggerList: any[] = useMemo(
        () => [
            {
                label: t("create.event", "事件触发"),
                icon: <TriggerEventColored className={styles["prefix-icon"]} />,
                value: "event",
            },
            {
                label: t("create.clock", "定时触发"),
                icon: <TriggerClockColored className={styles["prefix-icon"]} />,
                value: "cron",
            },
            {
                label: t("create.manual", "手动触发"),
                icon: (
                    <TriggerManualColored className={styles["prefix-icon"]} />
                ),
                value: "manual",
            },
        ],
        [t]
    );

    const getTriggerActions = useCallback(
        (reg: RegExp): any[] => {
            return Object.keys(triggers)
                .filter((operator) => reg.test(operator))
                .map((operator) => {
                    const arr = triggers[operator];
                    const SVGIcon = (
                        <img
                            className={styles["prefix-icon"]}
                            src={arr[0].icon}
                            alt={arr[0].operator}
                        />
                    );
                    return {
                        label: et(
                            arr[arr.length - 1].name,
                            isFunction(arr[0].name)
                                ? arr[0].name(globalConfig)
                                : arr[0].name
                        ),
                        icon: SVGIcon,
                        value: arr[0].operator,
                    };
                });
        },
        [et, triggers, globalConfig]
    );

    const triggerActions: any[] = useMemo(() => {
        switch (currentMethod) {
            case "event":
                return getTriggerActions(/@anyshare-trigger/);
            case "manual":
                return [
                    {
                        label: t("create.manual", "手动触发"),
                        icon: (
                            <AutomationManualColored
                                className={styles["prefix-icon"]}
                            />
                        ),
                        value: "@trigger/manual",
                    },
                    {
                        label: t("create.form", "表单触发"),
                        icon: (
                            <AutomationFormTriggerColored
                                className={styles["prefix-icon"]}
                            />
                        ),
                        value: "@trigger/form",
                    },
                    {
                        label: et("internal", "TAFile"),
                        icon: (
                            <AutomationFileTriggerColored
                                className={styles["prefix-icon"]}
                            />
                        ),
                        value: "@trigger/selected-file",
                    },
                ];
            case "cron":
                return getTriggerActions(/@trigger\/cron/);
            default:
                return [];
        }
    }, [currentMethod, et, getTriggerActions, t]);

    return (
        <div className={styles["create-item"]}>
            <div className={styles["header"]}>
                <div className={styles["title"]}>
                    {t("interactive.triggerHeader", "当触发事件发生时")}
                </div>
                <div className={styles["description"]}>
                    {t(
                        "interactive.triggerDescription",
                        "触发事件是指什么情况下触发流程"
                    )}
                </div>
            </div>
            <div className={styles["content"]}>
                <Form
                    form={form}
                    layout="vertical"
                    className={styles["form"]}
                    labelAlign="left"
                    autoComplete="off"
                    colon={false}
                    requiredMark={false}
                    onFieldsChange={() => {
                        onChange(form.getFieldValue("triggerAction"));
                        if (
                            form.getFieldValue("triggerMethod") !==
                            currentMethod
                        ) {
                            form.setFieldValue("triggerAction", undefined);
                        }
                    }}
                >
                    <Form.Item
                        className={styles["item"]}
                        name={"triggerMethod"}
                        label={
                            <div className={styles["item-label"]}>
                                {t(
                                    "interactive.triggerListLabel",
                                    "请选择触发流程的方式"
                                )}
                                <Popover
                                    showArrow={false}
                                    placement="bottomLeft"
                                    content={() => (
                                        <div
                                            style={{
                                                width: 300,
                                                marginLeft: "8px",
                                            }}
                                            onClick={stopPropagation}
                                        >
                                            <Typography.Text>
                                                {t(
                                                    "interactive.triggerTipTitle",
                                                    "什么是触发流程的方式？"
                                                )}
                                            </Typography.Text>
                                            <br />
                                            <Typography.Text>
                                                {t(
                                                    "interactive.triggerTip",
                                                    "比如“当文件上传至指定文件夹时，则…”，“当文件上传”就是触发流程的方式"
                                                )}
                                            </Typography.Text>
                                        </div>
                                    )}
                                >
                                    <QuestionCircleOutlined
                                        className={styles.titleTip}
                                    />
                                </Popover>
                            </div>
                        }
                    >
                        <Select
                            listHeight={230}
                            placeholder={t(
                                "interactive.triggerListPlaceholder",
                                "请选择流程的触发方式"
                            )}
                        >
                            {triggerList?.map((trigger) => (
                                <Select.Option
                                    key={trigger.value}
                                    value={trigger.value}
                                >
                                    {trigger.icon}
                                    {trigger.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        className={styles["item"]}
                        name={"triggerAction"}
                        label={
                            <div className={styles["item-label"]}>
                                {t(
                                    "interactive.triggerActionLabel",
                                    "请选择触发流程的动作"
                                )}
                            </div>
                        }
                    >
                        <Select
                            listHeight={230}
                            listItemHeight={32}
                            placeholder={t(
                                "interactive.triggerActionPlaceholder",
                                "请选择流程的触发动作"
                            )}
                        >
                            {triggerActions?.map((action) => (
                                <Select.Option
                                    key={action.value}
                                    value={action.value}
                                >
                                    {action.icon}
                                    {action.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};
