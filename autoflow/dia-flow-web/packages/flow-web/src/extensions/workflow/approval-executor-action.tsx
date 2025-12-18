import {
    createRef,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    ExecutorActionOutputProps,
    Validatable,
} from "../../components/extension";
import AuditSVG from "./assets/audit.svg";
import {
    Button,
    Checkbox,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Menu,
} from "antd";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FormItem } from "../../components/editor/form-item";
import {
    TranslateFn,
    AuditFlowKeyConfig,
    AsFileSelect,
    DatePickerISO,
    AsPermSelect,
    MicroAppContext,
    useFormatPermText,
} from "@applet/common";
import { CloseOutlined } from "@applet/icons";
import styles from "./approval-executor-action.module.less";
import { EditorContext } from "../../components/editor/editor-context";
import moment from "moment";
import { isArray, isString } from "lodash";
import { MetadataLog } from "../../components/metadata-template";
import { useTranslateExtension } from "../../components/extension-provider";
import { FormatSuffixType } from "../../components/file-suffixType";
import { formatQuotaToData } from "../../components/params-form/as-quota";
import { HolderOutlined } from "@ant-design/icons";
import clsx from "clsx";
export interface ApprovalExecutorActionParameters {
    title: string;
    workflow: string;
    contents: ApprovalContentType[];
}

export enum StrategyMode {
    "perm" = "perm",
    "upload" = "upload",
    "delete" = "delete",
    "rename" = "rename",
    "move" = "move",
    "copy" = "copy",
    "modify_folder_property" = "modify_folder_property",
}

// 对应审核类型为`security_policy_${mode}`
const AllStrategyMode = [
    "perm",
    "upload",
    "delete",
    "rename",
    "move",
    "copy",
    "modify_folder_property",
];

export type ConsoleApprovalTypes =
    | "asDoc"
    | "datetime"
    | "long_string"
    | "asFile"
    | "asFolder"
    | "asTags"
    | "asMetadata"
    | "asAccessorPerms"
    | "asLevel"
    | "asAllowSuffixDoc"
    | "asSpaceQuota";

type clientApprovalType =
    | "string"
    | "asFile"
    | "multipleFiles"
    | "asFolder"
    | "datetime"
    | "number"
    | "asPerm"
    | "asTags"
    | "asMetadata"
    | "asUsers"
    | "asDepartments";

interface ApprovalContentType {
    type: clientApprovalType | ConsoleApprovalTypes;
    title: string;
    value: any;
    allowModifyByAuditor?: boolean;
}

const getApproveLabel = (type: string, isSecretMode = false) => {
    if (type === "asAccessorPerms" && isSecretMode) {
        return "approval.asAccessorPerms.security";
    }
    return `approval.${type}`;
};

export const ApprovalExecutorAction: ExecutorAction = {
    name: "EAApproval",
    description: "EAApprovalDescription",
    operator: "@workflow/approval",
    icon: AuditSVG,
    validate(parameters) {
        return parameters && parameters?.workflow;
    },
    components: {
        Config: forwardRef(
            (
                {
                    t,
                    parameters = {
                        title: "",
                        workflow: "",
                        contents: [],
                    },
                    onChange,
                }: ExecutorActionConfigProps<ApprovalExecutorActionParameters>,
                ref
            ) => {
                const { getPopupContainer } = useContext(EditorContext);
                const { platform, microWidgetProps, isSecretMode } =
                    useContext(MicroAppContext);
                const [isDragging, setIsDragging] = useState(false);

                const [form] = Form.useForm<ApprovalExecutorActionParameters>();
                const refs = useMemo(
                    () =>
                        (parameters?.contents || [])?.map(() =>
                            createRef<Validatable>()
                        ),
                    [parameters]
                );

                useEffect(() => {
                    if (
                        platform === "console" &&
                        parameters.contents.length === 0
                    ) {
                        form.setFieldValue("contents", [
                            {
                                type: "asDoc",
                                title: "文档",
                                value: "{{__0.source.id}}",
                            },
                        ]);
                        onChange({
                            title: "",
                            workflow: "",
                            contents: [
                                {
                                    title: "文本",
                                    type: "long_string",
                                    value: undefined,
                                },
                            ],
                        });
                    }
                }, []);

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

                const audit_type = useMemo(() => {
                    const mode = microWidgetProps?.mode;
                    if (
                        platform === "console" &&
                        mode &&
                        AllStrategyMode.includes(mode)
                    ) {
                        return `security_policy_${mode}`;
                    }
                    return "automation";
                }, [microWidgetProps?.mode, platform]);

                useImperativeHandle(
                    ref,
                    () => {
                        return {
                            validate() {
                                return Promise.all([
                                    ...refs.map(
                                        (ref) =>
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

                const addMenuItems = useMemo(
                    () =>
                        Array.from(
                            platform === "console"
                                ? [
                                      "asDoc",
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
                                      isSecretMode ? "asAllowSuffixDoc" : "",
                                      isSecretMode ? "asSpaceQuota" : "",
                                  ].filter(Boolean)
                                : [
                                      "string",
                                      "long_string",
                                      "datetime",
                                      "number",
                                      "asFile",
                                      "multipleFiles",
                                      "asFolder",
                                    //   "asPerm",
                                    //   "asTags",
                                    //   "asMetadata",
                                    //   "asLevel",
                                      "asUsers",
                                      "asDepartments",
                                  ],
                            (key) => ({
                                key,
                                label: t(getApproveLabel(key, isSecretMode)),
                            })
                        ),
                    []
                );

                return (
                    <Form
                        form={form}
                        layout="vertical"
                        autoComplete="off"
                        initialValues={parameters}
                        onFieldsChange={() => {
                            onChange(form.getFieldsValue());
                        }}
                        className={styles["form"]}
                    >
                        {platform === "client" && (
                            <FormItem
                                label={t("approval.title")}
                                name="title"
                                allowVariable
                                type="string"
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                    {
                                        max: 256,
                                        message: t("maxLengthMessage", {
                                            length: 256,
                                        }),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={t("approval.titlePlaceholder")}
                                />
                            </FormItem>
                        )}
                        <FormItem
                            label={t("approval.workflow")}
                            name="workflow"
                            rules={[
                                { required: true, message: t("emptyMessage") },
                            ]}
                        >
                            <AuditFlowKeyConfig
                                drawerStyle={
                                    platform === "client"
                                        ? { position: "absolute" }
                                        : undefined
                                }
                                drawerClassName={
                                    platform === "client"
                                        ? styles.AuditFlowDrawer
                                        : undefined
                                }
                                getPopupContainer={getPopupContainer}
                                processType={audit_type}
                                allowOwnerAuditor={true}
                                onlyOwnerAuditor={
                                    microWidgetProps?.mode ===
                                        StrategyMode.perm ||
                                    microWidgetProps?.mode ===
                                        StrategyMode.upload
                                }
                                platform={platform}
                            />
                        </FormItem>
                        <FormItem label={t("approval.contents")} required>
                            <Form.List
                                name="contents"
                                rules={[
                                    {
                                        async validator(_, value) {
                                            if (!value || value.length < 1) {
                                                throw new Error(
                                                    t("emptyMessage")
                                                );
                                            }
                                        },
                                    },
                                ]}
                            >
                                {(
                                    fields,
                                    { add, remove, move },
                                    { errors }
                                ) => {
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
                                                            ref={
                                                                provided.innerRef
                                                            }
                                                        >
                                                            {fields.map(
                                                                (
                                                                    field,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <FormItem
                                                                            {...field}
                                                                        >
                                                                            <ApprovalContent
                                                                                ref={
                                                                                    refs[
                                                                                        index
                                                                                    ]
                                                                                }
                                                                                t={
                                                                                    t
                                                                                }
                                                                                index={
                                                                                    index
                                                                                }
                                                                                onClose={() =>
                                                                                    remove(
                                                                                        index
                                                                                    )
                                                                                }
                                                                            />
                                                                        </FormItem>
                                                                    );
                                                                }
                                                            )}
                                                            {
                                                                provided.placeholder
                                                            }
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                            <Form.ErrorList errors={errors} />
                                            <Dropdown
                                                overlay={
                                                    <Menu
                                                        className={
                                                            styles[
                                                                "dropdown-menu"
                                                            ]
                                                        }
                                                        items={addMenuItems}
                                                        onClick={(e) =>
                                                            add({
                                                                type: e.key,
                                                                title: t(
                                                                    getApproveLabel(
                                                                        e.key,
                                                                        isSecretMode
                                                                    )
                                                                ),
                                                                value: undefined,
                                                            })
                                                        }
                                                    />
                                                }
                                            >
                                                <Button>
                                                    {t("approval.addContent")}
                                                </Button>
                                            </Dropdown>
                                        </>
                                    );
                                }}
                            </Form.List>
                        </FormItem>
                    </Form>
                );
            }
        ),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const formatPermText = useFormatPermText();
            const te = useTranslateExtension("anyshare");
            const getValue = (field: ApprovalContentType) => {
                const value = field.value;
                if (!value) {
                    return "---";
                }
                try {
                    switch (field.type) {
                        case "string":
                        case "number":
                        case "asFile":
                        case "asFolder":
                            return value || "---";
                        case "asSpaceQuota":
                            return formatQuotaToData(value) + "GB";
                        case "asAllowSuffixDoc":
                            return <FormatSuffixType types={value} />;
                        case "multipleFiles":
                            return value?.map((item: string) => (
                                <div>{item}</div>
                            ));
                        case "datetime":
                            if (typeof value === "string") {
                                return moment(value).format("YYYY/MM/DD HH:mm");
                            }
                            if (!value || value === -1) {
                                return t("neverExpires");
                            }
                            return value;
                        case "asPerm": {
                            const val = JSON.parse(value);
                            return formatPermText(val);
                        }
                        case "asTags": {
                            if (isArray(value)) {
                                return value.join("，");
                            }
                            try {
                                const arr = JSON.parse(value);
                                return arr.join("，");
                            } catch (error) {
                                return JSON.stringify(value);
                            }
                        }
                        case "asMetadata": {
                            let templates = value;
                            if (isString(templates)) {
                                try {
                                    templates = JSON.parse(templates);
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                            return <MetadataLog t={te} templates={templates} />;
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
                            return value ? JSON.stringify(value) : "---";
                    }
                } catch (error) {
                    return value ? JSON.stringify(value) : "---";
                }
            };

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("approval.title")}
                                {t("colon", "：")}
                            </td>
                            <td>{input?.title}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                {t("approval.workflow") + " Key"}
                                {t("colon", "：")}
                            </td>
                            <td>{input?.workflow}</td>
                        </tr>
                        {input?.contents?.map(
                            (item: ApprovalContentType, index: number) => {
                                return (
                                    <>
                                        <tr>
                                            <td style={{ paddingTop: "12px" }}>
                                                {t("approval.contents") +
                                                    " " +
                                                    String(index + 1)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t(
                                                    "approval.contentType",
                                                    "审核内容类型"
                                                )}
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {t(`approval.${item.type}`, "")}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t(
                                                    "approval.contentTitle",
                                                    "标题"
                                                )}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{item.title}</td>
                                        </tr>
                                        {typeof item?.allowModifyByAuditor ===
                                            "boolean" && (
                                            <tr>
                                                <td className={styles.label}>
                                                    {t(
                                                        "approval.allowModifyByAuditor",
                                                        "允许审核员修改"
                                                    )}
                                                    {t("colon", "：")}
                                                </td>
                                                <td>
                                                    {t(
                                                        `approval.allowModifyByAuditor.${item.allowModifyByAuditor}`
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className={styles.label}>
                                                {t(`approval.${item.type}`, "")}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{getValue(item)}</td>
                                        </tr>
                                    </>
                                );
                            }
                        )}
                    </tbody>
                </table>
            );
        },
        FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => {
            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("EAApprovalResult", "审核结果")}
                                {t("colon", "：")}
                            </td>
                            <td>{t(`${outputData.result}`, "---")}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
    },
    outputs: (step, { t }) => {
        return [
            {
                key: ".result",
                name: "EAApprovalResult",
                type: "approval-result",
            },
            ...(step?.parameters?.contents?.map((item: any, index: number) => ({
                key: `.contents_${index}.value`,
                name: t("approval.variableName", { name: item.title }),
                type: item.type,
                isCustom: true,
            })) || []),
        ];
    },
};

interface ApprovalContentProps {
    t: TranslateFn;
    value?: ApprovalContentType;
    index: number;
    onClose(): void;
    onChange?(value: ApprovalContentType): void;
}

const ApprovalContent = forwardRef<Validatable, ApprovalContentProps>(
    ({ t, value, onChange, onClose, index }, ref) => {
        const { isSecretMode, platform } = useContext(MicroAppContext);
        const [form] = Form.useForm<ApprovalContentType>();
        const [isFocus, setIsFocus] = useState(false);

        useEffect(() => {
            setIsFocus(false);
        }, [index]);

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

        const contentType = Form.useWatch("type", form);

        const formItemType = useMemo(() => {
            if (value?.type === "string") {
                return ["string", "radio"];
            }
            return value?.type;
        }, [value?.type]);

        const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
            if (draggableStyle?.transform) {
                const translateY = parseFloat(
                    draggableStyle.transform.split("(")[1].split(",")[1]
                );
                return {
                    userSelect: "none",
                    cursor: isDragging ? "move" : "default",
                    boxShadow: isDragging
                        ? "0 2px 9px 1px rgba(0, 0, 0, 0.1)"
                        : undefined,
                    ...draggableStyle,
                    transform: `translate(${0}px,${translateY}px)`,
                };
            }
            return {
                userSelect: "none",
                cursor: isDragging ? "move" : "default",
                boxShadow: isDragging
                    ? "0 2px 9px 1px rgba(0, 0, 0, 0.1)"
                    : undefined,

                // styles need to apply on draggables
                ...draggableStyle,
            };
        };

        const focusHandlers = {
            onFocus: () => {
                setIsFocus(true);
            },
            onBlur: () => {
                setIsFocus(false);
            },
        };

        return (
            <Draggable
                key={`${index}_${value?.type}`}
                draggableId={`${index}_${value?.type}`}
                index={index}
            >
                {(provided, snapshot) => (
                    <div
                        className={clsx(styles["ApprovalContent"], {
                            [styles["isDragging"]]: snapshot.isDragging,
                        })}
                        key={`${index}_${value?.type}`}
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
                        <div className={styles.ApprovalContentHeader}>
                            <span className={styles.ApprovalContentTitle}>
                                {t(getApproveLabel(contentType, isSecretMode))}
                            </span>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                className={styles.removeButton}
                                onClick={onClose}
                            />
                        </div>
                        <Form
                            form={form}
                            initialValues={value}
                            autoComplete="off"
                            onFieldsChange={() => {
                                if (typeof onChange === "function") {
                                    onChange(form.getFieldsValue());
                                }
                            }}
                            {...focusHandlers}
                        >
                            <FormItem name="type" hidden>
                                <Input />
                            </FormItem>
                            <FormItem
                                name="title"
                                label={t("approval.contentTitle")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={t(
                                        "approval.contentTitlePlaceholder"
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                name="value"
                                label={
                                    value?.type === "asAccessorPerms"
                                        ? t("approvalContent.asAccessorPerms")
                                        : t(`approval.${value?.type}`)
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                ]}
                                allowVariable
                                type={formItemType}
                            >
                                {(() => {
                                    switch (value?.type) {
                                        case "number":
                                            return (
                                                <InputNumber
                                                    autoComplete="off"
                                                    style={{ width: "100%" }}
                                                    placeholder={t(
                                                        "form.placeholder",
                                                        "请输入"
                                                    )}
                                                    precision={0}
                                                    min={1}
                                                />
                                            );
                                        case "asFile":
                                            return (
                                                <AsFileSelect
                                                    selectType={1}
                                                    multiple={false}
                                                    readOnly={platform === "console"}
                                                    selectButtonText={t(
                                                        "select"
                                                    )}
                                                    title={t(
                                                        "selectFile",
                                                        "选择文件"
                                                    )}
                                                    omitUnavailableItem
                                                    omittedMessage={t(
                                                        "unavailableFilesOmitted"
                                                    )}
                                                    placeholder={t(
                                                        "fileSelectPlaceholder"
                                                    )}
                                                />
                                            );
                                        case "asFolder":
                                            return (
                                                <AsFileSelect
                                                    selectType={2}
                                                    multiple={false}
                                                    readOnly={platform === "console"}
                                                    selectButtonText={t(
                                                        "select"
                                                    )}
                                                    title={t(
                                                        "selectFolder",
                                                        "选择文件夹"
                                                    )}
                                                    omitUnavailableItem
                                                    omittedMessage={t(
                                                        "unavailableFilesOmitted"
                                                    )}
                                                    placeholder={t(
                                                        "folderSelectPlaceholder"
                                                    )}
                                                />
                                            );
                                        case "asPerm":
                                            return <AsPermSelect />;
                                        case "datetime":
                                            return (
                                                <DatePickerISO
                                                    showTime
                                                    popupClassName="automate-oem-primary"
                                                    style={{ width: "100%" }}
                                                />
                                            );
                                        case "long_string":
                                            return (
                                                <Input.TextArea
                                                    className={
                                                        styles["textarea"]
                                                    }
                                                    placeholder={t(
                                                        "form.placeholder",
                                                        "请输入"
                                                    )}
                                                />
                                            );
                                        case "string":
                                            return (
                                                <Input
                                                    placeholder={t(
                                                        "approval.content.stringPlaceholder"
                                                    )}
                                                />
                                            );
                                        default:
                                            return (
                                                <Input
                                                    readOnly
                                                    placeholder={t(
                                                        "selectParams"
                                                    )}
                                                />
                                            );
                                    }
                                })()}
                            </FormItem>
                            <FormItem
                                name="allowModifyByAuditor"
                                valuePropName="checked"
                                hidden={
                                    !["string", "long_string"].includes(
                                        contentType
                                    )
                                }
                            >
                                <Checkbox>
                                    {t("approval.allowModifyByAuditor")}
                                </Checkbox>
                            </FormItem>
                        </Form>
                    </div>
                )}
            </Draggable>
        );
    }
);
