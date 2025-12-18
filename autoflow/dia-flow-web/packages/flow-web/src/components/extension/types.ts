import { TranslateFn } from "@applet/common";
import { FormRule } from "antd";
import { ComponentType } from "react";
import { IStep } from "../editor/expr";

export interface BaseProps {
    t: TranslateFn;
}

export interface Validatable {
    validate?(): boolean | Promise<boolean>;
}

export interface TriggerActionNodeProps extends BaseProps {
    action: TriggerAction;
}

export interface TriggerActionConfigProps<P = any> extends BaseProps {
    action: TriggerAction;
    parameters: any;
    onChange(parameters: P): void;
}

export interface TriggerActionOutputProps extends BaseProps {
    outputData: any;
    outputs?: Outputs;
}

export interface TriggerActionInputProps extends BaseProps {
    input: any;
}

export interface Output {
    key: string;
    name: string;
    type?: string;
    /**表单触发等自定义输出部分name无需国际化处理 */
    isCustom?: boolean;
}

export type Outputs =
    | Output[]
    | ((step: IStep, opts: { t: TranslateFn }) => Output[]);

export interface TriggerAction {
    name: string;
    description?: string;
    icon: string;
    operator: string;
    title?: string;
    group?: string;
    allowDataSource?: boolean;
    outputs?: Outputs;
    validate?(parameters: any): boolean;
    components?: {
        Node?: ComponentType<TriggerActionNodeProps>;
        Config?:
        | React.ForwardRefExoticComponent<
            TriggerActionConfigProps & React.RefAttributes<Validatable>
        >
        | ComponentType<TriggerActionConfigProps>;
        FormattedOutput?: ComponentType<TriggerActionOutputProps>;
        FormattedInput?: ComponentType<TriggerActionInputProps>;
    };
}

export interface Group {
    group: string;
    name: string;
    icon?: string;
}

export interface Trigger {
    name: string;
    description?: string;
    icon: string;
    groups?: Group[];
    actions: TriggerAction[];
    group?: Group;
    extensionName?: string;
}

export interface ExecutorActionNodeProps extends BaseProps {
    action: ExecutorAction;
}

export interface ExecutorActionConfigProps<P = any> extends BaseProps {
    action: ExecutorAction;
    parameters: P;
    onChange(parameters: P): void;
}

export interface ExecutorActionOutputProps extends BaseProps {
    outputData: any;
    outputs?: Outputs;
}

export interface ExecutorActionInputProps extends BaseProps {
    input: any;
}

export interface ExecutorAction {
    name: string;
    icon: string;
    title?: string;
    description?: string;
    operator: string;
    group?: string;
    outputs?: Outputs;
    validate?(parameters: any): boolean;
    components?: {
        Node?: ComponentType<ExecutorActionNodeProps>;
        Config?:
        | ComponentType<ExecutorActionConfigProps>
        | React.ForwardRefExoticComponent<
            ExecutorActionConfigProps & React.RefAttributes<Validatable>
        >;
        FormattedOutput?: ComponentType<ExecutorActionOutputProps>;
        FormattedInput?: ComponentType<ExecutorActionInputProps>;
    };
}

export type TransferDescription = (config: Record<string, any>) => string;

export interface Executor {
    name: string;
    icon: string;
    description?: string | TransferDescription;
    groups?: Group[];
    actions: ExecutorAction[];
}

export interface ComparatorConfigProps extends BaseProps {
    step: IStep;
    comparator: Comparator;
    comparators: (Comparator | TypeComparators)[];
    onChange(step: IStep): void;
}

export interface CmpOperand<T = any> {
    name: string;
    label?: string;
    type?: string;
    default?: T;
    placeholder?: string;
    required?: boolean;
    allowVariable?: boolean;
    rules?: FormRule[];
    from?(parameters: any): T;
}

export interface Comparator {
    name: string;
    operator: string;
    type: string;
    validate?(parameters: any): boolean;
    operands?: (CmpOperand | string)[];
    components?: {
        Config?:
        | React.ForwardRefExoticComponent<
            ComparatorConfigProps & React.RefAttributes<Validatable>
        >
        | ComponentType<ComparatorConfigProps>;
    };
}

export interface DataSourceConfigProps extends BaseProps {
    action: DataSource;
    parameters: any;
    onChange(parameters: any): void;
}

export interface DataSource {
    name: string;
    description?: string;
    icon: string;
    operator: string;
    outputs?: Outputs;
    validate?(parameters: any): boolean;
    components?: {
        Config?:
        | React.ForwardRefExoticComponent<
            DataSourceConfigProps & React.RefAttributes<Validatable>
        >
        | ComponentType<DataSourceConfigProps>;
    };
}

export interface Translations {
    zhCN: Record<string, string>;
    zhTW: Record<string, string>;
    enUS: Record<string, string>;
    viVN: Record<string, string>;
}

export interface ValueInputProps<T = any> {
    t: TranslateFn;
    value?: T;
    placeholder?: string;
    onChange?(value: T): void;
    [key: string]: any;
}

export interface ValueType<T = any> {
    type: string;
    name: string;
    components?: {
        Input?: ComponentType<ValueInputProps<T>>;
    };
}

export interface Extension {
    name: string;
    types?: ValueType[];
    triggers?: Trigger[];
    executors?: Executor[];
    comparators?: Comparator[];
    dataSources?: DataSource[];
    translations?: Translations;
}

export interface TypeComparators {
    type: string;
    name: string;
    comparators: Comparator[];
}
