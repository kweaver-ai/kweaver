import {
    ExecutorActionConfigProps,
    Extension,
    Validatable,
} from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import FileSVG from "../anyshare/assets/file.svg";
import FolderSVG from "../anyshare/assets/folder.svg";
import PreParamsSVG from "./assets/preParams.svg";
import EndReturnsSVG from "./assets/endReturns.svg";
import {
    ForwardedRef,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import { Form, Input, Radio, Select } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import { MetaDataTemplate } from "../../components/metadata-template";
import { TagInput } from "../anyshare/tag-input";
import { FilePermExecutorAction } from "./components/file-perm-executor-action";
import { FormTriggerAction } from "./components/form-params-trigger";
import { MicroAppContext } from "@applet/common";
import styles from "./index.module.less";
import { LevelSelect } from "../anyshare/level-select";
import { FolderQuota } from "./components/folder-quota";
import { FolderProperties } from "./components/folder-properties";

export function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
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

function isVariableLike(value: any) {
    return typeof value === "string" && /^\{\{(__(\d+).*)\}\}$/.test(value);
}

function isGNSLike(value: any) {
    return typeof value === "string" && /^gns:\/(\/[0-9A-F]{32})+$/.test(value);
}

export default {
    name: "console",
    triggers: [
        {
            name: "TParamsForm",
            description: "TParamsFormDescription",
            icon: PreParamsSVG,
            actions: [FormTriggerAction],
        },
    ],
    executors: [
        {
            name: "EDocument",
            icon: FolderSVG,
            description: "EDocumentDescription",
            actions: [
                {
                    name: "EAFileRemove",
                    description: "EAFileRemoveDescription",
                    operator: "@anyshare/doc/remove",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asDoc",
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
                                            type="asDoc"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                readOnly
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
                    },
                },
                {
                    name: "EAFileRename",
                    description: "EAFileRenameDescription",
                    operator: "@anyshare/doc/rename",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asDoc",
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
                                            type="asDoc"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <AsFileSelect
                                                readOnly
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
                    },
                },
                // 文档设置标签
                {
                    name: "EAFileAddtag",
                    description: "EAFileAddtagDescription",
                    operator: "@anyshare/doc/addtag",
                    icon: FileSVG,
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.tags) ||
                                (Array.isArray(parameters.tags) &&
                                    parameters.tags.length > 0 &&
                                    parameters.tags.every(
                                        (tag: string) =>
                                            typeof tag === "string" &&
                                            !/[#\\/:*?\\"<>|]/.test(tag)
                                    )))
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
                                            label={t("fileAddTag.source")}
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
                                                readOnly
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={1}
                                                placeholder={t(
                                                    "fileAddTag.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            name="tags"
                                            allowVariable
                                            type={["string", "asTags"]}
                                            required
                                            label={t("tags")}
                                            rules={[
                                                {
                                                    async validator(_, value) {
                                                        if (
                                                            !value ||
                                                            value.length < 1
                                                        ) {
                                                            throw new Error(
                                                                "empty"
                                                            );
                                                        }
                                                    },
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <TagInput
                                                t={t}
                                                placeholder={t(
                                                    "fileAddTag.tagsPlaceholder"
                                                )}
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                    },
                },
                // 文档设置密级
                {
                    name: "EAFileSetcsflevel",
                    description: "EAFileSetcsflevelDescription",
                    operator: "@anyshare/doc/setcsflevel",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".docid",
                            type: "asDoc",
                            name: "EAFileSetcsflevelOutputDocid",
                        },
                        {
                            key: ".csf_level",
                            type: "csflevel",
                            name: "EAFileSetcsflevelOutputLevel",
                        },
                        {
                            key: ".result",
                            type: "csfResult",
                            name: "EAFileSetcsflevelOutputResult",
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
                                            label={t("fileSetcsflevel.source")}
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
                                                readOnly
                                                multiple={false}
                                                omitUnavailableItem
                                                selectType={1}
                                                placeholder={t(
                                                    "fileSetcsflevel.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t("fileSetcsflevel.level")}
                                            name="csf_level"
                                            allowVariable={true}
                                            type={["asLevel"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                readOnly
                                                placeholder={t(
                                                    "fileSetcsflevel.levelPlaceholder",
                                                    "请选择密级"
                                                )}
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                    },
                },
                // 文档设置编目
                {
                    name: "EAFileSetTemplate",
                    description: "EAFileSetTemplateDescription",
                    operator: "@anyshare/doc/settemplate",
                    icon: FileSVG,
                    outputs: [
                        {
                            key: ".results",
                            type: "metaDataResults",
                            name: "EAFileSetTemplateOutputResults",
                        },
                    ],
                    validate(parameters) {
                        return (
                            parameters &&
                            (isVariableLike(parameters.docid) ||
                                isGNSLike(parameters.docid)) &&
                            (isVariableLike(parameters.templates) ||
                                typeof parameters.templates === "object")
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
                                const { platform } =
                                    useContext(MicroAppContext);

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
                                            label={t("fileSetTemplate.source")}
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
                                                readOnly={
                                                    platform === "console"
                                                        ? true
                                                        : false
                                                }
                                                omitUnavailableItem
                                                selectType={1}
                                                placeholder={t(
                                                    "fileSetTemplate.sourcePlaceholder"
                                                )}
                                                selectButtonText={t("select")}
                                            />
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "fileSetTemplate.template"
                                            )}
                                            name="templates"
                                            type="asMetadata"
                                            allowVariable={
                                                platform === "console"
                                                    ? true
                                                    : false
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <MetaDataTemplate
                                                docType="file"
                                                t={t}
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                    },
                },
                // 获取文档所在路径
                // {
                //     name: "EAFileGetpath",
                //     description: "EAFileGetpathDescription",
                //     operator: "@anyshare/doc/getpath",
                //     icon: FileSVG,
                //     outputs: [
                //         {
                //             key: ".docid",
                //             type: "asDoc",
                //             name: "EAFileGetpathOutputDocid",
                //         },
                //         {
                //             key: ".path",
                //             type: "string",
                //             name: "EAFileGetpathOutputPath",
                //         },
                //     ],
                //     validate(parameters) {
                //         return (
                //             parameters &&
                //             (isVariableLike(parameters.docid) ||
                //                 isGNSLike(parameters.docid)) &&
                //             (parameters.order === "asc" ||
                //                 parameters.order === "desc") &&
                //             typeof parameters.depth === "number" &&
                //             parameters.depth >= -1
                //         );
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters = { depth: -1, order: "asc" },
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const { depth, order, docid } = parameters;
                //                 const lastAscDepth = useRef(
                //                     order !== "desc" ? depth : -1
                //                 );
                //                 const lastDescDepth = useRef(
                //                     order === "desc" ? depth : -1
                //                 );

                //                 const ascDepth =
                //                     order !== "desc"
                //                         ? depth
                //                         : lastAscDepth.current;

                //                 const descDepth =
                //                     order === "desc"
                //                         ? depth
                //                         : lastDescDepth.current;

                //                 const fieldsValue = useMemo(
                //                     () => ({
                //                         order,
                //                         docid,
                //                         ascDepth,
                //                         descDepth,
                //                     }),
                //                     [order, docid, ascDepth, descDepth]
                //                 );

                //                 const form = useConfigForm(fieldsValue, ref);

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={fieldsValue}
                //                         onFieldsChange={() => {
                //                             const {
                //                                 order,
                //                                 docid,
                //                                 ascDepth,
                //                                 descDepth,
                //                             } = form.getFieldsValue();
                //                             lastAscDepth.current = ascDepth;
                //                             lastDescDepth.current = descDepth;
                //                             onChange({
                //                                 order,
                //                                 docid,
                //                                 depth:
                //                                     order === "desc"
                //                                         ? descDepth
                //                                         : ascDepth,
                //                             });
                //                         }}
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t("fileGetPath.source")}
                //                             name="docid"
                //                             allowVariable
                //                             type="asDoc"
                //                             rules={[
                //                                 {
                //                                     required: true,
                //                                     message: t("emptyMessage"),
                //                                 },
                //                             ]}
                //                         >
                //                             <AsFileSelect
                //                                 readOnly
                //                                 title={t("fileSelectTitle")}
                //                                 multiple={false}
                //                                 omitUnavailableItem
                //                                 selectType={1}
                //                                 placeholder={t(
                //                                     "fileGetPath.sourcePlaceholder"
                //                                 )}
                //                                 selectButtonText={t("select")}
                //                             />
                //                         </FormItem>
                //                         <FormItem
                //                             required
                //                             label={t("fileGetPath.depth")}
                //                             name="order"
                //                         >
                //                             <Radio.Group>
                //                                 <Radio
                //                                     value="asc"
                //                                     style={{ display: "block" }}
                //                                 >
                //                                     {t("fileGetPath.asc", {
                //                                         level: () => (
                //                                             <FormItem
                //                                                 name="ascDepth"
                //                                                 noStyle
                //                                             >
                //                                                 <LevelSelect
                //                                                     t={t}
                //                                                     disabled={
                //                                                         order ===
                //                                                         "desc"
                //                                                     }
                //                                                     customLevelPlaceholder={t(
                //                                                         "custom"
                //                                                     )}
                //                                                 />
                //                                             </FormItem>
                //                                         ),
                //                                     })}
                //                                 </Radio>
                //                                 <Radio
                //                                     value="desc"
                //                                     style={{
                //                                         display: "block",
                //                                         marginTop: 12,
                //                                     }}
                //                                 >
                //                                     {t("fileGetPath.desc", {
                //                                         level: () => (
                //                                             <FormItem
                //                                                 name="descDepth"
                //                                                 noStyle
                //                                             >
                //                                                 <LevelSelect
                //                                                     t={t}
                //                                                     disabled={
                //                                                         order !==
                //                                                         "desc"
                //                                                     }
                //                                                     customLevelPlaceholder={t(
                //                                                         "custom"
                //                                                     )}
                //                                                 />
                //                                             </FormItem>
                //                                         ),
                //                                     })}
                //                                 </Radio>
                //                             </Radio.Group>
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //     },
                // },
                // 权限设置
                FilePermExecutorAction,
                FolderQuota,
                FolderProperties
            ],
        },
        // 结束流程运行
        // {
        //     name: "EReturns",
        //     icon: EndReturnsSVG,
        //     description: "EReturnsDescription",
        //     actions: [
        //         {
        //             name: "EAReturns",
        //             description: "EAReturnsDescription",
        //             operator: "@internal/return",
        //             icon: EndReturnsSVG,
        //             validate(parameters) {
        //                 return Boolean(parameters);
        //             },
        //             components: {
        //                 Config: forwardRef(
        //                     (
        //                         {
        //                             t,
        //                             parameters,
        //                             onChange,
        //                         }: ExecutorActionConfigProps,
        //                         ref
        //                     ) => {
        //                         const form = useConfigForm(parameters, ref);

        //                         return (
        //                             <Form
        //                                 form={form}
        //                                 layout="vertical"
        //                                 initialValues={parameters}
        //                                 onFieldsChange={() => {
        //                                     onChange(form.getFieldsValue());
        //                                 }}
        //                             >
        //                                 <FormItem
        //                                     name="result"
        //                                     type="string"
        //                                     required
        //                                     label={t(
        //                                         "returns.result",
        //                                         "流程结束状态"
        //                                     )}
        //                                     rules={[
        //                                         {
        //                                             required: true,
        //                                             message: t("emptyMessage"),
        //                                         },
        //                                     ]}
        //                                 >
        //                                     <Radio.Group>
        //                                         <Radio value={"success"}>
        //                                             {t("returns.success")}
        //                                         </Radio>
        //                                         <Radio value={"failed"}>
        //                                             {t("returns.fail")}
        //                                         </Radio>
        //                                     </Radio.Group>
        //                                 </FormItem>
        //                             </Form>
        //                         );
        //                     }
        //                 ),
        //             },
        //         },
        //     ],
        // },
    ],
    translations: {
        zhCN,
        zhTW,
        enUS,
        viVN,
    },
} as Extension;
