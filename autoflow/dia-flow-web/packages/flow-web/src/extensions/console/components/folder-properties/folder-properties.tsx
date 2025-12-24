import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    ExecutorAction,
    ExecutorActionConfigProps,
    Validatable,
} from "../../../../components/extension";
import FileSVG from "../../assets/file.svg";
import { Form } from "antd";
import { FormItem } from "../../../../components/editor/form-item";
import { AsFileSelect } from "../../../../components/as-file-select";
import { isVariableLike } from "../../../anyshare";
import { API, MicroAppContext } from "@applet/common";
import {
    FileSuffixType,
    SuffixType,
} from "../../../../components/file-suffixType";
import {
    FileCategory,
    defaultSuffix,
} from "../../../../components/file-suffixType/defaultSuffix";

export interface FolderPropertiesExecutorActionParameters {
    docid: string;
    allow_suffix_doc: SuffixType[];
}

export const FolderProperties: ExecutorAction = {
    name: "EAFolderProperties",
    description: "EAFolderPropertiesDescription",
    operator: "@anyshare/doc/setallowsuffixdoc",
    group: "security",
    icon: FileSVG,
    validate(parameters) {
        return parameters && isVariableLike(parameters.docid);
    },
    components: {
        Config: forwardRef(
            (
                {
                    t,
                    parameters,
                    onChange,
                }: ExecutorActionConfigProps<FolderPropertiesExecutorActionParameters>,
                ref
            ) => {
                const [form] = Form.useForm();
                const suffixRef = useRef<Validatable>(null);
                const [allowSuffix, setAllowSuffix] =
                    useState<SuffixType[]>(defaultSuffix);
                const { prefixUrl } = useContext(MicroAppContext);
                const [othersForbiddenTypes, setOthersForbiddenTypes] =
                    useState<string[]>([]);

                useEffect(() => {
                    const getAllowSuffix = async () => {
                        try {
                            const { data } = await API.axios.get(
                                `${prefixUrl}/api/doc-share/v1/suffix-classification-info`
                            );
                            let allForbiddenTypes: string[] = [];
                            data.forEach((element: SuffixType) => {
                                if (element.enabled === false) {
                                    allForbiddenTypes =
                                        allForbiddenTypes.concat(
                                            element.suffix
                                        );
                                }
                            });
                            const allowSuffixType: SuffixType[] = data.map(
                                (item: SuffixType) => {
                                    if (item.id === FileCategory.Others) {
                                        setOthersForbiddenTypes(
                                            allForbiddenTypes
                                        );
                                        return {
                                            id: item.id,
                                            name: item.name,
                                            suffix: [],
                                        };
                                    }
                                    const allSuffix = defaultSuffix.filter(
                                        (i) => i.id === item.id
                                    )[0].suffix;
                                    const allowSuffixArr = allSuffix.filter(
                                        (suffix) => {
                                            if (
                                                allForbiddenTypes.includes(
                                                    suffix
                                                )
                                            ) {
                                                return false;
                                            }
                                            if (item.enabled === false) {
                                                return !item.suffix.includes(
                                                    suffix
                                                );
                                            }
                                            return true;
                                        }
                                    );
                                    return {
                                        id: item.id,
                                        name: item.name,
                                        suffix: allowSuffixArr,
                                    };
                                }
                            );
                            setAllowSuffix(allowSuffixType);
                            if (!parameters?.allow_suffix_doc) {
                                form.setFieldValue(
                                    "allow_suffix_doc",
                                    allowSuffixType
                                );
                            }
                        } catch (error) {
                            console.error(error);
                            const data = defaultSuffix.map(
                                (item: SuffixType) => {
                                    if (item.id === FileCategory.VirusFile) {
                                        return { ...item, suffix: [] };
                                    }
                                    return item;
                                }
                            );
                            setAllowSuffix(data);
                            if (!parameters?.allow_suffix_doc) {
                                form.setFieldValue("allow_suffix_doc", data);
                            }
                        }
                    };
                    getAllowSuffix();
                }, []);

                useImperativeHandle(ref, () => {
                    return {
                        validate() {
                            return Promise.all([
                                typeof suffixRef.current?.validate !==
                                    "function" || suffixRef.current?.validate(),
                                form.validateFields().then(
                                    () => true,
                                    () => false
                                ),
                            ]).then((results) => results.every((r) => r));
                        },
                    };
                });

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
                            label={t("folderProperties.source")}
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
                                multiple={false}
                                omitUnavailableItem
                                selectType={2}
                                placeholder={t(
                                    "folderProperties.sourcePlaceholder"
                                )}
                                selectButtonText={t("select")}
                                readOnly
                            />
                        </FormItem>
                        <FormItem
                            label={t(
                                "folderProperties.allowType",
                                "允许以下文件类型上传"
                            )}
                            required
                            name="allow_suffix_doc"
                            type="asAllowSuffixDoc"
                            allowVariable
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                    type: "array",
                                },
                            ]}
                        >
                            <FileSuffixType
                                ref={suffixRef}
                                allowAllOthers={true}
                                allowSuffix={allowSuffix}
                                othersForbiddenTypes={othersForbiddenTypes}
                            />
                        </FormItem>
                    </Form>
                );
            }
        ),
    },
};
