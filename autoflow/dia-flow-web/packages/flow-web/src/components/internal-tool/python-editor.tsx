import { useContext, useEffect, useMemo, useRef, useState } from "react";
import copy from "copy-to-clipboard";
import clsx from "clsx";
import { Button, Input, Modal } from "antd";
import { API, MicroAppContext, TranslateFn } from "@applet/common";
import { ClearOutlined, CopyOutlined, PlayOutlined } from "@applet/icons";
import { CodeEditor, CodeEditorInstance } from "../code-editor/code-editor";
import { Param } from "./custom-params-input";
import { VariableInput } from "../editor/form-item";
import { isAccessable, isLoopVarAccessible } from "../editor/variable-picker";
import { EditorContext } from "../editor/editor-context";
import {
    TriggerStepNode,
    ExecutorStepNode,
    DataSourceStepNode,
    LoopOperator,
} from "../editor/expr";
import { StepConfigContext } from "../editor/step-config-context";
import { useHandleErrReq } from "../../utils/hooks";
import { Output } from "../extension";
import "./python-hint";
import styles from "./styles/python-editor.module.less";

interface PythonEditorProps {
    t: TranslateFn;
    value?: any;
    inputParams?: Param[];
    outputParams?: Param[];
    onChange?: (val: string) => void;
}

const codeTemplate = "def main():\n    return ";

export const handleOutput = (val: any) => {
    if (typeof val === "string") {
        return val;
    }
    return JSON.stringify(val);
};

export const PythonEditor = (props: PythonEditorProps) => {
    const {
        value = codeTemplate,
        onChange,
        t,
        inputParams,
        outputParams,
    } = props;
    const [isModalVisible, setModalVisible] = useState(false);
    const [values, setValues] = useState<Record<string, any>>({});
    const [outputResult, setResult] = useState<any>();
    const [isLoading, setLoading] = useState(false);
    const editorRef = useRef<CodeEditorInstance>(null);
    const { prefixUrl, message } = useContext(MicroAppContext);
    const containerRef = useRef<HTMLDivElement>(null);
    const handleErr = useHandleErrReq();

    const variables = useMemo(() => {
        if (inputParams) {
            let params: Record<string, boolean> = {};
            const transfer = inputParams.filter((item: Param) => {
                const value = item?.value;
                if (typeof value === "string") {
                    const result = /^\{\{(__(\d+).*)\}\}$/.exec(value);
                    if (result && !params?.[value]) {
                        params = { ...params, [value]: true };
                        return true;
                    }
                    return false;
                }
                return false;
            });
            return transfer;
        }
        return [];
    }, [inputParams]);

    const handleCopy = () => {
        if (editorRef.current) {
            try {
                if (value) {
                    copy(value);
                } else {
                    copy(" ");
                }
                message.success(t("tool.copied", "复制成功"));
            } catch (e: any) {
                console.error(e);
            }
        }
    };

    const handleClear = () => {
        if (editorRef.current) {
            editorRef.current.cm?.setValue("");
            editorRef.current.cm?.focus();
        }
        // 清空输出
        setResult(undefined);
    };

    const openModal = () => {
        if (variables.length > 0) {
            setModalVisible(true);
        } else {
            handleRun();
        }
    };
    const handleRun = async () => {
        const transferInputParams = inputParams?.map((item: Param) => {
            const value = item?.value;
            if (typeof value === "string") {
                const result = /^\{\{(__(\d+).*)\}\}$/.exec(value);
                if (result) {
                    return { ...item, value: values[value] };
                }
            }
            return item;
        });
        setLoading(true);
        // 获取输出
        try {
            const res = await API.axios.post(
                `${prefixUrl}/api/automation/v1/pycode/run-by-params`,
                {
                    code: value,
                    input_params: transferInputParams,
                    output_params: outputParams,
                }
            );
            setModalVisible(false);
            if (res?.data) {
                setResult(res.data);
                setTimeout(() => {
                    containerRef.current?.scrollIntoView();
                }, 500);
            }
        } catch (error: any) {
            const closeModal = () => {
                setModalVisible(false);
                setTimeout(() => {
                    containerRef.current?.scrollIntoView();
                }, 500);
            };
            if (error?.response.status === 400) {
                message.warning(t("err.title.code", "运行失败"));
                setResult({
                    [t("err.reason", "失败原因：")]: t(
                        "err.invalidParameter",
                        "请检查参数。"
                    ),
                });
                closeModal();
            } else if (
                error?.response.data?.code ===
                "ContentAutomation.InternalError.ErrorDepencyService"
            ) {
                message.warning(t("err.title.code", "运行失败"));
                setResult({
                    [t("err.reason", "失败原因：")]:
                        error?.response.data?.detail?.body?.detail ||
                        error?.response.data?.detail?.detail ||
                        error?.response.data?.description,
                });
                closeModal();
            } else {
                handleErr({ error: error?.response });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (val: string, variable: string) => {
        setValues((pre) => ({ ...pre, [variable]: val }));
    };

    useEffect(() => {
        if (value === codeTemplate) {
            onChange && onChange(codeTemplate);
        }
    }, []);

    return (
        <>
            <Button
                className={styles["btn"]}
                icon={<PlayOutlined className={styles["icon"]} />}
                onClick={openModal}
                loading={isLoading}
            >
                {t("tool.run", "运行")}
            </Button>
            <Button
                className={styles["btn"]}
                icon={<CopyOutlined className={styles["icon"]} />}
                onClick={handleCopy}
            >
                {t("tool.copy", "复制")}
            </Button>
            <Button
                className={styles["btn"]}
                icon={<ClearOutlined className={styles["icon"]} />}
                onClick={handleClear}
            >
                {t("tool.clear", "清空")}
            </Button>

            <CodeEditor ref={editorRef} value={value} onChange={onChange} />
            {outputResult && (
                <div ref={containerRef}>
                    <div className={styles["output-label"]}>
                        {t("tool.output", "输出数据")}
                    </div>
                    <div className={styles["output-container"]}>
                        <table>
                            <tbody>
                                {Object.keys(outputResult).map((key) => (
                                    <tr
                                        key={key}
                                        style={{ verticalAlign: "baseline" }}
                                    >
                                        <td className={styles["label"]}>
                                            {key}
                                            {t("colon", "：")}
                                        </td>
                                        <td>
                                            {handleOutput(outputResult[key])}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <Modal
                title={t("tool.set", "设置变量")}
                open={isModalVisible}
                width={560}
                onCancel={() => setModalVisible(false)}
                onOk={handleRun}
                okText={t("ok")}
                cancelText={t("cancel")}
                className={styles["modal"]}
                maskClosable={false}
            >
                {variables.map(({ key, value }) => (
                    <div key={key} className={styles["variable-row"]}>
                        <div className={styles["label-col"]}>
                            <ItemView value={value!} />
                        </div>
                        <Input
                            key={key}
                            placeholder={t("tool.setParam", "请输入变量值")}
                            defaultValue={values?.value}
                            onChange={(e) =>
                                handleChange(e.target.value, value!)
                            }
                            className={styles["input"]}
                        />
                    </div>
                ))}
            </Modal>
        </>
    );
};

const ItemView = ({ value }: { value: string }) => {
    const { step } = useContext(StepConfigContext);
    const { stepNodes, stepOutputs } = useContext(EditorContext);

    const [isVariable, stepNode, stepOutput] = useMemo<
        [
            boolean,
            (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
            Output?
        ]
    >(() => {
        if (typeof value === "string") {
            const result = /^\{\{(__(\d+).*)\}\}$/.exec(value);
            if (result) {
                const [, key, id] = result;
                return [
                    true,
                    stepNodes[id] as
                        | TriggerStepNode
                        | ExecutorStepNode
                        | DataSourceStepNode,
                    stepOutputs[key],
                ];
            }
        }
        return [false];
    }, [value, stepNodes, stepOutputs]);

    return (
        <div
            className={clsx(styles["variableInput-wrapper"], {
                [styles["invalid"]]:
                    !stepOutput ||
                    !isAccessable(
                        (step && stepNodes[step.id]?.path) || [],
                        stepNode!.path
                    ) && !isLoopVarAccessible((step && stepNodes[step.id]?.path) || [], stepNode!.path, stepNode?.step?.operator === LoopOperator)
            })}
        >
            <VariableInput
                scope={(step && stepNodes[step.id]?.path) || []}
                stepNode={stepNode}
                stepOutput={stepOutput}
                value={value}
            />
        </div>
    );
};
