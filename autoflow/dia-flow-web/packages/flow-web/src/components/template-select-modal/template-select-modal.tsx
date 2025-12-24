import { useContext, useMemo } from "react";
import { Modal } from "antd";
import { useTranslate } from "@applet/common";
import { Empty, getLoadStatus } from "../table-empty";
import { TemplateCard } from "../template-card";
import { taskTemplates } from "../../extensions/templates";
import styles from "./template-select-modal.module.less";
import { ExtensionContext, getOperatorEnable } from "../extension-provider";

interface TemplateSelectModalProps {
    onClose: () => void;
}

export const TemplateSelectModal = ({ onClose }: TemplateSelectModalProps) => {
    const t = useTranslate();
    const { globalConfig } = useContext(ExtensionContext);

    const templates = useMemo(() => {
        return taskTemplates
            .filter((item) => {
                if (item?.dependency) {
                    let enable = true;
                    for (const dependency of item?.dependency) {
                        if (!globalConfig?.[dependency]) {
                            enable = false;
                            break;
                        }
                    }
                    if (!enable) {
                        return false;
                    }
                }
                return true;
            })
            .filter(Boolean)
            .map((item) => item.template);
    }, [globalConfig]);

    return (
        <Modal
            open
            title={
                <div className={"modal-title"}>
                    {t("template.select", "选择模板")}
                </div>
            }
            className={styles["modal"]}
            width={960}
            onCancel={onClose}
            centered
            closable
            maskClosable={false}
            footer={null}
            transitionName=""
        >
            <div className={styles["template-container"]}>
                {templates.length ? (
                    templates.map((item: any, index: number) => (
                        <TemplateCard
                            template={item}
                            key={item?.templateId || index}
                        />
                    ))
                ) : (
                    <div className={styles["empty-container"]}>
                        <Empty
                            loadStatus={getLoadStatus({
                                data: templates,
                            })}
                            height={0}
                            emptyText={t("template.empty", "模板为空")}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};
