import { API, AsUserSelect, useTranslate } from "@applet/common";
import { Button, Form, Input, Switch, Tag, Space, FormInstance } from "antd";
import { ExecutorDto } from "../../models/executor-dto";
import styles from "./custom-executor-form.module.less";
import { useState } from "react";
import { useCustomExecutorErrorHandler } from "./errors";

export type ExecutorFormValues = Pick<
    ExecutorDto,
    "name" | "description" | "accessors"
> & { status: boolean };

export interface CustomExecutorFormProps {
    executorId?: string;
    initialValues?: ExecutorFormValues;
    form: FormInstance<ExecutorFormValues>;
    onFinish?(values: ExecutorFormValues): void;
    onCancel?(): void;
}

export function CustomExecutorForm({
    executorId,
    initialValues,
    form,
    onFinish,
    onCancel,
}: CustomExecutorFormProps) {
    const t = useTranslate("customExecutor");

    const [loading, setLoading] = useState(false);
    const status = Form.useWatch("status", form);
    const handleError = useCustomExecutorErrorHandler();

    const submit = async () => {
        try {
            setLoading(true);
            await form.validateFields();
            const values = form.getFieldsValue();
            const { name, description, status, accessors } = values;
            const data = {
                name: name && name.trim(),
                description: description && description.trim(),
                status: status ? 1 : 0,
                accessors,
            };
            await API.axios.put(
                `/api/automation/v1/executors/${executorId}`,
                data
            );
            onFinish?.(values);
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            labelAlign="left"
            autoComplete="off"
            initialValues={initialValues}
            className={styles.Form}
            onFinish={onFinish}
        >
            <Form.Item
                name="name"
                label={t("executorName", "节点名称")}
                requiredMark
                rules={[
                    {
                        required: true,
                        transform: (s) => s?.trim(),
                        message: t("emptyMessage", "此项不允许为空"),
                    },
                    {
                        transform: (s) => s?.trim(),
                        max: 255,
                        message: t(
                            "invalidExecutorName",
                            `名称不能超过255个字符`
                        ),
                    },
                    {
                        validateTrigger: "submit",
                        transform: (s) => s?.trim(),
                        async validator(_, value) {
                            let result = true;
                            if (executorId) {
                                try {
                                    const { data } = await API.axios.put<{
                                        result: boolean;
                                    }>(
                                        `/api/automation/v1/check/executors/${executorId}`,
                                        { name: value }
                                    );
                                    result = data.result;
                                } catch (e) {
                                    handleError(e);
                                }
                            } else {
                                try {
                                    const { data } = await API.axios.post<{
                                        result: boolean;
                                    }>("/api/automation/v1/check/executors", {
                                        name: value,
                                    });
                                    result = data.result;
                                } catch (e) {
                                    handleError(e);
                                }
                            }

                            if (!result) {
                                throw new Error("Name Duplicated");
                            }
                        },
                        message: t("duplicatedName", "您输入的名称已存在"),
                    },
                ]}
            >
                <Input
                    autoComplete="off"
                    placeholder={t("executorNamePlaceholder", "请输入节点名称")}
                />
            </Form.Item>
            <Form.Item
                name="description"
                label={t("executorDescription", "节点描述")}
                rules={[
                    {
                        transform: (s) => s?.trim(),
                        max: 255,
                        message: t(
                            "invalidDescription",
                            `描述不能超过255个字符`
                        ),
                    },
                ]}
            >
                <Input.TextArea
                    rows={5}
                    autoComplete="off"
                    placeholder={t("executorDescriptionPlaceholder", "请输入节点描述")}
                />
            </Form.Item>
            <Form.Item
                name="accessors"
                label={t("executorAccessors", "可用范围")}
            >
                <AsUserSelect>
                    {({ items, removeItem, onAdd }) => {
                        return (
                            <div className={styles.UserSelect}>
                                <header
                                    className={styles.UserSelectDescription}
                                >
                                    {t(
                                        "userSelectDescription",
                                        "允许以下用户在工作流中使用此节点"
                                    )}
                                </header>
                                <div className={styles.UserSelectMain}>
                                    <div className={styles.UserSelectWrapper}>
                                        {!items.length ? (
                                            <span
                                                className={styles.Placeholder}
                                            >
                                                {t(
                                                    "executorAccessorsPlaceholder",
                                                    "请选择"
                                                )}
                                            </span>
                                        ) : null}
                                        {items.map((item) => (
                                            <Tag
                                                key={item.id}
                                                closable
                                                onClose={() => removeItem(item)}
                                            >
                                                {item.name}
                                            </Tag>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={onAdd}
                                        className={styles.UserSelectButton}
                                    >
                                        {t("select", "选择")}
                                    </Button>
                                </div>
                            </div>
                        );
                    }}
                </AsUserSelect>
            </Form.Item>
            <Form.Item label={t("executorStatus", "状态")}>
                <Space>
                    <Form.Item noStyle name="status" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <span
                        className={styles.Status}
                        data-status={status ? "enabled" : "disabled"}
                    >
                        {status
                            ? t("executorStatus.enabled", "启用中")
                            : t("executorStatus.disabled", "已停用")}
                    </span>
                </Space>
            </Form.Item>
            {executorId ? (
                <Form.Item label={<span />} colon={false}>
                    <Space>
                        <Button
                            type="primary"
                            loading={loading}
                            onClick={submit}
                        >
                            {t("ok", "确定")}
                        </Button>
                        <Button onClick={onCancel}>
                            {t("cancel", "取消")}
                        </Button>
                    </Space>
                </Form.Item>
            ) : null}
        </Form>
    );
}
