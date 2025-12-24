import { forwardRef, useContext, useEffect, useMemo, useState } from "react";
import textExtractSVG from "./assets/text-extract.svg";
import useSWR from "swr";
import { isVariableLike, isGNSLike, useConfigForm } from ".";
import { API, MicroAppContext } from "@applet/common";
import {
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    ExecutorActionOutputProps,
} from "../../components/extension";
import { Form, Select, Typography } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import { IStep } from "../../components/editor/expr";
import styles from "./index.module.less";
// import { transferExtractResult } from "../../components/text-extract/extract-experience";

// 自定义文本提取
export const CustomExtractAction = {
    name: "EACustomExtract",
    description: "EACustomExtractDescription",
    operator: "@docinfo/entity/extract",
    icon: textExtractSVG,
    allowDataSource: true,
    outputs: (step: IStep) => {
        const input = step.parameters;
        // 自定义文本提取
        if (input?.type === 1) {
            return [
                {
                    key: ".result",
                    type: "textExtractResult",
                    name: "EACustomExtractOutputResult",
                },
            ];
        }
        // 标签提取
        if (input?.type === 2) {
            return [
                {
                    key: ".result",
                    type: "array",
                    name: "EACustomExtractOutputResult",
                },
            ];
        }
        return [
            {
                key: ".result",
                type: "array",
                name: "EACustomExtractOutputResult",
            },
        ];
    },
    validate(parameters: any) {
        return (
            parameters &&
            (isVariableLike(parameters.content) ||
                isGNSLike(parameters.content)) &&
            typeof parameters?.type === "number"
        );
    },
    components: {
        Config: forwardRef(
            ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
                const form = useConfigForm(parameters, ref as any);
                const { prefixUrl } = useContext(MicroAppContext);

                const { data } = useSWR(
                    "EACustomExtract",
                    () => {
                        return API.axios.get(
                            `${prefixUrl}/api/automation/v1/models`,
                            {
                                params: {
                                    status: 1,
                                },
                            }
                        );
                    },
                    {
                        onSuccess(data) {
                            if (parameters?.modelid) {
                                const select = data?.data?.filter(
                                    (i: any) => i.id === parameters.modelid
                                )[0];
                                if (!select) {
                                    form.setFieldValue("modelid", "---");
                                }
                            }
                        },
                    }
                );

                return (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={parameters}
                        onFieldsChange={() => {
                            const formValue = form.getFieldsValue();
                            const type = data?.data?.filter(
                                (i: any) => i.id === formValue.modelid
                            )[0]?.type;
                            onChange({ ...formValue, type });
                        }}
                    >
                        <FormItem
                            name="modelid"
                            label={t("customModel.name")}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                },
                                {
                                    async validator(_, value) {
                                        if (
                                            value &&
                                            data?.data?.filter(
                                                (i: any) => i.id === value
                                            ).length === 0
                                        ) {
                                            throw new Error(
                                                t(
                                                    "customModel.disable",
                                                    "此能力已无法使用,请重新选择"
                                                )
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <Select
                                options={data?.data?.map((item: any) => ({
                                    label: item.name || "---",
                                    value: item.id,
                                }))}
                                virtual={false}
                                placeholder={t(
                                    "customModel.placeholder",
                                    "请选择自定义能力"
                                )}
                            ></Select>
                        </FormItem>
                        <FormItem
                            required
                            label={t("customModel.source")}
                            name="content"
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
                                // supportExtensions={[
                                //     ".doc",
                                //     ".docx",
                                //     ".pptx",
                                //     ".ppt",
                                //     ".pdf",
                                //     ".txt",
                                // ]}
                                // notSupportTip={t("type.notSupport")}
                                placeholder={t("customModel.sourcePlaceholder")}
                                selectButtonText={t("select")}
                            />
                        </FormItem>
                    </Form>
                );
            }
        ),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const [detail, setDetail] = useState({ name: "---" });
            const { prefixUrl } = useContext(MicroAppContext);

            useEffect(() => {
                const getDetails = async () => {
                    try {
                        const { data } = await API.axios.get(
                            `${prefixUrl}/api/automation/v1/models/${input.modelid}`
                        );
                        setDetail(data);
                    } catch (error) {
                        console.error(error);
                    }
                };
                getDetails();
            }, []);
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
                                    title={t("customModel.name")}
                                >
                                    {t("customModel.name")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>{detail.name}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 2,
                                    }}
                                    className="applet-table-label"
                                    title={
                                        t("customModel.source") + t("id", "ID")
                                    }
                                >
                                    {t("customModel.source") + t("id", "ID")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>{input.content}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
        FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => {
            const result = useMemo(() => {
                return JSON.stringify(outputData?.result || outputData);
            }, [outputData]);
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
                                    title={t("EACustomExtractOutputResult")}
                                >
                                    {t("EACustomExtractOutputResult")}
                                </Typography.Paragraph>
                                {t("colon", "：")}
                            </td>
                            <td>{result}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
    },
};
