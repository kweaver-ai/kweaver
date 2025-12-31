import { createContext } from "react";
import { IStep, StepErrCode, StepNodeList, StepOutputs } from "./expr";
import { VariablePickerOptions } from "./variable-picker";

export interface EditorContextType {
    stepNodes: StepNodeList;
    stepOutputs: StepOutputs;
    validateResult: WeakMap<IStep | IStep[][], StepErrCode>;
    currentTrigger?: IStep;
    currentStep?: IStep;
    currentBranch?: [branches: IStep, index: number];
    stepToCopy: IStep | null,
    onConfigStepToCopy: (step: IStep | null) => void,
    getId(): string;
    pickVariable(
        scope: number[],
        type?: string | string[],
        options?: VariablePickerOptions,
        pickVariable?: string[],
    ): Promise<string>;
    onConfigTrigger(step: IStep, onFinish: (step: IStep) => void): void;
    onConfigStep(step: IStep, onFinish: (step: IStep) => void): void;
    onConfigConditions(
        step: IStep,
        branchIndex: number,
        onFinish: (conditions: IStep[][]) => void
    ): void;
    onConfigLoop(step: IStep, onFinish: (step: IStep) => void): void;
    getPopupContainer(): HTMLElement
}

function contextIsInvalid(): any {
    throw new Error("Context is invalid");
}

export const EditorContext = createContext<EditorContextType>({
    stepNodes: [] as unknown as StepNodeList,
    stepOutputs: {},
    validateResult: new WeakMap(),
    stepToCopy: null,
    onConfigStepToCopy: contextIsInvalid,
    getId: contextIsInvalid,
    pickVariable: contextIsInvalid,
    onConfigTrigger: contextIsInvalid,
    onConfigStep: contextIsInvalid,
    onConfigConditions: contextIsInvalid,
    onConfigLoop: contextIsInvalid,
    getPopupContainer: contextIsInvalid
});
