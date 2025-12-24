import { createRef, forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button, Form } from "antd";
import { isArray } from "lodash";
import { customAlphabet } from "nanoid";
import { useParams } from "react-router-dom";
import moment from "moment";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { API, useFormatPermText } from "@applet/common";
import {
    AsDatetimeColored,
    AsDepartmentsColored,
    AsFileColored,
    AsFolderColored,
    AsMultipleFilesColored,
    AsMultipleTextColored,
    AsNumberColored,
    AsPermColored,
    AsRadioColored,
    AsTextColored,
    AsUsersColored,
    CloseOutlined,
    PlusOutlined,
} from "@applet/icons";
import { ExecutorAction, ExecutorActionInputProps, ExecutorActionOutputProps, TriggerActionConfigProps, Validatable } from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";
import { FieldInput } from "./components/file-system-trigger";
import FormTriggerSVG from "./assets/form.svg";
import styles from "./form-trigger.module.less";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);

interface FormTriggerParameterField {
    key: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    allowOverride?: boolean;
}

interface FormTriggerParameter {
    fields: FormTriggerParameterField[];
}

const FieldTypes = [
    {
        type: "string",
        label: "formTrigger.field.type.string",
        icon: <AsTextColored className={styles["type-icon"]} />,
    },
    {
        type: "long_string",
        label: "formTrigger.field.type.long_string",
        icon: <AsMultipleTextColored className={styles["type-icon"]} />,
    },
    {
        type: "number",
        label: "formTrigger.field.type.number",
        icon: <AsNumberColored className={styles["type-icon"]} />,
    },
    {
        type: "datetime",
        label: "formTrigger.field.type.datetime",
        icon: <AsDatetimeColored className={styles["type-icon"]} />,
    },

    {
        type: "radio",
        label: "formTrigger.field.type.radio",
        icon: <AsRadioColored className={styles["type-icon"]} />,
    },
    {
        type: "asFile",
        label: "formTrigger.field.type.asFile",
        icon: <AsFileColored className={styles["type-icon"]} />,
    },
    {
        type: "multipleFiles",
        label: "formTrigger.field.type.multipleFiles",
        icon: <AsMultipleFilesColored className={styles["type-icon"]} />,
    },
    {
        type: "asFolder",
        label: "formTrigger.field.type.asFolder",
        icon: <AsFolderColored className={styles["type-icon"]} />,
    },
    // {
    //     type: "asPerm",
    //     label: "formTrigger.field.type.asPerm",
    //     icon: <AsPermColored className={styles["type-icon"]} />,
    // },
    {
        type: "asUsers",
        label: "formTrigger.field.type.asUsers",
        icon: <AsUsersColored className={styles["type-icon"]} />,
    },
    {
        type: "asDepartments",
        label: "formTrigger.field.type.asDepartments",
        icon: <AsDepartmentsColored className={styles["type-icon"]} />,
    },
];

const FormTriggerConfig = forwardRef<Validatable, TriggerActionConfigProps<FormTriggerParameter>>(({ t, parameters, onChange }, ref) => {
    const [form] = Form.useForm<FormTriggerParameter>();
    const [isSelecting, setIsSelecting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const refs = useMemo(() => {
        return parameters?.fields?.map(() => createRef<Validatable>()) || [];
    }, [parameters?.fields]);

    useImperativeHandle(
        ref,
        () => {
            return {
                validate() {
                    return Promise.all([
                        ...refs.map((ref:any) => typeof ref.current?.validate !== "function" || ref.current?.validate()),
                        form.validateFields().then(
                            () => true,
                            () => false
                        ),
                    ]).then((results) => results.every((r) => r));
                },
            };
        },
        [form, refs]
    );

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = "move";
        } else {
            document.body.style.cursor = "default";
        }
        return () => {
            document.body.style.cursor = "default";
        };
    }, [isDragging]);

    return (
        <Form
            form={form}
            initialValues={parameters}
            layout="vertical"
            onFieldsChange={() => {
                if (typeof onChange === "function") {
                    onChange(form.getFieldsValue());
                }
            }}
        >
            <FormItem label={t("formTrigger.fields")} className={styles["form-list"]}>
                <Form.List
                    name="fields"
                    rules={[
                        {
                            async validator(_, values) {
                                if (!Array.isArray(values) || values.length < 1) {
                                    throw new Error(t("emptyMessage"));
                                }
                            },
                        },
                    ]}
                >
                    {(fields, { add, remove, move }, { errors }) => {
                        return (
                            <>
                                <DragDropContext
                                    onDragStart={() => {
                                        setIsDragging(true);
                                    }}
                                    onDragEnd={(result) => {
                                        setIsDragging(false);
                                        if (!result.destination) {
                                            return;
                                        }

                                        move(result.source.index, result.destination.index);
                                    }}
                                >
                                    <Droppable droppableId="form-droppable">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                                {fields.map((field, index) => {
                                                    return (
                                                        <FormItem {...field}>
                                                            <FieldInput t={t} ref={refs[index]} index={index} fieldTypes={FieldTypes} onClose={() => remove(index)} fields={parameters.fields} />
                                                        </FormItem>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                                <Form.ErrorList errors={errors} />
                                {!isSelecting && (
                                    <Button type="link" icon={<PlusOutlined className={styles["add-icon"]} />} className={styles["link-btn"]} onClick={() => setIsSelecting(true)}>
                                        {t("fileTrigger.add", "添加问题")}
                                    </Button>
                                )}
                                {isSelecting && (
                                    <div>
                                        <div className={styles["select-types-placeholder"]}>
                                            <span className={styles["select-types-label"]}>{t("fileTrigger.typeSelect", "请选择问题类型")}</span>

                                            <CloseOutlined className={styles.removeButton} onClick={() => setIsSelecting(false)} />
                                        </div>
                                        <div className={styles["select-types"]}>
                                            {FieldTypes.map((item) => (
                                                <div
                                                    className={styles["type-item"]}
                                                    onClick={() => {
                                                        setIsSelecting(false);

                                                        if (item.type === "radio") {
                                                            add({
                                                                key: nanoid(),
                                                                type: item.type,
                                                                data: ["", ""],
                                                            });
                                                        } else {
                                                            add({
                                                                key: nanoid(),
                                                                type: item.type,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <div className={styles["type-icon-wrapper"]}>{item.icon}</div>
                                                    <div className={styles["type-label"]}>{t(item.label, "")}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    }}
                </Form.List>
            </FormItem>
        </Form>
    );
});

export const FormTriggerAction: ExecutorAction = {
    name: "TAForm",
    description: "TAFormDescription",
    operator: "@trigger/form",
    icon: FormTriggerSVG,
    outputs(step) {
        if (Array.isArray(step.parameters?.fields)) {
            return [
                {
                    key: ".accessor",
                    name: "TAFormOutputAccessor",
                    type: "asUser",
                },
                ...step.parameters.fields.map((field: FormTriggerParameterField) => {
                    return {
                        key: `.fields.${field.key}`,
                        name: field.name,
                        type: field.type,
                        isCustom: true,
                    };
                }),
            ];
        }
        return [];
    },
    components: {
        Config: FormTriggerConfig,
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            return (
                <table>
                    <tbody>
                        {input?.fields?.map((item: FormTriggerParameterField, index: number) => (
                            <>
                                <tr>
                                    <td style={index !== 0 ? { paddingTop: "12px" } : undefined}>
                                        {t("formTrigger.item", {
                                            index: index + 1,
                                        })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>
                                        {t("formTrigger.field.type")}
                                        {t("colon", "：")}
                                    </td>
                                    <td>{t(`formTrigger.field.type.${item.type}`, "")}</td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>
                                        {t("formTrigger.field.name")}
                                        {t("colon", "：")}
                                    </td>
                                    <td>{item.name}</td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>
                                        {t("formTrigger.required")}
                                        {t("colon", "：")}
                                    </td>
                                    <td>{typeof item.required === "boolean" ? t(`required.${item.required}`) : t("required.false")}</td>
                                </tr>
                            </>
                        ))}
                    </tbody>
                </table>
            );
        },
        FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => {
            const [formFields, setFields] = useState<FormTriggerParameterField[]>([]);
            const formatPermText = useFormatPermText();

            const { id: taskId = "" } = useParams();
            const accessor = useMemo(() => {
                let val = outputData?.accessor?.name || "";
                try {
                    val = JSON.parse(outputData?.accessor).name;
                } catch (error) {
                    console.warn(error);
                }
                return val;
            }, [outputData?.accessor]);

            const getValue = (field: FormTriggerParameterField) => {
                const value = outputData.fields[field.key];
                if (!value) {
                    return "---";
                }
                try {
                    switch (field.type) {
                        case "string":
                        case "long_string":
                        case "radio":
                        case "number":
                        case "asFile":
                        case "asFolder":
                            return value || "---";
                        case "multipleFiles":
                            return value?.map((item: string) => <div>{item}</div>);
                        case "datetime":
                            if (typeof value === "string") {
                                return moment(value).format("YYYY/MM/DD HH:mm");
                            }
                            if (!value || value === -1) {
                                return "---";
                            }
                            return value;
                        case "asPerm": {
                            const val = JSON.parse(value);
                            return formatPermText(val);
                        }
                        case "asUsers":
                        case "asDepartments": {
                            if (isArray(value)) {
                                return value.map((i: any) => i.name).join("，");
                            }
                            try {
                                const arr = JSON.parse(value);
                                return arr.map((i: any) => i.name).join("，");
                            } catch (error) {
                                return JSON.stringify(value);
                            }
                        }

                        default:
                            return JSON.stringify(value);
                    }
                } catch (error) {
                    return JSON.stringify(value);
                }
            };

            useEffect(() => {
                async function getFields() {
                    try {
                        const { data } = await API.automation.dagDagIdGet(taskId);
                        setFields((data?.steps[0]?.parameters as Record<string, any>)?.fields);
                    } catch (error) {
                        console.error(error);
                    }
                }
                getFields();
            }, []);

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("TAFormOutputAccessor", "执行者")}
                                {t("colon", "：")}
                            </td>
                            <td>{accessor}</td>
                        </tr>
                        {formFields?.map((field: FormTriggerParameterField) => {
                            const fieldValue = getValue(field);
                            return (
                                <tr>
                                    <td className={styles.label}>
                                        {field?.name}
                                        {t("colon", "：")}
                                    </td>
                                    <td>{typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        },
    },
};

// interface FieldInputProps {
//     t: TranslateFn;
//     value?: FormTriggerParameterField;
//     onClose(): void;
//     onChange?(value: FormTriggerParameterField): void;
// }

// const FieldTypes = [
//     "string",
//     "number",
//     "datetime",
//     "asFile",
//     "multipleFiles",
//     "asFolder",
//     "asPerm",
// ];

// const FieldInput = forwardRef<Validatable, FieldInputProps>(
//     ({ t, value, onChange, onClose }, ref) => {
//         const [form] = Form.useForm<FormTriggerParameterField>();

//         useImperativeHandle(
//             ref,
//             () => {
//                 return {
//                     validate() {
//                         return form.validateFields().then(
//                             () => true,
//                             () => false
//                         );
//                     },
//                 };
//             },
//             [form]
//         );

//         return (
//             <div className={styles.FieldInput}>
//                 <Button
//                     type="text"
//                     icon={<CloseOutlined />}
//                     className={styles.removeButton}
//                     onClick={onClose}
//                 />
//                 <Form
//                     form={form}
//                     initialValues={value}
//                     autoComplete="off"
//                     layout="vertical"
//                     onFieldsChange={(changedFields) => {
//                         if (typeof onChange === "function") {
//                             if (
//                                 (changedFields[0].name as string[])[0] ===
//                                     "type" &&
//                                 changedFields[0].value !== value?.type
//                             ) {
//                                 onChange({
//                                     ...form.getFieldsValue(),
//                                     key: nanoid(),
//                                 });
//                             } else {
//                                 onChange(form.getFieldsValue());
//                             }
//                         }
//                     }}
//                 >
//                     <FormItem name="key" hidden>
//                         <Input />
//                     </FormItem>
//                     <FormItem name="type" label={t("formTrigger.field.type")}>
//                         <Select>
//                             {FieldTypes.map((type) => (
//                                 <Select.Option key={type}>
//                                     {t(`formTrigger.field.type.${type}`)}
//                                 </Select.Option>
//                             ))}
//                         </Select>
//                     </FormItem>
//                     <FormItem
//                         name="name"
//                         label={t("formTrigger.field.name")}
//                         rules={[
//                             {
//                                 required: true,
//                                 message: t("emptyMessage"),
//                             },
//                             {
//                                 pattern: /^[^\\/:*?"<>|]{0,20}$/,
//                                 message: t("formTrigger.field.nameInvalid"),
//                             },
//                         ]}
//                     >
//                         <Input
//                             placeholder={t("formTrigger.field.namePlaceholder")}
//                         />
//                     </FormItem>
//                     <FormItem name="required" valuePropName="checked" noStyle>
//                         <Checkbox>{t("formTrigger.required")}</Checkbox>
//                     </FormItem>
//                 </Form>
//             </div>
//         );
//     }
// );
