import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { isString } from "lodash";
import clsx from "clsx";
import { Button, Input, Select } from "antd";
import { TranslateFn, useTranslate } from "@applet/common";
import { CloseOutlined } from "@applet/icons";
import { Param, ParamType } from "./custom-params-input";
import {
    TriggerStepNode,
    ExecutorStepNode,
    DataSourceStepNode,
    LoopOperator,
} from "../editor/expr";
import { Output, Validatable } from "../extension";
import { EditorContext } from "../editor/editor-context";
import { StepConfigContext } from "../editor/step-config-context";
import { VariableInput } from "../editor/form-item";
import styles from "./styles/params-config.module.less";

interface ParamsConfigProps {
    t: TranslateFn;
    index: number;
    param: Param;
    paramsType: "input" | "output";
    onChange: (index: number, params: Param) => void;
    onValidateName: () => void;
    onDelete: (index: number) => void;
    scope?: number[];
}

const SimilarType: Record<string, readonly string[]> = {
    array: [
        "multipleFiles",
        "asTags",
        "asUsers",
        "asDepartments"
    ],
    int: ["number"],
    string: [
        "long_string",
        "radio",
        "asFile",
        "asFolder",
        "asDoc",
        "asUser",
        "version",
        "textExtractResult",
        "datetime",
        "asMetadata",
        "asLevel",
        "asPerm",
        "asAccessorPerms"
    ],
    object: ["ocrResult", "asLevel"]
}

export const getTypes = (type: string): string[] => {
    return [type, ...SimilarType[type] ?? []]
}

export const ParamsConfig = forwardRef<Validatable, ParamsConfigProps>(
    (
        { t, param, index, paramsType, onChange, onValidateName, onDelete, scope },
        ref
    ) => {
        const [name, setName] = useState("");
        const [value, setValue] = useState<string | undefined>();
        const [type, setType] = useState<ParamType | undefined>();
        const [isPicking, setIsPicking] = useState(false);
        const [inValidStatus, setInValidStatus] = useState({
            name: "",
            type: "",
            value: "",
        });
        const { step } = useContext(StepConfigContext);
        const { pickVariable, stepNodes, stepOutputs } =
            useContext(EditorContext);
        const inputRef = useRef<HTMLDivElement>(null);
        const __ = useTranslate();

        const num = useMemo(() => index + 1, [index]);

        const [variableVal, setVariableVal] = useState<any>();

        useImperativeHandle(ref, () => {
            return {
                validate() {
                    return handleValidate();
                },
            };
        });

        useLayoutEffect(() => {
            if (paramsType === "input") {
                setValue(param.value);
            }
            setName(param.key);
            setType(param.type);
        }, []);

        useEffect(() => {
            const newParam = {
                id: param.id,
                key: name,
                value,
                type,
            };
            onChange(index, newParam);
            if (inValidStatus.name) {
                validateName();
            }
            if (inValidStatus.type) {
                validateType();
            }
            if (inValidStatus.value) {
                validateValue();
            }
        }, [name, value, type]);

        const [isVariable, stepNode, stepOutput] = useMemo<
            [
                boolean,
                (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
                Output?
            ]
        >(() => {
            if (typeof value === "string") {
               const result = /^\{\{(__(\w+).*)\}\}$/.exec(value);

                if (result) {
                    const [, key, id] = result;
                    const newID = !isNaN(Number(id)) ? id : "1000"; //处理全局变量的情况
                    // 找到最精确的匹配项（最长的匹配前缀）
                    let bestMatch: any = null;
                    
                    Object.entries(stepOutputs).forEach(([id, val]) => {
                    if (key.startsWith(id)) {
                        const differentPart = key.substring(id.length);
                        // 检查是否比当前最佳匹配更精确（匹配长度更长）
                        if (!bestMatch || id.length > bestMatch.id.length) {
                        bestMatch = {
                            id,
                            value: val,
                            differentPart: differentPart.startsWith(".") ? differentPart.substring(1) : differentPart
                        };
                        }
                    }
                    });

                    const outputsNew = bestMatch ? [{
                    key,
                    value: bestMatch.value,
                    differentPart: bestMatch.differentPart
                    }] : [];

                    setVariableVal({
                      ...variableVal,
                      addVal: outputsNew[0]?.differentPart,
                    });

                    return [
                        true,
                        stepNodes[newID] as
                        | TriggerStepNode
                        | ExecutorStepNode
                        | DataSourceStepNode,
                        stepOutputs[key] || outputsNew[0]?.value,
                    ];
                }
            }
            return [false];
        }, [value, stepNodes, stepOutputs]);

        const options = [
            { label: "string", value: ParamType.String },
            { label: "int", value: ParamType.Int },
            { label: "array", value: ParamType.Array },
            { label: "object", value: ParamType.Object },
        ];

        const validateName = () => {
            // 检验变量重名
            onValidateName();
            if (name.length > 0) {
                // 数字开头
                if (/^\d+.*/.test(name)) {
                    setInValidStatus((pre) => ({ ...pre, name: "numStart" }));
                    return false;
                }
                // 格式不合法
                if (name.length > 20 || /\W/.test(name)) {
                    setInValidStatus((pre) => ({ ...pre, name: "invalid" }));
                    return false;
                }
                setInValidStatus((pre) => ({ ...pre, name: "" }));
                return true;
            }

            setInValidStatus((pre) => ({ ...pre, name: "empty" }));
            return false;
        };

        const validateType = () => {
            if (isString(type)) {
                setInValidStatus((pre) => ({ ...pre, type: "" }));
                return true;
            }
            setInValidStatus((pre) => ({ ...pre, type: "empty" }));
            return false;
        };

        const validateValue = () => {
            if (value && value.length > 0) {
                // 变量失效
                if (isVariable && !stepOutput) {
                    setInValidStatus((pre) => ({
                        ...pre,
                        value: "variableInvalid",
                    }));
                    return false;
                }
                setInValidStatus((pre) => ({ ...pre, value: "" }));
                return true;
            }
            setInValidStatus((pre) => ({ ...pre, value: "empty" }));
            return false;
        };

        const handleValidate = () => {
            const isNameValid = validateName();
            const isTypeValid = validateType();
            const isValueValid =
                paramsType === "output" ? true : validateValue();
            if (isNameValid && isTypeValid && isValueValid) {
                return true;
            }
            return false;
        };

        const handleSelect = (val: ParamType) => {
            if (isVariable && val !== type && value) {
                const type = stepOutput?.type;
                const currentType = val === "int" ? "number" : val;
                if (currentType !== type) {
                    setValue("");
                }
            }
            setType(val);
        };

        const getErrorTip = (status: string) => {
            switch (status) {
                case "variableInvalid":
                    return t(
                        "tool.error.variableNotExist",
                        "已选变量不存在，请重新选择"
                    );
                case "invalid":
                    return t(
                        "tool.error.invalid",
                        "变量名称在20个字符以内，只能包含大小写字母、下划线或数字"
                    );
                case "numStart":
                    return t(
                        "tool.error.numStart",
                        "变量名称不能以数字为第一个字符"
                    );
                default:
                    return t("tool.error.empty", "请完善变量设置");
            }
        };

        return (
            <div
                className={clsx(styles["section"], {
                    [styles["output_section"]]: paramsType === "output",
                })}
            >
                <div className={styles["section-header"]}>
                    <span>{t("tool.params.num", { num })}</span>
                    {paramsType === "input" ? (
                        <Button
                            type="link"
                            onClick={() => {
                                const targetRect =
                                    inputRef.current?.getBoundingClientRect();
                                setIsPicking(true);
                                pickVariable(
                                    (step && stepNodes[step.id]?.path) || [],
                                    getTypes(type as string),
                                    {
                                        targetRect,
                                        height: 264,
                                        loop: step?.operator === LoopOperator
                                    },
                                )
                                    .then((value) => {
                                        setValue(`{{${value}}}`);
                                    })
                                    .catch()
                                    .finally(() => {
                                        setIsPicking(false);
                                    });
                            }}
                            className={styles["pick-btn"]}
                        >
                            {__("editor.formItem.pickVariable", "选择变量")}
                        </Button>
                    ) : (
                        <span></span>
                    )}
                </div>
                <div className={styles["section-content"]}>
                    <div className={styles["name-input"]}>
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                            status={inValidStatus.name ? "error" : undefined}
                            onBlur={validateName}
                            placeholder={t("tool.placeholder.name")}
                        />
                    </div>
                    <div className={styles["type-select"]}>
                        <Select
                            options={options}
                            value={type}
                            status={inValidStatus.type ? "error" : undefined}
                            onChange={handleSelect}
                            onBlur={validateType}
                            placeholder={t("tool.placeholder.type")}
                            popupClassName={styles["select-popup"]}
                        ></Select>
                    </div>
                    {paramsType === "input" && (
                        <div
                            ref={inputRef}
                            className={clsx(styles["value-input"], {
                                [styles["isVariable"]]: isVariable,
                            })}
                        >
                            {isVariable || isPicking ? (
                                <VariableInput
                                    value={value}
                                    onChange={(val: string) => {
                                        setValue(val || "");
                                    }}
                                    scope={scope || ((step && stepNodes[step.id]?.path) || [])}
                                    stepNode={stepNode}
                                    stepOutput={stepOutput}
                                    variableVal={variableVal}
                                />
                            ) : (
                                <Input
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                    }}
                                    status={
                                        inValidStatus.value
                                            ? "error"
                                            : undefined
                                    }
                                    onBlur={validateValue}
                                    placeholder={t("tool.placeholder.value")}
                                />
                            )}
                        </div>
                    )}

                    <Button
                        type="link"
                        className={styles["delete-btn"]}
                        title={t("tool.params.delete", "删除")}
                        icon={
                            <CloseOutlined className={styles["delete-icon"]} />
                        }
                        onClick={() => onDelete(index)}
                    />
                </div>
                {(inValidStatus.name ||
                    inValidStatus.type ||
                    inValidStatus.value) && (
                        <div className={styles["valid-tip"]}>
                            {getErrorTip(
                                inValidStatus.name ||
                                inValidStatus.type ||
                                inValidStatus.value
                            )}
                        </div>
                    )}
            </div>
        );
    }
);
