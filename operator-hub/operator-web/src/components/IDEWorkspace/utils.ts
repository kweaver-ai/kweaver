interface InputOutputType {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

// 通用解析函数
function parseInputOutput(properties: any, required: string[] | undefined, defaultDescription = ''): InputOutputType[] {
  if (!properties) return [];

  return Object.entries(properties).map(([key, value]: [string, any]) => ({
    name: key,
    type: value.type,
    description: value.description || defaultDescription,
    required: required?.includes(key) || false,
  }));
}

// 从函数的工具信息Spec中解析出outputs
export function parseOutputsFromToolInfo(apiSpec: any) {
  const successOutput = apiSpec?.responses?.find((item: any) => item.status_code === '200');
  if (!successOutput) return [];

  const { properties, required } = successOutput?.content?.['application/json']?.schema?.properties?.result || {};
  return parseInputOutput(properties, required);
}

// 从函数的工具信息Spec中解析出inputs
export function parseInputsFromToolInfo(apiSpec: any) {
  const { properties, required } = apiSpec?.request_body?.content?.['application/json']?.schema || {};
  return parseInputOutput(properties, required, '');
}
