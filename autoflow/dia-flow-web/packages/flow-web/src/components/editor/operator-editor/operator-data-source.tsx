import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  memo,
  useCallback,
  useContext,
} from "react";
import Form from "../../editor/form";
import validator from "@rjsf/validator-ajv8";
import "./json-schema-form.less";

interface JsonSchemaFormProps {
  action: any;
  parameters: any;
  onChange: (data: any) => void;
}

const JsonSchemaFormComponent = memo(
  forwardRef(({ action, parameters, onChange }: JsonSchemaFormProps, ref) => {
    const [schema, setSchema] = useState<any>({});
    const [formData, setFormData] = useState({});
    const jsonSchema = action?.config?.api_spec;
    // 生成稳定UI配置
    const uiSchema: any = {};

    // Schema初始化逻辑
    useEffect(() => {
      const generateSchema = {
        type: "object",
        properties: {
          parameters: jsonSchema?.parameters?.length
            ? {
                type: "array",
                items: jsonSchema.parameters.map((item: any) => ({
                  type: "string",
                  title: item?.name,
                  ...item,
                })),
              }
            : undefined,
          body:
            jsonSchema?.request_body?.content["application/json"]?.schema ||
            jsonSchema?.request_body?.content["application/json"],
        },
        components: jsonSchema?.components,
      };

      setSchema(generateSchema);

      // onChange({
      //   version: action.config.version,
      //   request: {},
      // });

    }, [jsonSchema]); // 依赖jsonSchema变化

    useEffect(() => {
      const authIndex = jsonSchema?.parameters?.findIndex(
        (item: any) => item.name === "Authorization"
      );

      if (authIndex >= 0 && !parameters?.request?.parameters?.[authIndex]) {
        const paramDefinitions = jsonSchema?.parameters || [];
        const paramValues = parameters?.request?.parameters || [];
        // 创建与定义数组长度相同的数组，不足部分用null填充
        const filledParameters = paramDefinitions.map(
          (_: any, index: number) => paramValues[index] ?? null
        );
        const data = {
          parameters: filledParameters,
          body: parameters?.request?.body,
        };
        data.parameters[authIndex] = `{{__g_authorization}}`;
        setTimeout(() => {
          setFormData({ ...data });
        }, 10);
      }
    }, [schema]);
    // 同步表单数据
    useEffect(() => {
      setFormData(parameters?.request || {});
    }, [parameters?.request]); // 精确依赖request字段

    // 表单提交处理
    const handleChange = useCallback(
      ({ formData }) => {
        onChange({
          version: action.config.version,
          request: formData,
        });
      },
      [action?.config?.version, onChange]
    );

    return (
      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        noValidate
        className="rjsf-jsonschema"
        formData={formData}
        onChange={handleChange}
      >
        <button type="submit" hidden>
          保存
        </button>
      </Form>
    );
  }),
  (prevProps, nextProps) => {
    // 深度比较关键参数
    return (
      prevProps?.action === nextProps?.action &&
      prevProps.onChange === nextProps.onChange
    );
  }
);

export function OperatorDataSource(action: any) {
  return (props: any) => <JsonSchemaFormComponent {...props} action={action} />;
}
