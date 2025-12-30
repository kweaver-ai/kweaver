import { OperatorTypeEnum } from './types';

const OperatorTypeNames = {
  [OperatorTypeEnum.MCP]: 'MCP',
  [OperatorTypeEnum.Operator]: '算子',
  [OperatorTypeEnum.ToolBox]: '工具箱',
} as const;

// 获取算子类型名称
export const getOperatorTypeName = (type?: string): string => {
  return OperatorTypeNames[type as OperatorTypeEnum] || OperatorTypeNames[OperatorTypeEnum.MCP];
};
// 获取算子类型名称（包含"服务"两个字）
export const getOperatorTypeNameWithService = (type?: string): string => {
  const typeName = getOperatorTypeName(type);
  return type !== OperatorTypeEnum.MCP ? typeName : `${typeName}服务`;
};

interface FormConfig {
  schema: any;
  uiSchema: any;
}

/**
 * 同时处理 schema 并生成对应的 uiSchema
 * 返回修改后的 schema 和匹配的 uiSchema
 */
export const getFormConfig = (originalSchema: any): FormConfig => {
  const schema = JSON.parse(JSON.stringify(originalSchema));
  const components = schema?.components?.schemas || {};
  const uiSchema: any = {};

  /**
   * 递归遍历 schema，修改空对象/数组，并记录修改路径
   */
  const traverseSchema = (schemaNode: any, uiNode: any, path: string[] = [], visited: Set<string> = new Set()) => {
    if (!schemaNode) return;

    // 处理 $ref 引用
    if (schemaNode.$ref) {
      const refName = schemaNode.$ref.split('/').pop();
      if (refName && components[refName]) {
        if (visited.has(refName)) {
          return;
        }
        visited.add(refName);
        // 递归处理引用的 schema
        traverseSchema(components[refName], uiNode, path, visited);
      }
      return;
    }

    // 处理空对象：type = object 但没有 properties
    if (schemaNode.type === 'object' && !schemaNode.properties) {
      // 修改 schema
      schemaNode.type = 'string';
      schemaNode.format = 'json:object';

      // 记录修改路径
      if (path.length > 0) {
        // 设置对应的 uiSchema
        setUISchemaForPath(uiSchema, path, {
          'ui:widget': 'JsonTextAreaWidget',
          'ui:options': { rows: 6 },
        });
      }
      return; // 修改后不需要继续遍历
    }

    // 处理空数组：type = array 但没有 items
    if (schemaNode.type === 'array' && !schemaNode.items) {
      // 修改 schema
      schemaNode.type = 'string';
      schemaNode.format = 'json:array';

      // 记录修改路径
      if (path.length > 0) {
        // 设置对应的 uiSchema
        setUISchemaForPath(uiSchema, path, {
          'ui:widget': 'JsonTextAreaWidget',
          'ui:options': { rows: 6 },
        });
      }
      return; // 修改后不需要继续遍历
    }

    // 处理 properties
    if (schemaNode.properties) {
      Object.entries(schemaNode.properties).forEach(([key, value]) => {
        const childPath = [...path, key];
        const childUINode = (uiNode[key] = uiNode[key] || {});
        traverseSchema(value, childUINode, childPath, visited);
      });
    }

    // 处理 items（数组元素）
    if (schemaNode.items) {
      const childPath = [...path, 'items'];
      traverseSchema(schemaNode.items, uiNode, childPath, visited);
    }

    // 处理 additionalProperties
    if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === 'object') {
      const childPath = [...path, '*'];
      traverseSchema(schemaNode.additionalProperties, uiNode, childPath, visited);
    }

    // 处理 oneOf, anyOf, allOf
    ['oneOf', 'anyOf', 'allOf'].forEach(key => {
      if (Array.isArray(schemaNode[key])) {
        schemaNode[key].forEach((item: any, index: number) => {
          const childPath = [...path, key, index.toString()];
          traverseSchema(item, uiNode, childPath, visited);
        });
      }
    });
  };

  /**
   * 根据路径设置 UI Schema
   */
  const setUISchemaForPath = (uiSchemaObj: any, path: string[], value: any) => {
    let current = uiSchemaObj;

    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === path.length - 1) {
        // 最后一个元素，设置值
        current[key] = { ...current[key], ...value };
      } else {
        // 中间路径，创建嵌套对象
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
  };

  // 开始遍历处理
  traverseSchema(schema, uiSchema, [], new Set());

  return {
    schema,
    uiSchema,
  };
};
