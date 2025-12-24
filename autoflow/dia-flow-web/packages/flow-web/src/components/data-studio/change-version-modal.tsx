import { Input, Form, Button, Popover } from "antd";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useContext, useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./change-version-modal.module.less";
import { TooltipPlacement } from "antd/es/tooltip";

const ChangeVersionModal = ({
  dagId,
  onSaveVersion,
  children,
  placement = "top",
}: {
  dagId?: string;
  onSaveVersion: (val?: any) => void;
  children: React.ReactNode;
  placement?: TooltipPlacement | undefined;
}) => {
  const [form] = Form.useForm();
  const { prefixUrl } = useContext(MicroAppContext);
  const t = useTranslate();
  const [visible, setVisible] = useState(false);

  const handleModalOk = async () => {
    const values = await form.getFieldsValue();
    onSaveVersion?.(values);
  };

  const handleModalCancel = () => {
    setVisible(false);
  };

  const getVersions = async () => {
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/dags/${dagId}/versions/next`
      );
      form.setFieldValue("version", data?.version);
    } catch (error) {}
  };

  useEffect(() => {
    if (dagId) {
      getVersions();
    } else {
      form.setFieldValue("version", "v0.0.0");
    }
  }, []);

  const handleVisibleChange = (newVisible: boolean) => {
    setVisible(newVisible);
  };

  const content = (
    <Form
      form={form}
      layout="vertical"
      className={styles["change-version-form"]}
    >
      <Form.Item
        label="版本号"
        name="version"
        rules={[
          {
            pattern: /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
            message: "版本号格式不正确，示例：v0.0.1",
          },
        ]}
      >
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item label="版本描述" name="change_log">
        <Input.TextArea placeholder="请输入" rows={3} />
      </Form.Item>
      <div className={styles["modal-footer"]}>
        <Button
          className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")}
          onClick={handleModalOk}
          type="primary"
          size="small"
        >
          {t("ok", "确定")}
        </Button>
        <Button
          className={styles["footer-btn-cancel"]}
          onClick={handleModalCancel}
          type="default"
          size="small"
        >
          {t("cancel", "取消")}
        </Button>
      </div>
    </Form>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement={placement}
      overlayClassName="model-settings-popover"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      getPopupContainer={(triggerNode) =>
        triggerNode.parentElement || document.body
      }
    >
      {children}
    </Popover>
  );
};

export default ChangeVersionModal;
