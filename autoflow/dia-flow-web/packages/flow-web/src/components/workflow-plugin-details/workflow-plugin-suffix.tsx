import { FC, useState } from "react";
import styles from "./styles/workflow-plugin-metadata.module.less";
import { Button, Modal } from "antd";
import { useTranslate } from "@applet/common";
import { CloseOutlined } from "@applet/icons";
import { FormatSuffixType, SuffixType } from "../file-suffixType";

interface WorkflowPluginSuffixProps {
    types: SuffixType[];
}

export const WorkflowPluginSuffix: FC<WorkflowPluginSuffixProps> = ({
    types,
}) => {
    const [isShowModal, setShowModal] = useState(false);
    const t = useTranslate();

    return (
        <>
            <Button type="link" onClick={() => setShowModal(true)}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={420}
                title={t("viewDetails", "查看详情")}
                open={isShowModal}
                className={styles["modal"]}
                mask
                centered
                transitionName=""
                onCancel={() => {
                    setShowModal(false);
                }}
                destroyOnClose
                footer={null}
                closeIcon={<CloseOutlined style={{ fontSize: "13px" }} />}
            >
                <div className={styles["content"]}>
                    <div className={styles["suffix-description"]}>
                        {t("suffix.allowType", "允许以下文件类型上传：")}
                    </div>
                    <FormatSuffixType types={types} />
                </div>
            </Modal>
        </>
    );
};
