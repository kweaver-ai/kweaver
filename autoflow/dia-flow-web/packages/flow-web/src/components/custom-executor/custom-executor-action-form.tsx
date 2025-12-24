import { useTranslate } from "@applet/common";
import { CloseOutlined, PlusOutlined } from "@applet/icons";
import {
    Button,
    Checkbox,
    Form,
    FormInstance,
    Input,
    Select,
    Space,
} from "antd";
import { ExecutorActionDto } from "../../models/executor-action-dto";
import {
    ExecutorActionInputDto,
    ExecutorActionInputDtoTypeEnum,
} from "../../models/executor-action-input-dto";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { CodeInput } from "./code-input";
import styles from "./custom-executor-action-form.module.less";
import { customAlphabet } from "nanoid";
import {
    ExecutorActionOutputDto,
    ExecutorActionOutputDtoTypeEnum,
} from "../../models/executor-action-output-dto";

const nanoid = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    8
);

export type ActionFormValues = Pick<
    ExecutorActionDto,
    "name" | "description" | "inputs" | "outputs" | "config"
>;

interface CustomExecutorActionFormProps {
    actionId?: string;
    action?: ActionFormValues;
    validateName(name: string): Promise<boolean>;
    onFinish?(values: ActionFormValues): void;
}

export const CustomExecutorActionForm = forwardRef<
    FormInstance<ActionFormValues>,
    CustomExecutorActionFormProps
>(({ action, validateName, onFinish }, ref) => {
    const [form] = Form.useForm<ActionFormValues>();
    const t = useTranslate("customExecutor");
    const inputs = Form.useWatch("inputs", form);
    const outputs = Form.useWatch("outputs", form);

    useImperativeHandle(ref, () => form, [form]);

    return (
        <Form
            form={form}
            initialValues={action}
            layout="vertical"
            className={styles.Form}
            onFinish={({ name, description, inputs, outputs, config }) => {
                onFinish?.({
                    name: name?.trim(),
                    description: description?.trim(),
                    inputs: inputs?.map((input) => ({
                        ...input,
                        name: input.name.trim(),
                    })),
                    outputs: outputs?.map((output) => ({
                        ...output,
                        name: output.name.trim(),
                    })),
                    config,
                });
            }}
        >
            <Form.Item
                name="name"
                label={t("actionName", "名称")}
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
                            "invalidActionName",
                            `名称不能超过255个字符`
                        ),
                    },
                    {
                        validateTrigger: "submit",
                        transform: (s) => s?.trim(),
                        async validator(_, value) {
                            const result = await validateName(value);
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
                    placeholder={t("actionNamePlaceholder", "请输入")}
                />
            </Form.Item>

            <Form.Item
                name="description"
                label={t("actionDescription", "描述")}
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
                    placeholder={t("actionDescriptionPlaceholder", "请输入")}
                />
            </Form.Item>

            <Form.Item label={t("actionInputs", "输入")}>
                <Form.List name="inputs">
                    {(fields, { add, remove }) => {
                        return (
                            <>
                                {fields.map((field, index) => {
                                    return (
                                        <Form.Item
                                            className={styles.InputFormItem}
                                            {...field}
                                            extra={
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <CloseOutlined
                                                            style={{
                                                                fontSize: 13,
                                                                color: "rgba(0, 0, 0, 0.45)",
                                                            }}
                                                        />
                                                    }
                                                    onClick={() =>
                                                        remove(index)
                                                    }
                                                ></Button>
                                            }
                                            rules={[
                                                {
                                                    async validator(_, value) {
                                                        value =
                                                            value?.name &&
                                                            value.name.trim();
                                                        if (!value) {
                                                            throw new Error(
                                                                t(
                                                                    "emptyMessage",
                                                                    "此项不允许为空"
                                                                )
                                                            );
                                                        }
                                                    },
                                                },
                                                {
                                                    async validator(_, value) {
                                                        value =
                                                            value?.name &&
                                                            value.name.trim();
                                                        if (
                                                            value &&
                                                            value.length > 50
                                                        ) {
                                                            throw new Error(
                                                                t(
                                                                    "invalidInputName",
                                                                    `名称不能超过50个字符`
                                                                )
                                                            );
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <ActionInput index={index} />
                                        </Form.Item>
                                    );
                                })}

                                <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                        add({
                                            key: nanoid(),
                                            name: "",
                                            type: "string",
                                            required: true,
                                        })
                                    }
                                >
                                    {t("add", "添加")}
                                </Button>
                            </>
                        );
                    }}
                </Form.List>
            </Form.Item>

            <Form.Item label={t("actionOutputs", "输出")}>
                <Form.List name="outputs">
                    {(fields, { add, remove }) => {
                        return (
                            <>
                                {fields.map((field, index) => {
                                    return (
                                        <Form.Item
                                            className={styles.OutputFormItem}
                                            {...field}
                                            extra={
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <CloseOutlined
                                                            style={{
                                                                fontSize: 13,
                                                                color: "rgba(0, 0, 0, 0.45)",
                                                            }}
                                                        />
                                                    }
                                                    onClick={() =>
                                                        remove(index)
                                                    }
                                                ></Button>
                                            }
                                            rules={[
                                                {
                                                    async validator(_, value) {
                                                        value =
                                                            value?.name &&
                                                            value.name.trim();
                                                        if (!value) {
                                                            throw new Error(
                                                                t(
                                                                    "emptyMessage",
                                                                    "此项不允许为空"
                                                                )
                                                            );
                                                        }
                                                    },
                                                },
                                                {
                                                    async validator(_, value) {
                                                        value =
                                                            value?.name &&
                                                            value.name.trim();
                                                        if (
                                                            value &&
                                                            value.length > 50
                                                        ) {
                                                            throw new Error(
                                                                t(
                                                                    "invalidOutputName",
                                                                    `名称不能超过50个字符`
                                                                )
                                                            );
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <ActionOutput index={index} />
                                        </Form.Item>
                                    );
                                })}
                                <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                        add({
                                            key: nanoid(),
                                            name: "",
                                            type: "string",
                                        })
                                    }
                                >
                                    {t("add", "添加")}
                                </Button>
                            </>
                        );
                    }}
                </Form.List>
            </Form.Item>

            <Form.Item
                name={["config", "code"]}
                label={t("actionCode", "编写代码")}
                rules={[
                    {
                        transform: (v) => v?.trim(),
                        required: true,
                        message: t("emptyMessage", "此项不允许为空"),
                    },
                ]}
            >
                <CodeInput inputs={inputs} outputs={outputs} />
            </Form.Item>
        </Form>
    );
});

interface ActionInputProps {
    index: number;
    value?: ExecutorActionInputDto;
    onChange?(value: ExecutorActionInputDto): void;
}

interface ActionOutputProps {
    index: number;
    value?: ExecutorActionOutputDto;
    onChange?(value: ExecutorActionOutputDto): void;
}

function useOptions() {
    const t = useTranslate("customExecutor");

    return useMemo(() => {
        return [
            {
                label: t("string", "文本"),
                value: "string",
            },
            {
                label: t("number", "数字"),
                value: "number",
            },
            {
                label: t("datetime", "日期"),
                value: "datetime",
            },
            {
                label: t("asFile", "文件"),
                value: "asFile",
            },
            {
                label: t("asFolder", "文件夹"),
                value: "asFolder",
            },
            {
                label: t("multipleFiles", "多个文件"),
                value: "multipleFiles",
            },
        ];
    }, [t]);
}

function ActionInput({
    index,
    value = {
        key: "",
        name: "",
        type: ExecutorActionInputDtoTypeEnum.String,
        required: false,
    },
    onChange,
}: ActionInputProps) {
    const t = useTranslate("customExecutor");

    const options = useOptions();
    return (
        <div className={styles.ActionInput}>
            <div className={styles.ActionInputTitle}>
                {t("actionInputTitle", "字段{index}", { index: index + 1 })}
            </div>
            <Space>
                <Input
                    value={value?.name}
                    autoComplete="off"
                    placeholder={t("actionInputName", "字段名称")}
                    onChange={(e) =>
                        onChange?.({
                            ...value,
                            key: value.key || nanoid(),
                            name: e.target.value,
                        })
                    }
                />
                <Select
                    options={options}
                    value={value?.type}
                    onChange={(type) =>
                        onChange?.({
                            ...value,
                            key: value.key || nanoid(),
                            type,
                        })
                    }
                />
                <Checkbox
                    checked={value?.required}
                    onChange={(e) =>
                        onChange?.({
                            ...value,
                            key: value.key || nanoid(),
                            required: e.target.checked,
                        })
                    }
                >
                    {t("required", "必填")}
                </Checkbox>
            </Space>
        </div>
    );
}

function ActionOutput({
    index,
    value = {
        key: "",
        name: "",
        type: ExecutorActionOutputDtoTypeEnum.String,
    },
    onChange,
}: ActionOutputProps) {
    const t = useTranslate("customExecutor");

    const options = useOptions();
    return (
        <div className={styles.ActionInput}>
            <div className={styles.ActionInputTitle}>
                {t("actionOutputTitle", "变量{index}", { index: index + 1 })}
            </div>
            <Space>
                <Input
                    value={value?.name}
                    autoComplete="off"
                    placeholder={t("actionOutputName", "变量名称")}
                    onChange={(e) =>
                        onChange?.({
                            ...value,
                            key: value.key || nanoid(),
                            name: e.target.value,
                        })
                    }
                />
                <Select
                    options={options}
                    value={value?.type}
                    onChange={(type) =>
                        onChange?.({
                            ...value,
                            key: value.key || nanoid(),
                            type,
                        })
                    }
                />
            </Space>
        </div>
    );
}
