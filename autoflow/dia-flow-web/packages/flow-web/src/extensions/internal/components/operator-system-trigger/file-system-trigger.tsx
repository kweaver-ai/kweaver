import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Form, Input, InputNumber, Select, Switch, Typography } from "antd";
import { Draggable } from "react-beautiful-dnd";
import { TranslateFn } from "@applet/common";
import { HolderOutlined } from "@ant-design/icons";
import { CloseOutlined } from "@applet/icons";
import { Validatable } from "../../../../components/extension";
import styles from "./file-system-trigger.module.less";
import { FormItem } from "../../../../components/editor/form-item";
import clsx from "clsx";

interface RelatedRatioItem {
  value: string;
  related: string[];
}

interface FileTriggerParameterField {
  key: string;
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
  allowOverride?: boolean;
  data?: (RelatedRatioItem | string)[];
  description?: any;
}

interface FieldInputProps {
  t: TranslateFn;
  value?: FileTriggerParameterField;
  index: number;
  fieldTypes: any;
  fields: FileTriggerParameterField[];
  onClose(): void;
  onChange?(value: FileTriggerParameterField): void;
}

export const FieldInput = forwardRef<Validatable, FieldInputProps>(
  ({ t, value, index, onChange, onClose, fieldTypes }, ref) => {
    const [form] = Form.useForm<FileTriggerParameterField>();
    const [isFocus, setIsFocus] = useState(false);
    const initialValues = {
      description: { type: "text" },
      ...value,
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          validate() {
            return form.validateFields().then(
              () => true,
              () => false
            );
          },
        };
      },
      [form]
    );

    useEffect(() => {
      setIsFocus(false);
    }, [index]);

    const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
      if (isDragging && draggableStyle?.transform) {
        const translateY = parseFloat(
          draggableStyle.transform.split("(")[1].split(",")[1]
        );
        const width = parseFloat(draggableStyle.width);
        return {
          userSelect: "none",
          cursor: "move",
          background: "#fff",
          borderBottom: "none",
          boxShadow: "0 2px 9px 1px rgba(0, 0, 0, 0.1)",
          margin: "0 -32px",
          padding: "48px 32px 16px",

          ...draggableStyle,
          transform: `translate(${0}px,${translateY}px)`,
          width: `${width + 64}px`,
        };
      }
      return {
        userSelect: "none",
        cursor: isDragging ? "move" : "default",
        background: "#fff",

        // styles need to apply on draggables
        ...draggableStyle,
      };
    };

    const defaultComponent = () => {
      if (value?.type === "number") {
        return <InputNumber style={{ width: "100%" }} placeholder="请输入参数的默认值，用于用户未填写时使用的预设值" />;
      } else if (value?.type === "string") {
        return <Input placeholder="请输入参数的默认值，用于用户未填写时使用的预设值" />;
      }
    };

    return (
      <Draggable key={index} draggableId={String(index)} index={index}>
        {(provided, snapshot) => (
          <div
            className={clsx(styles["fieldInput"], {
              [styles["isDragging"]]: snapshot.isDragging,
            })}
            key={index}
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={getItemStyle(
              snapshot.isDragging,
              provided.draggableProps.style
            )}
          >
            <span
              {...provided.dragHandleProps}
              className={clsx(styles["draggle-icon"], {
                [styles["visible"]]: isFocus === true,
              })}
            >
              <HolderOutlined style={{ fontSize: "13px" }} />
            </span>
            <span className={styles["fieldIndex"]}>
              {t("fileTrigger.item", "输入参数")}
              {index + 1}
            </span>
            <CloseOutlined className={styles.removeButton} onClick={onClose} />
            <Form
              form={form}
              initialValues={initialValues}
              autoComplete="off"
              layout="inline"
              onFieldsChange={async () => {
                await onChange?.({ ...form.getFieldsValue() });
              }}
            >
              <FormItem name="type" label="参数类型" required>
                <Select virtual={false} className={styles["select"]}>
                  {fieldTypes.map((field: any) => (
                    <Select.Option key={field.type}>
                      <div className={styles["select-item"]}>
                        <Typography.Text ellipsis title={t(field.label)}>
                          {t(field.label)}
                        </Typography.Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                name="key"
                label="参数名称"
                rules={[
                  {
                    required: true,
                    message: "请输入参数名称!",
                  },
                  {
                    type: "string",
                    pattern: /^[a-zA-Z]+(_?[a-zA-Z]+)*$/,
                    message: "参数名称只能包含字母和下划线，且必须以字母开头!",
                  },
                  // {
                  //     min: 2,
                  //     max: 10,
                  //     message: '参数名称长度必须在 2 到 10 个字符之间!',
                  // },
                ]}
              >
                <Input placeholder={t("input.placeholder", "请输入参数标识，只支持字母、数字或下划线（如：username）")} />
              </FormItem>
              <FormItem name="name" label="显示名称">
                <Input placeholder={t("input.placeholder", "请输入界面显示的名称（如：用户名）")} />
              </FormItem>
              <FormItem name={["description", "text"]} label="参数描述">
                <Input placeholder={t("input.placeholder", "请输入界面显示的描述，用于补充用途、示例或注意事项")} />
              </FormItem>
              <FormItem name={["description", "type"]} hidden>
                <Input value="text" defaultValue="text" />
              </FormItem>
              {(value?.type === "string" || value?.type === "number") && (
                <FormItem name="default" label="默认值">
                  {defaultComponent()}
                </FormItem>
              )}
              <FormItem name="required" valuePropName="checked" label={t("fileTrigger.required", "必填")}>
                <Switch />
              </FormItem>
            </Form>
          </div>
        )}
      </Draggable>
    );
  }
);
