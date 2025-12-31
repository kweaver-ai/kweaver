import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { Form, InputNumber, Input } from "antd";
import { FormItem } from "../../components/editor/form-item";
import EditorWithMentions from "../ai/editor-with-mentions";
import { EditorContext } from "../../components/editor/editor-context";

export interface InternalDefineParameters {
  target: string;
  value: any;
}

export const InternalAssign = forwardRef<
  Validatable,
  ExecutorActionConfigProps<InternalDefineParameters>
>(({ t, parameters, onChange }, ref) => {
  const [form] = Form.useForm<InternalDefineParameters>();
  const { stepOutputs } = useContext(EditorContext);
  const [variableType, setVariableType] = useState("string");

  const initialValues = {
    ...parameters,
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

  // 监听类型变化，更新表单值
  const onChangeTarget = (value?: string) => {
    const key = value?.replace(/^\{\{|\}\}$/g, "") || "";
    Object.entries(stepOutputs).forEach(([id, val]: any) => {
      if (key.startsWith(id)) {
        setVariableType(val?.type);
      }
    });
  };

  useEffect(() => {
    if (parameters?.target) {
      onChangeTarget(parameters?.target);
    }
  }, [parameters]);

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
        label={t("editVariableType", "目标变量名")}
        name="target"
        allowVariable
        allowOperator={["@internal/define"]}
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
        ]}
      >
        <Input readOnly placeholder="请选择要修改的变量名称" />
      </FormItem>
      <FormItem
        label={t("editVariableValue", "变量赋值")}
        name="value"
        allowVariable={variableType === "number" ? true : false}
        rules={[
          {
            required: true,
            message: t("emptyMessage"),
          },
          {
            validator: (_, value) => {
              const type = variableType;
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
