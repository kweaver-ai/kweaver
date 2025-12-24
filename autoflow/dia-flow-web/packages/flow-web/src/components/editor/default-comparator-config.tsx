import { Form, Input, Select } from "antd";
import {
    FC,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import {
    CmpOperand,
    Comparator,
    ComparatorConfigProps,
    TypeComparators,
    Validatable,
    ValueInputProps,
} from "../extension";
import { useTranslate } from "@applet/common";
import { FormItem } from "./form-item";
import moment from "moment";
import { EditorContext } from "./editor-context";

export const DefaultComparatorConfig = forwardRef<
    Validatable,
    ComparatorConfigProps
>(({ comparators, comparator, step, t: te, onChange }, ref) => {
    const stepRef = useRef(step);
    const onChangeRef = useRef(onChange);
    const { stepOutputs } = useContext(EditorContext);

    useLayoutEffect(() => {
        stepRef.current = step;
    }, [step]);

    useLayoutEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const [form] = Form.useForm<Record<string, any>>();
    const parameters = Form.useWatch([], form);

    useEffect(() => {
        if (typeof onChangeRef.current === "function" && stepRef.current) {
            onChangeRef.current({
                ...stepRef.current,
                parameters,
            });
        }
    }, [parameters]);

    const t = useTranslate();

    useImperativeHandle(ref, () => {
        return {
            async validate() {
                try {
                    await form.validateFields();
                    return true;
                } catch (e) {
                    return false;
                }
            },
        };
    });

    useLayoutEffect(() => {
        form.setFieldsValue(step.parameters || {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step.id, form]);

    const normalizedOperands = useMemo<CmpOperand[]>(() => {
        const operands = comparator.operands || ["a", "b"];
        const requiredRule = {
            required: true,
            message: t(
                "editor.defaultComparatorConfig.empty",
                "此项不允许为空"
            ),
        };

        if (!comparator.operands) {
            return [
                {
                    name: "a",
                    label: t(
                        "editor.defaultComparatorConfig.label.a",
                        "当前值"
                    ),
                    type: comparator.type,
                    placeholder: t(
                        "editor.defaultComparatorConfig.placeholder.a",
                        "请选择条件的初始值"
                    ),
                    required: true,
                    allowVariable: true,
                    rules: [requiredRule],
                },
                {
                    name: "b",
                    label: t(
                        "editor.defaultComparatorConfig.label.b",
                        "预设值"
                    ),
                    type: comparator.type,
                    placeholder: t(
                        "editor.defaultComparatorConfig.placeholder.b",
                        "请选择条件的预设值"
                    ),
                    required: true,
                    allowVariable: true,
                    rules: [requiredRule],
                },
            ];
        }

        return operands.map((op) => {
            if (typeof op === "string") {
                return {
                    name: op,
                    label: te(op),
                    type: comparator.type,
                    required: true,
                    allowVariable: true,
                    rules: [requiredRule],
                };
            }

            const {
                name,
                label,
                placeholder,
                type = comparator.type,
                required = true,
                allowVariable = true,
                rules = [],
                from,
            } = op;

            return {
                name,
                label: te(label || name),
                placeholder: placeholder && te(placeholder),
                type,
                default: op.default,
                required,
                allowVariable,
                rules: [
                    ...(required ? [requiredRule] : []),
                    ...rules.map((rule) => {
                        if (typeof rule === "function") {
                            return rule;
                        }
                        return {
                            ...rule,
                            message:
                                typeof rule.message === "string"
                                    ? te(rule.message)
                                    : rule.message,
                        };
                    }),
                ],
                from,
            };
        });
    }, [comparator.operands, comparator.type, t, te]);

    const getType = (type?: string) => {
        if (type === "string") {
            return [
                "string",
                "long_string",
                "radio",
                "version",
            ]
        }
        return type
    }

    return (
        <Form form={form} initialValues={{}} layout="vertical">
            {normalizedOperands.map((operand, index) => {
                return (
                    <>
                        <FormItem
                            name={operand.name}
                            required={operand.required}
                            rules={operand.rules}
                            label={operand.label}
                            allowVariable={operand.allowVariable}
                            type={getType(operand.type)}
                        >
                            <CmpOperandInput
                                operand={operand}
                                placeholder={operand.placeholder}
                            />
                        </FormItem>
                        {index === 0 ? (
                            <Form.Item
                                label={t(
                                    "editor.defaultComparatorConfig.label.operator",
                                    "筛选条件"
                                )}
                            >
                                <Select
                                    transitionName=""
                                    value={step.operator}
                                    onChange={(operator, option: any) => {
                                        const params: any = {};

                                        const oprands: (CmpOperand | string)[] =
                                            option?.comparator?.operands || [
                                                "a",
                                                "b",
                                            ];

                                        oprands.forEach((oprand) => {
                                            if (typeof oprand === "string") {
                                                if (
                                                    typeof parameters[
                                                        oprand
                                                    ] === "string" &&
                                                    /^\{\{(__(\d+).*)\}\}$/.test(
                                                        parameters[oprand]
                                                    )
                                                ) {
                                                    const result =
                                                        /^\{\{(__(\d+).*)\}\}$/.exec(
                                                            parameters[oprand]
                                                        );

                                                    if (result) {
                                                        const [, key] = result;
                                                        const output =
                                                            stepOutputs[key];

                                                        if (
                                                            output &&
                                                            (!output.type ||
                                                                output.type ===
                                                                    option
                                                                        ?.comparator
                                                                        ?.type)
                                                        ) {
                                                            params[oprand] =
                                                                parameters[
                                                                    oprand
                                                                ];
                                                        }
                                                    }
                                                } else if (
                                                    parameters[oprand] !==
                                                    undefined
                                                ) {
                                                    switch (
                                                        option.comparator.type
                                                    ) {
                                                        case "string":
                                                            params[oprand] =
                                                                String(
                                                                    parameters[
                                                                        oprand
                                                                    ]
                                                                ) || "";
                                                            break;
                                                        case "number":
                                                            params[oprand] =
                                                                Number(
                                                                    parameters[
                                                                        oprand
                                                                    ]
                                                                ) || undefined;
                                                            break;
                                                        case "datetime":
                                                            params[oprand] =
                                                                moment(
                                                                    parameters[
                                                                        oprand
                                                                    ]
                                                                )?.toISOString() ||
                                                                undefined;
                                                            break;
                                                    }
                                                }
                                            } else if (
                                                typeof oprand.from ===
                                                "function"
                                            ) {
                                                if (
                                                    typeof oprand?.name ===
                                                        "string" &&
                                                    typeof parameters[
                                                        oprand.name
                                                    ] === "string" &&
                                                    /^\{\{(__(\d+).*)\}\}$/.test(
                                                        parameters[oprand.name]
                                                    )
                                                ) {
                                                    const result =
                                                        /^\{\{(__(\d+).*)\}\}$/.exec(
                                                            parameters[
                                                                oprand.name
                                                            ]
                                                        );

                                                    if (result) {
                                                        const [, key] = result;
                                                        const output =
                                                            stepOutputs[key];

                                                        if (
                                                            output &&
                                                            (!output.type ||
                                                                output.type ===
                                                                    option
                                                                        ?.comparator
                                                                        ?.type)
                                                        ) {
                                                            params[
                                                                oprand.name
                                                            ] =
                                                                parameters[
                                                                    oprand.name
                                                                ];
                                                        }
                                                    }
                                                } else {
                                                    params[oprand.name] =
                                                        oprand.from(parameters);
                                                }
                                            }
                                        });

                                        stepRef.current = {
                                            ...stepRef.current,
                                            operator,
                                            parameters: params,
                                        };
                                        form.setFieldValue(
                                            "parameters",
                                            params
                                        );
                                        onChangeRef.current(stepRef.current);
                                    }}
                                >
                                    {comparators.map((item, index) => {
                                        if ((item as Comparator).operator) {
                                            return (
                                                <Select.Option
                                                    key={
                                                        (item as Comparator)
                                                            .operator
                                                    }
                                                    comparator={item}
                                                >
                                                    {item.name}
                                                </Select.Option>
                                            );
                                        }
                                        return (
                                            <Select.OptGroup
                                                key={item.type}
                                                label={item.name}
                                            >
                                                {(
                                                    item as TypeComparators
                                                ).comparators.map(
                                                    (comparator) => (
                                                        <Select.Option
                                                            key={
                                                                comparator.operator
                                                            }
                                                            comparator={
                                                                comparator
                                                            }
                                                        >
                                                            {comparator.name}
                                                        </Select.Option>
                                                    )
                                                )}
                                            </Select.OptGroup>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        ) : null}
                    </>
                );
            })}
        </Form>
    );
});

const CmpOperandInput: FC<
    Omit<ValueInputProps, "t"> & { operand: CmpOperand }
> = ({ operand, ...props }) => {
    const { type = "string" } = operand;
    const { types } = useContext(ExtensionContext);
    const [typeDef, extension] = types[type] || [];
    const te = useTranslateExtension(extension?.name);

    const InputComponent: any = typeDef?.components?.Input;
    if (InputComponent) {
        return <InputComponent {...props} t={te} />;
    }

    return <Input {...props} />;
};
