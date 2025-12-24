import {
    CloseOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    PlusCircleFilled,
    QuestionCircleOutlined,
} from "@ant-design/icons";
import { FC, useContext, useMemo, useState } from "react";
import { IStep } from "./expr";
import { Button, Form, Input, message, Modal, Popconfirm, Popover, Typography } from "antd";
import styles from "./editor.module.less";
import { EditorContext } from "./editor-context";
import { ExtensionContext, useExecutor, useTranslateExtension } from "../extension-provider";
import {
    MicroAppContext,
    NavigationContext,
    stopPropagation,
    useTranslate,
} from "@applet/common";
import clsx from "clsx";
import { DefaultActionNode } from "./default-action-node";
import { ErrorPopover } from "./error-popover";
import { isFunction } from "lodash";
import { FormItem } from "./form-item";
import modalStyles from '../header-bar/styles/task-form-modal.module.less'
import { CopyOutlined } from "@applet/icons";
import PlusCircleSVG from "../../assets/plusCircle.svg";

export const AtomStep: FC<{
    step: IStep;
    onChange(step: IStep): void;
    onRemove(): void;
}> = ({ step, onRemove, onChange }) => {
    const { title } = step
    const [form] = Form.useForm();

    const { stepNodes, validateResult, currentStep, onConfigStep, getPopupContainer, onConfigStepToCopy } =
        useContext(EditorContext);
    const { platform, microWidgetProps } = useContext(MicroAppContext);
    const { globalConfig } = useContext(ExtensionContext);

    const [action, executor, extension] = useExecutor(step.operator);
    const t = useTranslate();
    const te = useTranslateExtension(extension?.name);
    const Node: any = action?.components?.Node || DefaultActionNode;
    const hasError = validateResult.has(step);
    const [removePopconfirmOpen, setRemovePopconfirmOpen] = useState(false);
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
        name === "EDocument"
            ? te("EDocumentCustom", { name: documents })
            : te(name);

    return (
        <>
            <Popconfirm
                open={removePopconfirmOpen}
                placement="rightTop"
                title={t("editor.step.removeConfirmTitle", "确定删除此操作吗？")}
                showArrow
                transitionName=""
                okText={t("ok")}
                cancelText={t("cancel")}
                onConfirm={onRemove}
                onOpenChange={setRemovePopconfirmOpen}
                overlayClassName={clsx(
                    styles["delete-popover"],
                    "automate-oem-primary"
                )}
                icon={<ExclamationCircleOutlined className={styles["warn-icon"]} />}
            >
                <>
                    <div
                        className={clsx(styles.step, {
                            [styles.hasError]: hasError,
                            [styles.removePopconfirmOpen]: removePopconfirmOpen,
                            [styles.focus]: currentStep?.id === step.id,
                        })}
                        onClick={(e) => {
                            onConfigStep(step, onChange);
                            e.stopPropagation();
                        }}
                    >
                        <div className={styles.head}>
                            <div className={styles.title}>
                                {stepNodes[Number(step.id)]!.index + 1}.&nbsp;
                                {step.operator && executor
                                    ? getHeaderName(executor.name)
                                    : t(
                                        "editor.step.executorEmptyTitle",
                                        "选择执行操作"
                                    )}
                                {step.operator || platform === "console" ? null : (
                                    <Popover
                                        content={() => (
                                            <div
                                                style={{ width: 200 }}
                                                onClick={stopPropagation}
                                            >
                                                <Typography.Text>
                                                    {t(
                                                        "editor.step.executorTipTitle",
                                                        "什么是执行操作？"
                                                    )}
                                                </Typography.Text>
                                                <br />
                                                <Typography.Text>
                                                    {t(
                                                        "editor.step.executorTip",
                                                        "当设定事件发生后执行具体操作，比如“每周定时创建文档”，“创建文档”就是执行的具体操作"
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
                                {
                                    action
                                        ? (
                                            <>
                                                <span
                                                    className={styles['action']}
                                                    onClick={(e) => {
                                                        e.stopPropagation()

                                                        onConfigStepToCopy({ ...step, title: title || actionName })

                                                        if (platform === "console") {
                                                            message.success(
                                                                <span>
                                                                    <span>
                                                                        {t('action.copied1', ' 节点已复制，您可以点击')}
                                                                    </span>
                                                                    <img
                                                                        src={PlusCircleSVG}
                                                                        style={{ verticalAlign: '-3px', margin: '0 4px' }}
                                                                        alt=""
                                                                    ></img>
                                                                    <span>
                                                                        {t('action.copied2', ' 粘贴')}
                                                                    </span>
                                                                </span>
                                                            )
                                                        } else {
                                                            message.success(
                                                                <span>
                                                                    <span>
                                                                        {t('action.copied1', ' 节点已复制，您可以点击')}
                                                                    </span>
                                                                    <img
                                                                        src={PlusCircleSVG}
                                                                        style={{ verticalAlign: '-3px', margin: '0 4px' }}
                                                                        alt=""
                                                                    ></img>
                                                                    <span>
                                                                        {t('action.copied2', ' 粘贴')}
                                                                    </span>
                                                                </span>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <CopyOutlined />
                                                </span>
                                                <span
                                                    className={styles['action']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setVisible(true)
                                                    }}
                                                >
                                                    <EditOutlined className={styles["edit-icon"]} />
                                                </span>
                                            </>
                                        )
                                        : null
                                }
                            </div>
                            <div
                                onClick={stopPropagation}
                                onMouseDown={stopPropagation}
                            >
                                <Button
                                    type="text"
                                    className={styles.removeButton}
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        step.operator
                                            ? setRemovePopconfirmOpen(true)
                                            : onRemove();
                                    }}
                                />
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
                </>
            </Popconfirm >
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
                    onOk={async () => {
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
