/**
 * 参数位置类型
 */
type ParamLocation = 'body' | 'path' | 'header' | 'query' | 'unknown';

/**
 * 内部参数信息类型
 */
interface ParamInfo {
  name: string;
  type: string;
  source: string;
  location: ParamLocation;
  required?: boolean;
  description?: string;
  enum?: any[];
  children?: ParamInfo[];
}

/**
 * 扁平化的参数信息（用于接口返回）
 */
export interface FlatParamInfo {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: string;
  /** 参数描述 */
  description?: string;
  /** 参数来源位置 */
  source: string;
  /** 是否必填 */
  required?: boolean;
  /** 枚举值 */
  enum?: any[];
  /** 子参数（如果是object类型） */
  children?: FlatParamInfo[];
  /** 参数唯一标识 */
  key: string;
}

/**
 * 解析 $ref 引用
 */
function resolveRef(property: any, definitions: Record<string, any>): any {
  if (!property.$ref) {
    return property;
  }
  const refPath = property.$ref.replace('#/$defs/', '').replace('#/definitions/', '');
  return definitions[refPath] || property;
}

/**
 * 获取参数位置类型
 */
function getParamLocation(path: string): ParamLocation {
  const topLevel = path.split('.')[0].toLowerCase();
  if (topLevel === 'body') return 'body';
  if (topLevel === 'path') return 'path';
  if (topLevel === 'header') return 'header';
  if (topLevel === 'query') return 'query';
  return 'unknown';
}

/**
 * 递归解析 Schema 属性
 */
function parseProperties(
  properties: Record<string, any>,
  required: string[] = [],
  definitions: Record<string, any> = {},
  parentPath: string = '',
  location?: ParamLocation
): ParamInfo[] {
  const params: ParamInfo[] = [];

  Object.keys(properties).forEach((key) => {
    const property = properties[key];
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const currentLocation = location || getParamLocation(currentPath);

    let resolvedProperty = resolveRef(property, definitions);

    while (resolvedProperty.$ref && resolvedProperty !== property) {
      resolvedProperty = resolveRef(resolvedProperty, definitions);
    }

    const paramInfo: ParamInfo = {
      name: key,
      type: resolvedProperty.type || 'unknown', // 统一默认参数类型为 'unknown'
      source: currentPath,
      location: currentLocation,
      required: required.includes(key),
      description: resolvedProperty.description,
    };

    if (resolvedProperty.enum) {
      paramInfo.enum = resolvedProperty.enum;
    }

    if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
      paramInfo.children = parseProperties(resolvedProperty.properties, resolvedProperty.required || [], definitions, currentPath, currentLocation);
    }

    if (resolvedProperty.type === 'array' && resolvedProperty.items) {
      let itemSchema = resolveRef(resolvedProperty.items, definitions);

      while (itemSchema.$ref && itemSchema !== resolvedProperty.items) {
        itemSchema = resolveRef(itemSchema, definitions);
      }

      if (itemSchema.properties) {
        paramInfo.children = parseProperties(itemSchema.properties, itemSchema.required || [], definitions, `${currentPath}[]`, currentLocation);
      }
    }

    params.push(paramInfo);
  });

  return params;
}

/**
 * 将参数树扁平化为数组
 */
function flattenParams(params: ParamInfo[], result: FlatParamInfo[] = [], parentKey: string = ''): FlatParamInfo[] {
  params.forEach((param) => {
    const isTopLevelContainer = ['body', 'path', 'header'].includes(param.name.toLowerCase());
    // 生成key字段：
    // 1. 如果父级存在且不是顶层容器，格式为"{parentKey}.{name}"
    // 2. 其他情况（父级不存在或父级是顶层容器），格式为"{name}"
    const isParentTopLevel = parentKey ? ['body', 'path', 'header'].includes(parentKey.toLowerCase()) : false;
    const paramKey = parentKey && !isParentTopLevel ? `${parentKey}.${param.name}` : param.name;

    // 对于顶层容器，只提取children而不添加自身
    if (isTopLevelContainer) {
      if (param.children && param.children.length > 0) {
        flattenParams(param.children, result, param.name);
      }
    } else {
      // 对于普通参数和query参数，都添加到结果中
      const flatParam: FlatParamInfo = {
        name: param.name,
        type: param.type,
        description: param.description,
        source: param.location.charAt(0).toUpperCase() + param.location.slice(1), // 首字母大写
        required: param.required !== undefined ? param.required : false,
        key: paramKey,
        children: param.children && param.children.length > 0 ? [] : undefined,
      };

      if (param.enum) {
        flatParam.enum = param.enum;
      }

      // 添加到结果中
      result.push(flatParam);

      // 处理子参数
      if (param.children && param.children.length > 0) {
        flattenParams(param.children, flatParam.children || [], param.name);
      }
    }
  });

  return result;
}

/**
 * 根据工具名称从 tools 数组中提取特定工具的入参信息（扁平化）
 * @param toolsArray 工具数组
 * @param toolName 工具名称
 * @returns 扁平化的入参信息数组
 */
export function extractParamsByToolList(toolsArray: any[], toolName: string): FlatParamInfo[] {
  if (!Array.isArray(toolsArray)) {
    return [];
  }

  const tool = toolsArray.find((t: any) => t.name === toolName);

  if (!tool || !tool.inputSchema) {
    return [];
  }

  const schema = tool.inputSchema;
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const properties = schema.properties || {};
  const required = schema.required || [];
  const definitions = schema.$defs || schema.definitions || {};

  const params = parseProperties(properties, required, definitions);
  return flattenParams(params);
}
