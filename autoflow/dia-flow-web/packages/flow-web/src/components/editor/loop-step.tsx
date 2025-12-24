import { CloseOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { createContext, FC, useContext, useState } from "react";
import { IStep } from "./expr";
import { Button, InputNumber, Popconfirm } from "antd";
import { Steps } from "./steps";
import styles from "./editor.module.less";
import { EditorContext } from "./editor-context";
import { stopPropagation, useTranslate } from "@applet/common";
import clsx from "clsx";

export const LoopContext = createContext<{
    nest: number;
}>({
    nest: 0,
});

export const LoopStep: FC<{
    step: IStep;
    onChange(step: IStep): void;
    onRemove(): void;
}> = ({ step, onChange, onRemove }) => {
    const { currentBranch, onConfigLoop, validateResult, stepNodes } =
        useContext(EditorContext);
    const [removePopconfirmOpen, setRemovePopconfirmOpen] = useState(false);
    const t = useTranslate();
    const loopContext = useContext(LoopContext);
    return (
        <LoopContext.Provider value={{ nest: loopContext.nest + 1 }}>
            <div className={styles.loopStep}>
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
            >
                <div className={styles.loopback} />
                <div className={styles.step} id={step.id} onClick={(e) => {
                    onConfigLoop(step, onChange);
                    e.stopPropagation();
                }}>
                    <div className={styles.head}>
                        <div className={styles.title}>{step.title || "循环"}</div>
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
                </div>
            </Popconfirm>
            <div className={styles.stepDivider} />
            <Steps
                steps={step.steps || []}
                onChange={(steps) => onChange({ ...step, steps })}
            />
            <div className={styles.stepDivider} />
            <a
                href={`#${step.id}`}
                data-yes="是"
                data-no="否"
                className={styles.loopStepEnd}
            >
                循环结束？
            </a>
            <div className={styles.stepDivider} />
            <div className={styles.stepDivider} />
        </div>
        
        </LoopContext.Provider>
    );
};
