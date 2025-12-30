export const defaultParamType = 'unknown'; // 默认参数类型
export const hiddenBuildInFields = ['history', 'tool', 'header', 'self_config']; // 需要隐藏的内置输入变量

// 转换agentInput
export const transformAgentInput = ({ name, type, desc }: { name: string; type: string; desc: string }) => {
  return {
    enable: name === 'query', // query参数默认开启
    input_name: name,
    input_type: type || defaultParamType,
    map_type: 'auto',
    input_desc: desc || `${name}变量`,
  };
};

// 从openAPiSpec数据中解析出引用参数的值
function resolveRef(obj: any, apiSpec: any) {
  if (!obj || !obj.$ref) return obj;

  // 去除了"#/"，分解后的路径如 ["components", "parameters", "ApiKeyHeader"]
  const refPath = obj.$ref.split('/').slice(1);
  let current = apiSpec;

  // 逐级查找引用目标
  for (const key of refPath) {
    if (current?.[key] === undefined) {
      return {};
    }
    current = current[key];
  }

  // 递归解析（确保引用的对象内部没有未解析的 $ref）
  return resolveRef(current, apiSpec);
}

// 递归处理嵌套的properties
function processNestedProperties(properties: any, required: any, inStr: string, apiSpec: any): any[] | undefined {
  if (!properties) return undefined;

  return Object.keys(properties).map((name: string) => {
    const property = properties[name];
    const resolvedProperty = resolveRef(property, apiSpec);

    return {
      input_name: name,
      input_type: resolvedProperty.type || defaultParamType,
      input_desc: resolvedProperty.description || '',
      required: Array.isArray(required) ? required.includes(name) : false,
      in: inStr,
      children: processNestedProperties(resolvedProperty.properties, resolvedProperty.required || [], inStr, apiSpec),
    };
  });
}

// 从openAPI spec中获取输入参数（合并 parameters 和 request_body 中的参数）
export function getInputParamsFromOpenAPISpec(apiSpec: any) {
  const inputParams: any[] = [];

  // 1. 处理 parameters 中的参数
  if (apiSpec?.parameters) {
    const paramInputs = apiSpec.parameters.map((param: any) => {
      // 可能使用引用参数
      const resolvedParam = resolveRef(param, apiSpec);

      return {
        input_name: resolvedParam.name,
        input_type: resolvedParam.schema?.type || defaultParamType,
        input_desc: resolvedParam.description || '',
        required: resolvedParam.required || false,
        in: resolvedParam.in,
        children: processNestedProperties(
          resolvedParam.properties,
          resolvedParam.required || [],
          resolvedParam.in,
          apiSpec
        ),
      };
    });

    inputParams.push(...paramInputs);
  }

  // 2. 处理 request_body 中的参数
  const bodySchema = apiSpec.request_body?.content?.['application/json']?.schema;
  if (bodySchema) {
    const resolvedSchema = resolveRef(bodySchema, apiSpec);
    if (resolvedSchema?.properties) {
      const bodyInputs = processNestedProperties(
        resolvedSchema.properties,
        resolvedSchema.required || [],
        'body',
        apiSpec
      );
      inputParams.push(...(bodyInputs || []));
    }
  }

  return inputParams;
}
