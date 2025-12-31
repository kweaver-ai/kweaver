import { useTranslate } from "@applet/common";
import {
  Col,
  Form,
  FormInstance,
  InputNumber,
  Row,
  Slider,
  Tooltip,
} from "antd";
import { forwardRef, useImperativeHandle, useState, useMemo } from "react";
import styles from "./steps-settings.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";

interface CustomExecutorActionFormProps {
  onChange?: (value: any) => void;
  step?: any;
}

export const StepsSettings = forwardRef<
  FormInstance<any>,
  CustomExecutorActionFormProps
>(({ onChange, step }, ref) => {
  const { settings, operator } = step
  const [form] = Form.useForm<any>();
  const t = useTranslate();
  const [retryMax, setRetryMax] = useState(settings?.retry?.max || 3);
  const [retryDelay, setRetryDelay] = useState(settings?.retry?.delay || 3);

  const initialValues = useMemo(
    () => ({
      timeout: { delay: operator === '@anydata/call-agent' ? 7200 : 1800 },
      retry: {
        max: 3,
        delay: 3,
      },
      ...settings,
    }),
    [settings]
  );

  // 处理输入框变化，确保值以number类型传递给表单
  const handleInputChange = (name?: string) => (value: number | null) => {
    // 将null转换为undefined，确保与组件状态兼容
    const numValue = value ?? undefined;
    if (name === "retryMax") {
      form.setFieldsValue({
        retry: { ...form.getFieldValue("retry"), max: numValue },
      });
      setRetryMax(numValue);
    } else if (name === "retryDelay") {
      form.setFieldsValue({
        retry: { ...form.getFieldValue("retry"), delay: numValue },
      });
      setRetryDelay(numValue);
    }
    setTimeout(() => {
      const currentRetry = form.getFieldValue("retry") || {};
      onChange?.({
        ...form.getFieldsValue(),
        retry: {
          max: currentRetry.max ? Number(currentRetry.max) : undefined,
          delay: currentRetry.delay ? Number(currentRetry.delay) : undefined,
        },
      });
    }, 10);
  };

  useImperativeHandle(ref, () => form, [form]);

  return (
    <Form
      form={form}
      initialValues={initialValues}
      layout="vertical"
      className={styles.Form}
      onFieldsChange={() => {
        onChange?.(form.getFieldsValue());
      }}
    >
      <Form.Item
        name={["timeout", "delay"]}
        label={t("timeout.period", "超时时间(秒)")}
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
        ]}
      >
        <InputNumber
          min={1}
          max={86400}
          style={{ width: "100%" }}
          placeholder={t("form.placeholder", "请输入")}
        />
      </Form.Item>
      <Form.Item
        label={
          <div>
            {t("retry.on.failure", "失败时重试")}{" "}
            <Tooltip placement="bottom" title={t("form.error.tips")}>
              <QuestionCircleOutlined
                style={{
                  marginLeft: "4px",
                  color: "#909090",
                  cursor: "pointer ",
                }}
              />
            </Tooltip>
          </div>
        }
        required
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
        ]}
      >
        <div className={styles.timeoutDelay}>
          <Form.Item
            name={["retry", "max"]}
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
            className={styles.retry}
          >
            <Row>
              <Col span={5}>{t("maximum.retry.count")}</Col>
              <Col span={12}>
                <Slider
                  min={1}
                  max={10}
                  onChange={handleInputChange("retryMax")}
                  value={retryMax}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  min={1}
                  max={10}
                  style={{ margin: "0 16px" }}
                  onChange={handleInputChange("retryMax")}
                  value={retryMax}
                  prefix={t("ci")}
                  className={styles.inputNumber}
                />
              </Col>
            </Row>
          </Form.Item>
          <Form.Item
            name={["retry", "delay"]}
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
            className={styles.retry}
          >
            <Row>
              <Col span={5}>{t("retry.interval")}</Col>
              <Col span={12}>
                <Slider
                  min={1}
                  max={60}
                  onChange={handleInputChange("retryDelay")}
                  value={retryDelay}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  min={1}
                  max={60}
                  style={{ margin: "0 16px" }}
                  onChange={handleInputChange("retryDelay")}
                  value={retryDelay}
                  prefix={t("miao")}
                  className={styles.inputNumber}
                />
              </Col>
            </Row>
          </Form.Item>
        </div>
      </Form.Item>
    </Form>
  );
});
