import {
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    ExecutorActionOutputProps,
    Extension,
    Validatable,
} from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import TextSVG from "./assets/text.svg";
import ManualSVG from "./assets/manual.svg";
import TriggerManualSVG from "./assets/trigger-manual.svg";
import PythonSVG from "./assets/py.svg";
import TimeSVG from "./assets/time.svg";
import EndReturnsSVG from "./assets/endReturns.svg";
import {
    Button,
    DatePicker,
    Form,
    Input,
    InputNumber,
    InputNumberProps,
    Popover,
    Radio,
    Select,
    Space,
    Typography,
} from "antd";
import {
    ForwardedRef,
    createRef,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import moment from "moment";
import { FormItem } from "../../components/editor/form-item";
import { PlusOutlined } from "@applet/icons";
import { MinusCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import styles from "./index.module.less";
import clsx from "clsx";
import { TextAreaProps, TextAreaRef } from "antd/lib/input/TextArea";
import { IStep } from "../../components/editor/expr";
import {
    CustomInput,
    ValidateParams,
    PythonEditor,
} from "../../components/internal-tool";
import { FormTriggerAction } from "./form-trigger";
import { MicroAppContext, TranslateFn } from "@applet/common";
import { VariableDatePicker } from "./components/variable-date-picker";
import { FileTriggerAction, FolderTriggerAction } from "./components/file-system-trigger";
import { OutputsFormTriggerAction } from "../../extensions/internal/outputs-form-trigger";

const AntDatePicker: any = DatePicker;

function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => {
        return {
            validate() {
                return form.validateFields().then(
                    () => true,
                    () => false
                );
            },
        };
    });

    useLayoutEffect(() => {
        form.setFieldsValue(parameters);
    }, [form, parameters]);

    return form;
}

export default {
    name: "internal",
    types: [
        {
            type: "string",
            name: "types.string",
            components: {
                Input: forwardRef<TextAreaRef, TextAreaProps>(
                    (
                        {
                            autoSize = true,
                            showCount = true,
                            className,
                            ...props
                        },
                        ref
                    ) => (
                        <Input.TextArea
                            ref={ref}
                            autoSize={autoSize}
                            showCount={showCount}
                            className={clsx(styles.textArea, className)}
                            {...props}
                        />
                    )
                ),
            },
        },
        {
            type: "number",
            name: "types.number",
            components: {
                Input: forwardRef<HTMLInputElement, InputNumberProps>(
                    ({ className, ...props }, ref) => (
                        <InputNumber
                            {...props}
                            autoComplete="off"
                            className={clsx(className, styles.inputNumber)}
                            ref={ref}
                        />
                    )
                ),
            },
        },
        {
            type: "datetime",
            name: "types.datetime",
            components: {
                Input: forwardRef<any, any>(
                    (
                        {
                            showTime = true,
                            value,
                            className,
                            onChange,
                            ...props
                        },
                        ref
                    ) => (
                        <AntDatePicker
                            {...props}
                            ref={ref}
                            showTime={showTime}
                            className={clsx(styles.datePicker, className)}
                            popupClassName="automate-oem-primary"
                            value={value && moment(value)}
                            onChange={(value: any) => {
                                if (typeof onChange === "function") {
                                    onChange(value?.toISOString());
                                }
                            }}
                        />
                    )
                ),
            },
        },
    ],
    triggers: [
        {
            name: "TManual",
            icon: TriggerManualSVG,
            description: "TManualDescription",
            group: {
                group: "manualTrigger",
                name: "TGroupManual",
            },
            actions: [
                {
                    name: "TAManual",
                    description: "TAManualDescription",
                    operator: "@trigger/manual",
                    icon: ManualSVG,
                    allowDataSource: true,
                },
                FormTriggerAction,
                // FileTriggerAction,
                // FolderTriggerAction,
            ],
        },
    ],
    executors: [
        {
            name: "EText",
            description: "ETextDescription",
            icon: TextSVG,
            actions: [
                {
                    name: "EATextSplit",
                    description: "EATextSplitDescription",
                    operator: "@internal/text/split",
                    icon: TextSVG,
                    outputs: [
                        {
                            key: ".slices",
                            name: "EATextSplitOutputSlices",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return parameters && parameters?.text;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = { text: "", separator: "，" },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const form = useConfigForm(parameters, ref);
                                const separator = Form.useWatch(
                                    "separator",
                                    form
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={parameters}
                                        onFieldsChange={() => {
                                            const { text, separator, custom } =
                                                form.getFieldsValue();
                                            // 过滤无用字段
                                            onChange({
                                                text,
                                                separator,
                                                custom:
                                                    separator === "custom"
                                                        ? custom
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("textSplit.text")}
                                            name="text"
                                            allowVariable
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                autoComplete="off"
                                                placeholder={t(
                                                    "textSplit.textPlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("textSplit.separator")}
                                            name="separator"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Radio.Group
                                                className={styles.separators}
                                            >
                                                <Radio value="，">
                                                    {t("comma")}
                                                </Radio>
                                                <Radio value=",">
                                                    {t("semi-comma")}
                                                </Radio>
                                                <Radio value="；">
                                                    {t("semicolon")}
                                                </Radio>
                                                <Radio value=";">
                                                    {t("semi-semicolon")}
                                                </Radio>
                                                <Radio value=" ">
                                                    {t("space")}
                                                </Radio>
                                                <div
                                                    className={
                                                        styles.customSeparator
                                                    }
                                                >
                                                    <Radio value="custom">
                                                        {t(
                                                            "textSplit.customSeparator"
                                                        )}
                                                    </Radio>
                                                    <FormItem
                                                        name="custom"
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <Input
                                                            autoComplete="off"
                                                            disabled={
                                                                separator !==
                                                                "custom"
                                                            }
                                                        />
                                                    </FormItem>
                                                </div>
                                            </Radio.Group>
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => (
                            <table>
                                <tbody>
                                    {Object.keys(input).map((item) => {
                                        let label;
                                        let value = input[item];
                                        switch (item) {
                                            case "separator":
                                                if (input[item] === "custom") {
                                                    label = "";
                                                } else {
                                                    label = t(
                                                        "log.textSplit.separator",
                                                        "分割符"
                                                    );
                                                }
                                                break;
                                            case "custom":
                                                if (
                                                    input["separator"] ===
                                                    "custom"
                                                ) {
                                                    label = t(
                                                        "log.textSplit.separator",
                                                        "分割符"
                                                    );
                                                } else {
                                                    label = "";
                                                }
                                                break;
                                            case "text":
                                                label = t(
                                                    "textSplit.text",
                                                    "要分割的文本"
                                                );
                                                break;
                                            default:
                                                label = "";
                                        }
                                        if (label) {
                                            return (
                                                <tr>
                                                    <td
                                                        className={styles.label}
                                                    >
                                                        <Typography.Paragraph
                                                            ellipsis={{
                                                                rows: 2,
                                                            }}
                                                            className="applet-table-label"
                                                            title={label}
                                                        >
                                                            {label}
                                                        </Typography.Paragraph>
                                                        {t("colon", "：")}
                                                    </td>
                                                    <td>
                                                        {
                                                            typeof value === 'object' 
                                                                ? JSON.stringify(value, null, 2)
                                                                : value
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t("EATextSplitOutputSlices")}
                                            {t("colon", "：")}
                                        </td>
                                        <td
                                            className={styles.output}
                                        >{`${outputData.slices}`}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EATextJoin",
                    description: "EATextJoinDescription",
                    operator: "@internal/text/join",
                    icon: TextSVG,
                    outputs: [
                        {
                            key: ".text",
                            name: "EATextJoinOutputText",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return parameters && parameters?.texts[0];
                    },
                    components: {
                        Config: forwardRef<
                            Validatable,
                            ExecutorActionConfigProps<{
                                texts: string[];
                                separator: string;
                                custom?: string;
                            }>
                        >(
                            (
                                {
                                    t,
                                    parameters = {
                                        texts: ["", ""],
                                        separator: "",
                                    },
                                    onChange,
                                },
                                ref
                            ) => {
                                const [form] = Form.useForm();

                                const inputs = useMemo(
                                    () =>
                                        parameters.texts.map(() =>
                                            createRef<Validatable>()
                                        ),
                                    [parameters.texts]
                                );

                                useLayoutEffect(() => {
                                    form.setFieldsValue(parameters);
                                }, [form, parameters]);

                                useImperativeHandle(
                                    ref,
                                    () => {
                                        return {
                                            validate() {
                                                return Promise.all([
                                                    ...inputs.map(
                                                        (ref) =>
                                                            typeof ref.current
                                                                ?.validate !==
                                                            "function" ||
                                                            ref.current?.validate()
                                                    ),
                                                    form.validateFields().then(
                                                        () => true,
                                                        () => false
                                                    ),
                                                ]).then((results) => {
                                                    return results.every(
                                                        (r) => r
                                                    );
                                                });
                                            },
                                        };
                                    }
                                    // [form, inputs]
                                );

                                const separator = Form.useWatch(
                                    "separator",
                                    form
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={parameters}
                                        onFieldsChange={() => {
                                            const { texts, separator, custom } =
                                                form.getFieldsValue();
                                            // 过滤无用字段
                                            onChange({
                                                texts,
                                                separator,
                                                custom:
                                                    separator === "custom"
                                                        ? custom
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        <FormItem
                                            label={t("textJoin.texts")}
                                            required
                                        >
                                            <Form.List name="texts">
                                                {(
                                                    fields,
                                                    { add, remove },
                                                    { errors }
                                                ) => {
                                                    return (
                                                        <>
                                                            {fields.map(
                                                                (
                                                                    field,
                                                                    index
                                                                ) => (
                                                                    <FormItem
                                                                        {...field}
                                                                        noStyle
                                                                    >
                                                                        <TextJoinInput
                                                                            ref={
                                                                                inputs[
                                                                                index
                                                                                ]
                                                                            }
                                                                            t={
                                                                                t
                                                                            }
                                                                            index={
                                                                                index
                                                                            }
                                                                            removable={
                                                                                fields.length >
                                                                                2
                                                                            }
                                                                            onRemove={() =>
                                                                                remove(
                                                                                    index
                                                                                )
                                                                            }
                                                                        />
                                                                    </FormItem>
                                                                )
                                                            )}
                                                            <FormItem
                                                                style={{
                                                                    marginBottom: 0,
                                                                }}
                                                            >
                                                                <Button
                                                                    icon={
                                                                        <PlusOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        add()
                                                                    }
                                                                >
                                                                    {t(
                                                                        "textJoin.addText"
                                                                    )}
                                                                </Button>
                                                            </FormItem>
                                                        </>
                                                    );
                                                }}
                                            </Form.List>
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("textJoin.separator")}
                                            name="separator"
                                        >
                                            <Radio.Group
                                                className={styles.separators}
                                            >
                                                <Radio value="">
                                                    {t("textJoin.noSeparator")}
                                                </Radio>
                                                <Radio value=" ">
                                                    {t("space")}
                                                </Radio>
                                                <Radio value="，">
                                                    {t("comma")}
                                                </Radio>
                                                <Radio value=",">
                                                    {t("semi-comma")}
                                                </Radio>
                                                <Radio value="；">
                                                    {t("semicolon")}
                                                </Radio>
                                                <Radio value=";">
                                                    {t("semi-semicolon")}
                                                </Radio>
                                                <div
                                                    className={
                                                        styles.customSeparator
                                                    }
                                                >
                                                    <Radio value="custom">
                                                        {t(
                                                            "textJoin.customSeparator"
                                                        )}
                                                    </Radio>
                                                    <FormItem
                                                        name="custom"
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <Input
                                                            autoComplete="off"
                                                            disabled={
                                                                separator !==
                                                                "custom"
                                                            }
                                                        />
                                                    </FormItem>
                                                </div>
                                            </Radio.Group>
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t(
                                                "log.textJoin.separator",
                                                "连接符"
                                            )}
                                            {t("colon", "：")}
                                        </td>
                                        <td>{`"${input?.separator === "custom"
                                            ? input?.custom
                                            : input?.separator
                                            }"`}</td>
                                    </tr>
                                    {input?.texts?.map(
                                        (item: any, index: number) => {
                                            return (
                                                <tr>
                                                    <td
                                                        className={styles.label}
                                                    >
                                                        {t(
                                                            "textJoin.text",
                                                            "文本{index}",
                                                            {
                                                                index:
                                                                    index + 1,
                                                            }
                                                        )}
                                                        {t("colon", "：")}
                                                    </td>
                                                    <td>{typeof item === 'object' 
                                                            ? JSON.stringify(item, null, 2)
                                                            : item
                                                        }</td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        ),
                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t("EATextJoinOutputText")}
                                            {t("colon", "：")}
                                        </td>
                                        <td
                                            className={styles.output}
                                        >{`${outputData.text}`}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EATextMatch",
                    description: "EATextMatchDescription",
                    operator: "@internal/text/match",
                    icon: TextSVG,
                    outputs: [
                        {
                            key: ".matched",
                            name: "EATextMatchOutputExtracts",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return parameters && parameters?.text;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = { text: "" },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const form = useConfigForm(parameters, ref);

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={parameters}
                                        onFieldsChange={() =>
                                            onChange(form.getFieldsValue())
                                        }
                                    >
                                        <FormItem
                                            required
                                            label={t("textMatch.text")}
                                            name="text"
                                            allowVariable
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                autoComplete="off"
                                                placeholder={t(
                                                    "textMatch.textPlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={
                                                <div>
                                                    {t("textMatch.type")}
                                                    <Popover
                                                        trigger="hover"
                                                        placement="top"
                                                        className={styles.tip}
                                                        content={
                                                            <Typography.Text>
                                                                {t(
                                                                    "textMatch.tip",
                                                                    "将提取所有匹配内容中的第一项"
                                                                )}
                                                            </Typography.Text>
                                                        }
                                                    >
                                                        <QuestionCircleOutlined />
                                                    </Popover>
                                                </div>
                                            }
                                            name="matchtype"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Radio.Group
                                                className={
                                                    styles["text-matchType"]
                                                }
                                            >
                                                <Radio value="NUMBER">
                                                    {t("NUMBER")}
                                                </Radio>
                                                <Radio value="CN_ID_CARD">
                                                    {t("CN_ID_CARD")}
                                                </Radio>
                                                <Radio value="CN_BANK_CARD_NUMBER">
                                                    {t("CN_BANK_CARD_NUMBER")}
                                                </Radio>
                                                <Radio value="CN_PHONE_NUMBER">
                                                    {t("CN_PHONE_NUMBER")}
                                                </Radio>
                                            </Radio.Group>
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => (
                            <table>
                                <tbody>
                                    {Object.keys(input).map((item) => {
                                        let label;
                                        let value = input[item];
                                        switch (item) {
                                            case "matchtype":
                                                label = t(
                                                    "textMatch.type",
                                                    "要提取的内容类型"
                                                );
                                                value = t(value);
                                                break;
                                            case "text":
                                                label = t(
                                                    "textMatch.text",
                                                    "要提取的文本"
                                                );
                                                break;
                                            default:
                                                label = "";
                                        }
                                        if (label) {
                                            return (
                                                <tr>
                                                    <td
                                                        className={styles.label}
                                                    >
                                                        <Typography.Paragraph
                                                            ellipsis={{
                                                                rows: 2,
                                                            }}
                                                            className="applet-table-label"
                                                            title={label}
                                                        >
                                                            {label}
                                                        </Typography.Paragraph>
                                                        {t("colon", "：")}
                                                    </td>
                                                    <td>
                                                        {
                                                            typeof value === 'object' 
                                                                ? JSON.stringify(value, null, 2)
                                                                : value
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t("EATextMatchOutputExtracts")}
                                            {t("colon", "：")}
                                        </td>
                                        <td className={styles.output}>
                                            {outputData?.matched || ""}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
            ],
        },
        {
            name: "ETool",
            description: "EToolDescription",
            icon: PythonSVG,
            actions: [
                {
                    name: "EAToolPy3",
                    description: "EAToolPy3Description",
                    operator: "@internal/tool/py3",
                    icon: PythonSVG,
                    outputs: (step: IStep) => {
                        if (step.parameters?.output_params) {
                            return step.parameters?.output_params?.map(
                                (item: any) => ({
                                    key: `.${item.key}`,
                                    name: item.key,
                                    type:
                                        item.type === "int"
                                            ? "number"
                                            : item.type,
                                    isCustom: true,
                                })
                            );
                        }
                        return [];
                    },
                    validate(parameters) {
                        return parameters && parameters?.code;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = {
                                        input_params: [],
                                        output_params: [],
                                    },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const [form] = Form.useForm();
                                const inputParams = Form.useWatch(
                                    "input_params",
                                    form
                                );
                                const outputParams = Form.useWatch(
                                    "output_params",
                                    form
                                );

                                const { platform } = useContext(MicroAppContext);
                                useImperativeHandle(ref, () => {
                                    return {
                                        async validate() {
                                            let inputRes = true;
                                            let outputRes = true;
                                            if (
                                                typeof inputParamsRef?.current
                                                    ?.validate === "function"
                                            ) {
                                                inputRes =
                                                    await inputParamsRef.current?.validate();
                                            }
                                            if (
                                                typeof outputParamsRef?.current
                                                    ?.validate === "function"
                                            ) {
                                                outputRes =
                                                    await outputParamsRef.current?.validate();
                                            }
                                            if (!inputRes || !outputRes) {
                                                return false;
                                            }

                                            return form.validateFields().then(
                                                () => true,
                                                () => false
                                            );
                                        },
                                    };
                                });

                                // useLayoutEffect(() => {
                                //     form.setFieldsValue(parameters);
                                // }, [form, parameters]);

                                const inputParamsRef =
                                    useRef<ValidateParams>(null);
                                const outputParamsRef =
                                    useRef<ValidateParams>(null);

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={parameters}
                                        onFieldsChange={() =>
                                            onChange(form.getFieldsValue())
                                        }
                                    >
                                        <FormItem
                                            label={t("py3.input")}
                                            name="input_params"
                                        >
                                            <CustomInput
                                                key="input_params"
                                                ref={inputParamsRef}
                                                t={t}
                                                type="input"
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("py3.output")}
                                            name="output_params"
                                        >
                                            <CustomInput
                                                key="output_params"
                                                ref={outputParamsRef}
                                                t={t}
                                                type="output"
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("py3.code")}
                                            name="code"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <PythonEditor
                                                t={t}
                                                inputParams={inputParams}
                                                outputParams={outputParams}
                                            />
                                        </FormItem>

                                        {platform === 'operator' && (
                                            <FormItem label="运行方式" name="mode">
                                                <Select
                                                    placeholder="请选择"
                                                    options={[
                                                    { label: "同步", value: "sync" },
                                                    { label: "异步", value: "async" },
                                                    ]}
                                                />
                                            </FormItem>
                                        )}

                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => (
                            <table>
                                <tbody>
                                    {Object.keys(input).map((key) => {
                                        let value: any[] = input[key];
                                        switch (key) {
                                            case "input_params":
                                                return (
                                                    <>
                                                        <tr>
                                                            <td
                                                                className={
                                                                    styles.label
                                                                }
                                                            >
                                                                {t(
                                                                    "py3.log.input",
                                                                    "输入变量"
                                                                )}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                        {value?.map(
                                                            (
                                                                item: any,
                                                                index
                                                            ) => (
                                                                <tr>
                                                                    <td
                                                                        className={
                                                                            styles.label
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles[
                                                                                "label-wrapper"
                                                                                ]
                                                                            }
                                                                        >
                                                                            {t(
                                                                                "tool.params.num",
                                                                                {
                                                                                    num:
                                                                                        index +
                                                                                        1,
                                                                                }
                                                                            )}
                                                                            {t(
                                                                                "colon"
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {t(
                                                                            "tool.placeholder.name",
                                                                            "变量名称"
                                                                        ) +
                                                                            t(
                                                                                "colon",
                                                                                "："
                                                                            ) +
                                                                            item.key +
                                                                            t(
                                                                                "semi.colon"
                                                                            ) +
                                                                            "  "}
                                                                        {t(
                                                                            "tool.placeholder.type",
                                                                            "变量类型"
                                                                        ) +
                                                                            t(
                                                                                "colon",
                                                                                "："
                                                                            ) +
                                                                            item.type +
                                                                            t(
                                                                                "semi.colon"
                                                                            ) +
                                                                            "  "}
                                                                        {t(
                                                                            "tool.log.value",
                                                                            "变量值"
                                                                        ) +
                                                                            t(
                                                                                "colon",
                                                                                "："
                                                                            ) +
                                                                            item.value +
                                                                            "  "}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </>
                                                );
                                            case "code":
                                                return (
                                                    <tr>
                                                        <td
                                                            className={
                                                                styles.label
                                                            }
                                                        >
                                                            {t("py3.log.code")}
                                                            {t("colon", "：")}
                                                        </td>
                                                        <td>{`${value.length > 100
                                                            ? value.slice(
                                                                0,
                                                                100
                                                            ) + "..."
                                                            : value
                                                            }`}</td>
                                                    </tr>
                                                );
                                            case "output_params":
                                                return (
                                                    <>
                                                        <tr>
                                                            <td
                                                                className={
                                                                    styles.label
                                                                }
                                                            >
                                                                {t(
                                                                    "py3.log.output",
                                                                    "输出变量"
                                                                )}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                        {value?.map(
                                                            (
                                                                item: any,
                                                                index
                                                            ) => (
                                                                <tr>
                                                                    <td
                                                                        className={
                                                                            styles.label
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles[
                                                                                "label-wrapper"
                                                                                ]
                                                                            }
                                                                        >
                                                                            {t(
                                                                                "tool.params.num",
                                                                                {
                                                                                    num:
                                                                                        index +
                                                                                        1,
                                                                                }
                                                                            )}
                                                                            {t(
                                                                                "colon"
                                                                            )}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {t(
                                                                            "tool.placeholder.name",
                                                                            "变量名称"
                                                                        ) +
                                                                            t(
                                                                                "colon",
                                                                                "："
                                                                            ) +
                                                                            item.key +
                                                                            t(
                                                                                "semi.colon"
                                                                            ) +
                                                                            "  "}
                                                                        {t(
                                                                            "tool.placeholder.type",
                                                                            "变量类型"
                                                                        ) +
                                                                            t(
                                                                                "colon",
                                                                                "："
                                                                            ) +
                                                                            item.type +
                                                                            "  "}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </>
                                                );
                                            default:
                                                return null;
                                        }
                                    })}
                                </tbody>
                            </table>
                        ),
                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    {Object.keys(outputData)?.map(
                                        (key: string) => {
                                            return (
                                                <tr>
                                                    <td
                                                        className={styles.label}
                                                    >
                                                        {key}
                                                        {t("colon", "：")}
                                                    </td>
                                                    <td
                                                        className={
                                                            styles.output
                                                        }
                                                    >
                                                        {typeof outputData[
                                                            key
                                                        ] === "string"
                                                            ? outputData[key]
                                                            : JSON.stringify(
                                                                outputData[
                                                                key
                                                                ]
                                                            )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        ),
                    },
                },
            ],
        },
        {
            name: "ETime",
            icon: TimeSVG,
            description: "ETimeDescription",
            actions: [
                {
                    name: "EATimeNow",
                    description: "EATimeNowDescription",
                    operator: "@internal/time/now",
                    icon: TimeSVG,
                    outputs: [
                        {
                            key: ".curtime",
                            name: "EATimeNowOutputTime",
                            type: "datetime",
                        },
                    ],
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters,
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                return (
                                    <div>
                                        {t(
                                            "getTime.tip",
                                            "当前执行操作无需详细设置"
                                        )}
                                    </div>
                                );
                            }
                        ),

                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t(
                                                "EATimeNowOutputTime",
                                                "当前日期时间"
                                            )}
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {outputData?.curtime
                                                ? moment(
                                                    outputData.curtime / 1000
                                                ).format("YYYY/MM/DD HH:mm")
                                                : ""}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EATimeRelative",
                    description: "EATimeRelativeDescription",
                    operator: "@internal/time/relative",
                    icon: TimeSVG,
                    outputs: [
                        {
                            key: ".new_time",
                            name: "EATimeRelativeOutputTime",
                            type: "datetime",
                        },
                    ],
                    validate(parameters) {
                        return parameters && parameters?.relative_value;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = {
                                        relative_type: "add",
                                    },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const [form] = Form.useForm();

                                const options = useMemo(() => {
                                    return [
                                        {
                                            label: t("timeRelative.day", "天"),
                                            value: "day",
                                        },
                                        {
                                            label: t("timeRelative.hour", "时"),
                                            value: "hour",
                                        },
                                        {
                                            label: t(
                                                "timeRelative.minute",
                                                "分"
                                            ),
                                            value: "minute",
                                        },
                                    ];
                                }, []);

                                // 编辑时是moment对象，初始值可能是时间戳，避免时间组件报错
                                const transferParameter = useMemo(() => {
                                    return {
                                        ...parameters,
                                        old_time:
                                            typeof parameters?.old_time ===
                                                "number"
                                                ? moment(
                                                    parameters?.old_time /
                                                    1000
                                                )
                                                : parameters?.old_time,
                                    };
                                }, [parameters]);

                                useImperativeHandle(ref, () => {
                                    return {
                                        validate() {
                                            return form.validateFields().then(
                                                () => true,
                                                () => false
                                            );
                                        },
                                    };
                                });

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transferParameter}
                                        autoComplete="off"
                                        onFieldsChange={() => {
                                            const val = form.getFieldsValue();
                                            const transferVal = {
                                                ...val,
                                                old_time:
                                                    typeof val?.old_time ===
                                                        "object" &&
                                                        typeof val?.old_time
                                                            ?.valueOf === "function"
                                                        ? val?.old_time.valueOf() *
                                                        1000
                                                        : val?.old_time,
                                            };
                                            onChange(transferVal);
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("timeRelative.old_time")}
                                            name="old_time"
                                            allowVariable
                                            type="datetime"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <VariableDatePicker
                                                style={{ width: "100%" }}
                                                showTime
                                                showNow
                                                format="YYYY/MM/DD HH:mm"
                                                popupClassName="automate-oem-primary"
                                                placeholder={t(
                                                    "select.placeholder",
                                                    "请选择"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "timeRelative.relative_type"
                                            )}
                                            name="relative_type"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Radio.Group>
                                                <Radio value={"add"}>
                                                    {t(
                                                        "timeRelative.add",
                                                        "增加"
                                                    )}
                                                </Radio>
                                                <Radio value={"sub"}>
                                                    {t(
                                                        "timeRelative.sub",
                                                        "减少"
                                                    )}
                                                </Radio>
                                            </Radio.Group>
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "timeRelative.relative_value"
                                            )}
                                        >
                                            <Space size={12}>
                                                <FormItem
                                                    name="relative_value"
                                                    label=""
                                                    className={
                                                        styles["relative_value"]
                                                    }
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                t(
                                                                    "emptyMessage"
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        precision={0}
                                                        placeholder={t(
                                                            "input.placeholder",
                                                            "请输入"
                                                        )}
                                                        style={{
                                                            width: "140px",
                                                        }}
                                                    />
                                                </FormItem>
                                                <FormItem
                                                    name="relative_unit"
                                                    label=""
                                                    className={
                                                        styles["relative_unit"]
                                                    }
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                t(
                                                                    "emptyMessage"
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        options={options}
                                                        placeholder={t(
                                                            "select.placeholder",
                                                            "请选择"
                                                        )}
                                                        style={{
                                                            width: "140px",
                                                        }}
                                                    ></Select>
                                                </FormItem>
                                            </Space>
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => {
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className={styles.label}>
                                                {t("timeRelative.old_time")}
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {input?.old_time
                                                    ? moment(
                                                        input.old_time / 1000
                                                    ).format(
                                                        "YYYY/MM/DD HH:mm"
                                                    )
                                                    : input?.old_time}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t(
                                                    "timeRelative.relative_type"
                                                )}
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {t(
                                                    `timeRelative.${input.relative_type}`,
                                                    ""
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t(
                                                    "timeRelative.relative_value"
                                                )}
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {input.relative_value +
                                                    t(
                                                        `timeRelative.${input.relative_unit}`,
                                                        ""
                                                    )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                        FormattedOutput: ({
                            t,
                            outputData,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    <tr>
                                        <td className={styles.label}>
                                            {t(
                                                "EATimeRelativeOutputTime",
                                                "新的日期时间"
                                            )}
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {outputData?.new_time
                                                ? moment(
                                                    outputData.new_time / 1000
                                                ).format("YYYY/MM/DD HH:mm")
                                                : ""}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
            ],
        },
        {
            name: "结束算子",
            icon: EndReturnsSVG,
            description: "EReturnsDescription",
            actions: [
                {
                    name: "结束算子",
                    description: "EAReturnsDescription",
                    operator: "@internal/return",
                    icon: EndReturnsSVG,
                    validate(parameters:any) {
                        return Boolean(parameters);
                    },
                    components: {
                        Config: OutputsFormTriggerAction?.components?.Config
                    },
                },
            ],
        },
    ],
    comparators: [
        {
            operator: "@internal/cmp/string-eq",
            type: "string",
            name: "cmp.eq",
        },
        {
            operator: "@internal/cmp/string-neq",
            type: "string",
            name: "cmp.neq",
        },
        {
            operator: "@internal/cmp/string-contains",
            type: "string",
            name: "cmp.stringContains",
            operands: [
                {
                    name: "a",
                    label: "oprand.a",
                    required: true,
                    placeholder: "oprand.a.placeholder",
                    from(parameters) {
                        if (
                            parameters?.a !== undefined &&
                            parameters?.a !== null
                        ) {
                            return String(parameters.a);
                        }
                    },
                },
                {
                    name: "b",
                    label: "oprand.b",
                    required: false,
                    placeholder: "oprand.b.placeholder",
                    from(parameters) {
                        if (
                            parameters?.b !== undefined &&
                            parameters?.b !== null
                        ) {
                            return String(parameters.b);
                        }
                    },
                },
            ],
        },
        {
            operator: "@internal/cmp/string-not-contains",
            type: "string",
            name: "cmp.stringNotContains",
            operands: [
                {
                    name: "a",
                    label: "oprand.a",
                    required: true,
                    placeholder: "oprand.a.placeholder",
                    from(parameters) {
                        if (
                            parameters?.a !== undefined &&
                            parameters?.a !== null
                        ) {
                            return String(parameters.a);
                        }
                    },
                },
                {
                    name: "b",
                    label: "oprand.b",
                    required: false,
                    placeholder: "oprand.b.placeholder",
                    from(parameters) {
                        if (
                            parameters?.b !== undefined &&
                            parameters?.b !== null
                        ) {
                            return String(parameters.b);
                        }
                    },
                },
            ],
        },
        {
            operator: "@internal/cmp/string-empty",
            type: "string",
            name: "cmp.string.empty",
            operands: [
                {
                    name: "a",
                    label: "oprand.a",
                    required: true,
                    placeholder: "oprand.a.placeholder",
                    from(parameters) {
                        if (
                            parameters?.a !== undefined &&
                            parameters?.a !== null
                        ) {
                            return String(parameters.a);
                        }
                    },
                },
            ],
        },
        {
            operator: "@internal/cmp/string-not-empty",
            type: "string",
            name: "cmp.string.nonempty",
            operands: [
                {
                    name: "a",
                    label: "oprand.a",
                    required: true,
                    placeholder: "oprand.a.placeholder",
                    from(parameters) {
                        if (
                            parameters?.a !== undefined &&
                            parameters?.a !== null
                        ) {
                            return String(parameters.a);
                        }
                    },
                },
            ],
        },
        {
            operator: "@internal/cmp/string-start-with",
            type: "string",
            name: "cmp.startWith",
        },
        {
            operator: "@internal/cmp/string-end-with",
            type: "string",
            name: "cmp.endWith",
        },
        {
            operator: "@internal/cmp/string-match",
            type: "string",
            name: "cmp.match",
        },
        {
            operator: "@internal/cmp/number-eq",
            type: "number",
            name: "cmp.eq",
        },
        {
            operator: "@internal/cmp/number-neq",
            type: "number",
            name: "cmp.neq",
        },
        {
            operator: "@internal/cmp/number-lt",
            type: "number",
            name: "cmp.lt",
        },
        {
            operator: "@internal/cmp/number-gte",
            type: "number",
            name: "cmp.gte",
        },
        {
            operator: "@internal/cmp/number-gt",
            type: "number",
            name: "cmp.gt",
        },
        {
            operator: "@internal/cmp/number-lte",
            type: "number",
            name: "cmp.lte",
        },
        {
            operator: "@internal/cmp/date-earlier-than",
            name: "cmp.dateEarlierThan",
            type: "datetime",
        },
        {
            operator: "@internal/cmp/date-later-than",
            name: "cmp.dateLaterThan",
            type: "datetime",
        },
        {
            operator: "@internal/cmp/date-eq",
            name: "cmp.eq",
            type: "datetime",
        },
        {
            operator: "@internal/cmp/date-neq",
            name: "cmp.neq",
            type: "datetime",
        },
    ],
    translations: {
        zhCN,
        zhTW,
        enUS,
        viVN
    },
} as Extension;

interface TextJoinInputProps {
    index: number;
    value?: string;
    removable?: boolean;
    t: TranslateFn;
    onChange?(value: string): void;
    onRemove(): void;
}

const TextJoinInput = forwardRef<Validatable, TextJoinInputProps>(
    ({ index, value, t, removable, onChange, onRemove }, ref) => {
        const initialValues = useRef({ text: value });
        const [form] = Form.useForm();

        useImperativeHandle(
            ref,
            () => {
                return {
                    validate() {
                        return form.validateFields().then(
                            () => true,
                            () => false
                        );
                    },
                };
            },
            [form]
        );

        return (
            <Form
                form={form}
                initialValues={initialValues.current}
                onFieldsChange={(fields) => {
                    if (typeof onChange === "function" && fields.length) {
                        onChange(fields[0].value);
                    }
                }}
            >
                <div className={styles.textJoinTexts}>
                    <FormItem
                        name="text"
                        allowVariable
                        label={t("textJoin.text", {
                            index: index + 1,
                        })}
                        className={styles.textJoinTextFormItem}
                        requiredMark={false}
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <Input
                            autoComplete="off"
                            placeholder={t("textJoin.textPlaceholder")}
                        />
                    </FormItem>
                    {removable ? (
                        <Button
                            type="text"
                            className={styles.textJoinRemove}
                            icon={<MinusCircleOutlined />}
                            onClick={onRemove}
                        />
                    ) : null}
                </div>
            </Form>
        );
    }
);
