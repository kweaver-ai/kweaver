import {
    ExecutorAction,
    TriggerActionConfigProps,
    Validatable,
} from "../../../../components/extension";
import {
    createRef,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import PreParamsSVG from "../../assets/preParams.svg";
import { Button, Checkbox, Form, Input, Select, Typography } from "antd";
import { FormItem } from "../../../../components/editor/form-item";
import { MicroAppContext, TranslateFn } from "@applet/common";
import styles from "./form-trigger.module.less";
import {
    AsAccessorPermColored,
    AsDatetimeColored,
    AsDepartmentsColored,
    AsFileColored,
    AsFolderColored,
    AsFolderPropertiesColored,
    AsLevelColored,
    AsMetadataColored,
    AsMultipleTextColored,
    AsPermColored,
    AsSpaceQuotaColored,
    AsTagsColored,
    AsTextColored,
    AsUsersColored,
    CloseOutlined,
    PlusOutlined,
} from "@applet/icons";
import { customAlphabet } from "nanoid";
import { StrategyMode } from "../../../workflow/approval-executor-action";
import { PolicyContext } from "../../../../plugins/context";
import { FormItemDescription } from "../../../../components/form-item-description";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { HolderOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { ExtensionContext } from "../../../../components/extension-provider";

const nanoid = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    16
);

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

// 预设执行参数组件类型
export const ParamsFieldTypes = [
    "asPerm",
    "datetime",
    "string",
    "long_string",
    "asFile",
    "asFolder",
    "asTags",
    "asMetadata",
    "asAccessorPerms",
    "asLevel",
    "asUsers",
    "asDepartments",
];

const getIcon = (type: string) => {
    switch (type) {
        case "asPerm":
            return <AsPermColored className={styles["type-icon"]} />;
        case "datetime":
            return <AsDatetimeColored className={styles["type-icon"]} />;
        case "string":
            return <AsTextColored className={styles["type-icon"]} />;
        case "long_string":
            return <AsMultipleTextColored className={styles["type-icon"]} />;
        case "asTags":
            return <AsTagsColored className={styles["type-icon"]} />;
        case "asMetadata":
            return <AsMetadataColored className={styles["type-icon"]} />;
        case "asAccessorPerms":
            return <AsAccessorPermColored className={styles["type-icon"]} />;
        case "asLevel":
            return <AsLevelColored className={styles["type-icon"]} />;
        case "asDoc":
            return <AsFileColored className={styles["type-icon"]} />;
        case "asAllowSuffixDoc":
            return (
                <AsFolderPropertiesColored className={styles["type-icon"]} />
            );
        case "asSpaceQuota":
            return <AsSpaceQuotaColored className={styles["type-icon"]} />;
        case "asUsers":
            return <AsUsersColored className={styles["type-icon"]} />;
        case "asDepartments":
            return <AsDepartmentsColored className={styles["type-icon"]} />;
        case "asFile":
            return <AsFileColored className={styles["type-icon"]} />;
        case "asFolder":
            return <AsFolderColored className={styles["type-icon"]} />;
    }
};

const getFieldLabel = (type: string, isSecretMode = false) => {
    if (type === "asAccessorPerms" && isSecretMode) {
        return "formTrigger.field.type.asAccessorPerms.security";
    }
    return `formTrigger.field.type.${type}`;
};

export const FormTriggerAction: ExecutorAction = {
    name: "TAParamsForm",
    description: "TAParamsFormDescription",
    operator: "@trigger/security-policy",
    icon: PreParamsSVG,
    outputs(step) {
        const defaultOutput = [
            {
                key: ".source.id",
                name: "formTrigger.doc",
                type: "asDoc",
            },
            {
                key: ".source.name",
                name: "formTrigger.name",
                type: "string",
            },
            {
                key: ".source.path",
                name: "formTrigger.path",
                type: "string",
            },
            {
                key: ".source.rev",
                name: "formTrigger.rev",
                type: "version",
            },
            {
                key: ".source.type",
                name: "formTrigger.type",
                type: "string",
            },
        ];
        if (Array.isArray(step.parameters?.fields)) {
            return [
                ...defaultOutput,
                {
                    key: ".accessor",
                    name: "formTrigger.accessor",
                    type: "asUser",
                },
                ...step.parameters.fields.map(
                    (field: FormTriggerParameterField) => {
                        // 权限设置节点单独处理
                        return {
                            key: `.fields.${field.key}`,
                            name: field.name,
                            type: field.type,
                            isCustom: true,
                        };
                    }
                ),
            ];
        }
        return [...defaultOutput];
    },
    components: {
        Config: forwardRef<
            Validatable,
            TriggerActionConfigProps<FormTriggerParameter>
        >(({ t, parameters = { fields: [] }, onChange }, ref) => {
            const [form] = Form.useForm<FormTriggerParameter>();
            const refs = useMemo(() => {
                return (
                    parameters?.fields?.map(() => createRef<Validatable>()) ||
                    []
                );
            }, [parameters?.fields]);
            const [isSelecting, setIsSelecting] = useState(false);
            const [isDragging, setIsDragging] = useState(false);
            const { strategyMode, isSecretMode } = useContext(MicroAppContext);
            const { forbidForm } = useContext(PolicyContext);
            const { globalConfig } = useContext(ExtensionContext);

            const isDisabledEdit = useMemo(
                () =>
                    (strategyMode !== StrategyMode.upload &&
                        strategyMode !== StrategyMode.perm) ||
                    (forbidForm === true &&
                        strategyMode === StrategyMode.upload),
                [forbidForm, strategyMode]
            );

            const fieldTypes = useMemo(() => {
                let types = ParamsFieldTypes.slice();
                if (
                    strategyMode === StrategyMode.move ||
                    strategyMode === StrategyMode.copy
                ) {
                    types.push("asDoc");
                }
                if (
                    isSecretMode &&
                    globalConfig["@anyshare/doc/setallowsuffixdoc"] === true
                ) {
                    types.push("asAllowSuffixDoc");
                    types.push("asSpaceQuota");
                }
                return types;
            }, [isSecretMode, strategyMode, globalConfig]);

            useImperativeHandle(
                ref,
                () => {
                    return {
                        validate() {
                            return Promise.all([
                                ...refs.map(
                                    (ref:any) =>
                                        typeof ref.current?.validate !==
                                            "function" ||
                                        ref.current?.validate()
                                ),
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
                    <FormItem className={styles["form-list"]}>
                        <Form.List
                            name="fields"
                            rules={[
                                {
                                    async validator(_, values) {
                                        if (!Array.isArray(values)) {
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

                                                move(
                                                    result.source.index,
                                                    result.destination.index
                                                );
                                            }}
                                        >
                                            <Droppable droppableId="form-droppable">
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={styles["droppable"]}
                                                    >
                                                        {fields.map(
                                                            (field, index) => {
                                                                return (
                                                                    <FormItem
                                                                        {...field}
                                                                    >
                                                                        <FieldInput
                                                                            t={
                                                                                t
                                                                            }
                                                                            index={
                                                                                index
                                                                            }
                                                                            ref={
                                                                                refs[
                                                                                    index
                                                                                ]
                                                                            }
                                                                            fieldTypes={
                                                                                fieldTypes
                                                                            }
                                                                            onClose={() => {
                                                                                if (
                                                                                    isDisabledEdit
                                                                                ) {
                                                                                    return;
                                                                                }
                                                                                remove(
                                                                                    index
                                                                                );
                                                                            }}
                                                                            isDisabledEdit={
                                                                                isDisabledEdit
                                                                            }
                                                                        />
                                                                    </FormItem>
                                                                );
                                                            }
                                                        )}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                        <Form.ErrorList errors={errors} />
                                        {fields.length === 0 && (
                                            <div
                                                className={
                                                    styles["description"]
                                                }
                                            >
                                                {t("formTrigger.description")}
                                            </div>
                                        )}
                                        {!isSelecting && (
                                            <Button
                                                type="link"
                                                icon={
                                                    <PlusOutlined
                                                        className={
                                                            styles["add-icon"]
                                                        }
                                                    />
                                                }
                                                disabled={isDisabledEdit}
                                                className={styles["link-btn"]}
                                                onClick={() =>
                                                    setIsSelecting(true)
                                                }
                                            >
                                                {t(
                                                    "formTrigger.add",
                                                    "添加自定义参数"
                                                )}
                                            </Button>
                                        )}
                                        {isSelecting && (
                                            <div>
                                                <div
                                                    className={
                                                        styles[
                                                            "select-types-placeholder"
                                                        ]
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles[
                                                                "select-types-label"
                                                            ]
                                                        }
                                                    >
                                                        {t(
                                                            "formTrigger.typeSelect",
                                                            "请选择表单组件类型"
                                                        )}
                                                    </span>

                                                    <CloseOutlined
                                                        className={
                                                            styles.removeButton
                                                        }
                                                        onClick={() =>
                                                            setIsSelecting(
                                                                false
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div
                                                    className={
                                                        styles["select-types"]
                                                    }
                                                >
                                                    {fieldTypes.map((type) => (
                                                        <div
                                                            className={
                                                                styles[
                                                                    "type-item"
                                                                ]
                                                            }
                                                            onClick={() => {
                                                                setIsSelecting(
                                                                    false
                                                                );

                                                                add({
                                                                    key: nanoid(),
                                                                    type: type,
                                                                });
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles[
                                                                        "type-icon-wrapper"
                                                                    ]
                                                                }
                                                            >
                                                                {getIcon(type)}
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles[
                                                                        "type-label"
                                                                    ]
                                                                }
                                                            >
                                                                {t(
                                                                    getFieldLabel(
                                                                        type,
                                                                        isSecretMode
                                                                    )
                                                                )}
                                                            </div>
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
        }),
    },
};

interface FieldInputProps {
    t: TranslateFn;
    value?: FormTriggerParameterField;
    index: number;
    fieldTypes: string[];
    onClose(): void;
    onChange?(value: FormTriggerParameterField): void;
    isDisabledEdit: boolean;
}

const FieldInput = forwardRef<Validatable, FieldInputProps>(
    (
        {
            t,
            value,
            index,
            onChange,
            onClose,
            fieldTypes,
            isDisabledEdit = false,
        },
        ref
    ) => {
        const { isSecretMode } = useContext(MicroAppContext);
        const [form] = Form.useForm<FormTriggerParameterField>();
        const [isFocus, setIsFocus] = useState(false);
        const inputRef = useRef<any>(null);

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

        useEffect(() => {
            setIsFocus(false);
            inputRef.current?.blur();
        }, [index]);

        const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
            if (isDragging && draggableStyle?.transform) {
                const translateY = parseFloat(
                    draggableStyle.transform.split("(")[1].split(",")[1]
                );
                const width = parseFloat(draggableStyle.width);
                return {
                    userSelect: "none",
                    cursor: "move",
                    background: "#fff",
                    borderBottom: "none",
                    boxShadow: "0 2px 9px 1px rgba(0, 0, 0, 0.1)",
                    margin: "0 -32px",
                    padding: "48px 32px 16px",
    
                    ...draggableStyle,
                    transform: `translate(${0}px,${translateY}px)`,
                    width: `${width + 64}px`,
                };
            }
            return ({
                userSelect: "none",
                cursor: isDragging ? "move" : "default",
                background: "#fff",
    
                // styles need to apply on draggables
                ...draggableStyle,
            })
        };

        return (
            <Draggable
                key={value?.key}
                draggableId={value!.key}
                index={index}
                isDragDisabled={isDisabledEdit}
            >
                {(provided, snapshot) => (
                    <div
                        className={clsx(styles["fieldInput"], {
                            [styles["isDragging"]]: snapshot.isDragging,
                        })}
                        key={value?.key}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                        )}
                    >
                        <span
                            {...provided.dragHandleProps}
                            className={clsx(styles["draggle-icon"], {
                                [styles["visible"]]: isFocus === true,
                            })}
                        >
                            <HolderOutlined style={{ fontSize: "13px" }} />
                        </span>
                        <span className={styles["fieldIndex"]}>
                            {t("formTrigger.fields", { index: index + 1 })}
                        </span>
                        <CloseOutlined
                            className={styles.removeButton}
                            onClick={onClose}
                            hidden={isDisabledEdit}
                        />
                        <Form
                            form={form}
                            initialValues={value}
                            layout="inline"
                            autoComplete="off"
                            onFocus={() => {
                                setIsFocus(true);
                            }}
                            onBlur={() => {
                                setIsFocus(false);
                            }}
                            disabled={isDisabledEdit}
                            onFieldsChange={(changedFields) => {
                                if (typeof onChange === "function") {
                                    if (
                                        (
                                            changedFields[0].name as string[]
                                        )[0] === "type" &&
                                        changedFields[0].value !== value?.type
                                    ) {
                                        onChange({
                                            ...form.getFieldsValue(),
                                            key: nanoid(),
                                        });
                                    } else {
                                        onChange(form.getFieldsValue());
                                    }
                                }
                            }}
                        >
                            {/* 随机生成的变量名 */}
                            <FormItem name="key" hidden>
                                <Input />
                            </FormItem>
                            <FormItem
                                name="type"
                                style={{ flexGrow: 1, width: "120px" }}
                            >
                                <Select
                                    placeholder={t(
                                        "formTrigger.placeholder.type"
                                    )}
                                    virtual={false}
                                    className={styles["select"]}
                                >
                                    {fieldTypes.map((type) => (
                                        <Select.Option key={type}>
                                            <div
                                                className={
                                                    styles["select-item"]
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles[
                                                            "type-icon-wrapper"
                                                        ]
                                                    }
                                                >
                                                    {getIcon(type)}
                                                </div>
                                                <Typography.Text
                                                    ellipsis
                                                    title={t(
                                                        getFieldLabel(
                                                            type,
                                                            isSecretMode
                                                        )
                                                    )}
                                                    disabled={isDisabledEdit}
                                                >
                                                    {t(
                                                        getFieldLabel(
                                                            type,
                                                            isSecretMode
                                                        )
                                                    )}
                                                </Typography.Text>
                                            </div>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </FormItem>
                            <FormItem
                                name="name"
                                style={{ width: "270px" }}
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                    {
                                        pattern: /^[^\\/:*?"<>|]{1,128}$/,
                                        message: t(
                                            "formTrigger.field.nameInvalid"
                                        ),
                                    },
                                ]}
                            >
                                <Input
                                    autoComplete="off"
                                    ref={inputRef}
                                    placeholder={t(
                                        "formTrigger.placeholder.name"
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                name="description"
                                style={{ marginRight: 0, width: "28px" }}
                            >
                                <FormItemDescription
                                    disable={isDisabledEdit}
                                    allowFileLink={false}
                                />
                            </FormItem>
                            <div className={styles["required-wrapper"]}>
                                <FormItem
                                    name="required"
                                    valuePropName="checked"
                                    noStyle
                                >
                                    <Checkbox>
                                        {t("formTrigger.required")}
                                    </Checkbox>
                                </FormItem>
                            </div>
                        </Form>
                    </div>
                )}
            </Draggable>
        );
    }
);
