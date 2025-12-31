import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { Form, Select, InputNumber } from "antd";
import { FormItem } from "../../components/editor/form-item";
import EditorWithMentions from "../ai/editor-with-mentions";
import { DefaultOptionType } from "antd/lib/select";

export interface InternalDefineParameters {
  type: string;
  value: any;
}

export const InternalDefine = forwardRef<
  Validatable,
  ExecutorActionConfigProps<InternalDefineParameters>
>(({ t, parameters, onChange }, ref) => {
  const [form] = Form.useForm<InternalDefineParameters>();
  const [variableType, setVariableType] = useState(
    parameters?.type ?? "string"
  );
  const initialValues = {
    ...parameters,
    type: parameters?.type ?? "string",
  };

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

  const textAreaContent = (data: any, itemName: string) => {
    form.setFieldValue(itemName, data);
  };

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
      // {
      //   label: t("boolean", "布尔值"),
      //   value: "boolean",
      // },
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
      layout="vertical"
      autoComplete="off"
      initialValues={initialValues}
      onFieldsChange={() => {
        onChange(form.getFieldsValue());
      }}
    >
      <FormItem
        required
        label={t("variableType", "变量类型")}
        name="type"
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
        ]}
      >
        <Select
          options={options}
          style={{ width: "100%" }}
          onChange={(type) => {
            setVariableType(type);
          }}
        />
      </FormItem>
      <FormItem
        label={t("variableValue", "变量初始值")}
        name="value"
        allowVariable={parameters?.type === "number" ? true : false}
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
          {
            validator: (_, value) => {
              const type = form.getFieldValue("type");
              // 检查是否包含变量占位符
              const hasVariables = /\{\{[^}]+\}\}/.test(value);

              // 如果包含变量，跳过格式验证
              if (hasVariables) {
                return Promise.resolve();
              }

              if (type === "array") {
                try {
                  const trimmedValue = value.trim();
                  // 检查基本的数组结构
                  if (
                    !trimmedValue.startsWith("[") ||
                    !trimmedValue.endsWith("]")
                  ) {
                    return Promise.reject(
                      new Error(
                        t(
                          '请输入有效的数组格式，例如: [1, 2, 3] 或 [{"key": "value"}]'
                        )
                      )
                    );
                  }
                  // 对于包含函数调用或其他JavaScript表达式的数组，我们只检查基本结构
                  // 不尝试完整解析，因为这可能包含动态内容
                  return Promise.resolve();
                } catch (e) {
                  return Promise.reject(
                    new Error(
                      t(
                        '请输入有效的数组格式，例如: [1, 2, 3] 或 [{"key": "value"}]'
                      )
                    )
                  );
                }
              } else if (type === "object") {
                try {
                  const trimmedValue = value.trim();
                  // 检查基本的对象结构
                  if (
                    !trimmedValue.startsWith("{") ||
                    !trimmedValue.endsWith("}")
                  ) {
                    return Promise.reject(
                      new Error(
                        t('请输入有效的对象格式，例如: {"key": "value"}')
                      )
                    );
                  }
                  // 对于包含函数调用或其他JavaScript表达式的对象，我们只检查基本结构
                  // 不尝试完整解析，因为这可能包含动态内容
                  return Promise.resolve();
                } catch (e) {
                  return Promise.reject(
                    new Error(t('请输入有效的对象格式，例如: {"key": "value"}'))
                  );
                }
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        {variableType === "number" ? (
          <InputNumber style={{ width: "100%" }} />
        ) : (
          <EditorWithMentions
            onChange={textAreaContent}
            parameters={parameters?.value}
            itemName="value"
          />
        )}
      </FormItem>
    </Form>
  );
});
