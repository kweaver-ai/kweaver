import clsx from "clsx";
import { useTranslate } from "@applet/common";
import { IStep } from "./expr";
import { useComparator, useExtensionTranslateFn } from "../extension-provider";
import { ItemView } from "../metadata-template/render-item";
import styles from "./editor.module.less";

interface ConditionSummaryProps {
    conditions: IStep[][];
}

export const ConditionSummary = ({ conditions }: ConditionSummaryProps) => {
    const t = useTranslate();
    return (
        <div className={styles["conditionSummary-wrapper"]}>
            {conditions.map((andCondition: IStep[], index: number) => (
                <>
                    {index > 0 && (
                        <div className={styles["conditionSummary-or"]}>
                            {t("editor.conditionsOr", "或")}
                        </div>
                    )}
                    <div
                        className={clsx(styles["conditionSummary-and"], {
                            [styles["conditionSummary-onlyOne"]]:
                                andCondition.length === 1 &&
                                conditions.length === 1,
                        })}
                    >
                        {andCondition.map((item) => (
                            <ConditionItem step={item} />
                        ))}
                    </div>
                </>
            ))}
        </div>
    );
};

const getType = (type?: string) => {
    return type === "datetime" ? "date" : "string";
};

const ConditionItem = ({ step }: { step: IStep }) => {
    const [comparator, extension] = useComparator(step.operator);
    const et = useExtensionTranslateFn();
    const extensionName = extension?.name;

    const getValue = (value?: any, type?: string) => {
        if (
            type === "approval-result" &&
            (value === "pass" || value === "reject" || value === "undone")
        ) {
            return et(extensionName, value);
        }
        return value || "";
    };

    return (
        <div className={styles["conditionSummary-item"]}>
            <div className={styles["conditionSummary-line"]}>
                <ItemView
                    type={getType(comparator?.type)}
                    value={getValue(step.parameters?.a, comparator?.type)}
                />
                <span className={styles["conditionSummary-comparator"]}>
                    {comparator?.name ? et(extensionName, comparator.name) : ""}
                </span>
            </div>
            <div className={styles["conditionSummary-line"]}>
                {step.parameters?.b && <ItemView
                    type={getType(comparator?.type)}
                    value={getValue(step.parameters.b, comparator?.type)}
                />}
            </div>
        </div>
    );
};
