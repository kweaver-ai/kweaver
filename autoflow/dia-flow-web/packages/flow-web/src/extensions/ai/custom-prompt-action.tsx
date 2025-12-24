import { forwardRef, useContext, useEffect, useState } from "react";
import {
    ExecutorAction,
    ExecutorActionInputProps,
} from "../../components/extension";
import { Form } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { API, AsFileSelect, MicroAppContext } from "@applet/common";
import DocSummarizeSVG from "./assets/doc-summarize.svg";
import MeetSummarizeSVG from "./assets/meet-summarize.svg";
import { useConfigForm } from "../anyshare/use-config-form";
import styles from "./index.module.less";

interface PromptDefinition {
    prompt_name: string;
    prompt_service_id: string;
    prompt_desc: string;
}

interface PromptClass {
    class_name: string;
    prompt: PromptDefinition[];
}

export const DocPromptAction: ExecutorAction = {
    name: "EADocPrompt",
    icon: DocSummarizeSVG,
    description: "EADocPromptDescription",
    operator: "@cognitive-assistant/doc-summarize",
    components: {
        Config: forwardRef(({ t, parameters, onChange }, ref) => {
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
                        label={t("customPrompt.source")}
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
                            title={t("customPrompt.fileSelectTitle")}
                            multiple={false}
                            omitUnavailableItem
                            selectType={1}
                            placeholder={t("customPrompt.sourcePlaceholder")}
                            selectButtonText={t("select")}
                        />
                    </FormItem>
                </Form>
            );
        }),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const [name, setName] = useState("");
            const { prefixUrl } = useContext(MicroAppContext);

            useEffect(() => {
                const getPrompt = async () => {
                    try {
                        // TODO 获取 service
                        const { data } = await API.axios.get<PromptClass[]>(
                            `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt`
                        );

                        const cls = data.find(
                            (cls) => cls.class_name === "WorkCenter"
                        );
                        // 根据name来区分
                        const prompt = (cls?.prompt || []).filter(
                            (item: any) => {
                                return (
                                    item.prompt_service_id ===
                                    input.prompt_service_id
                                );
                            }
                        );
                        const name = prompt[0].prompt_name || "";
                        setName(name);
                    } catch (error) {
                        console.error(error);
                    }
                };
                getPrompt();
            }, [input.prompt_service_id, prefixUrl]);

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.service")}
                                {t("colon", "：")}
                            </td>
                            <td>{name}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.source")}
                                {t("id")}
                                {t("colon", "：")}
                            </td>
                            <td>{input?.docid}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
    },
    outputs: [
        {
            key: ".result",
            name: "EACustomPromptResult",
            type: "string",
        },
    ],
};

export const MeetPromptAction: ExecutorAction = {
    name: "EAMeetPrompt",
    icon: MeetSummarizeSVG,
    description: "EAMeetPromptDescription",
    operator: "@cognitive-assistant/meet-summarize",
    components: {
        Config: forwardRef(({ t, parameters, onChange }, ref) => {
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
                        label={t("customPrompt.source")}
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
                            title={t("customPrompt.fileSelectTitle")}
                            multiple={false}
                            omitUnavailableItem
                            selectType={1}
                            placeholder={t("customPrompt.sourcePlaceholder")}
                            selectButtonText={t("select")}
                        />
                    </FormItem>
                </Form>
            );
        }),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const [name, setName] = useState("");
            const { prefixUrl } = useContext(MicroAppContext);

            useEffect(() => {
                const getPrompt = async () => {
                    try {
                        // TODO 获取 service
                        const { data } = await API.axios.get<PromptClass[]>(
                            `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt`
                        );

                        const cls = data.find(
                            (cls) => cls.class_name === "WorkCenter"
                        );
                        // 根据name来区分
                        const prompt = (cls?.prompt || []).filter(
                            (item: any) => {
                                return (
                                    item.prompt_service_id ===
                                    input.prompt_service_id
                                );
                            }
                        );
                        const name = prompt[0].prompt_name || "";
                        setName(name);
                    } catch (error) {
                        console.error(error);
                    }
                };
                getPrompt();
            }, [input.prompt_service_id, prefixUrl]);

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.service")}
                                {t("colon", "：")}
                            </td>
                            <td>{name}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.source")}
                                {t("id")}
                                {t("colon", "：")}
                            </td>
                            <td>{input?.docid}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
    },
    outputs: [
        {
            key: ".result",
            name: "EACustomPromptResult",
            type: "string",
        },
    ],
};


/* export const CustomPromptAction: ExecutorAction = {
    name: "EACustomPrompt",
    icon: CognitiveAssistantSVG,
    description: "EACustomPromptDescription",
    operator: "@cognitive-assistant/custom-prompt",
    components: {
        Config: forwardRef(({ t, parameters, onChange }, ref) => {
            const form = useConfigForm(parameters, ref);
            const { prefixUrl } = useContext(MicroAppContext);

            const { data } = useSWR<PromptDefinition[]>(
                "getCognitiveAssistantCustomPrompt",
                async () => {
                    // TODO 获取 service
                    const { data } = await API.axios.get<PromptClass[]>(
                        `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt`
                    );

                    const cls = data.find(
                        (cls) => cls.class_name === "WorkCenter"
                    );
                    return cls?.prompt || [];
                }
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
                        name="prompt_service_id"
                        label={t("customPrompt.service")}
                        required
                        rules={[
                            {
                                required: true,
                                message: t("emptyMessage"),
                            },
                        ]}
                    >
                        <Select
                            options={data?.map((def) => ({
                                label: def.prompt_name,
                                value: def.prompt_service_id,
                            }))}
                            placeholder={t(
                                "customPrompt.servicePlaceholder",
                                "请选择提示词"
                            )}
                        ></Select>
                    </FormItem>
                    <FormItem
                        required
                        label={t("customPrompt.source")}
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
                            title={t("customPrompt.fileSelectTitle")}
                            multiple={false}
                            omitUnavailableItem
                            selectType={1}
                            placeholder={t("customPrompt.sourcePlaceholder")}
                            selectButtonText={t("select")}
                        />
                    </FormItem>
                </Form>
            );
        }),
        FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
            const [name, setName] = useState("");
            const { prefixUrl } = useContext(MicroAppContext);

            useEffect(() => {
                const getPrompt = async () => {
                    try {
                        // TODO 获取 service
                        const { data } = await API.axios.get<PromptClass[]>(
                            `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt`
                        );

                        const cls = data.find(
                            (cls) => cls.class_name === "WorkCenter"
                        );
                        // 根据name来区分
                        const prompt = (cls?.prompt || []).filter(
                            (item: any) => {
                                return (
                                    item.prompt_service_id ===
                                    input.prompt_service_id
                                );
                            }
                        );
                        const name = prompt[0].prompt_name || "";
                        setName(name);
                    } catch (error) {
                        console.error(error);
                    }
                };
                getPrompt();
            }, [input.prompt_service_id, prefixUrl]);

            return (
                <table>
                    <tbody>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.service")}
                                {t("colon", "：")}
                            </td>
                            <td>{name}</td>
                        </tr>
                        <tr>
                            <td className={styles.label}>
                                {t("customPrompt.source")}
                                {t("id")}
                                {t("colon", "：")}
                            </td>
                            <td>{input?.docid}</td>
                        </tr>
                    </tbody>
                </table>
            );
        },
    },
    outputs: [
        {
            key: ".result",
            name: "EACustomPromptResult",
            type: "string",
        },
    ],
}; */