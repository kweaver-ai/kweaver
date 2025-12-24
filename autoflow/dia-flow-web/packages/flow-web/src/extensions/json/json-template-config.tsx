import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import { ExecutorActionConfigProps, Validatable } from "../../components/extension";
import { Form, Input } from "antd";
import { FormItem } from "../../components/editor/form-item";
import EditorWithMentions from "../ai/editor-with-mentions";

export interface JSONTemplateParameters {
  json: string;
  template: string;
}

export const JSONTemplateConfig = forwardRef<Validatable, ExecutorActionConfigProps<JSONTemplateParameters>>(
  (
    {
      t,
      parameters = {
        json: "",
        template: "",
      },
      onChange,
    },
    ref
  ) => {
    const [form] = Form.useForm<JSONTemplateParameters>();

    useImperativeHandle(ref, () => {
      return {
        validate() {
          return form.validateFields().then(
            () => true,
            () => false
          );
        },
      };
    });

    useLayoutEffect(() => {
      form.setFieldsValue(parameters);
    }, [form, parameters]);

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
        <FormItem
          required
          label={t("JSON", "JSON")}
          name="json"
          rules={[
            {
              transform(value) {
                return value?.trim();
              },
              required: true,
              message: t("emptyMessage"),
            },
          ]}
        >
           <EditorWithMentions onChange={textAreaContent} parameters={parameters?.json} itemName="json"/>
        </FormItem>
        <FormItem
          label={t("template", "模板")}
          name="template"
          rules={[
            {
              transform(value) {
                return value?.trim();
              },
              required: true,
              message: t("emptyMessage"),
            },
          ]}
        >
          <Input.TextArea rows={5} placeholder={t("inputPlaceholder", "请输入")} />
        </FormItem>
      </Form>
    );
  }
);
