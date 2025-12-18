import { Button, Form, Input, InputNumber, Modal, Space } from "antd";
import { CodeEditor } from "../code-editor/code-editor";
import copy from "copy-to-clipboard";
import { ClearOutlined, CopyOutlined, PlayOutlined } from "@applet/icons";
import styles from "./code-input.module.less";
import {
    API,
    DatePickerISO,
    MicroAppContext,
    useTranslate,
} from "@applet/common";
import { ReactNode, useCallback, useContext, useState } from "react";
import { ExecutorActionInputDto } from "../../models/executor-action-input-dto";
import { ExecutorActionOutputDto } from "../../models/executor-action-output-dto";
import useSWR from "swr";
import { AsFileSelect } from "../as-file-select";

export interface CodeInputProps {
    inputs?: ExecutorActionInputDto[];
    outputs?: ExecutorActionOutputDto[];
    defaultValue?: string;
    value?: string;
    onChange?(value: string): void;
}

export function CodeInput(props: CodeInputProps) {
    const { message, modal } = useContext(MicroAppContext);
    const t = useTranslate("customExecutor");
    const [editor, setEditor] = useState<CodeMirror.EditorFromTextArea>();
    const [showInputModal, setShowInputModal] = useState(false);
    const [form] = Form.useForm();
    const [showResult, setShowResult] = useState(false);

    const [runArgs, setRunArgs] = useState<
        [
            number,
            string,
            ExecutorActionInputDto[] | undefined,
            ExecutorActionOutputDto[] | undefined,
            Record<string, any> | null
        ]
    >([0, "", undefined, undefined, null]);

    const { data, isValidating, error } = useSWR(
        [`/api/automation/v1/pycode/run-by-params`, ...runArgs],
        async (url, _, code, inputs, outputs, values) => {
            if (!code) {
                return;
            }
            const { data } = await API.axios.post<Record<string, any>>(url, {
                code,
                input_params: inputs?.map((input) => ({
                    id: input.key,
                    key: input.key,
                    type: input.type === "number" ? "int" : "string",
                    value: String(values?.[input.key] || ""),
                })),
                output_params: outputs?.map((output) => ({
                    id: output.key,
                    key: output.key,
                    type: output.type === "number" ? "int" : "string",
                })),
            });
            return data;
        },
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnMount: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false,
            onSuccess() {
                setShowResult(true);
            },
            onError() {
                setShowResult(true);
            },
        }
    );

    return (
        <>
            <div>
                <Space className={styles.Buttons}>
                    <Button
                        className={styles["btn"]}
                        loading={isValidating}
                        icon={<PlayOutlined />}
                        disabled={!props.value?.trim?.()}
                        onClick={() => {
                            if (!props.inputs?.length) {
                                setRunArgs(([id]) => [
                                    id + 1,
                                    props.value!,
                                    props.inputs,
                                    props.outputs,
                                    {},
                                ]);
                            } else {
                                setShowInputModal(true);
                            }
                        }}
                    >
                        {t("run", "运行")}
                    </Button>
                    <Button
                        className={styles["btn"]}
                        icon={<CopyOutlined />}
                        disabled={!props.value}
                        onClick={() => {
                            try {
                                copy(props.value || " ");
                                message.success(t("tool.copied", "复制成功"));
                            } catch (e) {}
                        }}
                    >
                        {t("copy", "复制")}
                    </Button>
                    <Button
                        className={styles["btn"]}
                        icon={<ClearOutlined />}
                        disabled={!props.value}
                        onClick={() => {
                            editor?.setValue("");
                            setShowResult(false);
                        }}
                    >
                        {t("clear", "清空")}
                    </Button>
                </Space>
                <CodeEditor
                    onInitEditor={(editor) => {
                        setEditor(editor);
                        editor.setValue(props.value || "");
                        editor.on("change", () => {
                            if (typeof props.onChange === "function") {
                                props.onChange(editor.getValue());
                            }
                        });
                    }}
                />
                {showResult ? (
                    <div>
                        <div className={styles.OutputTitle}>
                            {t("outputTitle", "输出数据")}
                        </div>
                        <div className={styles.OutputContainer}>
                            <table>
                                <tbody>
                                    {error ? (
                                        <tr className={styles.Row}>
                                            <td className={styles.Label}>
                                                {t("runError", "运行失败")}
                                            </td>
                                            <td>{error.toString()}</td>
                                        </tr>
                                    ) : (
                                        props.outputs?.map((output) => {
                                            let result = data?.[output.key];
                                            if (
                                                result &&
                                                typeof result !== "string"
                                            ) {
                                                result = JSON.stringify(result);
                                            }

                                            return (
                                                <tr
                                                    key={output.key}
                                                    className={styles.Row}
                                                >
                                                    <td>
                                                        {t(
                                                            "colon",
                                                            "{label}：",
                                                            {
                                                                label: output.name,
                                                            }
                                                        )}
                                                    </td>
                                                    <td>{result}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
            <Modal
                title={t("setVariables", "设置变量")}
                open={showInputModal}
                okText={t("ok", "确定")}
                cancelText={t("cancel", "取消")}
                maskClosable={false}
                destroyOnClose
                onCancel={() => setShowInputModal(false)}
                onOk={() => form.submit()}
            >
                <Form
                    form={form}
                    onFinish={(values) => {
                        setRunArgs(([id]) => [
                            id + 1,
                            props.value!,
                            props.inputs,
                            props.outputs,
                            values,
                        ]);
                        form.resetFields();
                        setShowInputModal(false);
                    }}
                >
                    {props.inputs?.map((input) => {
                        let inputElement: ReactNode;
                        switch (input.type) {
                            case "number":
                                inputElement = (
                                    <InputNumber
                                        autoComplete="off"
                                        style={{ width: "100%" }}
                                        placeholder={t(
                                            "formPlaceholder",
                                            "请输入"
                                        )}
                                    />
                                );
                                break;
                            case "asFile":
                                inputElement = (
                                    <AsFileSelect
                                        selectType={1}
                                        multiple={false}
                                        selectButtonText={t("select")}
                                        title={t("selectFile", "选择文件")}
                                        omitUnavailableItem
                                        omittedMessage={t(
                                            "unavailableFilesOmitted",
                                            "已为您过滤不存在和无访问权限的文件"
                                        )}
                                        placeholder={t("selectFilePlaceholder")}
                                    />
                                );
                                break;
                            case "asFolder":
                                inputElement = (
                                    <AsFileSelect
                                        selectType={2}
                                        multiple={false}
                                        selectButtonText={t("select")}
                                        title={t("selectFolder", "选择文件夹")}
                                        omitUnavailableItem
                                        omittedMessage={t(
                                            "unavailableFoldersOmitted",
                                            "已为您过滤不存在和无访问权限的文件夹"
                                        )}
                                        placeholder={t(
                                            "selectFolderPlaceholder",
                                            "请选择文件夹"
                                        )}
                                    />
                                );
                                break;
                            case "multipleFiles":
                                inputElement = (
                                    <AsFileSelect
                                        selectType={1}
                                        multiple={true}
                                        multipleMode="list"
                                        checkDownloadPerm={true}
                                        title={t("selectFile", "选择文件")}
                                        placeholder={t(
                                            "selectMultipleFilesPlaceholder",
                                            "请选择"
                                        )}
                                    />
                                );
                                break;
                            case "datetime":
                                inputElement = (
                                    <DatePickerISO
                                        showTime
                                        popupClassName="automate-oem-primary"
                                        style={{ width: "100%" }}
                                    />
                                );
                                break;
                            default:
                                inputElement = (
                                    <Input
                                        autoComplete="off"
                                        placeholder={t(
                                            "formPlaceholder",
                                            "请输入"
                                        )}
                                    />
                                );
                                break;
                        }

                        return (
                            <Form.Item
                                key={input.key}
                                name={input.key}
                                label={input.name}
                                rules={
                                    input.required
                                        ? [
                                              {
                                                  required: true,
                                                  message: t(
                                                      "emptyMessage",
                                                      "此项不允许为空"
                                                  ),
                                              },
                                          ]
                                        : []
                                }
                            >
                                {inputElement}
                            </Form.Item>
                        );
                    })}
                </Form>
            </Modal>
        </>
    );
}
