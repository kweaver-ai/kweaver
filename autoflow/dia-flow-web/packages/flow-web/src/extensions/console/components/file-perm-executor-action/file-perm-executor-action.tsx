import {
    FC,
    createRef,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
    Validatable,
} from "../../../../components/extension";
import FileSVG from "../../assets/file.svg";
import { Button, Form, Input, Radio } from "antd";
import { FormItem } from "../../../../components/editor/form-item";
import { AsFileSelect } from "../../../../components/as-file-select";
import {
    TranslateFn,
    AsPermSelect,
    AsUserSelectItem,
    MicroAppContext,
} from "@applet/common";
import styles from "./file-perm-executor-action.module.less";
import { CloseOutlined, PlusOutlined } from "@applet/icons";
import { FormDatePicker } from "../../../../components/params-form/date-picker";

export interface FilePermExecutorActionParameters {
    useAppid?: boolean;
    appid?: string;
    apppwd?: string;
    docid: string;
    inherit: boolean;
    type: "asPerm" | "asAccessorPerms";
    asAccessorPerms: any;
    perminfos: PermInfoValue[];
}

export const FilePermExecutorAction: ExecutorAction = {
    name: "EAFilePerm",
    description: "EAFilePermDescription",
    operator: "@anyshare/doc/perm",
    icon: FileSVG,
    validate(parameters) {
        return parameters && parameters?.docid;
    },
    components: {
        Config: forwardRef(
            (
                {
                    t,
                    parameters = {
                        useAppid: false,
                        appid: "",
                        apppwd: "",
                        docid: "",
                        inherit: true,
                        type: "asAccessorPerms",
                        asAccessorPerms: "",
                        perminfos: [{}],
                    },
                    onChange,
                }: ExecutorActionConfigProps<FilePermExecutorActionParameters>,
                ref
            ) => {
                const [form] = Form.useForm<FilePermExecutorActionParameters>();
                const refs = useMemo(
                    () =>
                        (parameters?.perminfos || [])?.map(() =>
                            createRef<Validatable>()
                        ),
                    [parameters]
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
                    [refs, form]
                );

                return (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={parameters}
                        onFieldsChange={() => {
                            onChange(form.getFieldsValue());
                        }}
                    >
                        <FormItem
                            required
                            label={t("filePerm.source")}
                            name="docid"
                            allowVariable
                            type="asDoc"
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                },
                            ]}
                        >
                            <AsFileSelect
                                title={t("fileSelectTitle")}
                                multiple={false}
                                omitUnavailableItem
                                selectType={1}
                                placeholder={t("filePerm.sourcePlaceholder")}
                                selectButtonText={t("select")}
                                readOnly
                            />
                        </FormItem>
                        <FormItem
                            required
                            label={t("filePerm.rule")}
                            name="type"
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                },
                            ]}
                        >
                            <PermRule t={t} refs={refs} />
                        </FormItem>
                    </Form>
                );
            }
        ),
    },
};

interface PermRuleProps {
    t: TranslateFn;
    refs: React.RefObject<Validatable>[];
    value?: string;
    onChange?: (value: string) => void;
}

const PermRule: React.FC<PermRuleProps> = ({ t, refs, value, onChange }) => {
    return (
        <div className={styles["perm-rule"]}>
            <div style={{ marginBottom: "8px" }}>
                <Radio
                    value="asAccessorPerms"
                    checked={value === "asAccessorPerms"}
                    onClick={() => {
                        onChange && onChange("asAccessorPerms");
                    }}
                >
                    {t("rule.whole")}
                </Radio>
            </div>
            {value === "asAccessorPerms" && (
                <div>
                    <FormItem
                        label=""
                        name="asAccessorPerms"
                        allowVariable
                        type="asAccessorPerms"
                        className={styles["asAccessorPerms"]}
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <Input readOnly placeholder={t("selectParams")} />
                    </FormItem>
                </div>
            )}
            <div>
                <Radio
                    value="asPerm"
                    checked={value === "asPerm"}
                    onClick={() => {
                        onChange && onChange("asPerm");
                    }}
                >
                    {t("rule.detail")}
                </Radio>
            </div>
            {value === "asPerm" && (
                <div className={styles["asPerm"]}>
                    <FormItem
                        label={
                            <span style={{ fontWeight: "bold" }}>
                                {t("filePerm.inherit")}
                            </span>
                        }
                        name="inherit"
                        required
                        className={styles["inherit"]}
                        initialValue={true}
                    >
                        <Radio.Group>
                            <Radio value={true}>{t("filePerm.enable")}</Radio>
                            <Radio value={false}>{t("filePerm.disable")}</Radio>
                        </Radio.Group>
                    </FormItem>
                    <FormItem
                        label={
                            <span style={{ fontWeight: "bold" }}>
                                {t("filePerm.perminfo")}
                            </span>
                        }
                        required
                    >
                        <Form.List name="perminfos">
                            {(fields, { add, remove }, { errors }) => {
                                return (
                                    <>
                                        {fields.map((field, index) => (
                                            <FormItem
                                                {...field}
                                                className={styles["perminfo"]}
                                            >
                                                <PermInfo
                                                    t={t}
                                                    index={index}
                                                    length={fields.length}
                                                    ref={refs[index]}
                                                    onClose={() =>
                                                        remove(index)
                                                    }
                                                />
                                            </FormItem>
                                        ))}
                                        <Form.ErrorList errors={errors} />
                                        <Button
                                            type="link"
                                            icon={
                                                <PlusOutlined
                                                    className={
                                                        styles["add-icon"]
                                                    }
                                                />
                                            }
                                            className={styles["link-btn"]}
                                            onClick={() =>
                                                add({
                                                    perm: undefined,
                                                })
                                            }
                                        >
                                            {t(
                                                "filePerm.addPerm",
                                                "添加访问者"
                                            )}
                                        </Button>
                                    </>
                                );
                            }}
                        </Form.List>
                    </FormItem>
                </div>
            )}
        </div>
    );
};

interface PermValue {
    allow: string[];
    deny: string[];
}

interface PermInfoValue {
    accessor?: AsUserSelectItem;
    perm?: PermValue;
    endtime?: string;
}

interface PermInfoProps {
    t: TranslateFn;
    value?: PermInfoValue;
    length: number;
    index: number;
    onChange?: (value: PermInfoValue) => void;
    onClose?(): void;
}

const PermInfo = forwardRef<Validatable, PermInfoProps>(
    ({ t, value, length, index, onChange, onClose }, ref) => {
        const [form] = Form.useForm<PermInfoValue>();

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

        useLayoutEffect(() => {
            if (value) {
                form.setFieldsValue(value);
            }
        }, [value]);

        return (
            <div className={styles.PermInfo}>
                <span className={styles["accessorNum"]}>
                    {t("filePerm.accessorNum", { index: index + 1 })}
                </span>
                {length > 1 && (
                    <Button
                        className={styles.removeButton}
                        icon={<CloseOutlined />}
                        type="text"
                        size="small"
                        onClick={onClose}
                    />
                )}
                <Form
                    form={form}
                    onFieldsChange={() => {
                        if (typeof onChange === "function") {
                            onChange(form.getFieldsValue());
                        }
                    }}
                >
                    <FormItem
                        label={t("filePerm.accessor")}
                        name="accessor"
                        allowVariable
                        type="asUser"
                        required
                        requiredMark
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <AccessorSelect t={t} />
                    </FormItem>
                    <FormItem
                        label={t("filePerm.perm")}
                        name="perm"
                        required
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                        allowVariable
                        type="asPerm"
                    >
                        <AsPermSelect />
                    </FormItem>
                    <FormItem
                        name="endtime"
                        label={t("filePerm.expireTime")}
                        allowVariable
                        type="datetime"
                        className={styles["required-mark"]}
                    >
                        <FormDatePicker
                            style={{ width: "100%" }}
                            showTime
                            showNow={false}
                            popupClassName="automate-oem-primary"
                        />
                    </FormItem>
                </Form>
            </div>
        );
    }
);

interface IAccessor {
    id: string;
    type: "user" | "department";
    name: string;
}

interface AccessorSelectProps {
    t: TranslateFn;
    value?: AsUserSelectItem;
    onChange?: (value?: AsUserSelectItem) => void;
}

const AccessorSelect: FC<AccessorSelectProps> = ({ t, value, onChange }) => {
    // const users = useMemo(() => value && [value], [value]);
    const { microWidgetProps } = useContext(MicroAppContext);
    const ref = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        microWidgetProps?.unmountComponent(ref.current);
    };

    const formatAddOperator = (data: any[]): IAccessor[] => {
        return data.map((item) => ({
            id: item.id,
            type: item.type,
            name: item.name,
        }));
    };

    // 处理选择用户和部门的信息
    const handlePick = async (data: any[]) => {
        const newAccessors = formatAddOperator(data);
        // 过滤重复用户
        onChange && onChange(newAccessors[0]);
        handleClose();
    };

    // 组织架构选择弹窗
    const pickOrganization = () => {
        microWidgetProps?.mountComponent({
            component: microWidgetProps?.components?.OrgAndGroupPicker,
            props: {
                title: t("filePerm.accessorPlaceholder", "请选择"),
                isMult: false,
                isSingleChoice: true,
                nodeType: [0, 1, 2], // 选择用户、部门
                tabType: ["org", "group"],
                onRequestConfirm: handlePick,
                onRequestCancel: handleClose,
            },
            element: ref.current,
        });
    };

    return (
        <>
            <div ref={ref} />
            <div className={styles.UserSelectRender}>
                <Input
                    readOnly
                    value={value?.name || value?.id}
                    className={styles.input}
                    placeholder={t("filePerm.accessorPlaceholder")}
                />
                <Button onClick={pickOrganization}>{t("select")}</Button>
            </div>
        </>
    );
};
