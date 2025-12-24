import { PlusCircleOutlined } from "@ant-design/icons";
import { FlowActionOutlined, FlowBranchOutlined } from "@applet/icons";
import { FC, useContext, useState } from "react";
import { Popover, Space } from "antd";
import styles from "./editor.module.less";
import { useTranslate } from "@applet/common";

import { PasteOutlined } from "@applet/icons";
import { EditorContext } from "./editor-context";
import { LoopContext } from "./loop-step";

export const AddButton: FC<{
    onAddBranch(): void;
    onAddStep(): void;
    onAddLoop(): void;
    onPasteStep?(): void
}> = ({ onAddBranch, onAddStep, onPasteStep, onAddLoop }) => {
    const { stepToCopy } = useContext(EditorContext);
    const [visible, setVisible] = useState(false);
    const t = useTranslate();
    const loopContext = useContext(LoopContext);

    return (
        <Popover
            content={
                <Space
                    className={styles.addButtonGroup}
                    onClick={() => setVisible(false)}
                >
                    {
                        stepToCopy
                            ? (
                                <div
                                    className={styles.addButtonGroupItem}
                                    onClick={onPasteStep}
                                >
                                    <PasteOutlined
                                        className={styles.addButtonGroupItemIcon}
                                    />
                                    <div className={styles.addButtonGroupItemLabel}>
                                        {t('action.paste', '粘贴到此处')}
                                    </div>
                                </div>
                            )
                            : null
                    }
                    <div
                        className={styles.addButtonGroupItem}
                        onClick={onAddStep}
                    >
                        <FlowActionOutlined
                            className={styles.addButtonGroupItemIcon}
                        />
                        <div className={styles.addButtonGroupItemLabel}>
                            {t("editor.addButton.action", "操作")}
                        </div>
                    </div>
                    <div
                        className={styles.addButtonGroupItem}
                        onClick={onAddBranch}
                    >
                        <FlowBranchOutlined
                            className={styles.addButtonGroupItemIcon}
                        />
                        <div className={styles.addButtonGroupItemLabel}>
                            {t("editor.addButton.branches", "分支")}
                        </div>
                    </div>
                    {loopContext.nest > 0 ? null : (
                        <div
                            className={styles.addButtonGroupItem}
                            onClick={onAddLoop}
                    >
                        <FlowBranchOutlined
                            className={styles.addButtonGroupItemIcon}
                        />
                        <div className={styles.addButtonGroupItemLabel}>
                            {t("editor.addButton.loop", "循环")}
                            </div>
                        </div>
                    )}
                </Space>
            }
            showArrow={false}
            placement="right"
            open={visible}
            onOpenChange={setVisible}
            transitionName=""
        >
            <PlusCircleOutlined data-testid="editor-add-button" className={styles.addButton} />
        </Popover>
    );
};
