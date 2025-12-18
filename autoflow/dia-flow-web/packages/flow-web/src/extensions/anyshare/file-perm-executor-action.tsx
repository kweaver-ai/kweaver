import {
    FC,
    createRef,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    Validatable,
} from "../../components/extension";
import FileSVG from "./assets/file.svg";
import FolderSVG from "./assets/folder.svg"
import {
    Button,
    Checkbox,
    Divider,
    Form,
    Input,
    Radio,
    Typography,
} from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import {
    TranslateFn,
    AsUserSelect,
    AsPermSelect,
    AsUserSelectItem,
    DatePickerISO,
    useFormatPermText,
} from "@applet/common";
import styles from "./file-perm-executor-action.module.less";
import { CloseOutlined } from "@applet/icons";
import moment from "moment";

export interface FilePermExecutorActionParameters {
    useAppid?: boolean;
    appid?: string;
    apppwd?: string;
    docid: string;
    inherit: boolean;
    config_inherit: boolean;
    perminfos: PermInfo[];
}

const AppPassword: FC<{
    placeholder?: string;
    value?: string;
    hasAppid?: boolean;
    onChange?: (value?: string) => void;
}> = ({ value, onChange, hasAppid, placeholder }) => {
    const [password, setPassword] = useState(hasAppid ? "******" : "");
    return (
        <Input.Password
            value={password}
            placeholder={placeholder}
            onFocus={() => {
                setPassword("");
            }}
            onBlur={() => {
                setPassword(value ? "******" : "");
            }}
            onChange={(e) => {
                onChange && onChange(e.target.value);
                setPassword(e.target.value);
            }}
        />
    );
};

export const FilePermExecutorAction: ExecutorAction = {
    name: "EAFilePerm",
    description: "EAFilePermDescription",
    operator: "@anyshare/file/perm",
    group: "file",
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
                        config_inherit: false,
                        perminfos: [],
                    },
                    onChange,
                }: ExecutorActionConfigProps<FilePermExecutorActionParameters>,
                ref
            ) => {
                const [form] = Form.useForm<FilePermExecutorActionParameters>();
                const [hasAppid] = useState(() => !!parameters.appid);
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
                            type="asFile"
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
                                omittedMessage={t(
                                    "unavailableFilesOmitted"
                                )}
                                selectType={1}
                                placeholder={t("filePerm.sourcePlaceholder")}
                                selectButtonText={t("select")}
                            />
                        </FormItem>
                        <FormItem
                            name="config_inherit"
                            label={t("filePerm.config_inherit", "是否设置继承权限")}
                            className={styles['radio-config']}
                        >
                            <Radio.Group>
                                <Radio value={false}>{t('filePerm.config_disable', '不设置')}</Radio><br />
                                <Radio value={true} className={styles['radio-config-set']}>{t('filePerm.config_enable', '设置')}</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem
                            label={''}
                            name="inherit"
                            className={styles['radio-inherit']}
                            style={{ display: (form.getFieldValue('config_inherit') || parameters?.config_inherit) ? 'block' : 'none' }}
                        >
                            <Radio.Group>
                                <Radio value={true}>
                                    {t("filePerm.enable")}
                                </Radio>
                                <Radio value={false}>
                                    {t("filePerm.disable")}
                                </Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label={t("filePerm.perminfo")} className={styles['perminfo']}>
                            <Form.List name="perminfos">
                                {(fields, { add, remove }, { errors }) => {
                                    return (
                                        <>
                                            {fields.map((field, index) => (
                                                <FormItem {...field}>
                                                    <PermInfo
                                                        t={t}
                                                        ref={refs[index]}
                                                        onClose={() =>
                                                            remove(index)
                                                        }
                                                    />
                                                </FormItem>
                                            ))}
                                            <Form.ErrorList errors={errors} />
                                            <Button
                                                onClick={() =>
                                                    add({
                                                        perm: {
                                                            allow: [
                                                                "display",
                                                                "preview",
                                                            ],
                                                            deny: [],
                                                        },
                                                    })
                                                }
                                            >
                                                {t("filePerm.addPerm")}
                                            </Button>
                                        </>
                                    );
                                }}
                            </Form.List>
                        </FormItem>
                        {/**
                        <Divider />
                        <FormItem name="useAppid" valuePropName="checked">
                            <Checkbox>{t("filePerm.useAppid")}</Checkbox>
                        </FormItem>
                        <FormItem
                            label={t("filePerm.appid")}
                            name="appid"
                            type="string"
                            hidden={!parameters.useAppid}
                            rules={[
                                {
                                    required: parameters.useAppid,
                                    message: t("emptyMessage"),
                                },
                            ]}
                        >
                            <Input
                                placeholder={t("filePerm.appidPlaceholder")}
                            />
                        </FormItem>
                        <FormItem
                            label={t("filePerm.apppwd")}
                            name="apppwd"
                            type="string"
                            hidden={!parameters.useAppid}
                            rules={[
                                {
                                    required: parameters.useAppid,
                                    message: t("emptyMessage"),
                                },
                            ]}
                        >
                            <AppPassword
                                placeholder={t("filePerm.apppwdPlaceholder")}
                                hasAppid={hasAppid}
                            />
                        </FormItem>
                         */}
                    </Form>
                );
            }
        ),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const formatPermText = useFormatPermText();

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 2,
                                    }}
                                    className="applet-table-label"
                                    title={t("filePerm.source") + t("id", "ID")}
                                >
                                    {t("filePerm.source") + t("id", "ID")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>{input?.docid}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 2,
                                    }}
                                    className="applet-table-label"
                                    title={t("filePerm.inherit")}
                                >
                                    {t("filePerm.inherit")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>
                                {t(`filePerm.${input.inherit ? "enable" : "disable"}`, "")}
                            </td>
                        </tr>
                        {input?.perminfos?.map(
                            (item: PermInfo, index: number) => (
                                <>
                                    <tr>
                                        <td
                                            className={styles.label}
                                            style={
                                                index !== 0
                                                    ? { paddingTop: "8px" }
                                                    : undefined
                                            }
                                        >
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.accessor")}
                                            >
                                                {t("filePerm.accessor")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.accessor === "string"
                                                ? JSON.parse(item?.accessor)
                                                    ?.name
                                                : item?.accessor?.name ||
                                                JSON.stringify(
                                                    item?.accessor
                                                )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={styles.label}>
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.expireTime")}
                                            >
                                                {t("filePerm.expireTime")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.endtime === "string"
                                                ? moment(item.endtime).format(
                                                    "YYYY/MM/DD HH:mm"
                                                )
                                                : t("neverExpires")}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={styles.label}>
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.perminfo")}
                                            >
                                                {t("filePerm.perminfo")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.perm === "string"
                                                ? formatPermText(
                                                    JSON.parse(
                                                        item?.perm as string
                                                    )
                                                )
                                                : formatPermText(
                                                    item?.perm as any
                                                )}
                                        </td>
                                    </tr>
                                </>
                            )
                        )}
                    </tbody>
                </table>
            );
        },
    },
};

export const FolderPermExecutorAction: ExecutorAction = {
    name: "EAFolderPerm",
    description: "EAFolderPermDescription",
    operator: "@anyshare/folder/perm",
    group: "folder",
    icon: FolderSVG,
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
                        config_inherit: false,
                        perminfos: [],
                    },
                    onChange,
                }: ExecutorActionConfigProps<FilePermExecutorActionParameters>,
                ref
            ) => {
                const [form] = Form.useForm<FilePermExecutorActionParameters>();
                const [hasAppid] = useState(() => !!parameters.appid);
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
                            label={t("folderPerm.source")}
                            name="docid"
                            allowVariable
                            type="asFolder"
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
                                omittedMessage={t(
                                    "unavailableFoldersOmitted"
                                )}
                                selectType={2}
                                placeholder={t("folderPerm.sourcePlaceholder")}
                                selectButtonText={t("select")}
                            />
                        </FormItem>
                        <FormItem
                            name="config_inherit"
                            label={t("filePerm.config_inherit", "是否设置继承权限")}
                            className={styles['radio-config']}
                        >
                            <Radio.Group>
                                <Radio value={false}>{t('filePerm.config_disable', '不设置')}</Radio><br />
                                <Radio value={true} className={styles['radio-config-set']}>{t('filePerm.config_enable', '设置')}</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem
                            label={''}
                            name="inherit"
                            className={styles['radio-inherit']}
                            style={{ display: (form.getFieldValue('config_inherit') || parameters?.config_inherit) ? 'block' : 'none' }}
                        >
                            <Radio.Group>
                                <Radio value={true}>
                                    {t("filePerm.enable")}
                                </Radio>
                                <Radio value={false}>
                                    {t("filePerm.disable")}
                                </Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label={t("filePerm.perminfo")} className={styles['perminfo']}>
                            <Form.List name="perminfos">
                                {(fields, { add, remove }, { errors }) => {
                                    return (
                                        <>
                                            {fields.map((field, index) => (
                                                <FormItem {...field}>
                                                    <PermInfo
                                                        t={t}
                                                        ref={refs[index]}
                                                        onClose={() =>
                                                            remove(index)
                                                        }
                                                    />
                                                </FormItem>
                                            ))}
                                            <Form.ErrorList errors={errors} />
                                            <Button
                                                onClick={() =>
                                                    add({
                                                        perm: {
                                                            allow: [
                                                                "display",
                                                                "preview",
                                                            ],
                                                            deny: [],
                                                        },
                                                    })
                                                }
                                            >
                                                {t("filePerm.addPerm")}
                                            </Button>
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

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 2,
                                    }}
                                    className="applet-table-label"
                                    title={t("folderPerm.source") + t("id", "ID")}
                                >
                                    {t("folderPerm.source") + t("id", "ID")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>{input?.docid}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 2,
                                    }}
                                    className="applet-table-label"
                                    title={t("filePerm.inherit")}
                                >
                                    {t("filePerm.inherit")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>
                                {t(
                                    `filePerm.${input.inherit ? "enable" : "disable"
                                    }`,
                                    ""
                                )}
                            </td>
                        </tr>
                        {input?.perminfos?.map(
                            (item: PermInfo, index: number) => (
                                <>
                                    <tr>
                                        <td
                                            className={styles.label}
                                            style={
                                                index !== 0
                                                    ? { paddingTop: "8px" }
                                                    : undefined
                                            }
                                        >
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.accessor")}
                                            >
                                                {t("filePerm.accessor")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.accessor === "string"
                                                ? JSON.parse(item?.accessor)
                                                    ?.name
                                                : item?.accessor?.name ||
                                                JSON.stringify(
                                                    item?.accessor
                                                )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={styles.label}>
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.expireTime")}
                                            >
                                                {t("filePerm.expireTime")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.endtime === "string"
                                                ? moment(item.endtime).format(
                                                    "YYYY/MM/DD HH:mm"
                                                )
                                                : t("neverExpires")}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={styles.label}>
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={t("filePerm.perminfo")}
                                            >
                                                {t("filePerm.perminfo")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {typeof item?.perm === "string"
                                                ? formatPermText(
                                                    JSON.parse(
                                                        item?.perm as string
                                                    )
                                                )
                                                : formatPermText(
                                                    item?.perm as any
                                                )}
                                        </td>
                                    </tr>
                                </>
                            )
                        )}
                    </tbody>
                </table>
            );
        },
    },
};

interface PermValue {
    allow: string[];
    deny: string[];
}

interface PermInfo {
    accessor: AsUserSelectItem;
    perm: PermValue;
    endtime: string;
}

interface PermInfoProps {
    t: TranslateFn;
    value?: PermInfo;
    onChange?: (value: PermInfo) => void;
    onClose?(): void;
}

const PermInfo = forwardRef<Validatable, PermInfoProps>(
    ({ t, value, onChange, onClose }, ref) => {
        const [form] = Form.useForm<PermInfo>();

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
                    >
                        <DatePickerISO
                            showTime
                            popupClassName="automate-oem-primary"
                            placeholder={t("filePerm.expireTimePlaceholder")}
                            style={{ width: "100%" }}
                        />
                    </FormItem>
                </Form>
                <Button
                    className={styles.removeButton}
                    icon={<CloseOutlined />}
                    type="text"
                    size="small"
                    onClick={onClose}
                />
            </div>
        );
    }
);

interface AccessorSelectProps {
    t: TranslateFn;
    value?: AsUserSelectItem;
    onChange?: (value?: AsUserSelectItem) => void;
}

const AccessorSelect: FC<AccessorSelectProps> = ({ t, value, onChange }) => {
    const users = useMemo(() => value && [value], [value]);

    return (
        <AsUserSelect
            multiple={false}
            value={users}
            onChange={(value) =>
                onChange && onChange(value.length ? value[0] : undefined)
            }
        >
            {({ items, onAdd }) => {
                return (
                    <div className={styles.UserSelectRender}>
                        <Input
                            readOnly
                            value={items[0]?.name || items[0]?.id}
                            className={styles.input}
                            placeholder={t("filePerm.accessorPlaceholder")}
                        />
                        <Button onClick={onAdd}>{t("select")}</Button>
                    </div>
                );
            }}
        </AsUserSelect>
    );
};
