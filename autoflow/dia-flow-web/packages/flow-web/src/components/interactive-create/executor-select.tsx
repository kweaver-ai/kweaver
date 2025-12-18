import { Form, Popover, Select, Typography } from "antd";
import {
    useTranslate,
    stopPropagation,
    NavigationContext,
} from "@applet/common";
import styles from "./styles/interactive-select.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useContext, useMemo, useState } from "react";
import { isFunction } from "lodash";
import {
    ExtensionContext,
    useExtensionTranslateFn,
} from "../extension-provider";
import { ExecutorAction } from "../extension";

interface ExecutorSelectProps {
    onChange: (operator: string) => void;
}

export const ExecutorSelect = ({ onChange }: ExecutorSelectProps) => {
    const [form] = Form.useForm();
    const currentMethod = Form.useWatch("executorMethod", form);
    const [actionList, setActionList] = useState<
        Record<string, ExecutorAction[]>
    >({});
    const t = useTranslate();
    const et = useExtensionTranslateFn();
    const { extensions, globalConfig } = useContext(ExtensionContext);
    const { getLocale } = useContext(NavigationContext);
    // 适配导航栏OEM
    const documents = useMemo(() => {
        return getLocale && getLocale("documents");
    }, [getLocale]);

    const executorList: any[] = useMemo(() => {
        let newActionList: Record<string, ExecutorAction[]> = {};
        const allArr = extensions.reduce((pre: any[], item) => {
            const executors = item.executors?.map((executor) => {
                const executorName = isFunction(executor.name)
                    ? executor.name(globalConfig)
                    : executor.name;

                const Icon = (
                    <img
                        className={styles["prefix-icon"]}
                        src={executor.icon}
                        alt=""
                    />
                );
                newActionList[executorName] = executor.actions;

                return {
                    label:
                        executorName === "EDocument"
                            ? et(item.name, "EDocumentCustom", {
                                  name: documents,
                              })
                            : et(item.name, executorName),
                    icon: Icon,
                    value: executorName,
                };
            });
            setActionList(newActionList);
            return [...pre, ...(executors || [])];
        }, []);
        return allArr;
    }, [documents, et, extensions, globalConfig]);

    const executorActions: any[] = useMemo(() => {
        try {
            let actions: Record<string, any[]> = { nogroup: [] };
            actionList[currentMethod]?.forEach((item) => {
                const extensionName = extensions.filter((item) => {
                    const executors = item.executors?.filter((i) => {
                        const executorName = isFunction(i.name)
                            ? i.name(globalConfig)
                            : i.name;
                        return executorName === currentMethod;
                    });
                    if (executors?.length) {
                        return true;
                    }
                    return false;
                })[0].name;
                const Icon = (
                    <img
                        className={styles["prefix-icon"]}
                        src={item.icon}
                        alt=""
                    />
                );
                const actionName = isFunction(item.name)
                    ? item.name(globalConfig)
                    : item.name;
                if (typeof item.group === "string") {
                    if (actions[item.group]) {
                        actions[item.group].push({
                            label: et(extensionName, actionName),
                            icon: Icon,
                            value: item.operator,
                        });
                    } else {
                        actions[item.group] = [
                            {
                                label: et(extensionName, actionName),
                                icon: Icon,
                                value: item.operator,
                            },
                        ];
                    }
                } else {
                    actions["nogroup"] = [
                        ...actions["nogroup"],
                        {
                            label: et(extensionName, actionName),
                            icon: Icon,
                            value: item.operator,
                        },
                    ];
                }
            });
            let actionsArr: any[] = [];
            Object.keys(actions).forEach((key: string) => {
                actionsArr = [...actionsArr, ...actions[key]];
            });
            return actionsArr;
        } catch (error) {
            return [];
        }
    }, [actionList, currentMethod, et, extensions, globalConfig]);

    return (
        <div className={styles["create-item"]}>
            <div className={styles["header"]}>
                <div className={styles["title"]}>
                    {t("interactive.executorHeader", "自动执行指定操作")}
                </div>
                <div className={styles["description"]}>
                    {t(
                        "interactive.executorDescription",
                        "执行操作是指让流程执行什么操作"
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
                        onChange(form.getFieldValue("executorAction"));
                        if (
                            form.getFieldValue("executorMethod") !==
                            currentMethod
                        ) {
                            form.setFieldValue("executorAction", undefined);
                        }
                    }}
                >
                    <Form.Item
                        className={styles["item"]}
                        name={"executorMethod"}
                        label={
                            <div className={styles["item-label"]}>
                                {t(
                                    "interactive.executorListLabel",
                                    "请选择执行流程的方式"
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
                                                    "interactive.executorTipTitle",
                                                    "什么是流程执行的操作？"
                                                )}
                                            </Typography.Text>
                                            <br />
                                            <Typography.Text>
                                                {t(
                                                    "interactive.executorTip",
                                                    "比如“当XXX时，则邮箱自动发送邮件”，“邮箱发送邮件”就是流程执行的操作"
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
                                "interactive.executorListPlaceholder",
                                "请选择流程的执行方式"
                            )}
                        >
                            {executorList?.map((executor) => (
                                <Select.Option
                                    key={executor.value}
                                    value={executor.value}
                                >
                                    {executor.icon}
                                    {executor.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        className={styles["item"]}
                        name={"executorAction"}
                        label={
                            <div className={styles["item-label"]}>
                                {t(
                                    "interactive.executorActionLabel",
                                    "请选择执行流程的动作"
                                )}
                            </div>
                        }
                    >
                        <Select
                            listHeight={230}
                            placeholder={t(
                                "interactive.executorActionPlaceholder",
                                "请选择流程的执行动作"
                            )}
                        >
                            {executorActions?.map((action) => (
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
