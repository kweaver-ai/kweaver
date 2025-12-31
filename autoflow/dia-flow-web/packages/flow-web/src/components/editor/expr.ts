import {
    Comparator,
    DataSource,
    Executor,
    ExecutorAction,
    Extension,
    Output,
    Trigger,
    TriggerAction,
} from "../extension";

export interface IStep {
    id: string;
    title?: string;
    operator: string;
    parameters?: any;
    branches?: IBranch[];
    steps?: IStep[];
    dataSource?: IStep & { depth?: number };
    outputs?: Array<{ key: string; value: string; type?: string }>;
    settings?: any;
}

export interface IBranch {
    id: string;
    conditions: IStep[][];
    steps: IStep[];
}

export interface IAutomation {
    name: string;
    steps: IStep[];
}

export type StepNodeType =
    | "trigger"
    | "executor"
    | "comparator"
    | "branches"
    | "loop"
    | "branch"
    | "dataSource"
    | "globalVariable";

export type StepErrCode = "INVALID_OPERATOR" | "INVALID_PARAMETERS";

export interface BaseStepNode {
    path: number[];
    index: number;
    type: StepNodeType;
    outputs: Output[];
}

export interface BranchNode extends BaseStepNode {
    branch: IBranch;
    type: "branch";
}

export interface BranchesStepNode extends BaseStepNode {
    step: IStep;
    type: "branches";
}

export interface LoopStepNode extends BaseStepNode {
    step: IStep;
    type: "loop";
}

export interface TriggerStepNode extends BaseStepNode {
    step: IStep;
    type: "trigger";
    action?: TriggerAction;
    trigger?: Trigger;
    extension?: Extension;
}

export interface ExecutorStepNode extends BaseStepNode {
    step: IStep;
    type: "executor";
    action?: ExecutorAction;
    executor?: Executor;
    extension?: Extension;
}

export interface ComparatorStepNode extends BaseStepNode {
    step: IStep;
    type: "comparator";
    comparator?: Comparator;
    extension?: Extension;
}

export interface DataSourceStepNode extends BaseStepNode {
    step: IStep;
    type: "dataSource";
    parent: TriggerStepNode;
    action?: DataSource;
    extension?: Extension;
}

export interface GlobalVariableNode extends BaseStepNode {
    step: IStep;
    type: "globalVariable";
    action?: TriggerAction;
    trigger?: Trigger;
    extension?: Extension;
}

export type StepNode =
    | BranchNode
    | BranchesStepNode
    | LoopStepNode
    | TriggerStepNode
    | ExecutorStepNode
    | ComparatorStepNode
    | DataSourceStepNode
    | GlobalVariableNode;

export type StepNodeList = (StepNode | undefined)[] & {
    [index: string]: StepNode | undefined;
};

export type StepOutputs = Record<string, Output>;

export const LoopOperator = "@control/flow/loop";
export const BranchesOperator = "@control/flow/branches";
