import {
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    ExecutorActionOutputProps,
    Extension,
    Output,
    Validatable,
} from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import FileSVG from "./assets/file.svg";
import FolderSVG from "./assets/folder.svg";
import {
    ForwardedRef,
    createRef,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import clsx from "clsx";
import { Button, Checkbox, Form, Input, Radio, Select, Typography } from "antd";
import { API, MicroAppContext, formatSize } from "@applet/common";
import { FormItem } from "../../components/editor/form-item";
import { TagInput } from "./tag-input";
import { LevelSelect } from "./level-select";
import { useSecurityLevel } from "../../components/log-card";
import { CsfLevelSelect, getCsfText } from "./csf-select";
import { find, includes, isArray } from "lodash";
import { useHandleErrReq } from "../../utils/hooks";
import { AsFileSelect } from "../../components/as-file-select";
import styles from "./index.module.less";
import {
    MetaDataTemplate,
    MetadataLog,
} from "../../components/metadata-template";
import { FilePermExecutorAction, FolderPermExecutorAction } from "./file-perm-executor-action";
import { TableRowSelect } from "./components/table-row-select";
import { Inherit } from "./components/datasource-inherit";
import { PlusOutlined } from "@applet/icons";
import { EditContentInput } from "./components/edit-content-input";
import { formatTime } from "../../components/log-card/default-output";
import { EditorContext } from "../../components/editor/editor-context";
import { TriggerStepNode } from "../../components/editor/expr";
import { FileCreate } from "./file-executors";
// import { FileRestoreReversionAction } from "./file-restore-reversion-action";

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

// 触发器节点转换docid为docids
function transformParams(parameters: any) {
    if (parameters?.docid && !parameters?.docids) {
        return {
            ...parameters,
            docids: [parameters.docid],
            docid: undefined,
        };
    }
    return parameters;
}

export function isVariableLike(value: any) {
    return typeof value === "string" && /^\{\{(__(\d+).*)\}\}$/.test(value);
}

export function isGNSLike(value: any) {
    return typeof value === "string" && /^gns:\/(\/[0-9A-F]{32})+$/.test(value);
}

export default {
    name: "anyshare",
    dataSources: [
        {
            name: "DSpecifyFiles",
            description: "DSpecifyFilesDescription",
            icon: FileSVG,
            operator: "@anyshare-data/specify-files",
            outputs: [
                {
                    key: ".id",
                    name: "DSpecifyFilesOutputId",
                    type: "asFile",
                },
                {
                    key: ".name",
                    name: "DSpecifyFilesOutputName",
                    type: "string",
                },
                {
                    key: ".path",
                    name: "DSpecifyFilesOutputPath",
                    type: "string",
                },
                {
                    key: ".create_time",
                    name: "DSpecifyFilesOutputCreateTime",
                    type: "datetime",
                },
                {
                    key: ".creator",
                    name: "DSpecifyFilesOutputCreator",
                    type: "string",
                },
                {
                    key: ".modify_time",
                    name: "DSpecifyFilesOutputModificationTime",
                    type: "datetime",
                },
                {
                    key: ".editor",
                    name: "DSpecifyFilesOutputModifiedBy",
                    type: "string",
                },
                {
                    key: ".size",
                    name: "DSpecifyFilesOutputSize",
                    type: "number",
                },
            ],
            validate(parameters) {
                return (
                    parameters &&
                    Array.isArray(parameters.docids) &&
                    parameters.docids.length > 0 &&
                    parameters.docids.every(isGNSLike)
                );
            },
            components: {
                Config: forwardRef(({ parameters, onChange, t }, ref) => {
                    const form = useConfigForm(parameters, ref);
                    return (
                        <Form
                            form={form}
                            onFieldsChange={() => {
                                onChange(form.getFieldsValue());
                            }}
                        >
                            <FormItem
                                name="docids"
                                rules={[
                                    {
                                        required: true,
                                        type: "array",
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <AsFileSelect
                                    title={t("fileSelectTitle")}
                                    key="files"
                                    selectType={1}
                                    omitUnavailableItem
                                    omittedMessage={t(
                                        "unavailableFilesOmitted"
                                    )}
                                    multiple
                                    multipleMode="list"
                                    placeholder={t("fileSelectPlaceholder")}
                                    selectButtonText={t("select")}
                                />
                            </FormItem>
                        </Form>
                    );
                }),
            },
        },
        {
            name: "DSpecifyFolders",
            description: "DSpecifyFoldersDescription",
            icon: FolderSVG,
            operator: "@anyshare-data/specify-folders",
            outputs: [
                {
                    key: ".id",
                    name: "DSpecifyFoldersOutputId",
                    type: "asFolder",
                },
                {
                    key: ".name",
                    name: "DSpecifyFoldersOutputName",
                    type: "string",
                },
                {
                    key: ".path",
                    name: "DSpecifyFoldersOutputPath",
                    type: "string",
                },
                {
                    key: ".create_time",
                    name: "DSpecifyFoldersOutputCreateTime",
                    type: "datetime",
                },
                {
                    key: ".creator",
                    name: "DSpecifyFoldersOutputCreator",
                    type: "string",
                },
                {
                    key: ".modify_time",
                    name: "DSpecifyFoldersOutputModificationTime",
                    type: "datetime",
                },
                {
                    key: ".editor",
                    name: "DSpecifyFoldersOutputModifiedBy",
                    type: "string",
                },
            ],
            validate(parameters) {
                return (
                    parameters &&
                    Array.isArray(parameters.docids) &&
                    parameters.docids.length > 0 &&
                    parameters.docids.every(isGNSLike)
                );
            },
            components: {
                Config: forwardRef(({ parameters, onChange, t }, ref) => {
                    const form = useConfigForm(parameters, ref);
                    return (
                        <Form
                            form={form}
                            onFieldsChange={() => {
                                onChange(form.getFieldsValue());
                            }}
                        >
                            <FormItem
                                name="docids"
                                rules={[
                                    {
                                        required: true,
                                        type: "array",
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <AsFileSelect
                                    title={t("folderSelectTitle")}
                                    key="folders"
                                    selectType={2}
                                    multiple
                                    multipleMode="list"
                                    omittedMessage={t(
                                        "unavailableFoldersOmitted"
                                    )}
                                    omitUnavailableItem
                                    placeholder={t("folderSelectPlaceholder")}
                                    selectButtonText={t("select")}
                                />
                            </FormItem>
                        </Form>
                    );
                }),
            },
        },
        {
            name: "DListFiles",
            description: "DListFilesDescription",
            icon: FileSVG,
            operator: "@anyshare-data/list-files",
            outputs: [
                {
                    key: ".id",
                    name: "DListFilesOutputId",
                    type: "asFile",
                },
                {
                    key: ".name",
                    name: "DListFilesOutputName",
                    type: "string",
                },
                {
                    key: ".path",
                    name: "DListFilesOutputPath",
                    type: "string",
                },
                {
                    key: ".create_time",
                    name: "DListFilesOutputCreateTime",
                    type: "datetime",
                },
                {
                    key: ".creator",
                    name: "DListFilesOutputCreator",
                    type: "string",
                },
                {
                    key: ".size",
                    name: "DListFilesOutputSize",
                    type: "number",
                },
                {
                    key: ".modify_time",
                    name: "DListFilesOutputModificationTime",
                    type: "datetime",
                },
                {
                    key: ".editor",
                    name: "DListFilesOutputModifiedBy",
                    type: "string",
                },
            ],
            validate(parameters) {
                return (
                    (Array.isArray(parameters?.docids) &&
                        parameters.docids.length > 0 &&
                        parameters.docids.every(isGNSLike)) ||
                    isGNSLike(parameters.docid)
                );
            },
            components: {
                Config: forwardRef(({ parameters, onChange, t }, ref) => {
                    const form = useConfigForm(
                        transformParams(parameters),
                        ref
                    );
                    return (
                        <Form
                            form={form}
                            onFieldsChange={() => {
                                onChange(form.getFieldsValue());
                            }}
                        >
                            <FormItem
                                name="docids"
                                rules={[
                                    {
                                        required: true,
                                        type: "array",
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <AsFileSelect
                                    title={t("folderSelectTitle")}
                                    key="listFiles"
                                    selectType={2}
                                    multiple
                                    multipleMode="list"
                                    omittedMessage={t(
                                        "unavailableFoldersOmitted"
                                    )}
                                    omitUnavailableItem
                                    placeholder={t("folderSelectPlaceholder")}
                                    selectButtonText={t("select")}
                                />
                            </FormItem>
                            <FormItem
                                label={t("inherit", "应用到子文件夹")}
                                name="depth"
                                style={{ marginTop: "24px" }}
                            >
                                <Inherit t={t} />
                            </FormItem>
                        </Form>
                    );
                }),
            },
        },
        {
            name: "DListFolders",
            description: "DListFoldersDescription",
            icon: FileSVG,
            operator: "@anyshare-data/list-folders",
            outputs: [
                {
                    key: ".id",
                    name: "DListFoldersOutputId",
                    type: "asFolder",
                },
                {
                    key: ".name",
                    name: "DListFoldersOutputName",
                    type: "string",
                },
                {
                    key: ".path",
                    name: "DListFoldersOutputPath",
                    type: "string",
                },
                {
                    key: ".create_time",
                    name: "DListFoldersOutputCreateTime",
                    type: "datetime",
                },
                {
                    key: ".creator",
                    name: "DListFoldersOutputCreator",
                    type: "string",
                },
                {
                    key: ".modify_time",
                    name: "DListFoldersOutputModificationTime",
                    type: "datetime",
                },
                {
                    key: ".editor",
                    name: "DListFoldersOutputModifiedBy",
                    type: "string",
                },
            ],
            validate(parameters) {
                return (
                    (Array.isArray(parameters?.docids) &&
                        parameters.docids.length > 0 &&
                        parameters.docids.every(isGNSLike)) ||
                    isGNSLike(parameters.docid)
                );
            },
            components: {
                Config: forwardRef(({ parameters, onChange, t }, ref) => {
                    const form = useConfigForm(
                        transformParams(parameters),
                        ref
                    );
                    return (
                        <Form
                            form={form}
                            onFieldsChange={() => {
                                onChange(form.getFieldsValue());
                            }}
                        >
                            <FormItem
                                name="docids"
                                rules={[
                                    {
                                        required: true,
                                        type: "array",
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <AsFileSelect
                                    title={t("folderSelectTitle")}
                                    key="listFolders"
                                    selectType={2}
                                    multiple
                                    multipleMode="list"
                                    omittedMessage={t(
                                        "unavailableFoldersOmitted"
                                    )}
                                    omitUnavailableItem
                                    placeholder={t("folderSelectPlaceholder")}
                                    selectButtonText={t("select")}
                                />
                            </FormItem>
                            <FormItem
                                label={t("inherit", "应用到子文件夹")}
                                name="depth"
                                style={{ marginTop: "24px" }}
                            >
                                <Inherit t={t} />
                            </FormItem>
                        </Form>
                    );
                }),
            },
        },
    ],
    triggers: [
        {
            name: "TDocument",
            description: "TDocumentDescription",
            icon: FolderSVG,
            group: {
                group: "autoTrigger",
                name: "TGroupAuto",
            },
            groups: [
                {
                    group: "file",
                    name: "TGFile",
                },
                {
                    group: "folder",
                    name: "TGFolder",
                },
            ],
            actions: [
                {
                    name: "TAUploadFile",
                    description: "TAUploadFileDescription",
                    operator: "@anyshare-trigger/upload-file",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".id",
                            name: "TAUploadFileOutputId",
                            type: "asFile",
                        },
                        {
                            key: ".name",
                            name: "TAUploadFileOutputName",
                            type: "string",
                        },
                        {
                            key: ".path",
                            name: "TAUploadFileOutputPath",
                            type: "string",
                        },
                        {
                            key: ".size",
                            name: "TAUploadFileOutputSize",
                            type: "number",
                        },
                        {
                            key: ".create_time",
                            name: "TAUploadFileOutputCreateTime",
                            type: "datetime",
                        },
                        {
                            key: ".creator",
                            name: "TAUploadFileOutputCreator",
                            type: "string",
                        },
                        {
                            key: ".modify_time",
                            name: "TAUploadFileOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TAUploadFileOutputModifiedBy",
                            type: "string",
                        },
                        {
                            key: ".accessor",
                            name: "TAUploadFileOutputAccessor",
                            type: "asUser",
                        },
                        // {
                        //     key: ".old_reversion",
                        //     name: "TAUploadFileOutputLastReversion",
                        //     type: "string"
                        // }
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TACopyFile",
                    description: "TACopyFileDescription",
                    operator: "@anyshare-trigger/copy-file",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".new_id",
                            name: "TACopyFileOutputNewId",
                            type: "asFile",
                        },
                        {
                            key: ".new_path",
                            name: "TACopyFileOutputNewPath",
                            type: "string",
                        },
                        {
                            key: ".name",
                            name: "TACopyFileOutputName",
                            type: "string",
                        },
                        {
                            key: ".size",
                            name: "TACopyFileOutputSize",
                            type: "number",
                        },
                        {
                            key: ".create_time",
                            name: "TACopyFileOutputCreateTime",
                            type: "datetime",
                        },
                        {
                            key: ".creator",
                            name: "TACopyFileOutputCreator",
                            type: "string",
                        },
                        {
                            key: ".modify_time",
                            name: "TACopyFileOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TACopyFileOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TAMoveFile",
                    description: "TAMoveFileDescription",
                    operator: "@anyshare-trigger/move-file",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".id",
                            name: "TAMoveFileOutputId",
                            type: "asFile",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "TAMoveFileOutputPath",
                        },
                        {
                            key: ".name",
                            name: "TAMoveFileOutputName",
                            type: "string",
                        },
                        {
                            key: ".size",
                            name: "TAMoveFileOutputSize",
                            type: "number",
                        },
                        {
                            key: ".create_time",
                            name: "TAMoveFileOutputCreateTime",
                            type: "datetime",
                        },
                        {
                            key: ".creator",
                            name: "TAMoveFileOutputCreator",
                            type: "string",
                        },
                        {
                            key: ".modify_time",
                            name: "TAMoveFileOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TAMoveFileOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TARemoveFile",
                    description: "TARemoveFileDescription",
                    operator: "@anyshare-trigger/remove-file",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".id",
                            type: "asFile",
                            name: "TARemoveFileOutputId",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "TARemoveFileOutputPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "TARemoveFileOutputName",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TACreateFolder",
                    description: "TACreateFolderDescription",
                    operator: "@anyshare-trigger/create-folder",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".id",
                            type: "asFolder",
                            name: "TACreateFolderOutputId",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "TACreateFolderOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "TACreateFolderOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "TACreateFolderOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "TACreateFolderOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TACreateFolderOutputModifiedBy",
                            type: "string",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "TACreateFolderOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TACopyColder",
                    description: "TACopyColderDescription",
                    operator: "@anyshare-trigger/copy-folder",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".new_id",
                            type: "asFolder",
                            name: "TACopyColderOutputNewId",
                        },
                        {
                            key: ".new_path",
                            type: "string",
                            name: "TACopyFolderOutputNewPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "TACopyFolderOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "TACopyFolderOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "TACopyFolderOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "TACopyFolderOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TACopyFolderOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TAMoveFolder",
                    description: "TAMoveFolderDescription",
                    operator: "@anyshare-trigger/move-folder",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".id",
                            type: "asFolder",
                            name: "TAMoveFolderOutputId",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "TAMoveFolderOutputPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "TAMoveFolderOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "TAMoveFolderOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "TAMoveFolderOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "TAMoveFolderOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "TAMoveFolderOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "TARemoveFolder",
                    description: "TARemoveFolderDescription",
                    operator: "@anyshare-trigger/remove-folder",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".id",
                            type: "asFolder",
                            name: "TARemoveFolderOutputId",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "TARemoveFolderOutputPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "TARemoveFolderOutputName",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            ((Array.isArray(parameters.docids) &&
                                parameters.docids.length > 0 &&
                                parameters.docids.every(isGNSLike)) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.inherit === undefined ||
                                typeof parameters.inherit === "boolean")
                        );
                    },
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
                                const form = useConfigForm(
                                    transformParams(parameters),
                                    ref
                                );

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transformParams(
                                            parameters
                                        )}
                                        onFieldsChange={() => {
                                            onChange(form.getFieldsValue());
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="docids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                omittedMessage={t(
                                                    "unavailableFoldersOmitted"
                                                )}
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={t("inherit")}
                                            name="inherit"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {t("inheritDescription")}
                                            </Checkbox>
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
                                            case "docids":
                                            case "docid":
                                                label = t(
                                                    "targetFolderId",
                                                    "目标文件夹ID"
                                                );
                                                break;
                                            case "inherit":
                                                label = t(
                                                    "inherit",
                                                    "应用到子文件夹"
                                                );
                                                value =
                                                    input[item] === true
                                                        ? t(
                                                            "log.inherit.true",
                                                            "是"
                                                        )
                                                        : t(
                                                            "log.inherit.false",
                                                            "否"
                                                        );
                                                break;
                                            default:
                                                label = item;
                                        }
                                        return (
                                            <tr>
                                                <td className={styles.label}>
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
                                                <td>{value}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
            ],
        },
    ],
    executors: [
        {
            name: "EDocument",
            icon: FolderSVG,
            description: "EDocumentDescription",
            groups: [
                {
                    group: "file",
                    name: "EGFile",
                },
                {
                    group: "folder",
                    name: "EGFolder",
                },
            ],
            actions: [
                {
                    name: "EAFileCopy",
                    description: "EAFileCopyDescription",
                    operator: "@anyshare/file/copy",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".new_docid",
                            name: "EAFileCopyOutputNewDocid",
                            type: "asFile",
                        },
                        {
                            key: ".new_path",
                            name: "EAFileCopyOutputNewPath",
                            type: "string",
                        },
                        {
                            key: ".name",
                            name: "EAFileCopyOutputName",
                            type: "string",
                        },
                        {
                            key: ".size",
                            name: "EAFileCopyOutputSize",
                            type: "number",
                        },
                        {
                            key: ".create_time",
                            name: "EAFileCopyOutputCreateTime",
                            type: "datetime",
                        },
                        {
                            key: ".creator",
                            name: "EAFileCopyOutputCreator",
                            type: "string",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFileCopyOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFileCopyOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.destparent) ||
                                isGNSLike(parameters.destparent)) &&
                            [1, 2, 3].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);
                                const { stepNodes } = useContext(EditorContext);
                                const showTip = useMemo(() => {
                                    if (
                                        stepNodes[0] &&
                                        (stepNodes[0] as TriggerStepNode).step
                                            .operator ===
                                        "@anyshare-trigger/copy-file"
                                    ) {
                                        return true;
                                    }
                                    return false;
                                }, [stepNodes]);

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
                                            label={t("fileCopy.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileCopy.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="destparent"
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                                tip={
                                                    showTip
                                                        ? t(
                                                            "tip.sameFolder",
                                                            "请确认目标文件夹与触发器所选文件夹不能是同一个"
                                                        )
                                                        : undefined
                                                }
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.file")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.filePlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                                <Select.Option
                                                    key={3}
                                                    value={3}
                                                >
                                                    {t("ondup.overwrite")}
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "fileCopy.source",
                                                        "要复制的文件"
                                                    ) + t("id", "ID");
                                                break;
                                            case "destparent":
                                                label =
                                                    t(
                                                        "destparent",
                                                        "目标文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.file",
                                                    "如果文件存在"
                                                );
                                                value =
                                                    input[item] === 1
                                                        ? t(
                                                            "ondup.throw",
                                                            "运行时抛出异常"
                                                        )
                                                        : input[item] === 2
                                                            ? t(
                                                                "ondup.rename",
                                                                "自动重命名"
                                                            )
                                                            : t(
                                                                "ondup.overwrite",
                                                                "自动覆盖"
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFileMove",
                    description: "EAFileMoveDescription",
                    operator: "@anyshare/file/move",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            name: "EAFileMoveOutputDocid",
                            type: "asFile",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFileMoveOutputPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFileMoveOutputName",
                        },
                        {
                            key: ".size",
                            type: "number",
                            name: "EAFileMoveOutputSize",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFileMoveOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFileMoveOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFileMoveOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFileMoveOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.destparent) ||
                                isGNSLike(parameters.destparent)) &&
                            [1, 2, 3].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("fileMove.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileMove.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="destparent"
                                            type="asFolder"
                                            allowVariable
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.file")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.filePlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                                <Select.Option
                                                    key={3}
                                                    value={3}
                                                >
                                                    {t("ondup.overwrite")}
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "fileMove.source",
                                                        "要移动的文件"
                                                    ) + t("id", "ID");
                                                break;
                                            case "destparent":
                                                label =
                                                    t(
                                                        "destparent",
                                                        "目标文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.file",
                                                    "如果文件存在"
                                                );
                                                input[item] === 1
                                                    ? (value = t(
                                                        "ondup.throw",
                                                        "运行时抛出异常"
                                                    ))
                                                    : input[item] === 2
                                                        ? (value = t(
                                                            "ondup.rename",
                                                            "自动重命名"
                                                        ))
                                                        : (value = t(
                                                            "ondup.overwrite",
                                                            "自动覆盖"
                                                        ));
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFileRemove",
                    description: "EAFileRemoveDescription",
                    operator: "@anyshare/file/remove",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFile",
                            name: "EAFileRemoveOutputDocid",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFileRemoveOutputName",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFileRemoveOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("fileRemove.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileRemove.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
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
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={
                                                    t(
                                                        "fileRemove.source",
                                                        "要删除的文件"
                                                    ) + t("id", "ID")
                                                }
                                            >
                                                {t(
                                                    "fileRemove.source",
                                                    "要删除的文件"
                                                ) + t("id", "ID")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>{input?.docid}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFileRename",
                    description: "EAFileRenameDescription",
                    operator: "@anyshare/file/rename",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFile",
                            name: "EAFileRenameOutputDocid",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFileRenameOutputName",
                        },
                        {
                            key: ".size",
                            type: "number",
                            name: "EAFileRenameOutputSize",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFileRenameOutputPath",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFileRenameOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFileRenameOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFileRenameOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFileRenameOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.name) ||
                                (typeof parameters.name === "string" &&
                                    /^[^#\\/:*?"<>|]{0,255}$/.test(
                                        parameters.name
                                    ))) &&
                            [1, 2].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("fileRename.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileRename.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("fileRename.name")}
                                            name="name"
                                            allowVariable
                                            type="string"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                                {
                                                    pattern:
                                                        /^[^#\\/:*?"<>|]{0,255}$/,
                                                    message:
                                                        t("invalidFileName"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                autoComplete="off"
                                                placeholder={t(
                                                    "fileRename.namePlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.file")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.filePlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "fileRename.source",
                                                        "要重命名的文件"
                                                    ) + t("id", "ID");
                                                break;
                                            case "name":
                                                label = t(
                                                    "fileRename.name",
                                                    "新的文件名称"
                                                );
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.file",
                                                    "如果文件存在"
                                                );
                                                input[item] === 1
                                                    ? (value = t(
                                                        "ondup.throw",
                                                        "运行时抛出异常"
                                                    ))
                                                    : (value = t(
                                                        "ondup.rename",
                                                        "自动重命名"
                                                    ));
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                // {
                //     name: "EAFileAddtag",
                //     description: "EAFileAddtagDescription",
                //     operator: "@anyshare/file/addtag",
                //     group: "file",
                //     icon: FileSVG,
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid)) &&
                //             (isVariableLike(parameters.tags) ||
                //                 (Array.isArray(parameters.tags) &&
                //                     parameters.tags.length > 0 &&
                //                     parameters.tags.every(
                //                         (tag: string) =>
                //                             typeof tag === "string" &&
                //                             !/[#\\/:*?\\"<>|]/.test(tag)
                //                     )))
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const form = useConfigForm(parameters, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={parameters}
                //                         onFieldsChange={() => {
                //                             onChange(form.getFieldsValue());
                //                         }}
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("fileAddTag.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFile"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={1}
                //                                 placeholder={t(
                //                                     "fileAddTag.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             name="tags"
                //                             allowVariable
                //                             type={["string", "asTags", "array"]}
                //                             required
                //                             label={t("tags")}
                //                             rules={[
                //                                 {
                //                                     async validator(_, value) {
                //                                         if (
                //                                             !value ||
                //                                             value.length < 1
                //                                         ) {
                //                                             throw new Error(
                //                                                 "empty"
                //                                             );
                //                                         }
                //                                     },
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <TagInput
                //                                 t={t}
                //                                 placeholder={t(
                //                                     "fileAddTag.tagsPlaceholder"
                //                                 )}
                //                             />
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => (
                //             <table>
                //                 <tbody>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={
                //                                     t(
                //                                         "fileAddTag.source",
                //                                         "要添加标签的文件"
                //                                     ) + t("id", "ID")
                //                                 }
                //                             >
                //                                 {t(
                //                                     "fileAddTag.source",
                //                                     "要添加标签的文件"
                //                                 ) + t("id", "ID")}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{input?.docid}</td>
                //                     </tr>
                //                     {input?.tags?.map ? (
                //                         input?.tags?.map(
                //                             (item: string, index: number) => {
                //                                 const label =
                //                                     index === 0
                //                                         ? t("tags", "标签")
                //                                         : t(
                //                                             "log.tags",
                //                                             "标签{index}",
                //                                             {
                //                                                 index:
                //                                                     index + 1,
                //                                             }
                //                                         );
                //                                 return (
                //                                     <tr>
                //                                         <td
                //                                             className={
                //                                                 styles.label
                //                                             }
                //                                         >
                //                                             <Typography.Paragraph
                //                                                 ellipsis={{
                //                                                     rows: 2,
                //                                                 }}
                //                                                 className="applet-table-label"
                //                                                 title={label}
                //                                             >
                //                                                 {label}
                //                                             </Typography.Paragraph>
                //                                             {t("colon", "：")}
                //                                         </td>
                //                                         <td>{item}</td>
                //                                     </tr>
                //                                 );
                //                             }
                //                         )
                //                     ) : (
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t("tags", "标签")}
                //                                 >
                //                                     {t("tags", "标签")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td className={styles.inputTags}>
                //                                 {input?.tags}
                //                             </td>
                //                         </tr>
                //                     )}
                //                 </tbody>
                //             </table>
                //         ),
                //         FormattedOutput: ({
                //             t,
                //             outputData,
                //         }: ExecutorActionOutputProps) => (
                //             <table>
                //                 <tbody>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={t(
                //                                     "log.tags.maximum",
                //                                     "标签可添加的最大上限"
                //                                 )}
                //                             >
                //                                 {t(
                //                                     "log.tags.maximum",
                //                                     "标签可添加的最大上限"
                //                                 )}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{outputData?.tag_max_num}</td>
                //                     </tr>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={t(
                //                                     "log.tags.unset",
                //                                     "未成功添加的标签个数"
                //                                 )}
                //                             >
                //                                 {t(
                //                                     "log.tags.unset",
                //                                     "未成功添加的标签个数"
                //                                 )}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{outputData?.unset_tag_num}</td>
                //                     </tr>
                //                 </tbody>
                //             </table>
                //         ),
                //     },
                // },
                {
                    name: "EAFileGetpath",
                    description: "EAFileGetpathDescription",
                    operator: "@anyshare/file/getpath",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFile",
                            name: "EAFileGetpathOutputDocid",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFileGetpathOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.order === "asc" ||
                                parameters.order === "desc") &&
                            typeof parameters.depth === "number" &&
                            parameters.depth >= -1
                        );
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = { depth: -1, order: "asc" },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const { depth, order, docid } = parameters;
                                const lastAscDepth = useRef(
                                    order !== "desc" ? depth : -1
                                );
                                const lastDescDepth = useRef(
                                    order === "desc" ? depth : -1
                                );

                                const ascDepth =
                                    order !== "desc"
                                        ? depth
                                        : lastAscDepth.current;

                                const descDepth =
                                    order === "desc"
                                        ? depth
                                        : lastDescDepth.current;

                                const fieldsValue = useMemo(
                                    () => ({
                                        order,
                                        docid,
                                        ascDepth,
                                        descDepth,
                                    }),
                                    [order, docid, ascDepth, descDepth]
                                );

                                const form = useConfigForm(fieldsValue, ref);

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={fieldsValue}
                                        onFieldsChange={() => {
                                            const {
                                                order,
                                                docid,
                                                ascDepth,
                                                descDepth,
                                            } = form.getFieldsValue();
                                            lastAscDepth.current = ascDepth;
                                            lastDescDepth.current = descDepth;
                                            onChange({
                                                order,
                                                docid,
                                                depth:
                                                    order === "desc"
                                                        ? descDepth
                                                        : ascDepth,
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("fileGetPath.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileGetPath.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("fileGetPath.depth")}
                                            name="order"
                                        >
                                            <Radio.Group>
                                                <Radio
                                                    value="asc"
                                                    style={{ display: "block" }}
                                                >
                                                    {t("fileGetPath.asc", {
                                                        level: () => (
                                                            <FormItem
                                                                name="ascDepth"
                                                                noStyle
                                                            >
                                                                <LevelSelect
                                                                    t={t}
                                                                    disabled={
                                                                        order ===
                                                                        "desc"
                                                                    }
                                                                    customLevelPlaceholder={t(
                                                                        "custom"
                                                                    )}
                                                                />
                                                            </FormItem>
                                                        ),
                                                    })}
                                                </Radio>
                                                <Radio
                                                    value="desc"
                                                    style={{
                                                        display: "block",
                                                        marginTop: 12,
                                                    }}
                                                >
                                                    {t("fileGetPath.desc", {
                                                        level: () => (
                                                            <FormItem
                                                                name="descDepth"
                                                                noStyle
                                                            >
                                                                <LevelSelect
                                                                    t={t}
                                                                    disabled={
                                                                        order !==
                                                                        "desc"
                                                                    }
                                                                    customLevelPlaceholder={t(
                                                                        "custom"
                                                                    )}
                                                                />
                                                            </FormItem>
                                                        ),
                                                    })}
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "fileGetPath.source",
                                                        "要获取的文件"
                                                    ) + t("id", "ID");
                                                break;
                                            case "depth":
                                                label = t(
                                                    "fileGetPath.depth",
                                                    "要获取的路径层级"
                                                );
                                                value = t(
                                                    input.order === "asc"
                                                        ? "fileGetPath.asc"
                                                        : "fileGetPath.desc",
                                                    {
                                                        level: () =>
                                                            input.depth === -1
                                                                ? t(
                                                                    "all",
                                                                    "全部"
                                                                )
                                                                : input.depth ===
                                                                    1
                                                                    ? t("nLevel", {
                                                                        level: input.depth,
                                                                    })
                                                                    : t("nLevels", {
                                                                        level: input.depth,
                                                                    }),
                                                    }
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFolderCreate",
                    description: "EAFolderCreateDescription",
                    operator: "@anyshare/folder/create",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFolder",
                            name: "EAFolderCreateOutputDocid",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFolderCreateOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFolderCreateOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFolderCreateOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFolderCreateOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFolderCreateOutputModifiedBy",
                            type: "string",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFolderCreateOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.name) ||
                                (typeof parameters.name === "string" &&
                                    /^[^#\\/:*?"<>|]{0,255}$/.test(
                                        parameters.name
                                    ))) &&
                            [1, 2, 3].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("folderCreate.name")}
                                            name="name"
                                            allowVariable
                                            type="string"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                                {
                                                    pattern:
                                                        /^[^#\\/:*?"<>|]{0,255}$/,
                                                    message:
                                                        t("invalidFileName"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                autoComplete="off"
                                                placeholder={t(
                                                    "folderCreate.namePlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("destparent")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.folder")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.folderPlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                                <Select.Option
                                                    key={3}
                                                    value={3}
                                                >
                                                    {t("ondup.overwrite")}
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "destparent",
                                                        "目标文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "name":
                                                label = t(
                                                    "folderCreate.name",
                                                    "新的文件夹名称"
                                                );
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.folder",
                                                    "如果文件夹存在"
                                                );
                                                value =
                                                    input[item] === 1
                                                        ? t(
                                                            "ondup.throw",
                                                            "运行时抛出异常"
                                                        )
                                                        : input[item] === 2
                                                            ? t(
                                                                "ondup.rename",
                                                                "自动重命名"
                                                            )
                                                            : t(
                                                                "ondup.overwrite",
                                                                "自动覆盖"
                                                            );
                                                break;
                                            default:
                                                label = "";
                                        }
                                        if (label) {
                                            return (
                                                <>
                                                    <tr>
                                                        <td
                                                            className={
                                                                styles.label
                                                            }
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
                                                        <td>{value}</td>
                                                    </tr>
                                                </>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFolderCopy",
                    description: "EAFolderCopyDescription",
                    operator: "@anyshare/folder/copy",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".new_docid",
                            type: "asFolder",
                            name: "EAFolderCopyOutputNewDocid",
                        },
                        {
                            key: ".new_path",
                            type: "string",
                            name: "EAFolderCopyOutputNewPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFolderCopyOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFolderCopyOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFolderCopyOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFolderCopyOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFolderCopyOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.destparent) ||
                                isGNSLike(parameters.destparent)) &&
                            [1, 2, 3].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("folderCopy.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderCopy.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="destparent"
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.folder")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.folderPlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                                <Select.Option
                                                    key={3}
                                                    value={3}
                                                >
                                                    {t("ondup.overwrite")}
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "folderCopy.source",
                                                        "要复制的文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "destparent":
                                                label =
                                                    t(
                                                        "destparent",
                                                        "目标文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.folder",
                                                    "如果文件夹存在"
                                                );
                                                value =
                                                    input[item] === 1
                                                        ? t(
                                                            "ondup.throw",
                                                            "运行时抛出异常"
                                                        )
                                                        : input[item] === 2
                                                            ? t(
                                                                "ondup.rename",
                                                                "自动重命名"
                                                            )
                                                            : t(
                                                                "ondup.overwrite",
                                                                "自动覆盖"
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFolderMove",
                    description: "EAFolderMoveDescription",
                    operator: "@anyshare/folder/move",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".docid",
                            name: "EAFolderMoveOutputDocid",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFolderMoveOutputPath",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFolderMoveOutputName",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFolderMoveOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFolderMoveOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFolderMoveOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFolderMoveOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.destparent) ||
                                isGNSLike(parameters.destparent)) &&
                            [1, 2, 3].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("folderMove.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderMove.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("destparent")}
                                            name="destparent"
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "destparentPlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.folder")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.folderPlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                                <Select.Option
                                                    key={3}
                                                    value={3}
                                                >
                                                    {t("ondup.overwrite")}
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "folderMove.source",
                                                        "要移动的文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "destparent":
                                                label =
                                                    t(
                                                        "destparent",
                                                        "目标文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.folder",
                                                    "如果文件夹存在"
                                                );
                                                value =
                                                    input[item] === 1
                                                        ? t(
                                                            "ondup.throw",
                                                            "运行时抛出异常"
                                                        )
                                                        : input[item] === 2
                                                            ? t(
                                                                "ondup.rename",
                                                                "自动重命名"
                                                            )
                                                            : t(
                                                                "ondup.overwrite",
                                                                "自动覆盖"
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFolderRemove",
                    description: "EAFolderRemoveDescription",
                    operator: "@anyshare/folder/remove",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFolder",
                            name: "EAFolderRemoveOutputDocid",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFolderRemoveOutputName",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFolderRemoveOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("folderRemove.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderRemove.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
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
                                            <Typography.Paragraph
                                                ellipsis={{
                                                    rows: 2,
                                                }}
                                                className="applet-table-label"
                                                title={
                                                    t(
                                                        "folderRemove.source",
                                                        "要删除的文件夹"
                                                    ) + t("id", "ID")
                                                }
                                            >
                                                {t(
                                                    "folderRemove.source",
                                                    "要删除的文件夹"
                                                ) + t("id", "ID")}
                                            </Typography.Paragraph>
                                            {t("colon", "：")}
                                        </td>
                                        <td>{input?.docid}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFolderRename",
                    description: "EAFolderRenameDescription",
                    operator: "@anyshare/folder/rename",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFolder",
                            name: "EAFolderRenameOutputDocid",
                        },
                        {
                            key: ".name",
                            type: "string",
                            name: "EAFolderRenameOutputName",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFolderRenameOutputPath",
                        },
                        {
                            key: ".create_time",
                            type: "datetime",
                            name: "EAFolderRenameOutputCreateTime",
                        },
                        {
                            key: ".creator",
                            type: "string",
                            name: "EAFolderRenameOutputCreator",
                        },
                        {
                            key: ".modify_time",
                            name: "EAFolderRenameOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "EAFolderRenameOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.name) ||
                                (typeof parameters.name === "string" &&
                                    /^[^#\\/:*?"<>|]{0,255}$/.test(
                                        parameters.name
                                    ))) &&
                            [1, 2].includes(parameters.ondup)
                        );
                    },
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
                                const form = useConfigForm(parameters, ref);

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
                                            label={t("folderRename.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderRename.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("folderRename.name")}
                                            name="name"
                                            allowVariable
                                            type="string"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                                {
                                                    pattern:
                                                        /^[^#\\/:*?"<>|]{0,255}$/,
                                                    message:
                                                        t("invalidFileName"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                autoComplete="off"
                                                placeholder={t(
                                                    "folderRename.namePlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            name="ondup"
                                            label={t("ondup.folder")}
                                            allowVariable={false}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={t(
                                                    "ondup.folderPlaceholder"
                                                )}
                                            >
                                                <Select.Option
                                                    key={1}
                                                    value={1}
                                                >
                                                    {t("ondup.throw")}
                                                </Select.Option>
                                                <Select.Option
                                                    key={2}
                                                    value={2}
                                                >
                                                    <span>
                                                        {t("ondup.rename")}
                                                        &nbsp;
                                                        <span
                                                            className={
                                                                styles.selectOptionDescription
                                                            }
                                                        >
                                                            {t(
                                                                "ondup.renameDescription"
                                                            )}
                                                        </span>
                                                    </span>
                                                </Select.Option>
                                            </Select>
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "folderRename.source",
                                                        "要重命名的文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "name":
                                                label = t(
                                                    "folderRename.name",
                                                    "新的文件夹名称"
                                                );
                                                break;
                                            case "ondup":
                                                label = t(
                                                    "ondup.folder",
                                                    "如果文件夹存在"
                                                );
                                                input[item] === 1
                                                    ? (value = t(
                                                        "ondup.throw",
                                                        "运行时抛出异常"
                                                    ))
                                                    : (value = t(
                                                        "ondup.rename",
                                                        "自动重命名"
                                                    ));
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                // {
                //     name: "EAFolderAddTag",
                //     description: "EAFolderAddTagDescription",
                //     operator: "@anyshare/folder/addtag",
                //     group: "folder",
                //     icon: FolderSVG,
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid)) &&
                //             (isVariableLike(parameters.tags) ||
                //                 (Array.isArray(parameters.tags) &&
                //                     parameters.tags.length > 0 &&
                //                     parameters.tags.every(
                //                         (tag: string) =>
                //                             typeof tag === "string" &&
                //                             !/[#\\/:*?\\"<>|]/.test(tag)
                //                     )))
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const form = useConfigForm(parameters, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={parameters}
                //                         onFieldsChange={() => {
                //                             onChange(form.getFieldsValue());
                //                         }}
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("folderAddTag.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFolder"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("folderSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={2}
                //                                 placeholder={t(
                //                                     "folderAddTag.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             name="tags"
                //                             allowVariable
                //                             required
                //                             label={t("tags")}
                //                             type={["string", "asTags", "array"]}
                //                             rules={[
                //                                 {
                //                                     async validator(_, value) {
                //                                         if (
                //                                             !value ||
                //                                             value.length < 1
                //                                         ) {
                //                                             throw new Error(
                //                                                 "empty"
                //                                             );
                //                                         }
                //                                     },
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <TagInput
                //                                 t={t}
                //                                 placeholder={t(
                //                                     "folderAddTag.tagsPlaceholder"
                //                                 )}
                //                             />
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => (
                //             <table>
                //                 <tbody>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={
                //                                     t(
                //                                         "folderAddTag.source",
                //                                         "要添加标签的文件夹"
                //                                     ) + t("id", "ID")
                //                                 }
                //                             >
                //                                 {t(
                //                                     "folderAddTag.source",
                //                                     "要添加标签的文件夹"
                //                                 ) + t("id", "ID")}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{input?.docid}</td>
                //                     </tr>
                //                     {input?.tags?.map ? (
                //                         input?.tags?.map(
                //                             (item: string, index: number) => {
                //                                 const label =
                //                                     index === 0
                //                                         ? t("tags", "标签")
                //                                         : t(
                //                                             "log.tags",
                //                                             "标签{index}",
                //                                             {
                //                                                 index:
                //                                                     index + 1,
                //                                             }
                //                                         );
                //                                 return (
                //                                     <tr>
                //                                         <td
                //                                             className={
                //                                                 styles.label
                //                                             }
                //                                         >
                //                                             <Typography.Paragraph
                //                                                 ellipsis={{
                //                                                     rows: 2,
                //                                                 }}
                //                                                 className="applet-table-label"
                //                                                 title={label}
                //                                             >
                //                                                 {label}
                //                                             </Typography.Paragraph>
                //                                             {t("colon", "：")}
                //                                         </td>
                //                                         <td>{item}</td>
                //                                     </tr>
                //                                 );
                //                             }
                //                         )
                //                     ) : (
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t("tags", "标签")}
                //                                 >
                //                                     {t("tags", "标签")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td className={styles.inputTags}>
                //                                 {input?.tags}
                //                             </td>
                //                         </tr>
                //                     )}
                //                 </tbody>
                //             </table>
                //         ),
                //         FormattedOutput: ({
                //             t,
                //             outputData,
                //         }: ExecutorActionOutputProps) => (
                //             <table>
                //                 <tbody>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={t(
                //                                     "log.tags.maximum",
                //                                     "标签可添加的最大上限"
                //                                 )}
                //                             >
                //                                 {t(
                //                                     "log.tags.maximum",
                //                                     "标签可添加的最大上限"
                //                                 )}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{outputData?.tag_max_num}</td>
                //                     </tr>
                //                     <tr>
                //                         <td className={styles.label}>
                //                             <Typography.Paragraph
                //                                 ellipsis={{
                //                                     rows: 2,
                //                                 }}
                //                                 className="applet-table-label"
                //                                 title={t(
                //                                     "log.tags.unset",
                //                                     "未成功添加的标签个数"
                //                                 )}
                //                             >
                //                                 {t(
                //                                     "log.tags.unset",
                //                                     "未成功添加的标签个数"
                //                                 )}
                //                             </Typography.Paragraph>
                //                             {t("colon", "：")}
                //                         </td>
                //                         <td>{outputData?.unset_tag_num}</td>
                //                     </tr>
                //                 </tbody>
                //             </table>
                //         ),
                //     },
                // },
                {
                    name: "EAFolderGetpath",
                    description: "EAFolderGetpathDescription",
                    operator: "@anyshare/folder/getpath",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFolder",
                            name: "EAFolderGetpathOutputDocid",
                        },
                        {
                            key: ".path",
                            type: "string",
                            name: "EAFolderGetpathOutputPath",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (parameters.order === "asc" ||
                                parameters.order === "desc") &&
                            typeof parameters.depth === "number" &&
                            parameters.depth >= -1
                        );
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters = { depth: -1, order: "asc" },
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const { depth, order, docid } = parameters;
                                const lastAscDepth = useRef(
                                    order !== "desc" ? depth : -1
                                );
                                const lastDescDepth = useRef(
                                    order === "desc" ? depth : -1
                                );

                                const ascDepth =
                                    order !== "desc"
                                        ? depth
                                        : lastAscDepth.current;

                                const descDepth =
                                    order === "desc"
                                        ? depth
                                        : lastDescDepth.current;

                                const fieldsValue = useMemo(
                                    () => ({
                                        order,
                                        docid,
                                        ascDepth,
                                        descDepth,
                                    }),
                                    [order, docid, ascDepth, descDepth]
                                );

                                const form = useConfigForm(fieldsValue, ref);

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={fieldsValue}
                                        onFieldsChange={() => {
                                            const {
                                                order,
                                                docid,
                                                ascDepth,
                                                descDepth,
                                            } = form.getFieldsValue();
                                            lastAscDepth.current = ascDepth;
                                            lastDescDepth.current = descDepth;
                                            onChange({
                                                order,
                                                docid,
                                                depth:
                                                    order === "desc"
                                                        ? descDepth
                                                        : ascDepth,
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("folderGetPath.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderGetPath.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("folderGetPath.depth")}
                                            name="order"
                                        >
                                            <Radio.Group>
                                                <Radio
                                                    value="asc"
                                                    style={{ display: "block" }}
                                                >
                                                    {t("folderGetPath.asc", {
                                                        level: () => (
                                                            <FormItem
                                                                name="ascDepth"
                                                                noStyle
                                                            >
                                                                <LevelSelect
                                                                    t={t}
                                                                    disabled={
                                                                        order ===
                                                                        "desc"
                                                                    }
                                                                    customLevelPlaceholder={t(
                                                                        "custom"
                                                                    )}
                                                                />
                                                            </FormItem>
                                                        ),
                                                    })}
                                                </Radio>
                                                <Radio
                                                    value="desc"
                                                    style={{
                                                        display: "block",
                                                        marginTop: 12,
                                                    }}
                                                >
                                                    {t("folderGetPath.desc", {
                                                        level: () => (
                                                            <FormItem
                                                                name="descDepth"
                                                                noStyle
                                                            >
                                                                <LevelSelect
                                                                    t={t}
                                                                    disabled={
                                                                        order !==
                                                                        "desc"
                                                                    }
                                                                    customLevelPlaceholder={t(
                                                                        "custom"
                                                                    )}
                                                                />
                                                            </FormItem>
                                                        ),
                                                    })}
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
                                            case "docid":
                                                label =
                                                    t(
                                                        "folderGetPath.source",
                                                        "文件夹"
                                                    ) + t("id", "ID");
                                                break;
                                            case "depth":
                                                label = t(
                                                    "folderGetPath.depth",
                                                    "要获取的路径层级"
                                                );
                                                value = t(
                                                    input.order === "asc"
                                                        ? "folderGetPath.asc"
                                                        : "folderGetPath.desc",
                                                    {
                                                        level: () =>
                                                            input.depth === -1
                                                                ? t(
                                                                    "all",
                                                                    "全部"
                                                                )
                                                                : input.depth ===
                                                                    1
                                                                    ? t("nLevel", {
                                                                        level: input.depth,
                                                                    })
                                                                    : t("nLevels", {
                                                                        level: input.depth,
                                                                    }),
                                                    }
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
                                                    <td>{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        ),
                    },
                },
                {
                    name: "EAFileMatchContent",
                    description: "EAFileMatchContentDescription",
                    operator: "@anyshare/file/matchcontent",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFile",
                            name: "EAFileMatchContentOutputDocid",
                        },
                        {
                            key: ".is_match",
                            type: "isMatch",
                            name: "EAFileMatchContentOutputIsMatch",
                        },
                        {
                            key: ".match_nums",
                            type: "number",
                            name: "EAFileMatchContentOutputNums",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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

                                const matchtype = Form.useWatch(
                                    "matchtype",
                                    form
                                );
                                const keywordError =
                                    form.getFieldError("keyword");
                                const regError = form.getFieldError("reg");
                                const { TextArea } = Input;
                                const config: string | null =
                                    localStorage.getItem("automateConfig");
                                const { prefixUrl } =
                                    useContext(MicroAppContext);

                                const getOptions = (config: any[]) => {
                                    const matchConfig = find(
                                        config,
                                        (item) =>
                                            item?.name ===
                                            "@anyshare/file/matchcontent"
                                    );

                                    const orderTemplates = [
                                        "CN_ID_CARD",
                                        "CN_BANK_CARD_NUMBER",
                                        "CN_PHONE_NUMBER",
                                        "KEYWORD",
                                        "REG",
                                    ];
                                    return orderTemplates.filter(
                                        (item: any) => {
                                            return includes(
                                                matchConfig.config.options,
                                                item
                                            );
                                        }
                                    );
                                };

                                const [options, setOptions] = useState<
                                    string[]
                                >(
                                    config
                                        ? getOptions(JSON.parse(config))
                                        : ["KEYWORD", "REG"]
                                );
                                const handleErr = useHandleErrReq();

                                useEffect(() => {
                                    const getConfig = async () => {
                                        try {
                                            const data = await API.axios.get(
                                                `${prefixUrl}/api/automation/v1/actions`
                                            );
                                            localStorage.setItem(
                                                "automateConfig",
                                                JSON.stringify(data?.data)
                                            );
                                            const newOptions = getOptions(
                                                data?.data
                                            );
                                            setOptions(newOptions);
                                            // 此前选中项已失效
                                            if (
                                                parameters?.matchtype &&
                                                !includes(
                                                    newOptions,
                                                    parameters.matchtype
                                                )
                                            ) {
                                                form.setFieldValue(
                                                    "matchtype",
                                                    undefined
                                                );
                                            }
                                        } catch (error: any) {
                                            // 服务错误
                                            handleErr({
                                                error: error?.response,
                                            });
                                        }
                                    };
                                    getConfig();
                                }, []);

                                const validateValue = (
                                    _: unknown,
                                    value: string,
                                    type: string
                                ): Promise<void> => {
                                    return new Promise((resolve, reject) => {
                                        if (matchtype !== type) {
                                            resolve();
                                            return;
                                        }

                                        if (!value) {
                                            reject(new Error("empty"));
                                            return;
                                        }

                                        if (
                                            type === "KEYWORD" &&
                                            value.length > 128
                                        ) {
                                            reject(
                                                new Error("invalid.limit.128")
                                            );
                                            return;
                                        }

                                        if (
                                            type === "REG" &&
                                            value.length > 2048
                                        ) {
                                            reject(
                                                new Error("invalid.limit.2048")
                                            );
                                            return;
                                        }
                                        resolve();
                                    });
                                };

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={parameters}
                                        onFieldsChange={() => {
                                            const {
                                                docid,
                                                matchtype,
                                                keyword,
                                                reg,
                                            } = form.getFieldsValue();
                                            // 过滤无用字段
                                            onChange({
                                                docid,
                                                matchtype,
                                                keyword:
                                                    matchtype === "KEYWORD"
                                                        ? keyword
                                                        : undefined,
                                                reg:
                                                    matchtype === "REG"
                                                        ? reg
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t("fileMatchContent.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileMatchContent.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "fileMatchContent.keyword"
                                            )}
                                            name="matchtype"
                                            allowVariable={false}
                                            className={clsx({
                                                [styles["matchtype"]]:
                                                    Boolean(matchtype),
                                            })}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Radio.Group
                                                className={styles.keyword}
                                                onChange={(e) => {
                                                    if (
                                                        e.target.value ===
                                                        "KEYWORD"
                                                    ) {
                                                        form.validateFields([
                                                            "reg",
                                                        ]);
                                                    } else if (
                                                        e.target.value === "REG"
                                                    ) {
                                                        form.validateFields([
                                                            "keyword",
                                                        ]);
                                                    } else {
                                                        form.validateFields([
                                                            "keyword",
                                                            "reg",
                                                        ]);
                                                    }
                                                }}
                                            >
                                                {options.map(
                                                    (option: string) => {
                                                        switch (option) {
                                                            case "KEYWORD":
                                                                return (
                                                                    <div
                                                                        className={
                                                                            styles.customItem
                                                                        }
                                                                    >
                                                                        <Radio value="KEYWORD">
                                                                            {t(
                                                                                "KEYWORD",
                                                                                "自定义关键字"
                                                                            )}
                                                                        </Radio>
                                                                        <FormItem
                                                                            name="keyword"
                                                                            noStyle
                                                                            rules={[
                                                                                {
                                                                                    validator:
                                                                                        (
                                                                                            e,
                                                                                            value
                                                                                        ) =>
                                                                                            validateValue(
                                                                                                e,
                                                                                                value,
                                                                                                "KEYWORD"
                                                                                            ),
                                                                                },
                                                                            ]}
                                                                        >
                                                                            <Input
                                                                                autoComplete="off"
                                                                                disabled={
                                                                                    matchtype !==
                                                                                    "KEYWORD"
                                                                                }
                                                                                placeholder={
                                                                                    matchtype ===
                                                                                        "KEYWORD"
                                                                                        ? t(
                                                                                            "keyword.placeholder",
                                                                                            "请输入"
                                                                                        )
                                                                                        : ""
                                                                                }
                                                                            />
                                                                        </FormItem>
                                                                        {keywordError?.length >
                                                                            0 && (
                                                                                <div
                                                                                    className={
                                                                                        styles[
                                                                                        "invalid-help"
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    {keywordError[0] ===
                                                                                        "empty"
                                                                                        ? t(
                                                                                            "emptyMessage"
                                                                                        )
                                                                                        : t(
                                                                                            "invalid.limit.128",
                                                                                            "长度不能超过128个字符。"
                                                                                        )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                );
                                                            case "REG":
                                                                return (
                                                                    <div
                                                                        className={
                                                                            styles.customItem
                                                                        }
                                                                    >
                                                                        <Radio value="REG">
                                                                            {t(
                                                                                "REG",
                                                                                "自定义正则表达式"
                                                                            )}
                                                                        </Radio>
                                                                        <FormItem
                                                                            name="reg"
                                                                            noStyle
                                                                            rules={[
                                                                                {
                                                                                    validator:
                                                                                        (
                                                                                            e,
                                                                                            value
                                                                                        ) =>
                                                                                            validateValue(
                                                                                                e,
                                                                                                value,
                                                                                                "REG"
                                                                                            ),
                                                                                },
                                                                            ]}
                                                                        >
                                                                            <TextArea
                                                                                placeholder={
                                                                                    matchtype ===
                                                                                        "REG"
                                                                                        ? t(
                                                                                            "reg.placeholder",
                                                                                            "请输入"
                                                                                        )
                                                                                        : ""
                                                                                }
                                                                                autoComplete="off"
                                                                                disabled={
                                                                                    matchtype !==
                                                                                    "REG"
                                                                                }
                                                                                style={{
                                                                                    resize: "none",
                                                                                    height: "100px",
                                                                                }}
                                                                            />
                                                                        </FormItem>
                                                                        {regError?.length >
                                                                            0 && (
                                                                                <div
                                                                                    className={
                                                                                        styles[
                                                                                        "invalid-help"
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    {regError[0] ===
                                                                                        "empty"
                                                                                        ? t(
                                                                                            "emptyMessage"
                                                                                        )
                                                                                        : t(
                                                                                            "invalid.limit.2048",
                                                                                            "长度不能超过2048个字符。"
                                                                                        )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                );
                                                            default:
                                                                return (
                                                                    <Radio
                                                                        value={
                                                                            option
                                                                        }
                                                                    >
                                                                        {t(
                                                                            option
                                                                        )}
                                                                    </Radio>
                                                                );
                                                        }
                                                    }
                                                )}
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
                                    {Object.keys(input).map((key) => {
                                        let label = "";
                                        let value = input[key];
                                        switch (key) {
                                            case "docid":
                                                label =
                                                    t(
                                                        "fileMatchContent.source",
                                                        "要匹配的文件"
                                                    ) + t("id", "ID");
                                                break;
                                            case "matchtype":
                                                label = t(
                                                    "fileMatchContent.keyword",
                                                    "要匹配的关键字类型"
                                                );
                                                value = t(value);
                                                break;
                                            case "keyword":
                                                if (
                                                    input["matchtype"] ===
                                                    "KEYWORD"
                                                ) {
                                                    label = t(
                                                        "log.matchContent.keyword",
                                                        "自定义关键字"
                                                    );
                                                }
                                                break;
                                            case "reg":
                                                if (
                                                    input["matchtype"] ===
                                                    "KEYWORD"
                                                ) {
                                                    label = t(
                                                        "log.matchContent.reg",
                                                        "自定义正则表达式"
                                                    );
                                                }
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
                                                    <td>{value}</td>
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
                            outputs,
                        }: ExecutorActionOutputProps) => (
                            <table>
                                <tbody>
                                    {outputs &&
                                        (outputs as Output[]).map(
                                            (item: Output) => {
                                                const label = t(item.name);
                                                const key = item.key.replace(
                                                    ".",
                                                    ""
                                                );
                                                let value = outputData[key];
                                                if (key === "is_match") {
                                                    value =
                                                        value === true
                                                            ? t(
                                                                "log.matchContent.true"
                                                            )
                                                            : t(
                                                                "log.matchContent.false"
                                                            );
                                                }
                                                if (label) {
                                                    return (
                                                        <tr>
                                                            <td
                                                                className={
                                                                    styles.label
                                                                }
                                                            >
                                                                <Typography.Paragraph
                                                                    ellipsis={{
                                                                        rows: 2,
                                                                    }}
                                                                    className="applet-table-label"
                                                                    title={
                                                                        label
                                                                    }
                                                                >
                                                                    {label}
                                                                </Typography.Paragraph>
                                                                {t(
                                                                    "colon",
                                                                    "："
                                                                )}
                                                            </td>
                                                            <td>{value}</td>
                                                        </tr>
                                                    );
                                                }
                                                return null;
                                            }
                                        )}
                                </tbody>
                            </table>
                        ),
                    },
                },
                // {
                //     name: "EAFileSetcsflevel",
                //     description: "EAFileSetcsflevelDescription",
                //     operator: "@anyshare/file/setcsflevel",
                //     group: "file",
                //     icon: FileSVG,
                //     outputs: [
                //         {
                //             key: ".docid",
                //             type: "asFile",
                //             name: "EAFileSetcsflevelOutputDocid",
                //         },
                //         {
                //             key: ".csf_level",
                //             type: "csflevel",
                //             name: "EAFileSetcsflevelOutputLevel",
                //         },
                //         {
                //             key: ".result",
                //             type: "csfResult",
                //             name: "EAFileSetcsflevelOutputResult",
                //         },
                //     ],
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid))
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const form = useConfigForm(parameters, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={parameters}
                //                         onFieldsChange={() =>
                //                             onChange(form.getFieldsValue())
                //                         }
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("fileSetcsflevel.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFile"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={1}
                //                                 placeholder={t(
                //                                     "fileSetcsflevel.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t("fileSetcsflevel.level")}
                //                             name="csf_level"
                //                             allowVariable={false}
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <CsfLevelSelect
                //                                 t={t}
                //                                 customLevelPlaceholder={t(
                //                                     "fileSetcsflevel.levelPlaceholder"
                //                                 )}
                //                                 value={parameters?.csf_level}
                //                             />
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => {
                //             const [csf_level_enum] = useSecurityLevel();

                //             return (
                //                 <table>
                //                     <tbody>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={
                //                                         t(
                //                                             "fileSetcsflevel.source",
                //                                             "要添加密级的文件"
                //                                         ) + t("id", "ID")
                //                                     }
                //                                 >
                //                                     {t(
                //                                         "fileSetcsflevel.source",
                //                                         "要添加密级的文件"
                //                                     ) + t("id", "ID")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>{input?.docid}</td>
                //                         </tr>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t(
                //                                         "fileSetcsflevel.level",
                //                                         "密级"
                //                                     )}
                //                                 >
                //                                     {t(
                //                                         "fileSetcsflevel.level",
                //                                         "密级"
                //                                     )}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>
                //                                 {getCsfText(
                //                                     input?.csf_level,
                //                                     csf_level_enum
                //                                 )}
                //                             </td>
                //                         </tr>
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //         FormattedOutput: ({
                //             t,
                //             outputData,
                //             outputs,
                //         }: ExecutorActionOutputProps) => {
                //             const [csf_level_enum] = useSecurityLevel();

                //             return (
                //                 <table>
                //                     <tbody>
                //                         {outputs &&
                //                             (outputs as Output[]).map(
                //                                 (item: Output) => {
                //                                     const label = t(item.name);
                //                                     const key =
                //                                         item.key.replace(
                //                                             ".",
                //                                             ""
                //                                         );
                //                                     let value = outputData[key];
                //                                     if (key === "csf_level") {
                //                                         value = getCsfText(
                //                                             value,
                //                                             csf_level_enum
                //                                         );
                //                                     }
                //                                     if (key === "result") {
                //                                         value =
                //                                             value === 0
                //                                                 ? t(
                //                                                     "log.result.success"
                //                                                 )
                //                                                 : t(
                //                                                     "log.result.submit"
                //                                                 );
                //                                     }
                //                                     if (label) {
                //                                         return (
                //                                             <tr>
                //                                                 <td
                //                                                     className={
                //                                                         styles.label
                //                                                     }
                //                                                 >
                //                                                     <Typography.Paragraph
                //                                                         ellipsis={{
                //                                                             rows: 2,
                //                                                         }}
                //                                                         className="applet-table-label"
                //                                                         title={
                //                                                             label
                //                                                         }
                //                                                     >
                //                                                         {label}
                //                                                     </Typography.Paragraph>
                //                                                     {t(
                //                                                         "colon",
                //                                                         "："
                //                                                     )}
                //                                                 </td>
                //                                                 <td>{value}</td>
                //                                             </tr>
                //                                         );
                //                                     }
                //                                     return null;
                //                                 }
                //                             )}
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //     },
                // },
                // 文件设置编目
                // {
                //     name: "EAFileSetTemplate",
                //     description: "EAFileSetTemplateDescription",
                //     operator: "@anyshare/file/settemplate",
                //     group: "file",
                //     icon: FileSVG,
                //     outputs: [
                //         {
                //             key: ".results",
                //             type: "metaDataResults",
                //             name: "EAFileSetTemplateOutputResults",
                //         },
                //     ],
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid)) &&
                //             (typeof parameters.templates === "object" ||
                //                 isVariableLike(parameters.templates))
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const form = useConfigForm(parameters, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={parameters}
                //                         onFieldsChange={() =>
                //                             onChange(form.getFieldsValue())
                //                         }
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("fileSetTemplate.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFile"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={1}
                //                                 placeholder={t(
                //                                     "fileSetTemplate.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t(
                //                                 "fileSetTemplate.template"
                //                             )}
                //                             name="templates"
                //                             allowVariable={true}
                //                             type="asMetadata"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <MetaDataTemplate
                //                                 docType="file"
                //                                 t={t}
                //                             />
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => {
                //             return (
                //                 <table>
                //                     <tbody>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={
                //                                         t(
                //                                             "fileSetTemplate.source",
                //                                             "要添加编目的文件"
                //                                         ) + t("id", "ID")
                //                                     }
                //                                 >
                //                                     {t(
                //                                         "fileSetTemplate.source",
                //                                         "要添加编目的文件"
                //                                     ) + t("id", "ID")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>{input?.docid}</td>
                //                         </tr>
                //                         <MetadataLog
                //                             t={t}
                //                             templates={input?.templates}
                //                         />
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //         FormattedOutput: ({
                //             t,
                //             outputData,
                //             outputs,
                //         }: ExecutorActionOutputProps) => {
                //             return (
                //                 <table>
                //                     <tbody>
                //                         <MetadataLog
                //                             t={t}
                //                             templates={outputData}
                //                         />
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //     },
                // },
                // 文件夹设置编目
                // {
                //     name: "EAFolderSetTemplate",
                //     description: "EAFolderSetTemplateDescription",
                //     operator: "@anyshare/folder/settemplate",
                //     group: "folder",
                //     icon: FolderSVG,
                //     outputs: [
                //         {
                //             key: ".results",
                //             type: "metaDataResults",
                //             name: "EAFolderSetTemplateOutputResults",
                //         },
                //     ],
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid)) &&
                //             typeof parameters.templates === "object"
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const form = useConfigForm(parameters, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={parameters}
                //                         onFieldsChange={() =>
                //                             onChange(form.getFieldsValue())
                //                         }
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t(
                //                                 "folderSetTemplate.source"
                //                             )}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFolder"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={2}
                //                                 placeholder={t(
                //                                     "folderSetTemplate.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t(
                //                                 "folderSetTemplate.template"
                //                             )}
                //                             name="templates"
                //                             allowVariable={true}
                //                             type="asMetadata"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <MetaDataTemplate
                //                                 docType="folder"
                //                                 t={t}
                //                             />
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => {
                //             return (
                //                 <table>
                //                     <tbody>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={
                //                                         t(
                //                                             "folderSetTemplate.source",
                //                                             "要添加编目的文件夹"
                //                                         ) + t("id", "ID")
                //                                     }
                //                                 >
                //                                     {t(
                //                                         "folderSetTemplate.source",
                //                                         "要添加编目的文件夹"
                //                                     ) + t("id", "ID")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>{input?.docid}</td>
                //                         </tr>
                //                         {typeof input?.templates ===
                //                             "string" ? (
                //                             input.templates
                //                         ) : (
                //                             <MetadataLog
                //                                 t={t}
                //                                 templates={input?.templates}
                //                             />
                //                         )}
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //         FormattedOutput: ({
                //             t,
                //             outputData,
                //             outputs,
                //         }: ExecutorActionOutputProps) => {
                //             return (
                //                 <table>
                //                     <tbody>
                //                         <MetadataLog
                //                             t={t}
                //                             templates={outputData}
                //                         />
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //     },
                // },
                // 新建文件节点
                ...FileCreate,
                // 新增表格记录
                // {
                //     name: "EAFileEditExcel",
                //     description: "EAFileEditExcelDescription",
                //     operator: "@anyshare/file/editexcel",
                //     group: "file",
                //     icon: FileSVG,
                //     outputs: [
                //         {
                //             key: ".docid",
                //             type: "asFile",
                //             name: "EAFileEditExcelOutputFile",
                //         },
                //         {
                //             key: ".name",
                //             type: "string",
                //             name: "EAFileCreateOutputName",
                //         },
                //         {
                //             key: ".path",
                //             type: "string",
                //             name: "EAFileCreateOutputPath",
                //         },
                //         {
                //             key: ".create_time",
                //             type: "datetime",
                //             name: "EAFileCreateOutputCreateTime",
                //         },
                //         {
                //             key: ".creator",
                //             type: "string",
                //             name: "EAFileCreateOutputCreator",
                //         },
                //         {
                //             key: ".modify_time",
                //             type: "datetime",
                //             name: "EAFileCreateOutputModificationTime",
                //         },
                //         {
                //             key: ".editor",
                //             type: "string",
                //             name: "EAFileCreateOutputModifiedBy",
                //         },
                //     ],
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid))
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters = {
                //                         content: [""],
                //                     },
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const [form] = Form.useForm();
                //                 const typeRef = useRef<Validatable>(null);

                //                 const inputs = useMemo(
                //                     () =>
                //                         parameters.content.map(() =>
                //                             createRef<Validatable>()
                //                         ),
                //                     [parameters.content]
                //                 );

                //                 useImperativeHandle(ref, () => {
                //                     return {
                //                         async validate() {
                //                             const validateResults =
                //                                 await Promise.allSettled([
                //                                     ...inputs.map((ref: any) =>
                //                                         typeof ref.current
                //                                             ?.validate ===
                //                                             "function"
                //                                             ? ref.current?.validate()
                //                                             : true
                //                                     ),
                //                                     typeof typeRef.current
                //                                         ?.validate ===
                //                                         "function"
                //                                         ? typeRef.current.validate()
                //                                         : true,
                //                                     form.validateFields().then(
                //                                         () => true,
                //                                         () => false
                //                                     ),
                //                                 ]);

                //                             return validateResults.every(
                //                                 (v) =>
                //                                     v.status === "fulfilled" &&
                //                                     v.value
                //                             );
                //                         },
                //                     };
                //                 });

                //                 const transferParameter = useMemo(() => {
                //                     return {
                //                         docid: parameters?.docid,
                //                         type: parameters?.new_type
                //                             ? {
                //                                 new_type: parameters.new_type,
                //                                 insert_type:
                //                                     parameters.insert_type,
                //                                 insert_pos:
                //                                     parameters.insert_pos,
                //                             }
                //                             : undefined,
                //                         content: parameters?.content,
                //                     };
                //                 }, [parameters]);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={transferParameter}
                //                         autoComplete="off"
                //                         onFieldsChange={() => {
                //                             const val = form.getFieldsValue();
                //                             onChange({
                //                                 docid: val?.docid,
                //                                 new_type: val?.type?.new_type,
                //                                 insert_type:
                //                                     val?.type?.insert_type,
                //                                 insert_pos:
                //                                     val?.type?.insert_pos,
                //                                 content: val?.content,
                //                             });
                //                         }}
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("fileEditExcel.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asFile"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={1}
                //                                 supportExtensions={[
                //                                     ".xls",
                //                                     ".xlsx",
                //                                 ]}
                //                                 notSupportTip={t(
                //                                     "fileEditExcel.tip"
                //                                 )}
                //                                 placeholder={t(
                //                                     "fileEditExcel.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t("fileEditExcel.method")}
                //                             name="type"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <TableRowSelect
                //                                 ref={typeRef}
                //                                 t={t}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t(
                //                                 "fileEditExcel.addContent"
                //                             )}
                //                         >
                //                             <Form.List name="content">
                //                                 {(
                //                                     fields,
                //                                     { add, remove },
                //                                     { errors }
                //                                 ) => {
                //                                     return (
                //                                         <>
                //                                             {fields.map(
                //                                                 (
                //                                                     field,
                //                                                     index
                //                                                 ) => (
                //                                                     <FormItem
                //                                                         {...field}
                //                                                         noStyle
                //                                                     >
                //                                                         <EditContentInput
                //                                                             ref={
                //                                                                 inputs[
                //                                                                 index
                //                                                                 ]
                //                                                             }
                //                                                             t={
                //                                                                 t
                //                                                             }
                //                                                             index={
                //                                                                 index
                //                                                             }
                //                                                             removable={
                //                                                                 fields.length >
                //                                                                 1
                //                                                             }
                //                                                             onRemove={() =>
                //                                                                 remove(
                //                                                                     index
                //                                                                 )
                //                                                             }
                //                                                         />
                //                                                     </FormItem>
                //                                                 )
                //                                             )}
                //                                             <FormItem
                //                                                 style={{
                //                                                     marginBottom: 0,
                //                                                 }}
                //                                             >
                //                                                 <Button
                //                                                     icon={
                //                                                         <PlusOutlined />
                //                                                     }
                //                                                     onClick={() =>
                //                                                         add("")
                //                                                     }
                //                                                 >
                //                                                     {t(
                //                                                         "fileEditExcel.add"
                //                                                     )}
                //                                                 </Button>
                //                                             </FormItem>
                //                                         </>
                //                                     );
                //                                 }}
                //                             </Form.List>
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //         FormattedInput: ({
                //             t,
                //             input,
                //         }: ExecutorActionInputProps) => {
                //             return (
                //                 <table>
                //                     <tbody>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={
                //                                         t(
                //                                             "fileEditExcel.source"
                //                                         ) + t("id", "ID")
                //                                     }
                //                                 >
                //                                     {t("fileEditExcel.source") +
                //                                         t("id", "ID")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>{input?.docid}</td>
                //                         </tr>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t(
                //                                         "fileEditExcel.method"
                //                                     )}
                //                                 >
                //                                     {t("fileEditExcel.method")}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>
                //                                 {t(
                //                                     `fileEditExcel.${input.new_type}`
                //                                 ) +
                //                                     "/" +
                //                                     t(
                //                                         `fileEditExcel.${input.new_type}.${input.insert_type}`
                //                                     )}
                //                             </td>
                //                         </tr>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t(
                //                                         `fileEditExcel.${input.new_type}.insert_pos`
                //                                     )}
                //                                 >
                //                                     {t(
                //                                         `fileEditExcel.${input.new_type}.insert_pos`
                //                                     )}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>{input.insert_pos}</td>
                //                         </tr>
                //                         <tr>
                //                             <td className={styles.label}>
                //                                 <Typography.Paragraph
                //                                     ellipsis={{
                //                                         rows: 2,
                //                                     }}
                //                                     className="applet-table-label"
                //                                     title={t(
                //                                         "fileEditExcel.addContent"
                //                                     )}
                //                                 >
                //                                     {t(
                //                                         "fileEditExcel.addContent"
                //                                     )}
                //                                 </Typography.Paragraph>
                //                                 {t("colon", "：")}
                //                             </td>
                //                             <td>
                //                                 {input.content
                //                                     ? input.content?.join(" ")
                //                                     : ""}
                //                             </td>
                //                         </tr>
                //                     </tbody>
                //                 </table>
                //             );
                //         },
                //     },
                // },
                // 设置文件关联文档节点
                {
                    name: "EAFileRelevance",
                    description: "EAFileRelevanceDescription",
                    operator: "@anyshare/file/relevance",
                    group: "file",
                    icon: FileSVG,
                    outputs: [],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("fileRelevance.source")}
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
                                                selectType={1}
                                                placeholder={t(
                                                    "fileRelevance.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("fileRelevance.relevance")}
                                            name="relevance"
                                            allowVariable
                                            type={["asFile", "asFolder"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("docSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                selectType={3}
                                                placeholder={t(
                                                    "fileRelevance.relevancePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
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
                                                <Typography.Paragraph
                                                    ellipsis={{
                                                        rows: 2,
                                                    }}
                                                    className="applet-table-label"
                                                    title={
                                                        t(
                                                            "fileRelevance.source"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t("fileRelevance.source") +
                                                        t("id", "ID")}
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
                                                    title={
                                                        t(
                                                            "fileRelevance.relevance"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t(
                                                        "fileRelevance.relevance"
                                                    ) + t("id", "ID")}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {isArray(input?.relevance)
                                                    ? input.relevance.map(
                                                        (item: string) => (
                                                            <div>{item}</div>
                                                        )
                                                    )
                                                    : String(input?.relevance)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                // 设置文件夹关联文档节点
                {
                    name: "EAFolderRelevance",
                    description: "EAFolderRelevanceDescription",
                    operator: "@anyshare/folder/relevance",
                    group: "folder",
                    icon: FolderSVG,
                    outputs: [],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("folderRelevance.source")}
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
                                                title={t("folderSelectTitle")}
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={2}
                                                placeholder={t(
                                                    "folderRelevance.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "folderRelevance.relevance"
                                            )}
                                            name="relevance"
                                            allowVariable
                                            type={["asFile", "asFolder"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                title={t("docSelectTitle")}
                                                multiple
                                                multipleMode="list"
                                                omitUnavailableItem
                                                selectType={3}
                                                placeholder={t(
                                                    "folderRelevance.relevancePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
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
                                                <Typography.Paragraph
                                                    ellipsis={{
                                                        rows: 2,
                                                    }}
                                                    className="applet-table-label"
                                                    title={
                                                        t(
                                                            "folderRelevance.source"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t(
                                                        "folderRelevance.source"
                                                    ) + t("id", "ID")}
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
                                                    title={
                                                        t(
                                                            "folderRelevance.relevance"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t(
                                                        "folderRelevance.relevance"
                                                    ) + t("id", "ID")}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {isArray(input?.relevance)
                                                    ? input.relevance.map(
                                                        (item: string) => (
                                                            <div>{item}</div>
                                                        )
                                                    )
                                                    : String(input?.relevance)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                // 根据文件名查找文件
                {
                    name: "EAFileSearchFile",
                    description: "EAFileSearchFileDescription",
                    operator: "@anyshare/file/get-file-by-name",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asFile",
                            name: "EAFileSearchFileOutputDocid",
                        },
                        {
                            key: ".name",
                            name: "DSpecifyFilesOutputName",
                            type: "string",
                        },
                        {
                            key: ".path",
                            name: "DSpecifyFilesOutputPath",
                            type: "string",
                        },
                        {
                            key: ".create_time",
                            name: "DSpecifyFilesOutputCreateTime",
                            type: "datetime",
                        },
                        {
                            key: ".creator",
                            name: "DSpecifyFilesOutputCreator",
                            type: "string",
                        },
                        {
                            key: ".modify_time",
                            name: "DSpecifyFilesOutputModificationTime",
                            type: "datetime",
                        },
                        {
                            key: ".editor",
                            name: "DSpecifyFilesOutputModifiedBy",
                            type: "string",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("fileSearchFile.source")}
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
                                                selectType={2}
                                                placeholder={t(
                                                    "fileSearchFile.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("fileSearchFile.name")}
                                            name="name"
                                            allowVariable
                                            type="string"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                                {
                                                    pattern:
                                                        /^[^#\\/:*?"<>|]{0,255}$/,
                                                    message:
                                                        t("invalidFileName"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                autoComplete="off"
                                                placeholder={t(
                                                    "fileSearchFile.namePlaceholder"
                                                )}
                                            />
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
                                                <Typography.Paragraph
                                                    ellipsis={{
                                                        rows: 2,
                                                    }}
                                                    className="applet-table-label"
                                                    title={
                                                        t(
                                                            "fileSearchFile.source"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t(
                                                        "fileSearchFile.source"
                                                    ) + t("id", "ID")}
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
                                                    title={t(
                                                        "fileSearchFile.name"
                                                    )}
                                                >
                                                    {t("fileSearchFile.name")}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>{input?.name}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                        FormattedOutput: ({
                            t,
                            outputData,
                            outputs,
                        }: ExecutorActionOutputProps) => {
                            if (!outputData["docid"] && !outputData["name"]) {
                                return t("getFileNone", "未获取到文件");
                            }
                            return (
                                <table>
                                    <tbody>
                                        {outputs &&
                                            isArray(outputs) &&
                                            outputs.map((item: Output) => {
                                                let label = item?.name
                                                    ? t(item.name)
                                                    : "";
                                                const key = item.key.replace(
                                                    ".",
                                                    ""
                                                );
                                                if (key === "docid") {
                                                    label =
                                                        label + t("id", "ID");
                                                }
                                                let value =
                                                    typeof outputData[key] ===
                                                        "string"
                                                        ? outputData[key]
                                                        : JSON.stringify(
                                                            outputData[key]
                                                        );
                                                if (
                                                    key === "create_time" ||
                                                    key === "modify_time"
                                                ) {
                                                    value = formatTime(value);
                                                }
                                                if (key === "size") {
                                                    value = formatSize(
                                                        value,
                                                        2
                                                    );
                                                }
                                                if (label) {
                                                    return (
                                                        <tr>
                                                            <td
                                                                className={
                                                                    styles.label
                                                                }
                                                            >
                                                                <Typography.Paragraph
                                                                    ellipsis={{
                                                                        rows: 2,
                                                                    }}
                                                                    className="applet-table-label"
                                                                    title={
                                                                        label
                                                                    }
                                                                >
                                                                    {label}
                                                                </Typography.Paragraph>
                                                                {t(
                                                                    "colon",
                                                                    "："
                                                                )}
                                                            </td>
                                                            <td>{value}</td>
                                                        </tr>
                                                    );
                                                }
                                                return null;
                                            })}
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                // 获取Word/PDF文件页数
                {
                    name: "EAFileGetPage",
                    description: "EAFileGetPageDescription",
                    operator: "@anyshare/file/getpage",
                    group: "file",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".page_nums",
                            type: "number",
                            name: "EAFileGetPageOutputPage",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid))
                        );
                    },
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
                                            label={t("fileGetPage.source")}
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
                                                selectType={1}
                                                supportExtensions={[
                                                    ".pdf",
                                                    ".doc",
                                                    ".docx",
                                                    ".docm",
                                                    ".dotm",
                                                    ".dotx",
                                                    ".odt",
                                                    ".wps",
                                                ]}
                                                notSupportTip={t(
                                                    "fileGetPage.sourcePlaceholder"
                                                )}
                                                placeholder={t(
                                                    "fileGetPage.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
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
                                                <Typography.Paragraph
                                                    ellipsis={{
                                                        rows: 2,
                                                    }}
                                                    className="applet-table-label"
                                                    title={
                                                        t(
                                                            "fileGetPage.source"
                                                        ) + t("id", "ID")
                                                    }
                                                >
                                                    {t("fileGetPage.source") +
                                                        t("id", "ID")}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>{input?.docid}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                        FormattedOutput: ({
                            t,
                            outputData,
                            outputs,
                        }: ExecutorActionOutputProps) => {
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
                                                    title={t(
                                                        "EAFileGetPageOutputPage",
                                                        "文件页数"
                                                    )}
                                                >
                                                    {t(
                                                        "EAFileGetPageOutputPage",
                                                        "文件页数"
                                                    )}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>
                                                {outputData?.page_nums || 0}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                FilePermExecutorAction,
                FolderPermExecutorAction
                // FileRestoreReversionAction
            ],
        },
    ],
    translations: {
        zhCN,
        zhTW,
        enUS,
        viVN,
    },
} as Extension;
