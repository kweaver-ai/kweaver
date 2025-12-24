import { FC, useContext, useMemo, useState } from "react";
import styles from "./styles/workflow-plugin-file-tags.module.less";
import { Button, Modal, Tag } from "antd";
import { useTranslate } from "@applet/common";
import { WorkflowContext } from "../workflow-provider";
import { CloseOutlined } from "@applet/icons";

interface WorkflowPluginTagsProps {
    tags: string[];
}

export const formatTag = (tag: string) => {
    const tags = tag.split("/");
    return tags[tags.length - 1];
};

export const WorkflowPluginTags: FC<WorkflowPluginTagsProps> = ({ tags }) => {
    const { process } = useContext(WorkflowContext);
    const [isShowModal, setShowModal] = useState(false);
    const isUploadStrategy = useMemo(() => {
        return process?.audit_type === "security_policy_upload";
    }, [process?.audit_type]);
    const t = useTranslate();
    const parseData: string[] = useMemo(() => {
        if (typeof tags === "string") {
            try {
                return JSON.parse(tags);
            } catch (error) {
                return tags;
            }
        }
        return tags;
    }, [tags]);

    return (
        <>
            <Button type="link" onClick={() => setShowModal(true)}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={420}
                title={t("tag", "标签")}
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
                    {isUploadStrategy && (
                        <div className={styles["description"]}>
                            {t(
                                "upload.tags",
                                "“发起者”申请给上传的文档配置以下标签：",
                                { name: process?.user_name }
                            )}
                        </div>
                    )}
                    <div className={styles["tags-container"]}>
                        {parseData?.map((tag) => (
                            <Tag
                                className={styles["tag"]}
                                title={formatTag(tag)}
                            >
                                {formatTag(tag)}
                            </Tag>
                        ))}
                    </div>
                </div>
            </Modal>
        </>
    );
};
