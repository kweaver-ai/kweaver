import { CloseOutlined } from "@ant-design/icons";
import { MicroAppContext, useTranslate } from "@applet/common";
import { PlusOutlined } from "@applet/icons";
import { Button, Divider, Drawer, Form, Select, Space } from "antd";
import moment from "moment";
import {
    createRef,
    FC,
    forwardRef,
    Fragment,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";
import {
    CmpOperand,
    Comparator,
    TypeComparators,
    Validatable,
} from "../extension";
import {
    ExtensionContext,
    ExtensionTranslatePrefix,
    useComparator,
    useTranslateExtension,
} from "../extension-provider";
import { DefaultComparatorConfig } from "./default-comparator-config";
import { EditorContext } from "./editor-context";
import styles from "./editor.module.less";
import { IStep } from "./expr";
import { StepConfigContext } from "./step-config-context";

export interface ConditionsConfigProps {
    step?: IStep;
    branchIndex?: number;
    onFinish?(step: IStep[][]): void;
    onCancel?(): void;
}

export const ConditionsConfig: FC<ConditionsConfigProps> = ({
    step,
    branchIndex = 0,
    onFinish,
    onCancel,
}) => {
    const { platform } = useContext(MicroAppContext);
    const { types, extensions } = useContext(ExtensionContext);
    const { getId, getPopupContainer } = useContext(EditorContext);
    const [curerntConditions, setCurrentConditions] = useState(
        (step?.branches && step.branches[branchIndex]?.conditions) || []
    );

    useLayoutEffect(() => {
        if (step) {
            setCurrentConditions(
                (step?.branches && step.branches[branchIndex]?.conditions) || []
            );
        }
    }, [step, branchIndex]);

    const refs = useMemo(
        () => curerntConditions.map(() => createRef<Validatable>()),
        [curerntConditions]
    );

    const t = useTranslate();

    const typeComparators = useMemo<TypeComparators[]>(() => {
        const typed: Record<string, Comparator[]> = {};

        extensions.forEach(({ comparators, name: extensionName }) => {
            comparators?.forEach((comparator) => {
                if (types[comparator.type]) {
                    if (!typed[comparator.type]) {
                        typed[comparator.type] = [];
                    }
                    typed[comparator.type].push({
                        ...comparator,
                        name: t(
                            `${ExtensionTranslatePrefix}/${extensionName}/${comparator.name}`
                        ),
                    });
                }
            });
        });

        return Object.entries(typed).map(([type, comparators]) => ({
            type,
            name: t(
                `${ExtensionTranslatePrefix}/${types[type][1].name}/${types[type][0].name}`
            ),
            comparators,
        }));
    }, [extensions, types, t]);

    return (
        <StepConfigContext.Provider value={{ step }}>
            <Drawer
                open={!!step}
                push={false}
                onClose={onCancel}
                width={528}
                maskClosable={false}
                afterOpenChange={(open) => {
                    if (!open) {
                        setCurrentConditions([]);
                    }
                }}
                title={
                    <div className={styles.configTitle}>
                        {t("editor.conditionsConfigTitle", "设置分支 {index}", {
                            index: branchIndex + 1,
                        })}
                    </div>
                }
                className={styles.configDrawer}
                getContainer={getPopupContainer}
                style={
                    platform === "client" ? { position: "absolute" } : undefined
                }
                footerStyle={{
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "none",
                }}
                footer={
                    <Space>
                        <Button
                            type="primary"
                            className="automate-oem-primary-btn"
                            onClick={async () => {
                                const results = await Promise.allSettled(
                                    refs.map((validate) => {
                                        if (
                                            typeof validate?.current
                                                ?.validate === "function"
                                        ) {
                                            return validate.current.validate();
                                        }
                                        return true;
                                    })
                                );
                                const isValid = results.every(
                                    (result) =>
                                        result.status === "fulfilled" &&
                                        result.value
                                );

                                if (isValid && typeof onFinish === "function") {
                                    onFinish(curerntConditions);
                                }
                            }}
                        >
                            {t("ok", "确定")}
                        </Button>
                        <Button onClick={onCancel}>
                            {t("cancel", "取消")}
                        </Button>
                    </Space>
                }
            >
                <div className={styles.conditions}>
                    <div className={styles.conditionTitle}>
                        {t(
                            "editor.conditionsConfigTip",
                            "当满足以下条件时执行后续操作"
                        )}
                    </div>
                    {curerntConditions.map((group, index) => {
                        return (
                            <Fragment key={index}>
                                <ConditionConfigGroup
                                    ref={refs[index]}
                                    comparators={typeComparators}
                                    steps={group}
                                    onChange={(value) =>
                                        setCurrentConditions((steps) => [
                                            ...steps.slice(0, index),
                                            value,
                                            ...steps.slice(index + 1),
                                        ])
                                    }
                                    onRemove={() =>
                                        setCurrentConditions((steps) => [
                                            ...steps.slice(0, index),
                                            ...steps.slice(index + 1),
                                        ])
                                    }
                                />
                                {index < curerntConditions.length - 1 ? (
                                    <div className={styles.orDivider}>
                                        <div className={styles.text}>
                                            {t("editor.conditionsOr", "或")}
                                        </div>
                                    </div>
                                ) : null}
                            </Fragment>
                        );
                    })}
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setCurrentConditions((current) => [
                                ...current,
                                [
                                    {
                                        id: getId(),
                                        operator: "@internal/cmp/string-eq",
                                        parameters: {},
                                    },
                                ],
                            ]);
                        }}
                    >
                        {curerntConditions.length
                            ? t("editor.conditionsAddOr", "新增或")
                            : t("editor.conditionsAdd", "设置条件")}
                    </Button>
                </div>
            </Drawer>
        </StepConfigContext.Provider>
    );
};

const ConditionConfig = forwardRef<
    Validatable,
    {
        comparators: TypeComparators[];
        step: IStep;
        onChange(step: IStep): void;
        onRemove(): void;
    }
>(({ comparators, step, onChange, onRemove }, ref) => {
    const { stepOutputs } = useContext(EditorContext);
    const [comparator, extensions] = useComparator(step.operator);
    const t = useTranslate();
    const te = useTranslateExtension(extensions?.name);

    const comparatorType = comparator?.type;
    const typeComparators = useMemo(() => {
        return Object.fromEntries(comparators.map((item) => [item.type, item]));
    }, [comparators]);

    const Config: any =
        comparator?.components?.Config || DefaultComparatorConfig;

    return (
        <div className={styles.conditionConfig}>
            <Button
                type="text"
                icon={<CloseOutlined />}
                className={styles.removeButton}
                onClick={onRemove}
            ></Button>
            <Form layout="vertical">
                <Form.Item label={t("editor.conditionsConfigType", "筛选类型")}>
                    <Select
                        value={comparatorType}
                        onChange={(e, option: any) => {
                            const params: any = {};
                            const comparator = option.comparators[0];
                            const oprands: (CmpOperand | string)[] =
                                comparator?.operands || ["a", "b"];
                            oprands.forEach((oprand) => {
                                if (typeof oprand === "string") {
                                    if (
                                        typeof step.parameters[oprand] ===
                                            "string" &&
                                        /^\{\{(__(\d+).*)\}\}$/.test(
                                            step.parameters[oprand]
                                        )
                                    ) {
                                        const result =
                                            /^\{\{(__(\d+).*)\}\}$/.exec(
                                                step.parameters[oprand]
                                            );

                                        if (result) {
                                            const [, key] = result;
                                            const output = stepOutputs[key];

                                            if (
                                                output &&
                                                (!output.type ||
                                                    output.type ===
                                                        comparator?.type)
                                            ) {
                                                params[oprand] =
                                                    step.parameters[oprand];
                                            }
                                        }
                                    } else if (
                                        step.parameters[oprand] !== undefined &&
                                        step.parameters[oprand] !== null
                                    ) {
                                        switch (comparator.type) {
                                            case "string":
                                                params[oprand] =
                                                    String(
                                                        step.parameters[oprand]
                                                    ) || "";
                                                break;
                                            case "number":
                                                params[oprand] =
                                                    Number(
                                                        step.parameters[oprand]
                                                    ) || undefined;
                                                break;
                                            case "datetime":
                                                params[oprand] =
                                                    moment(
                                                        step.parameters[oprand]
                                                    )?.toISOString() ||
                                                    undefined;
                                                break;
                                        }
                                    }
                                } else if (typeof oprand.from === "function") {
                                    params[oprand.name] = oprand.from(
                                        step.parameters
                                    );
                                }
                            });
                            onChange({
                                ...step,
                                operator: comparator.operator,
                                parameters: params,
                            });
                        }}
                    >
                        {comparators.map((item) => (
                            <Select.Option
                                key={item.type}
                                comparators={item.comparators}
                            >
                                {item.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
            {comparator ? (
                <Config
                    ref={ref}
                    key={step.operator}
                    t={te}
                    comparator={comparator}
                    comparators={
                        typeComparators[comparator.type]?.comparators || []
                    }
                    step={step}
                    onChange={onChange}
                />
            ) : null}
        </div>
    );
});

const ConditionConfigGroup = forwardRef<
    Validatable,
    {
        comparators: TypeComparators[];
        steps: IStep[];
        onChange(steps: IStep[]): void;
        onRemove(): void;
    }
>(({ comparators, steps, onChange, onRemove }, ref) => {
    const { getId } = useContext(EditorContext);
    const refs = useMemo(
        () => steps.map(() => createRef<Validatable>()),
        [steps]
    );
    const t = useTranslate();

    useImperativeHandle(
        ref,
        () => {
            return {
                async validate() {
                    const results = await Promise.allSettled(
                        refs.map((validate) => {
                            if (
                                typeof validate?.current?.validate ===
                                "function"
                            ) {
                                return validate.current.validate();
                            }
                            return true;
                        })
                    );
                    return results.every(
                        (result) =>
                            result.status === "fulfilled" && result.value
                    );
                },
            };
        },
        [refs]
    );

    return (
        <div className={styles.conditionGroup}>
            {steps.map((step, index) => (
                <>
                    <ConditionConfig
                        comparators={comparators}
                        ref={refs[index]}
                        key={step.id}
                        step={step}
                        onChange={(step) =>
                            onChange([
                                ...steps.slice(0, index),
                                step,
                                ...steps.slice(index + 1),
                            ])
                        }
                        onRemove={() => {
                            if (steps.length > 1) {
                                onChange([
                                    ...steps.slice(0, index),
                                    ...steps.slice(index + 1),
                                ]);
                            } else {
                                onRemove();
                            }
                        }}
                    />
                    {index < steps.length - 1 ? (
                        <Divider className={styles.andDivider}>
                            {t("editor.conditionsAnd", "且")}
                        </Divider>
                    ) : (
                        <Button
                            onClick={() =>
                                onChange([
                                    ...steps,
                                    {
                                        id: getId(),
                                        operator: "@internal/cmp/string-eq",
                                    },
                                ])
                            }
                            icon={<PlusOutlined />}
                        >
                            {t("editor.conditionsAddAnd", "新增且")}
                        </Button>
                    )}
                </>
            ))}
        </div>
    );
});
