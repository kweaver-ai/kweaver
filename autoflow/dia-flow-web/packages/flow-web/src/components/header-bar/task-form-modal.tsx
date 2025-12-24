import React, { useContext, useLayoutEffect, useRef, useState } from "react";
import { Button, Modal } from "antd";
import { useNavigate, useParams } from "react-router";
import { trim } from "lodash";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { FormValue, RefProps, TaskInfoModal } from "./task-form";
import { TaskInfoContext, TaskStatus } from "../../pages/editor-panel";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./styles/task-form-modal.module.less";
import { getBackUrl } from "./header-bar";
interface TaskFormModalModalProps {
    visible: boolean;
    onClose: () => void;
}

export const TaskFormModal = ({
    visible,
    onClose,
}: TaskFormModalModalProps) => {
    const t = useTranslate();
    const formRef = useRef<RefProps>(null);
    const [hasValidateError, setHasValidateError] = useState(false);
    const { microWidgetProps } = useContext(MicroAppContext);
    const navigate = useNavigate();
    const handleErr = useHandleErrReq();
    const enable = useRef(true);
    const [params] = useSearchParams();
    const templateId = params.get("template") || undefined;
    const model = params.get("model");
    const back = params.get("back") || "";
    const local = params.get("local");
    const { id: taskId = "" } = useParams<{ id: string }>();
    const {
        title,
        description = "",
        status = TaskStatus.Normal,
        accessors = [],
        steps,
        handleDisable,
        handleChanges,
        onUpdate,
    } = useContext(TaskInfoContext);

    const handleFinish = async ({
        taskName,
        description,
        isNormal,
        accessors,
    }: FormValue) => {
        if (!enable.current) {
            return;
        }
        enable.current = false;
        const newStatus =
            isNormal === true ? TaskStatus.Normal : TaskStatus.Stopped;
        const title = trim(taskName);
        const desc = trim(description);
        let create_by = "direct"
        if (templateId) {
            create_by = "template";
        } else if (model && local) {
            create_by = "local";
        }
        try {
            // 首次保存时,判断每个操作块是否输入为空 请求新建任务
            const {
                data: { id },
            } = await API.automation.dagPost({
                title,
                description: desc,
                status: newStatus,
                accessors,
                steps,
                template: templateId,
                create_by
            });
            // 更新数据
            if (onUpdate) {
                onUpdate({ type: "title", title });
                onUpdate({
                    type: "status",
                    status: newStatus,
                });
                onUpdate({ type: "description", description: desc });
                onUpdate({ type: "accessors", accessors });
            }

            handleChanges && handleChanges(false);
            microWidgetProps?.components?.toast.success(
                t("save.success", "保存成功")
            );
            onClose();
            // navigate(`/edit/${id}?back=${back}`);
            // 保存成功直接关闭编辑器页面
            navigate(getBackUrl(taskId, back, true));
            if (model) {
                localStorage.removeItem(`automateTemplate-${model}`);
            }
        } catch (error: any) {
            if (
                error?.response?.data?.code ===
                "ContentAutomation.DuplicatedName"
            ) {
                setHasValidateError(true);
                formRef.current?.handleValidateResult({
                    validateStatus: "error",
                    help: t(
                        "taskForm.validate.nameDuplicated",
                        "您输入的名称已存在"
                    ),
                });
                return;
            }
            if (
                error?.response?.data?.code ===
                "ContentAutomation.InvalidParameter"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title.save", "无法保存自动任务"),
                    message: t("err.invalidParameter", "请检查参数。"),
                    okText: t("ok", "确定"),
                });
                return;
            }
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.NumberOfTasksLimited"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title.save", "无法保存自动任务"),
                    message: t(
                        "err.tasksExceeds",
                        "您新建的自动任务数已达上限。（最多允许新建50个）"
                    ),
                    okText: t("ok", "确定"),
                });
                return;
            }
            // 自动化未启用
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                handleDisable && handleDisable();
                return;
            }
            handleErr({ error: error?.response });
        } finally {
            enable.current = true;
        }
    };

    const handleValidateError = (hasError: boolean) => {
        setHasValidateError(hasError);
    };

    useLayoutEffect(() => {
        formRef.current?.form.setFieldsValue({
            taskName: title,
            description: description,
            isNormal: status === TaskStatus.Normal ? true : false,
            accessors,
        });
    }, []);

    const footer = (
        <div className={styles["modal-footer"]}>
            <Button
                className={clsx(
                    styles["footer-btn-ok"],
                    "automate-oem-primary-btn"
                )}
                onClick={() => {
                    formRef.current && formRef.current.form.submit();
                }}
                type="primary"
                disabled={hasValidateError}
            >
                {t("ok", "确定")}
            </Button>
            <Button
                className={styles["footer-btn-cancel"]}
                onClick={onClose}
                type="default"
            >
                {t("cancel", "取消")}
            </Button>
        </div>
    );

    return (
        <Modal
            visible={visible}
            title={
                <div className={styles["modal-title"]}>
                    {t("saveTask.title", "保存任务设置")}
                </div>
            }
            className={styles["modal"]}
            width={520}
            onCancel={onClose}
            centered
            closable
            maskClosable={false}
            footer={footer}
            transitionName=""
        >
            <TaskInfoModal
                ref={formRef}
                steps={steps}
                onSubmit={handleFinish}
                handleValidateError={handleValidateError}
            />
        </Modal>
    );
};
