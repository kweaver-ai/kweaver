import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Checkbox, Form, Input, Select, Typography } from "antd";
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
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name="name" label="显示名称">
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name={["description", "text"]} label="参数说明">
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name={["description", "type"]} hidden>
                <Input value="text" defaultValue="text" />
              </FormItem>
              <div className={styles["required-wrapper"]}>
                <FormItem name="required" valuePropName="checked" noStyle>
                  <Checkbox>{t("fileTrigger.required", "必填")}</Checkbox>
                </FormItem>
              </div>
            </Form>
          </div>
        )}
      </Draggable>
    );
  }
);
