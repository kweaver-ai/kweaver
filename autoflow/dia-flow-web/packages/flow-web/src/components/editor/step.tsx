import { FC } from "react";
import { IStep, LoopOperator, BranchesOperator } from "./expr";
import { AtomStep } from "./atom-step";
import { BranchStep } from "./branch-step";
import { LoopStep } from "./loop-step";

export const Step: FC<{
    step: IStep;
    onChange(step: IStep): void;
    onRemove(): void;
}> = ({ step, onChange, onRemove }) => {
    switch (step.operator) {
        case BranchesOperator:
            return (
                <BranchStep
                    step={step}
                    onChange={onChange}
                    onRemove={onRemove}
                />
            );
        case LoopOperator:
            return (
                <LoopStep step={step} onChange={onChange} onRemove={onRemove} />
            );
        default:
            return (
                <AtomStep step={step} onChange={onChange} onRemove={onRemove} />
            );
    }
};
