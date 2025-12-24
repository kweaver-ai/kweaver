import {
  Input,
  Modal,
  Form,
  Button,
  FormItemProps,
} from "antd";
import { useTranslate } from "@applet/common";
import { useState } from "react";
import { trim } from "lodash";
import clsx from "clsx";
import styles from "./create-modal.module.less";

const RenameModal = ({
  onClose,
  onSave,
  rollbackInfo,
}: {
  onSave: (val?: any) => void;
  onClose: () => void;
  rollbackInfo: any
}) => {
  const [form] = Form.useForm();
  const [hasValidateError, setHasValidateError] = useState(false);
  const t = useTranslate();

  const [nameValidateResult, setNameValidateResult] = useState<
    Pick<FormItemProps, "help" | "validateStatus">
  >({});

  const handleModalOk = async (data?: any) => {
    const values = await form.validateFields();
    onSave?.({...rollbackInfo,...values})
  };

  const handleModalCancel = () => {
    form.resetFields();
    onClose();
  };

  const footer = (
    <div className={styles["modal-footer"]}>
      <Button
        className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")}
        onClick={handleModalOk}
        type="primary"
        disabled={hasValidateError}
      >
        {t("ok", "确定")}
      </Button>
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
      >
        <Form.Item
          label={t("column.taskName", "流程名称")}
          name="title"
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

export default RenameModal;
