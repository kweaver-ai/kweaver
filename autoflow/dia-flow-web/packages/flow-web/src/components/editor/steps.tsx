import { FC, Fragment, ReactElement, useContext } from "react";
import { IStep, LoopOperator, BranchesOperator } from "./expr";
import { Step } from "./step";
import { StepsContext } from "./steps-context";
import { AddButton } from "./add-button";
import styles from "./editor.module.less";
import clsx from "clsx";
import { EditorContext } from "./editor-context";

export const Steps: FC<{
    steps: IStep[];
    head?: ReactElement;
    tail?: ReactElement;
    onChange(steps: IStep[]): void;
    type?: string;
}> = ({ steps, head, tail, onChange, type }) => {
    const { depth } = useContext(StepsContext);
    const { getId, onConfigStep, stepToCopy, onConfigStepToCopy } = useContext(EditorContext);

    return (
        <StepsContext.Provider value={{ steps, depth: depth + 1 }}>
            <div
                className={clsx(styles.steps, {
                    [styles["readonly"]]: type === "preview",
                })}
            >
                {head && (
                    <>
                        {depth > 0 && <div className={styles.stepDivider} />}
                        {head}
                        <div className={styles.stepDivider} />
                    </>
                )}
                <AddButton
                    onAddStep={onAddStep.bind(null, 0)}
                    onAddBranch={onAddBranch.bind(null, 0)}
                    onAddLoop={onAddLoop.bind(null, 0)}
                    onPasteStep={onPasteStep.bind(null, 0)}
                />
                <div className={styles.stepDivider} />
                {steps.map((step, index) => (
                    <Fragment key={step.id}>
                        <Step
                            step={step}
                            onChange={(step) =>
                                onChange([
                                    ...steps.slice(0, index),
                                    step,
                                    ...steps.slice(index + 1),
                                ])
                            }
                            onRemove={() =>
                                onChange([
                                    ...steps.slice(0, index),
                                    ...steps.slice(index + 1),
                                ])
                            }
                        />
                        {index !== steps.length - 1 && (
                            <>
                                <div className={styles.stepDivider} />
                                <AddButton
                                    onAddStep={onAddStep.bind(null, index + 1)}
                                    onAddBranch={onAddBranch.bind(
                                        null,
                                        index + 1
                                    )}
                                    onAddLoop={onAddLoop.bind(null, index + 1)}
                                    onPasteStep={onPasteStep.bind(null, index + 1)}
                                />
                                <div className={styles.stepDivider} />
                            </>
                        )}
                    </Fragment>
                ))}
                {steps.length > 0 ? (
                    <>
                        <div className={styles.stepDivider} />
                        <AddButton
                            onAddStep={onAddStep.bind(null, steps.length + 1)}
                            onAddBranch={onAddBranch.bind(
                                null,
                                steps.length + 1
                            )}
                            onAddLoop={onAddLoop.bind(null, steps.length + 1)}
                            onPasteStep={onPasteStep.bind(null, steps.length + 1)}
                        />
                    </>
                ) : null}
                {tail && (
                    <>
                        <div
                            className={clsx(styles.stepDivider, styles.grow)}
                        />
                        {tail}
                    </>
                )}
                {depth > 0 && (
                    <div className={clsx(styles.stepDivider, styles.grow)} />
                )}
            </div>
        </StepsContext.Provider>
    );
    function getStepTitle(step: IStep, steps: readonly IStep[]): string {
        const { title = '' } = step

        let num = 0

        const getExistTitle = (steps: readonly IStep[]) => {
            steps.forEach((item) => {
                const { operator, title: itemTitle = '', branches } = item

                if (operator !== '@control/flow/branches') {

                    if (itemTitle.startsWith(title)) {
                        const tail = itemTitle.slice(title.length, itemTitle.length)

                        const match = /\((\d+)\)/.exec(String(tail))

                        if (match) {
                            num = Math.max(num, Number(match[1]))
                        }
                    }
                } else {
                    branches?.forEach((item) => {
                        const { steps } = item

                        getExistTitle(steps)
                    })
                }
            });
        }

        getExistTitle(steps)

        return `${title}(${num + 1})`
    }

    function onPasteStep(index: number) {
        if (stepToCopy) {
            const newTitle = getStepTitle(stepToCopy, steps)

            const addStepItem = {
                ...stepToCopy,
                id: getId(),
                title: newTitle
            }

            const newSteps = [
                ...steps.slice(0, index),
                addStepItem,
                ...steps.slice(index),
            ];

            onChange(newSteps);

            onConfigStepToCopy(null)

            // 添加操作后自动进入配置
            setTimeout(() => {
                onConfigStep(addStepItem, (step) =>
                    onChange(
                        newSteps.map((item) => {
                            if (item.id === addStepItem.id) {
                                return step;
                            }
                            return item;
                        })
                    )
                );
            }, 100);
        }
    }

    function onAddStep(index: number) {
        const addStepItem = { id: getId(), operator: "" };
        const newSteps = [
            ...steps.slice(0, index),
            addStepItem,
            ...steps.slice(index),
        ];
        onChange(newSteps);
        // 添加操作后自动进入配置
        setTimeout(() => {
            onConfigStep(addStepItem, (step) =>
                onChange(
                    newSteps.map((item) => {
                        if (item.id === addStepItem.id) {
                            return step;
                        }
                        return item;
                    })
                )
            );
        }, 100);
    }

    function onAddBranch(index: number) {
        onChange([
            ...steps.slice(0, index),
            {
                id: getId(),
                operator: BranchesOperator,
                branches: [
                    {
                        id: getId(),
                        conditions: [],
                        steps: [
                            {
                                id: getId(),
                                operator: "",
                            },
                        ],
                    },
                    {
                        id: getId(),
                        conditions: [],
                        steps: [
                            {
                                id: getId(),
                                operator: "",
                            },
                        ],
                    },
                ],
            },
            ...steps.slice(index),
        ]);
    }

    function onAddLoop(index: number) {
        onChange([
            ...steps.slice(0, index),
            {
                id: getId(),
                operator: LoopOperator,
                parameters: {
                    mode: "limit",
                    limit: 1,
                    outputs: []
                },
                steps: [
                    {
                        id: getId(),
                        operator: "",
                    },
                ],
            },
            ...steps.slice(index),
        ]);
    }
};
