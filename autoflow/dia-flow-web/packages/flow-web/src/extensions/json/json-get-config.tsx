import { createRef, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { ExecutorActionConfigProps, Validatable } from "../../components/extension";
import { Button, Form, Input, Select, Space } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { CloseOutlined, PlusOutlined } from "@applet/icons";
import { TranslateFn } from "@applet/common";
import styles from "./json-get-config.module.less";
import { DefaultOptionType } from "antd/lib/select";
import EditorWithMentions from "../ai/editor-with-mentions";

export interface JSONGetField {
  key: string;
  type: string;
  value: string;
}

export interface JSONGetParameters {
  json: string;
  fields: JSONGetField[];
}

export const JSONGetConfig = forwardRef<Validatable, ExecutorActionConfigProps<JSONGetParameters>>(({ t, parameters = { json: "", fields: [] }, onChange }, ref) => {
  const [form] = Form.useForm<JSONGetParameters>();

  const fieldRefs = useMemo(() => {
    if (Array.isArray(parameters.fields)) {
      return parameters.fields?.map(() => createRef<Validatable>());
    }
    return [];
  }, [parameters.fields]);

  useImperativeHandle(ref, () => {
    return {
      validate() {
        return Promise.all([
          ...fieldRefs.map((ref) => typeof ref.current?.validate !== "function" || ref.current?.validate()),
          form.validateFields().then(
            () => true,
            () => false
          ),
        ]).then((results) => {
          return results.every((r) => r);
        });
      },
    };
  });

  const textAreaContent = (data: any, itemName:string) => {
     form.setFieldValue(itemName, data)
  };

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      initialValues={parameters}
      onFieldsChange={() => {
        onChange(form.getFieldsValue());
      }}
    >
      <FormItem label={t("input", "输入")} name="json" type="string">
        <EditorWithMentions onChange={textAreaContent} parameters={parameters?.json} itemName="json"/>
      </FormItem>
      <FormItem label={t("fields", "字段")}>
        <Form.List name="fields">
          {(fields, { add, remove }, { errors }) => {
            return (
              <div>
                {fields.map((field, index) => {
                  return (
                    <FormItem {...field} noStyle>
                      <JSONGetFieldInput t={t} ref={fieldRefs[index]} index={index} onRemove={remove} removable={fields.length > 1} />
                    </FormItem>
                  );
                })}
                <Form.ErrorList errors={errors} />
                <div>
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        key: "",
                        type: "string",
                        value: "",
                      })
                    }
                  >
                    {t("addField", "添加")}
                  </Button>
                </div>
              </div>
            );
          }}
        </Form.List>
      </FormItem>
    </Form>
  );
});

interface JSONGetFieldInputProps {
  t: TranslateFn;
  index: number;
  value?: JSONGetField;
  removable?: boolean;
  onRemove(index: number): void;
  onChange?: (value: JSONGetField) => void;
}

const JSONGetFieldInput = forwardRef<Validatable, JSONGetFieldInputProps>(({ index, value, t, removable, onChange, onRemove }, ref) => {
  const initialValues = useRef(value);
  const [form] = Form.useForm();

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

  const options = useMemo<DefaultOptionType[]>(() => {
    return [
      {
        label: t("string", "字符串"),
        value: "string",
      },
      {
        label: t("number", "数字"),
        value: "number",
      },
      {
        label: t("boolean", "布尔值"),
        value: "boolean",
      },
      {
        label: t("array", "数组"),
        value: "array",
      },
      {
        label: t("object", "对象"),
        value: "object",
      },
    ];
  }, [t]);

  return (
    <Form
      form={form}
      initialValues={initialValues.current}
      autoComplete="off"
      onFieldsChange={() => {
        if (typeof onChange === "function") {
          onChange(form.getFieldsValue());
        }
      }}
    >
      <Form.Item label={t("field", "Key{index}", { index: index + 1 })} help={null} className={styles.JSONGetFieldItem}>
        <div className={styles.JSONGetFieldInner}>
          <FormItem
            name="key"
            rules={[
              {
                required: true,
                message: t("emptyMessage", "此项不能为空"),
              },
            ]}
            allowVariable={false}
            className={styles.JSONGetFieldKey}
          >
            <Input placeholder={t("field", "Key{index}", { index: index + 1 })} />
          </FormItem>
          <FormItem name="type" allowVariable={false} style={{ width: 80 }} className={styles.JSONGetFieldType}>
            <Select options={options} />
          </FormItem>
          <FormItem name="value" allowVariable className={styles.JSONGetFieldValue}>
            <Input placeholder={t("fieldValuePlaceholder", "请输入变量值或选择已有变量")} />
          </FormItem>
          {removable ? <Button type="text" size="small" className={styles.JSONGetFieldRemove} icon={<CloseOutlined />} onClick={() => onRemove(index)} /> : null}
        </div>
      </Form.Item>
    </Form>
  );
});
