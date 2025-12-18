import { FC, useContext } from "react";
import { IStep } from "./expr";
import { Button } from "antd";
import { Steps } from "./steps";
import styles from "./editor.module.less";
import { ConditionStep } from "./condition-step";
import { EditorContext } from "./editor-context";
import { useTranslate } from "@applet/common";

export const BranchStep: FC<{
    step: IStep;
    onChange(step: IStep): void;
    onRemove(): void;
}> = ({ step, onChange, onRemove }) => {
    const { getId } = useContext(EditorContext);
    const t = useTranslate();
    return (
        <>
            <div className={styles.stepDivider} />
            <div className={styles.branchStep}>
                <Button
                    className={styles.addBranchButton}
                    onClick={() =>
                        onChange({
                            ...step,
                            branches: [
                                ...step.branches!,
                                {
                                    conditions: [],
                                    steps: [
                                        {
                                            id: getId(),
                                            operator: "",
                                        },
                                    ],
                                    id: getId(),
                                },
                            ],
                        })
                    }
                >
                    {t("editor.step.addBranch", "添加分支")}
                </Button>
                <div className={styles.branchWrapper}>
                    {step.branches?.map((branch, index, branches) => (
                        <Steps
                            key={branch.id}
                            head={
                                <>
                                    <div className={styles.stepDivider} />
                                    <ConditionStep
                                        step={step}
                                        branchIndex={index}
                                        onChange={(conditions) =>
                                            onChange({
                                                ...step,
                                                branches: [
                                                    ...branches.slice(0, index),
                                                    { ...branch, conditions },
                                                    ...branches.slice(
                                                        index + 1
                                                    ),
                                                ],
                                            })
                                        }
                                        onRemove={() => {
                                            if (branches.length <= 2) {
                                                onRemove();
                                            } else {
                                                onChange({
                                                    ...step,
                                                    branches: [
                                                        ...branches.slice(
                                                            0,
                                                            index
                                                        ),
                                                        ...branches.slice(
                                                            index + 1
                                                        ),
                                                    ],
                                                });
                                            }
                                        }}
                                    />
                                </>
                            }
                            steps={branch.steps || []}
                            onChange={(steps) =>
                                onChange({
                                    ...step,
                                    branches: [
                                        ...branches.slice(0, index),
                                        { ...branch, steps },
                                        ...branches.slice(index + 1),
                                    ],
                                })
                            }
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
