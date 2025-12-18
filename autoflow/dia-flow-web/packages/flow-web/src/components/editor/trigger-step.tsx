import { EditOutlined, PlusCircleFilled, QuestionCircleOutlined } from "@ant-design/icons";
import { FC, useContext, useMemo, useState } from "react";
import { IStep } from "./expr";
import { Form, Input, Modal, Popover, Typography } from "antd";
import styles from "./editor.module.less";
import modalStyles from '../header-bar/styles/task-form-modal.module.less'
import {
    useTranslate,
    stopPropagation,
    NavigationContext,
} from "@applet/common";
import { ExtensionContext, useTranslateExtension, useTrigger } from "../extension-provider";
import { DefaultActionNode } from "./default-action-node";
import clsx from "clsx";
import { EditorContext } from "./editor-context";
import { ErrorPopover } from "./error-popover";
import { FormItem } from "./form-item";
import { isFunction } from "lodash";

export const TriggerStep: FC<{
    step: IStep;
    onChange(step: IStep): void;
}> = ({ step, onChange }) => {
    const { title } = step
    const [form] = Form.useForm();

    const { stepNodes, validateResult, currentTrigger, onConfigTrigger, getPopupContainer } =
        useContext(EditorContext);
    const { isDataStudio, globalConfig } = useContext(ExtensionContext);
    const [action, trigger, extension] = useTrigger(step?.operator);
    const t = useTranslate();
    const te = useTranslateExtension(extension?.name);
    const Node: any = action?.components?.Node || DefaultActionNode;
    const hasError = validateResult.has(step);
    const { getLocale } = useContext(NavigationContext);

    const [visible, setVisible] = useState<boolean>(false)

    const actionName = action
        ? isFunction(action.name)
            ? te(action.name(globalConfig))
            : te(action.name)
        : ''

    // 适配导航栏OEM
    const documents = useMemo(() => {
        return getLocale && getLocale("documents");
    }, [getLocale]);
    const getHeaderName = (name: string) =>
        name === "TDocument"
            ? te("TDocumentCustom", { name: documents })
            : te(name);
    return (
        <>
            <div
                className={clsx(styles.step, {
                    [styles.hasError]: hasError,
                    [styles.focus]: currentTrigger?.id === step.id,
                })}
                onClick={() => onConfigTrigger(step, onChange)}
            >
                <div className={styles.head}>
                    <div className={styles.title}>
                        {step && stepNodes[step.id]
                            ? stepNodes[step.id]!.index + 1
                            : 1}
                        .&nbsp;
                        {
                            isDataStudio
                                ? (
                                    t("datastudio.datasource", "数据源")
                                )
                                : <>
                                    {step?.operator && trigger
                                        ? getHeaderName(trigger.name)
                                        : t("editor.step.triggerEmptyTitle", "选择触发器")}
                                    {step?.operator ? null : (
                                        <Popover
                                            content={() => (
                                                <div
                                                    style={{ width: 200 }}
                                                    onClick={stopPropagation}
                                                >
                                                    <Typography.Text>
                                                        {t(
                                                            "editor.step.triggerTipTitle",
                                                            "什么是触发器？"
                                                        )}
                                                    </Typography.Text>
                                                    <br />
                                                    <Typography.Text>
                                                        {t(
                                                            "editor.step.triggerTip",
                                                            "当设定事件发生时触发任务，比如“每周定时创建文档”，“每周定时”就是触发器"
                                                        )}
                                                    </Typography.Text>
                                                </div>
                                            )}
                                        >
                                            <QuestionCircleOutlined
                                                className={styles.titleTip}
                                            />
                                        </Popover>
                                    )}
                                </>
                        }
                        {
                            action
                                ? (
                                    <span
                                        className={styles['action']}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setVisible(true)
                                        }}
                                    >
                                        <EditOutlined className={styles["action-icon"]} />
                                    </span>
                                )
                                : null
                        }
                    </div>
                </div>
                <div className={clsx(styles.body, !action && styles.empty)}>
                    {action ? (
                        <Node action={{ ...action, title }!} t={te} />
                    ) : (
                        <PlusCircleFilled className={styles.addIcon} />
                    )}
                </div>
                {hasError ? (
                    <ErrorPopover code={validateResult.get(step)!} />
                ) : null}
            </div>
            <div onMouseDown={(e) => e.stopPropagation()}>
                <Modal
                    open={visible}
                    title={
                        <div className={modalStyles["modal-title"]}>
                            {t('action.edit.name', '编辑动作名称')}
                        </div>
                    }
                    className={modalStyles["modal"]}
                    getContainer={getPopupContainer}
                    width={520}
                    onCancel={() => setVisible(false)}
                    onOk={async (e) => {
                        const { title } = await form.validateFields()

                        onChange({
                            ...step,
                            title
                        })

                        setVisible(false)
                    }}
                    centered
                    closable
                    maskClosable={false}
                    transitionName=""
                    destroyOnClose
                >
                    <div className={styles['edit-action']}>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{ title: title || actionName }}
                        >
                            <FormItem
                                required
                                label={t('action.name', '动作名称')}
                                name="title"
                                type="string"
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <Input
                                    autoComplete="off"
                                    maxLength={128}
                                    placeholder={t("form.placeholder")}
                                />
                            </FormItem>
                        </Form>
                    </div>
                </Modal>
            </div>
        </>
    );
};
