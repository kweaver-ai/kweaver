import React, { useContext, useLayoutEffect, useRef, useState } from "react";
import { Button, Drawer } from "antd";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useParams } from "react-router";
import clsx from "clsx";
import { trim } from "lodash";
import { FormValue, RefProps, TaskInfoModal } from "./task-form";
import { useHandleErrReq } from "../../utils/hooks";
import { TaskInfoContext, TaskStatus } from "../../pages/editor-panel";
import styles from "./styles/task-form-drawer.module.less";
import { Step } from "@applet/api/lib/content-automation";

interface TaskFormDrawerModalProps {
    steps: Step[];
    visible: boolean;
    onClose: () => void;
}

export const TaskFormDrawer = ({
    steps,
    visible,
    onClose,
}: TaskFormDrawerModalProps) => {
    const t = useTranslate();
    const formRef = useRef<RefProps>(null);
    const [hasValidateError, setHasValidateError] = useState(false);
    const { id: taskId = "" } = useParams<{ id: string }>();
    const { microWidgetProps } = useContext(MicroAppContext);
    const handleErr = useHandleErrReq();
    const enable = useRef(true);
    const {
        title,
        description = "",
        status = TaskStatus.Normal,
        accessors = [],
        onUpdate,
        handleDisable,
        handleChanges,
    } = useContext(TaskInfoContext);

    const handleFinish = async ({
        taskName,
        description,
        isNormal,
        accessors = [],
    }: FormValue) => {
        if (!enable.current) {
            return;
        }
        enable.current = false;
        const newStatus =
            isNormal === true ? TaskStatus.Normal : TaskStatus.Stopped;
        const title = trim(taskName);
        const desc = trim(description);
        try {
            await API.automation.dagDagIdPut(taskId, {
                title,
                description: desc,
                status: newStatus,
                accessors,
                steps,
            });
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
                t("setting.success", "任务设置成功")
            );
            onClose();
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
            accessors: accessors,
        });
    }, []);

    const footer = (
        <div className={styles["drawer-footer"]}>
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
        <Drawer
            visible={visible}
            title={
                <div className={styles["drawer-title"]}>
                    {t("saveTask.title", "保存任务设置")}
                </div>
            }
            className={styles["drawer"]}
            width={560}
            placement="right"
            maskClosable={false}
            footer={footer}
            onClose={onClose}
        >
            <TaskInfoModal
                ref={formRef}
                steps={steps}
                onSubmit={handleFinish}
                handleValidateError={handleValidateError}
            />
        </Drawer>
    );
};
