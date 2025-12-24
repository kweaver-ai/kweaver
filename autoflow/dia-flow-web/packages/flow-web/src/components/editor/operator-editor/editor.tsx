import {
    CSSProperties,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    IStep,
    StepNodeList,
    StepOutputs,
    LoopOperator,
    BranchesOperator,
    StepErrCode,
    TriggerStepNode,
    LoopStepNode,
} from "../../editor/expr";
import { Steps } from "../../editor/steps";
import { Button, Dropdown, Menu } from "antd";
import { Position, Scaleable, ScaleableRef } from "react-scaleable";
import styles from "../editor.module.less";
import { clamp, has } from "lodash";
import clsx from "clsx";
import {
    MicroAppContext,
    TranslateFn,
    useEvent,
    useTranslate,
} from "@applet/common";
import { EditorContext, EditorContextType } from "../../editor/editor-context";
import { ExecutorConfig } from "../executor-config";
import { ConditionsConfig } from "../../editor/conditions-config";
import { TriggerStep } from "./trigger-step";
import {
    isAccessable,
    isLoopVarAccessible,
    VariablePicker,
    VariablePickerOptions,
    VariablePickerProps,
} from ".././variable-picker";
import {
    ExtensionContext,
    useExtensionTranslateFn,
} from "../../extension-provider";
import { TriggerConfig } from "./trigger-config";
import { MinusOutlined, PlusOutlined, CenterOutlined } from "@applet/icons";
import { Output } from "../../extension";
import { useSearchParams } from "react-router-dom";
import { uploadTemplate } from "../../editor/upload-template";
import { TemplateDrawer } from "../../editor/template-drawer";
import { PolicyContext } from "../../../plugins/context";
import { LoopConfig } from "../loop-config";
import { globalVariable } from "../../../utils/global-variable";
import LoopSVG from "../../../assets/audit.svg";

interface ZoomCenter {
    delay?: number;
    scale?: boolean;
    left?: Position;
    top?: Position;
}

export interface Instance {
    validate(): Promise<boolean>;
    zoomCenter?: (params?: ZoomCenter) => void;
}

export interface EditorProps {
    mode?: string;
    className?: string;
    style?: CSSProperties;
    defaultValue?: IStep[];
    value?: IStep[];
    type?: string;
    onChange?(value?: IStep[]): void;
    getPopupContainer?(): HTMLElement;
}

const DefaultSteps: IStep[] = [
    {
        id: "0",
        operator: "",
    },
    {
        id: "1",
        operator: "",
    },
  // {
  //     "id": "2",
  //     "operator": "@internal/return",
  //     "parameters": {}
  // }
];

export const ConsoleDefaultSteps: IStep[] = [
    {
        id: "0",
    operator: "@trigger/form",
        parameters: {
            fields: [],
        },
    },
    {
        id: "1",
        operator: "",
    },
  // {
  //     "id": "2",
  //     "operator": "@internal/return",
  //     "parameters": {}
  // }
];

export const Editor = forwardRef<Instance, EditorProps>((props, ref) => {
    const { platform, message, isSecretMode } = useContext(MicroAppContext);
    const {
        triggers,
        executors,
        comparators,
        dataSources,
        globalConfig,
        isDataStudio,
        reloadAccessableExecutors,
    } = useContext(ExtensionContext);

    const { forbidForm } = useContext(PolicyContext);
    const {
        defaultValue = platform === "client" || isDataStudio
            ? DefaultSteps
            : ConsoleDefaultSteps,
        onChange,
        className,
        mode,
        type: editorType,
        style,
    } = props;
    const [params] = useSearchParams();

    const isControlled = "value" in props;

    const [value, setValue] = useState<IStep[]>(
        defaultValue && defaultValue.length > 0
            ? defaultValue
            : platform === "client" || isDataStudio
                ? DefaultSteps
                : ConsoleDefaultSteps
    );

    useLayoutEffect(() => {
        if (isControlled && props.value && props.value.length > 0) {
            setValue(props.value);
        }
    }, [props.value, isControlled]);

    const [scaleValue, setScale] = useState(1);
    const [grabbing, setGrabbing] = useState(false);

    const scaleable = useRef<ScaleableRef>(null);
    const wrapper = useRef<HTMLDivElement>(null);
    const popupContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            scaleable.current?.scrollTo({
                left: "center",
                top: scaleable.current.container!.offsetHeight - 200,
            });
        }, 33);
    }, []);

    useEffect(() => {
        const type = params.get("type");
        if (type) {
            const [triggerStep, ...executorSteps] = value;
            const onFinish = (step: IStep) => {
                if (isControlled) {
                    if (typeof onChange === "function") {
                        onChange([step, ...executorSteps]);
                    }
                } else {
                    setValue([step, ...executorSteps]);
                }
            };
            setCurrentTrigger({ value: triggerStep, onFinish });
        }
    }, []);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const {
            scrollLeft,
            scrollTop,
            offsetWidth,
            offsetHeight,
            scrollWidth,
            scrollHeight,
        } = scaleable.current!.container!;

        let flag = false;

        const onMouseMove = (e: MouseEvent) => {
            if (
                !flag &&
        (Math.abs(e.clientX - clientX) > 3 || Math.abs(e.clientY - clientY) > 3)
            ) {
                flag = true;
                setGrabbing(true);
            }
            if (flag) {
                const left = clamp(
                    scrollLeft - e.clientX + clientX,
                    0,
                    scrollWidth - offsetWidth
                );
                const top = clamp(
                    scrollTop - e.clientY + clientY,
                    0,
                    scrollHeight - offsetHeight
                );
                requestAnimationFrame(() => {
                    scaleable.current?.scrollTo({
                        left,
                        top,
                    });
                });
            }
        };

        const onMouseUp = () => {
            if (flag) {
                flag = false;
                setGrabbing(false);
            }
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, []);

    const t = useTranslate();

    const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);

    const [currentTrigger, setCurrentTrigger] = useState<{
        value: IStep;
        onFinish(value: IStep): void;
    }>();

    const [currentStep, setCurrentStep] = useState<{
        value: IStep;
        onFinish(value: IStep): void;
    }>();

    const [currentConditions, setCurrentConditions] = useState<{
        step: IStep;
        branchIndex: number;
        onFinish(value: IStep[][]): void;
    }>();

    const [currentLoop, setCurrentLoop] = useState<{
        step: IStep;
        onFinish(value: IStep): void;
    }>();

    // 要复制的节点
  const [stepToCopy, setStepToCopy] = useState<IStep | null>(null);

    const [variablePickerProps, setVariablePickerProps] =
        useState<VariablePickerProps>();

    const et = useExtensionTranslateFn();

  const [stepNodes, stepOutputs] = useMemo<[StepNodeList, StepOutputs]>(() => {
        const list = [] as unknown as any;
        const outputs: StepOutputs = {};

        outputs["__g_authorization"] = {
            key: "g_authorization",
            name: "Authorization",
            type: "string",
        }

        let stepNodeIndex = 0;

        function traverse(step: IStep, path: number[] = []) {
            switch (step.operator) {
                case BranchesOperator: {
                    list[step.id] = {
                        step,
                        index: -1,
                        type: "branches",
                        path,
                        outputs: [],
                    };
                    if (step.branches?.length) {
                        step.branches.forEach((branch, branchIndex) => {
                            list[branch.id] = {
                                type: "branch",
                                index: stepNodeIndex++,
                                path: [...path, branchIndex],
                                branch,
                                outputs: [],
                            };
                            if (branch.conditions?.length) {
                                branch.conditions.forEach((steps, groupIndex) =>
                                    steps.forEach((step, i) => {
                                        const [comparator, extension] =
                                            comparators[step.operator] || [];
                                        list[step.id] = {
                                            step,
                                            type: "comparator",
                                            index: -1,
                      path: [...path, branchIndex, -1, groupIndex, i],
                                            comparator,
                                            extension,
                                            outputs: [],
                                        };
                                    })
                                );
                            }

                            if (branch.steps?.length) {
                                branch.steps.forEach((step, i) =>
                                    traverse(step, [...path, branchIndex, i])
                                );
                            }
                        });
                    }
                    break;
                }
                case LoopOperator: {

                    let nodeOutputs: Output[] = [];

                    if (Array.isArray(step.parameters?.outputs)) {
                        nodeOutputs = [
                            {
                                key: ".value",
                                name: "value",
                                type: "any",
                                isCustom: true,
                            },
                            {
                                key: ".index",
                                name: "index",
                                type: "number",
                                isCustom: true,
                            },
                            ...step.parameters?.outputs.map((field: any) => {
                                return {
                                    key: `.outputs.${field.key}`,
                                    name: field.name || field.key,
                                    type: "array",
                                    isCustom: true,
                                };
                            }),
                        ];
                    }
                    list[step.id] = {
                        step,
                        type: "executor",
                        index: stepNodeIndex++,
                        path,
                        action: {
                            name: "循环",
                            icon: LoopSVG,
                            operator: LoopOperator,
                            outputs: nodeOutputs,
                        },
                        outputs: nodeOutputs,
                    };

                    if (nodeOutputs.length) {
                        nodeOutputs.forEach((output) => {
                            outputs[`__${step.id}${output.key}`] = output;
                        });
                    }
                    if (step.steps?.length) {
                        step.steps.forEach((step, index) =>
                            traverse(step, [...path, index])
                        );
                    }
                    break;
                }
                default: {
          const [action, executor, extension] = executors[step.operator] || [];

                    let nodeOutputs: Output[] = [];

                    if (typeof action?.outputs === "function") {
                        nodeOutputs = action.outputs(step, {
                            t: et.bind(null, extension.name) as TranslateFn,
                        });
                    } else if (Array.isArray(action?.outputs)) {
                        nodeOutputs = action.outputs;
                    }
                    list[step.id] = {
                        step,
                        type: "executor",
                        index: stepNodeIndex++,
                        path,
                        action,
                        executor,
                        extension,
                        outputs: nodeOutputs,
                    };

                    if (nodeOutputs.length) {
                        nodeOutputs.forEach((output) => {
                            outputs[`__${step.id}${output.key}`] = output;
                        });
                    }
                    break;
                }
            }
        }

        if (value.length) {
            const [step, ...steps] = value;
            const [action, trigger, extension] = triggers[step.operator] || [];

            const index = stepNodeIndex++;

            let nodeOutputs: Output[] = [];

            if (typeof action?.outputs === "function") {
                nodeOutputs = action.outputs(step, {
                    t: et.bind(null, extension.name) as TranslateFn,
                });
            } else if (Array.isArray(action?.outputs)) {
                nodeOutputs = action.outputs;
            }

            list[step.id] = {
                step,
                type: "trigger",
                index,
                path: [0],
                action,
                trigger,
                extension,
                outputs: nodeOutputs,
            };

            if (nodeOutputs.length) {
                nodeOutputs.forEach((output) => {
                    outputs[`__${step.id}${output.key}`] = output;
                });
            }

            if (action?.allowDataSource && step.dataSource?.id) {
        const [action, extension] = dataSources[step.dataSource.operator] || [];
                if (action) {
                    let nodeOutputs: Output[] = [];

                    if (typeof action?.outputs === "function") {
                        nodeOutputs = action.outputs(step, {
                            t: et.bind(null, extension.name) as TranslateFn,
                        });
                    } else if (Array.isArray(action?.outputs)) {
                        nodeOutputs = action.outputs;
                    }

                    list[step.dataSource.id] = {
                        step: step.dataSource,
                        parent: list[step.id] as TriggerStepNode,
                        type: "dataSource",
                        index,
                        path: [0],
                        action,
                        extension,
                        outputs: nodeOutputs,
                    };

                    if (nodeOutputs.length) {
                        nodeOutputs.forEach((output) => {
              outputs[`__${step.dataSource!.id}${output.key}`] = output;
                        });
                    }
                }
            }
              
            steps.forEach((step, index) => traverse(step, [index + 1]));
        }
        list[1000] =  globalVariable[0]
        return [list, outputs];
    }, [value, executors, triggers, comparators, dataSources]);

    const getId = useCallback(() => {
        const id = stepNodes.length;
        stepNodes[id] = undefined;
        return String(id);
    }, [stepNodes]);

    const pickVariable = useCallback(
        (
            scope: number[],
            type?: string | string[],
            options?: VariablePickerOptions
        ) => {
            const promise = new Promise<string>((resolve, reject) => {
                setVariablePickerProps({
                    ...options,
                    type,
                    scope,
                    onFinish: resolve,
                    onCancel: reject,
                });
            });
            promise.finally(() => setVariablePickerProps(undefined));
            return promise;
        },
        []
    );

    const [validateResult, setValidateResult] = useState(
        new WeakMap<IStep, StepErrCode>()
    );

    const validate = useEvent(async () => {
        // 最少两个节点
        if (platform === "console" && value.length === 1) {
      message.info(t("err.invalidParameter.node", "至少需包含一个执行节点"));
            return false;
        }
        let isValid = true;
        const validateResult = new WeakMap<IStep | IStep[][], StepErrCode>();

        function _validateVariables(
            step: IStep,
            parameter: any,
            depth: number = 1
        ): boolean {
            if (typeof parameter === "string") {
                const result = /^\{\{(__(\w+).*)\}\}$/.exec(parameter);
                if (result) {
                    const [, key, id] = result;
                     const newID = !isNaN(Number(id)) ? id : "1000";
                     
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

                    if (!stepNodes[newID] ||
                        outputsNew?.length<=0 ||
                        !isAccessable(
                            stepNodes[step.id]!.path,
                            stepNodes[newID]!.path
                        ) && !isLoopVarAccessible(stepNodes[step.id]!.path, stepNodes[newID]!.path, (stepNodes[newID]! as LoopStepNode).step?.operator === LoopOperator)
                    ) {
                        return false;
                    }
                }
                return true;
            } else if (Array.isArray(parameter)) {
        return parameter.every((p) => _validateVariables(step, p, depth + 1));
            } else if (parameter && typeof parameter === "object") {
                return Object.values(parameter).every((p) =>
                    _validateVariables(step, p, depth + 1)
                );
            }
            // 模板中缺少部分参数(编目设置INT类型时参数可能为null)
            if (
                parameter === null &&
                (!step.operator.includes("settemplate") ||
                    (step.operator.includes("settemplate") && depth === 2))
            ) {
                return false;
            }

            return true;
        }

        async function _validateParameters(step: IStep) {
            try {
                const node = stepNodes[step.id];
                switch (node?.type) {
                    case "executor":
                    case "trigger":
                    case "dataSource":
                        if (typeof node.action?.validate === "function") {
                            return await node.action.validate(step.parameters);
                        }
                        break;
                    case "comparator":
                        if (typeof node.comparator?.validate === "function") {
              return await node.comparator.validate(step.parameters);
                        }
                        break;
                }
            } catch (e) {
                return false;
            }
            return true;
        }

        async function _validate(step: IStep) {
            switch (step.operator) {
                case BranchesOperator: {
                    if (step.branches?.length) {
                        for (const branch of step.branches) {
                            if (branch.conditions?.length) {
                                out: for (const conditions of branch.conditions) {
                                    for (const condition of conditions) {
                                        if (
                                            !condition.operator ||
                      !_validateVariables(condition, condition.parameters, 1) ||
                      !(await _validateParameters(condition))
                                        ) {
                                            validateResult.set(
                                                branch.conditions,
                                                "INVALID_PARAMETERS"
                                            );
                                            isValid = false;
                                            break out;
                                        }
                                    }
                                }
                            }

                            await Promise.all(branch.steps.map(_validate));
                        }
                    }
                    break;
                }
                case LoopOperator: {
                    if (step.steps?.length) {
                        await Promise.all(step.steps.map(_validate));
                    }
                    break;
                }
                default: {
                    if (!step.operator) {
                        validateResult.set(step, "INVALID_OPERATOR");
                        isValid = false;
                    } else {
                        if (
                            !_validateVariables(step, step.parameters, 1) ||
                            !(await _validateParameters(step))
                        ) {
                            validateResult.set(step, "INVALID_PARAMETERS");
                            isValid = false;
                            break;
                        }

                        if (step.dataSource) {
                            if (
                                !step.dataSource.operator ||
                                !_validateVariables(
                                    step.dataSource,
                                    step.dataSource?.parameters,
                                    1
                                ) ||
                                !(await _validateParameters(step.dataSource))
                            ) {
                                validateResult.set(step, "INVALID_PARAMETERS");
                                isValid = false;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }

        await Promise.all(value.map(_validate));
        setValidateResult(validateResult);

        return isValid;
    });

    useImperativeHandle(
        ref,
        () => {
            return {
                validate,
                zoomCenter,
            };
        },
        [validate]
    );

    const contextValue = useMemo<EditorContextType>(() => {
        return {
            stepNodes,
            stepOutputs,
            validateResult,
            getId,
            pickVariable,
            currentTrigger: currentTrigger?.value,
            currentStep: currentStep?.value,
            currentBranch: currentConditions && [
                currentConditions.step,
                currentConditions.branchIndex,
            ],
            currentLoop: currentLoop?.step,
            stepToCopy,
            onConfigStepToCopy: (step: IStep | null) => setStepToCopy(step),
            onConfigTrigger: (value, onFinish) => {
                setCurrentTrigger({ value, onFinish });
            },
      onConfigLoop: (step, onFinish) => {
        setCurrentLoop({ step, onFinish });
      },
      onConfigStep: (value, onFinish) => setCurrentStep({ value, onFinish }),
            onConfigConditions: (step, branchIndex, onFinish) =>
                setCurrentConditions({ step, branchIndex, onFinish }),
            getPopupContainer: () => {
                if (typeof props.getPopupContainer === "function") {
                    return props.getPopupContainer() || popupContainer.current;
                }
                return popupContainer.current!;
            },
        };
    }, [
        stepNodes,
        stepOutputs,
        validateResult,
        currentConditions,
        currentStep,
        currentTrigger,
        stepToCopy,
        getId,
        pickVariable,
    ]);

    const zoomCenter = (params = {} as ZoomCenter) => {
        const {
            delay = 33,
            scale = true,
            left = "center",
            top = "center",
        } = params;
        if (scaleable.current?.container && wrapper.current) {
            if (scale) {
                const scale = Math.min(
                    (scaleable.current.container.offsetWidth - 40) /
                    wrapper.current.offsetWidth,
                    (scaleable.current.container.offsetHeight - 40) /
                    wrapper.current.offsetHeight,
                    1
                );

                scaleable.current.scaleTo(scale);
                scaleable.current.scaleEnded();
            }

            setTimeout(() => {
                scaleable.current?.scrollTo({
                    left,
                    top,
                });
                if (top === "content-start") {
                    const { scrollTop } = scaleable.current!.container!;
                    setTimeout(() => {
                        scaleable.current?.scrollTo({
                            left,
                            top: scrollTop - 40,
                        });
                    }, 0);
                }
            }, delay);
        }
    };

    const filterUploadTemplate = useMemo(() => {
        return uploadTemplate.filter((item) => {
            if (!isSecretMode && item?.is_security_level === true) {
                return false;
            }
            if (item?.dependency) {
                let enable = true;
                for (const dependency of item?.dependency) {
                    if (!globalConfig?.[dependency]) {
                        enable = false;
                        break;
                    }
                }
                if (!enable) {
                    return false;
                }
            }
            return true;
        });
    }, [isSecretMode, globalConfig]);

    useEffect(() => {
        reloadAccessableExecutors();
    }, []);

    return (
        <div className={clsx(styles.editor, className)}>
            <EditorContext.Provider value={contextValue}>
                <Scaleable
                    ref={scaleable}
          className={clsx(styles.scaleable, grabbing && styles.grabbing)}
                    style={style}
                    scale={scaleValue}
                    wheel={{ enabled: true, factor: 0.02 }}
                    onScale={setScale}
                    onMouseDown={onMouseDown}
                >
                    {useMemo(() => {
                        const [triggerStep, ...executorSteps] = value;
                        return (
                            <div ref={wrapper}>
                                <Steps
                                    type={editorType}
                                    steps={executorSteps}
                                    head={
                                        <>
                      <div className={clsx(styles.step, styles.start)}>
                                                <div className={styles.head}>
                          <div className={styles.title}>
                            {t("editor.step.start", "开始任务")}
                                                    </div>
                                                </div>
                                            </div>
                      <div className={styles.stepDivider} />
                      <div className={styles.stepDivider} />
                                            <TriggerStep
                                                step={triggerStep}
                                                onChange={(step) => {
                                                    if (isControlled) {
                            if (typeof onChange === "function") {
                              onChange([step, ...executorSteps]);
                                                        }
                                                    } else {
                            setValue([step, ...executorSteps]);
                                                    }
                                                }}
                                            />
                                        </>
                                    }
                                    tail={
                    <div className={clsx(styles.step, styles.start)}>
                                            <div className={styles.head}>
                                                <div className={styles.title}>
                          {t("editor.step.end", "结束任务")}
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    onChange={(steps) => {
                                        if (isControlled) {
                      if (typeof onChange === "function") {
                        onChange([triggerStep, ...steps]);
                                            }
                                        } else {
                                            setValue([triggerStep, ...steps]);
                                        }
                                    }}
                                />
                            </div>
                        );
                    }, [value, t, isControlled, onChange])}
                </Scaleable>

                {useMemo(
                    () => (
                        <TriggerConfig
                            step={currentTrigger?.value}
                            onFinish={(value) => {
                                setCurrentTrigger(undefined);
                                currentTrigger?.onFinish({
                                    ...value,
                  ...(value?.operator === currentTrigger?.value?.operator &&
                  has(currentTrigger?.value, "title")
                                        ? { title: currentTrigger?.value?.title }
                    : {}),
                                });
                            }}
                            onCancel={() => setCurrentTrigger(undefined)}
                        />
                    ),
                    [currentTrigger]
                )}

                {useMemo(
                    () => (
                        <ExecutorConfig
                            step={currentStep?.value}
                            onFinish={(value) => {
                                setCurrentStep(undefined);
                                currentStep?.onFinish({
                                    ...value,
                  ...(value?.operator === currentStep?.value?.operator &&
                  has(currentStep?.value, "title")
                                        ? { title: currentStep?.value?.title }
                    : {}),
                                });
                            }}
                            onCancel={() => setCurrentStep(undefined)}
                        />
                    ),
                    [currentStep]
                )}

                {useMemo(
                    () => (
                        <ConditionsConfig
                            step={currentConditions?.step}
                            branchIndex={currentConditions?.branchIndex}
                            onFinish={(value) => {
                                setCurrentConditions(undefined);
                                currentConditions?.onFinish(value);
                            }}
                            onCancel={() => setCurrentConditions(undefined)}
                        />
                    ),
                    [currentConditions]
                )}

                {useMemo(
                    () => (
                        <LoopConfig
                            step={currentLoop?.step}
                            onFinish={(value) => {
                                setCurrentLoop(undefined);
                                currentLoop?.onFinish(value);
                            }}
                            onCancel={() => setCurrentLoop(undefined)}
                        />
                    ),
                    [currentLoop]
                )}

                {useMemo(
                    () => (
                        <VariablePicker {...variablePickerProps} />
                    ),
                    [variablePickerProps]
                )}

                {/* 选择模板 */}
                {mode === "upload" &&
                    editorType !== "preview" &&
                    forbidForm !== true && (
                        <div
                            className={styles["template-select"]}
                            onClick={() => setShowTemplateDrawer(true)}
                        >
                            {t("uploadTemplate.select", "从模板中选择>>")}
                        </div>
                    )}
                <TemplateDrawer
                    data={filterUploadTemplate}
                    open={showTemplateDrawer}
                    onClose={() => {
                        setShowTemplateDrawer(false);
                    }}
                    onChoose={(template) => {
                        if (isControlled) {
                            if (typeof onChange === "function") {
                                onChange(template.steps);
                            }
                        } else {
                            setValue(template.steps);
                        }
                        // 内容居中
                        zoomCenter({
                            delay: 0,
                            scale: false,
                            left: "center",
                            top: "content-start",
                        });
                    }}
                />

                <div
                    className={clsx(styles["scaleTool"], {
                        [styles["strategy"]]: platform === "console",
                        [styles["preview-toolBar"]]: editorType === "preview",
                    })}
                >
                    {editorType !== "preview" && (
                        <Button
                            type="text"
                            icon={<CenterOutlined />}
                            onClick={() => zoomCenter()}
                        ></Button>
                    )}
                    <Button
                        type="text"
                        icon={<MinusOutlined />}
                        disabled={scaleValue <= 0.2}
                        onClick={() => {
                            scaleable.current?.scaleTo((cur) =>
                clamp(Math.round((cur - 0.2) * 10) / 10, 0.2, 2.0)
                            );
                            scaleable.current?.scaleEnded();
                        }}
                    ></Button>
                    <Dropdown
                        trigger={["click"]}
                        overlay={
                            <Menu
                                items={[
                                    { key: 0.2, label: "20%" },
                                    { key: 0.5, label: "50%" },
                                    { key: 1, label: "100%" },
                                    { key: 1.5, label: "150%" },
                                    { key: 2.0, label: "200%" },
                                ]}
                                onClick={({ key }) => {
                                    scaleable.current?.scaleTo(Number(key));
                                    scaleable.current?.scaleEnded();
                                }}
                            ></Menu>
                        }
                    >
                        <Button style={{ minWidth: 48 }} type="text">
                            {Math.round(scaleValue * 100)}%
                        </Button>
                    </Dropdown>
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        disabled={scaleValue >= 2.0}
                        onClick={() => {
                            scaleable.current?.scaleTo((cur) =>
                clamp(Math.round((cur + 0.2) * 10) / 10, 0.2, 2.0)
                            );
                            scaleable.current?.scaleEnded();
                        }}
                    ></Button>
                </div>
            </EditorContext.Provider>
            <div ref={popupContainer}></div>
        </div>
    );
});

Editor.displayName = "Editor";
