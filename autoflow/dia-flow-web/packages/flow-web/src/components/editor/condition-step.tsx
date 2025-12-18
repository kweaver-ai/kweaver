import { FC, useContext, useMemo, useState } from "react";
import { CloseOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { IStep } from "./expr";
import { Button, Popconfirm } from "antd";
import styles from "./editor.module.less";
import { EditorContext } from "./editor-context";
import clsx from "clsx";
import { stopPropagation, useTranslate } from "@applet/common";
import { ErrorPopover } from "./error-popover";
import { ConditionSummary } from "./condition-summary";

export const ConditionStep: FC<{
    step: IStep;
    branchIndex: number;
    onChange(conditions: IStep[][]): void;
    onRemove(): void;
}> = ({ step, branchIndex, onChange, onRemove }) => {
    const { currentBranch, onConfigConditions, validateResult, stepNodes } =
        useContext(EditorContext);
    const t = useTranslate();
    const [removePopconfirmOpen, setRemovePopconfirmOpen] = useState(false);

    const [conditions, count] = useMemo(() => {
        const conditions =
            (step.branches && step.branches[branchIndex]?.conditions) || [];
        return [
            conditions,
            conditions.reduce((c, items) => c + items.length, 0),
        ];
    }, [step.branches, branchIndex]);

    const hasError = validateResult.has(conditions);

    return (
        <Popconfirm
            open={removePopconfirmOpen}
            placement="rightTop"
            title={t("editor.step.removeConfirmTitle", "确定删除此操作吗？")}
            showArrow
            transitionName=""
            okText={t("ok")}
            cancelText={t("cancel")}
            onConfirm={onRemove}
            onOpenChange={setRemovePopconfirmOpen}
            overlayClassName={clsx(
                styles["delete-popover"],
                "automate-oem-primary"
            )}
            icon={<ExclamationCircleOutlined className={styles["warn-icon"]} />}
        >
            <>
                <div
                    className={clsx(styles.step, styles.conditionStep, {
                        [styles.hasError]: hasError,
                        [styles.removePopconfirmOpen]: removePopconfirmOpen,
                        [styles.focus]:
                            currentBranch &&
                            currentBranch[0].id === step.id &&
                            currentBranch[1] === branchIndex,
                    })}
                    onClick={(e) => {
                        onConfigConditions(step, branchIndex, onChange);
                        e.stopPropagation();
                    }}
                >
                    <div className={styles.head}>
                        <div className={styles.title}>
                            {(stepNodes[step.branches![branchIndex].id]
                                ?.index || 0) + 1}
                            .&nbsp;
                            {t("editor.step.conditionTitle", "分支 {index}", {
                                index: branchIndex + 1,
                            })}
                        </div>
                        <div className={styles.priority}>
                            {t(
                                "editor.step.conditionPriority",
                                "优先级 {index}",
                                {
                                    index: branchIndex + 1,
                                }
                            )}
                        </div>
                        <div
                            onClick={stopPropagation}
                            onMouseDown={stopPropagation}
                        >
                            <Button
                                type="text"
                                className={styles.removeButton}
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setRemovePopconfirmOpen(true);
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.body}>
                        {count === 0 ? (
                            <div className={styles.conditionEmpty}>
                                <div className={styles.conditionEmptyText}>
                                    {t(
                                        "editor.step.conditionEmpty",
                                        "自动任务进入该分支，无条件限制"
                                    )}
                                </div>
                                <Button type="link">
                                    {t(
                                        "editor.step.conditionButton",
                                        "设置条件"
                                    )}
                                </Button>
                            </div>
                        ) : (
                            // <div className={styles.conditionSummary}>
                            //     {t(
                            //         "editor.step.conditionSummary",
                            //         "已设置 {count} 个分支条件",
                            //         { count }
                            //     )}
                            // </div>
                            <ConditionSummary conditions={conditions} />
                        )}
                    </div>
                    {hasError ? (
                        <ErrorPopover code={validateResult.get(conditions)!} />
                    ) : null}
                </div>
            </>
        </Popconfirm>
    );
};
