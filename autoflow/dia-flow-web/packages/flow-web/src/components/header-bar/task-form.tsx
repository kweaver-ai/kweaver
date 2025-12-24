import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
    Button,
    Col,
    Divider,
    Form,
    FormInstance,
    FormItemProps,
    Input,
    List,
    Row,
    Switch,
    Typography,
} from "antd";
import clsx from "clsx";
import { trim } from "lodash";
import { AsUserSelect, AsUserSelectItem, useTranslate } from "@applet/common";
import styles from "./styles/task-form.module.less";
import {
    ShareContactOutlined,
    ShareGroupOutlined,
    ShareOrganizationOutlined,
    UserOutlined,
} from "@applet/icons";
import { IStep } from "../editor/expr";
import { automation } from "@applet/api";

interface TaskInfoModalProps {
    taskId?: string;
    steps: (IStep | automation.Step)[];
    data?: any;
    onCancel?(): void;
    onSubmit({ taskName, description, isNormal, accessors }: FormValue): void;
    handleValidateError(hasError: boolean): void;
}

export interface RefProps {
    form: FormInstance;
    handleValidateResult: (
        result: Pick<FormItemProps, "help" | "validateStatus">
    ) => void;
}

export interface FormValue {
    taskName: string;
    description: string;
    isNormal: boolean;
    accessors?: AsUserSelectItem[];
}

export const TaskInfoModal = forwardRef<RefProps, TaskInfoModalProps>(
    ({ taskId, data, steps, onSubmit, handleValidateError }, ref) => {
        const t = useTranslate();
        const [form] = Form.useForm<FormValue>();
        const isNormal = Form.useWatch("isNormal", form);

        const [nameValidateResult, setNameValidateResult] = useState<
            Pick<FormItemProps, "help" | "validateStatus">
        >({});
        const btnRef = useRef<HTMLButtonElement>(null);

        const handleValidateResult = (
            result: Pick<FormItemProps, "help" | "validateStatus">
        ) => {
            setNameValidateResult(result);
        };

        useImperativeHandle(ref, () => ({ form, handleValidateResult }));

        const isManual = !!steps.length && ["@trigger/form", "@trigger/selected-file", "@trigger/selected-folder"].includes(steps[0].operator)

        return (
            <Form
                name="newTask"
                form={form}
                className={styles["form"]}
                labelAlign="left"
                onFinish={onSubmit}
                autoComplete="off"
                colon={false}
                layout="vertical"
                requiredMark={false}
            >
                <Form.Item
                    label={t("label.taskName", "任务名称")}
                    colon={false}
                    labelAlign="left"
                    name="taskName"
                    rules={[
                        {
                            validator: (_, value: string) => {
                                if (trim(value).length === 0) {
                                    handleValidateError(true);
                                    return Promise.reject(
                                        new Error(
                                            t(
                                                "taskForm.validate.required",
                                                "此项不允许为空"
                                            )
                                        )
                                    );
                                }
                                if (!/^[^\\/:*?"<>|]{1,128}$/.test(value)) {
                                    handleValidateError(true);
                                    return Promise.reject(
                                        new Error(
                                            t(
                                                "taskForm.validate.taskName",
                                                '名称不能包含\\ / : * ? " < > | 特殊字符，长度不能超过128个字符'
                                            )
                                        )
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                    initialValue=""
                    {...nameValidateResult}
                >
                    <Input
                        className={styles["input"]}
                        placeholder={t(
                            "taskForm.taskName.placeholder",
                            "请填写任务名称"
                        )}
                        autoComplete="off"
                        onChange={() => {
                            setNameValidateResult({});
                            handleValidateError(false);
                        }}
                        onPressEnter={(e) => e.preventDefault()}
                    />
                </Form.Item>
                <Form.Item
                    label={t("label.description", "任务描述")}
                    name="description"
                >
                    <Input.TextArea
                        className={clsx(styles["input"], styles["detail"])}
                        maxLength={300}
                        placeholder={t(
                            "taskForm.description.placeholder",
                            "请填写任务描述"
                        )}
                        autoSize={{ minRows: 4, maxRows: 4 }}
                    />
                </Form.Item>
                <Form.Item
                    label={t("label.taskStatus", "任务状态")}
                    hasFeedback={false}
                >
                    <Row>
                        <Col>
                            <Form.Item
                                name="isNormal"
                                valuePropName="checked"
                                noStyle
                            >
                                <Switch size="small" />
                            </Form.Item>
                        </Col>
                        <Col>
                            {isNormal ? (
                                <span className={styles["running"]}>
                                    {t("task.status.normal", "启用中")}
                                </span>
                            ) : (
                                <span className={styles["stop"]}>
                                    {t("task.status.stopped", "已停用")}
                                </span>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        <Typography.Text className={styles["tip"]}>
                            {t(
                                "taskStatus.description",
                                "设置的任务状态，保存流程后生效"
                            )}
                        </Typography.Text>
                    </Row>
                </Form.Item>
                <Divider style={{ display: isManual ? undefined : "none" }} />
                {isManual && (
                    <Form.Item
                        name="accessors"
                        label={t(
                            "label.accessors",
                            "允许以下用户执行此自动化任务"
                        )}
                        rules={[
                            {
                                validator: (_, value: AsUserSelectItem[]) => {
                                    if (isManual && !value?.length) {
                                        if (btnRef.current) {
                                            btnRef.current.scrollIntoView();
                                        }
                                        return Promise.reject(
                                            new Error(
                                                t(
                                                    "taskForm.validate.required",
                                                    "此项不允许为空"
                                                )
                                            )
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <AsUserSelect>
                            {({ items, onAdd, removeItem }) => (
                                <>
                                    <List
                                        dataSource={items}
                                        rowKey="id"
                                        className={styles.accessorList}
                                        bordered
                                        renderItem={(item) => (
                                            <List.Item
                                                key={item.id}
                                                className={styles.accessorItem}
                                            >
                                                {item.type === "user" && (
                                                    <UserOutlined />
                                                )}
                                                {item.type === "group" && (
                                                    <ShareGroupOutlined />
                                                )}
                                                {item.type === "department" && (
                                                    <ShareOrganizationOutlined />
                                                )}
                                                {item.type === "contactor" && (
                                                    <ShareContactOutlined />
                                                )}
                                                <div
                                                    className={
                                                        styles.accessorName
                                                    }
                                                >
                                                    {item.name}
                                                </div>
                                                <Button
                                                    className={
                                                        styles.removeButton
                                                    }
                                                    type="link"
                                                    onClick={() =>
                                                        removeItem(item)
                                                    }
                                                >
                                                    {t("delete", "删除")}
                                                </Button>
                                            </List.Item>
                                        )}
                                    ></List>
                                    <Button onClick={onAdd} ref={btnRef}>
                                        {t("add", "添加")}
                                    </Button>
                                </>
                            )}
                        </AsUserSelect>
                    </Form.Item>
                )}
            </Form>
        );
    }
);
