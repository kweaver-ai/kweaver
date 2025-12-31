import _ from 'lodash';
import ActionType from '@/services/action/type';

interface InputItem {
  name: string;
  value_from: string;
  value: string;
  description?: string;
  type?: string;
  source?: string;
}

interface OutputItem {
  name: string;
  key: string;
  description?: string;
  type?: string;
  source?: string;
  value_from?: string;
  value?: string;
  children?: OutputItem[];
}

const defaultParamType = 'unknown'; // 默认参数类型

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
function processNestedProperties(properties: any, required: any, source: string, apiSpec: any, parentKey: string = ''): any[] | undefined {
  if (!properties) return undefined;

  return Object.keys(properties)
    .sort((a, b) => a.localeCompare(b))
    .map((name: string) => {
      const property = properties[name];
      const resolvedProperty = resolveRef(property, apiSpec);
      const key = parentKey ? `${parentKey}.${name}` : name;

      return {
        name,
        key,
        type: resolvedProperty.type || defaultParamType,
        description: resolvedProperty.description || '',
        required: Array.isArray(required) ? required.includes(name) : false,
        source,
        children: processNestedProperties(resolvedProperty.properties, resolvedProperty.required || [], source, apiSpec, key),
      };
    });
}

// 从openAPI spec中获取输入参数（合并 parameters 和 request_body 中的参数）
export function getInputParamsFromToolOpenAPISpec(apiSpec: any) {
  const inputParams: any[] = [];

  // 1. 处理 parameters 中的参数
  if (apiSpec?.parameters) {
    const paramInputs = apiSpec.parameters.map((param: any) => {
      // 可能使用引用参数
      const resolvedParam = resolveRef(param, apiSpec);
      const key = resolvedParam.name;
      // 首字母大写，其它字母小写
      const source = _.upperFirst(_.toLower(resolvedParam.in));

      return {
        name: resolvedParam.name,
        key,
        type: resolvedParam.schema?.type || defaultParamType,
        description: resolvedParam.description || '',
        required: resolvedParam.required || false,
        source,
        children: processNestedProperties(resolvedParam.properties, resolvedParam.required || [], source, apiSpec, key),
      };
    });

    inputParams.push(...paramInputs);
  }

  // 2. 处理 request_body 中的参数
  const bodySchema = apiSpec.request_body?.content?.['application/json']?.schema;
  if (bodySchema) {
    const resolvedSchema = resolveRef(bodySchema, apiSpec);
    if (resolvedSchema?.properties) {
      const bodyInputs = processNestedProperties(resolvedSchema.properties, resolvedSchema.required || [], 'Body', apiSpec);
      inputParams.push(...(bodyInputs || []));
    }
  }

  return inputParams;
}

// 递归收集所有包含 children 的项的 key（支持无限层级）
export const getAllExpandableKeys = (data: any[]) => {
  let keys: string[] = [];

  data.forEach((item) => {
    // 如果当前项有 children，收集其 key
    if (item.children && item.children.length > 0) {
      keys.push(item.key);
      // 递归处理子项
      const childKeys = getAllExpandableKeys(item.children);
      keys = [...keys, ...childKeys];
    }
  });
  return keys;
};

export const processTreeData = (data: any[], oldParams?: any[]): any[] => {
  // 将oldParams转换为Map，将查找复杂度从O(n)降至O(1)
  const paramsMap = oldParams ? new Map(oldParams.map((param) => [param.name, param])) : new Map<string, any>();

  // 递归处理函数，内部复用paramsMap
  const processNode = (item: any): any => {
    // 从Map中获取对应参数，性能更优
    const matchedParam = paramsMap.get(item.key);

    // 处理子节点（如果存在）
    const children = item.children?.length ? item.children.map(processNode) : undefined;

    // 返回新对象，避免直接修改原数据
    return {
      ...item,
      value_from: matchedParam?.value_from || ActionType.ValueFrom.Input,
      value: matchedParam?.value,
      children,
    };
  };

  return data.map(processNode);
};

// 查看工具表格时，用于将接口中存储的输入参数转换成界面上展示的数据
export function transformInput(input: InputItem[]): OutputItem[] {
  // 创建一个临时映射来存储所有节点，便于查找和构建层级
  const nodeMap = new Map<string, OutputItem>();

  // 首先处理所有输入项，创建对应的节点
  input.forEach((item) => {
    const parts = item.name.split('.');
    let currentKey = '';

    // 为每个层级创建节点
    parts.forEach((part, index) => {
      currentKey = currentKey ? `${currentKey}.${part}` : part;

      // 如果节点不存在，则创建它
      if (!nodeMap.has(currentKey)) {
        // 只有叶子节点才有value_from和value
        const isLeaf = index === parts.length - 1;

        const node: OutputItem = {
          name: part,
          key: currentKey,
          description: item.description,
          type: item.type || (isLeaf ? 'unknown' : 'object'),
          source: item.source,
          ...(isLeaf && {
            value_from: item.value_from,
            value: item.value,
          }),
          // 非叶子节点初始化为空数组，叶子节点不初始化children
          ...(!isLeaf && { children: [] }),
        };
        nodeMap.set(currentKey, node);
      }
    });
  });

  // 构建层级结构
  const rootNodes: OutputItem[] = [];

  // 为每个节点找到其父节点并添加到children中
  nodeMap.forEach((node, key) => {
    const lastDotIndex = key.lastIndexOf('.');

    // 如果是根节点（没有父节点）
    if (lastDotIndex === -1) {
      rootNodes.push(node);
    } else {
      // 找到父节点的key
      const parentKey = key.substring(0, lastDotIndex);
      const parentNode = nodeMap.get(parentKey);

      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      }
    }
  });

  // 清理空的children数组，将其设置为undefined
  const cleanEmptyChildren = (nodes: OutputItem[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children) {
        cleanEmptyChildren(node.children);
      }
    });
  };

  cleanEmptyChildren(rootNodes);

  return rootNodes;
}
