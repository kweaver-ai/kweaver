import React, { useContext, useRef } from "react";
import { Button, Modal } from "antd";
import clsx from "clsx";
import { debounce } from "lodash";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./delete-task-modal.module.less";

interface IDeleteModalProps {
    isModalVisible: boolean;
    onDeleteSuccess: () => void;
    onCancel: () => void;
    taskId: string;
}

export const DeleteModal: React.FC<IDeleteModalProps> = ({
    isModalVisible,
    onDeleteSuccess,
    onCancel,
    taskId,
}: IDeleteModalProps) => {
    const t = useTranslate();
    const { microWidgetProps } = useContext(MicroAppContext);
    const handleErr = useHandleErrReq();
    const enable = useRef(true);

    const handleDelete = async (taskId: string) => {
        if (!enable.current) {
            return;
        }
        enable.current = false;
        try {
            await API.automation.dagDagIdDelete(taskId);
            onDeleteSuccess();
            microWidgetProps?.components?.toast?.success(
                t("task.delete.success", "删除自动任务成功")
            );
        } catch (error: any) {
            onCancel();
            // 任务不存在
            if (
                error?.response?.data?.code === "ContentAutomation.TaskNotFound"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title", "无法完成操作"),
                    message: t("err.task.notFound", "该任务已不存在。"),
                    okText: t("ok", "确定"),
                    onOk: () => onDeleteSuccess(),
                });
                return;
            }
            handleErr({ error: error?.response });
        } finally {
            enable.current = true;
        }
    };

    const footer = (
        <div>
            <Button
                type="primary"
                className={clsx(
                    styles["panel-delete-footer-btn"],
                    "automate-oem-primary-btn"
                )}
                onClick={debounce(() => handleDelete(taskId), 500)}
            >
                {t("ok", "确定")}
            </Button>
            <Button
                className={styles["panel-delete-footer-btn"]}
                onClick={onCancel}
            >
                {t("cancel", "取消")}
            </Button>
        </div>
    );

    return (
        <Modal
            title={
                <div className={styles["delete-title"]}>
                    {t("deleteTitle", "确认删除")}
                </div>
            }
            visible={isModalVisible}
            onCancel={onCancel}
            closable
            centered
            className={styles["delete-modal"]}
            maskClosable={false}
            width={420}
            transitionName=""
            footer={footer}
        >
            <div className={styles["delete-info"]}>
                {t("task.delete.info", "确定要删除该任务吗？")}
            </div>
            <div className={styles["delete-extra-tip"]}>
                {t("task.delete.extra", "删除后，任务将无法恢复。")}
            </div>
        </Modal>
    );
};
