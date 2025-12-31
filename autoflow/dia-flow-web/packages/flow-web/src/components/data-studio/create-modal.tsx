import {
  Input,
  Modal,
  Form,
  message,
  Button,
  FormItemProps,
  Popconfirm,
} from "antd";
import { FlowDetail } from "./types";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useContext, useState } from "react";
import { trim } from "lodash";
import clsx from "clsx";
import styles from "./create-modal.module.less";
import ChangeVersionModal from "./change-version-modal";
import { hasOperatorMessage, hasTargetOperator } from "./utils";

const CreateModal = ({
  value,
  isTemplateCreate,
  onClose,
  onSave,
}: {
  value: FlowDetail;
  isTemplateCreate?: boolean;
  onSave: (val?: string) => void;
  onClose: () => void;
}) => {
  const [form] = Form.useForm();
  const { prefixUrl } = useContext(MicroAppContext);
  const [hasValidateError, setHasValidateError] = useState(false);
  const t = useTranslate();
  const { microWidgetProps } = useContext(MicroAppContext);

  const [nameValidateResult, setNameValidateResult] = useState<
    Pick<FormItemProps, "help" | "validateStatus">
  >({});

  const handleCreateFlowError = (error: any, onRefresh: () => void) => {
    if (error?.response?.data?.code === "ContentAutomation.DuplicatedName") {
      setHasValidateError(true);
      setNameValidateResult({
        help: t("taskForm.validate.nameDuplicated", "您输入的名称已存在"),
        validateStatus: "error",
      });
      return;
    }
    if (error?.response?.data?.code === "ContentAutomation.InvalidParameter") {
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

    if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
      message.error(t("err.task.notFound", "任务已不存在"));
      onRefresh();
    }
    message.error(error?.response?.data?.description);
  };

  const handleModalOk = async (data?: any) => {
    const values = await form.validateFields();
    // if (!hasTargetOperator(value?.steps)) {
    //   const confirm = await hasOperatorMessage(microWidgetProps?.container);
    //   if (!confirm) {
    //     return;
    //   }
    // }

    if (isTemplateCreate) {
      onSave(values.flowName);
      return;
    }

    // 创建流程，若名称已存在，则提示，若成功则关闭弹窗
    const { id, ...flow } = value;

    if (!id) {
      try {
        // 新建
        await API.axios.post(`${prefixUrl}/api/automation/v1/data-flow/flow`, {
          ...flow,
          title: values.flowName,
          ...data,
        });

        message.success(t("assistant.success", "新建成功"));
        onSave();
      } catch (error) {
        handleCreateFlowError(error, onSave);
      }
    } else {
      // 编辑
      try {
        await API.axios.put(
          `${prefixUrl}/api/automation/v1/data-flow/flow/${id}`,
          { ...flow, title: values.flowName, ...data }
        );
        message.success(t("edit.success", "编辑成功"));
        onSave();
      } catch (error) {
        handleCreateFlowError(error, onSave);
      }
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    onClose();
  };

  const footer = (
    <div className={styles["modal-footer"]}>
      <ChangeVersionModal
        dagId={value?.id}
        onSaveVersion={(data) => handleModalOk(data)}
      >
        <Button
          className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")}
          // onClick={handleModalOk}
          type="primary"
          disabled={hasValidateError}
        >
          {t("ok", "确定")}
        </Button>
      </ChangeVersionModal>
      <Button
        className={styles["footer-btn-cancel"]}
        onClick={handleModalCancel}
        type="default"
      >
        {t("cancel", "取消")}
      </Button>
    </div>
  );

  return (
    <Modal
      title={t("column.taskName", "流程名称")}
      open={true}
      onCancel={onClose}
      footer={footer}
      centered
      closable
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ flowName: value?.title }}
      >
        <Form.Item
          label={t("column.taskName", "流程名称")}
          name="flowName"
          rules={[
            {
              validator: (_, value: string) => {
                if (trim(value).length === 0) {
                  setHasValidateError(true);
                  return Promise.reject(
                    new Error(t("taskForm.validate.required", "此项不允许为空"))
                  );
                }
                if (!/^[^\\/:*?"<>|]{1,128}$/.test(value)) {
                  setHasValidateError(true);
                  return Promise.reject(
                    new Error(
                      t(
                        "taskForm.validate.taskName",
                        '名称不能包含\\ / : * ? " < > | 特殊字符，长度不能超过128个字符'
                      )
                    )
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          {...nameValidateResult}
        >
          <Input
            placeholder={t("create.modal.placeholder", "请输入流程名称")}
            onChange={() => {
              setNameValidateResult({});
              setHasValidateError(false);
            }}
            onPressEnter={(e) => e.preventDefault()}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateModal;
