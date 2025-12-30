import moment from 'moment';

export function resolveRefPath(ref: any, doc: any) {
  const parts = ref.split('/').filter((part: any) => part !== '#' && part !== '');
  let current = doc;
  for (const part of parts) {
    if (!current?.hasOwnProperty(part)) {
      current = null;
      // throw new Error(`Invalid $ref path: ${ref} (missing ${part})`);
    } else {
      current = current[part];
    }
  }
  return current;
}

/**
 * 递归替换对象中的所有 $ref 引用
 * @param {object} obj - 需要处理的对象
 * @param {object} doc - 完整文档对象（用于解析 $ref）
 * @returns {object} 处理后的新对象
 */
export function dereference(obj: any, doc: any, visited = new Set()): object {
    // 处理基本类型
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    // 检测循环引用
    if (visited.has(obj)) {
        return {}; // 遇到循环引用返回空对象避免无限递归
    }
    visited.add(obj);

    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map((item: any) => dereference(item, doc, visited));
    }

    // 处理 $ref 引用
    if (obj.$ref) {
        const resolved = resolveRefPath(obj.$ref, doc);
        if (resolved) return dereference(resolved, doc, visited); // 传递visited集合
    }

    // 处理普通对象
    const result: any = {};
    for (const key in obj) {
        if (obj?.hasOwnProperty(key)) {
            result[key] = dereference(obj[key], doc, visited);
        }
    }
    visited.delete(obj); // 移除已处理对象，允许在其他分支中重用
    return result;
}

// 递归函数，用于将JSONSchema转换为表格数据
export const getTableData = (schema, parentKey = '') => {
  const data = [];
  for (const key in schema?.properties) {
    const property = schema?.properties[key];
    const name = parentKey ? `${parentKey}.${key}` : key;
    const row = {
      key: name,
      name: key,
      type: property.type,
      required: Array.isArray(schema?.required) ? schema.required.includes(key) : false,
      description: property.description || '',
    };
    if (property.type === 'object' && property?.properties) {
      row.children = getTableData(property, name);
    } else if (property.type === 'array' && property.items && property.items.properties) {
      row.children = getTableData(property.items, `${name}[].`);
    }
    data.push(row);
  }
  return data;
};

export const formatTime = (timestamp?: number, format = 'YYYY/MM/DD HH:mm') => {
  if (!timestamp) {
    return '';
  }
  const timestampMilliseconds = Math.floor(timestamp / 1000000);
  return moment(timestampMilliseconds).format(format);
};

export function generateJsonSchema(params: any) {
  // 初始化一个空对象
  const jsonSchema: any = {};

  // 遍历参数数据
  params?.forEach((param: any) => {
    const { name, description, required, in: location, type = 'string' } = param;
    // 如果当前 location（header 或 query）尚未初始化，则动态创建
    if (!jsonSchema[location]) {
      jsonSchema[location] = {
        type: 'object',
        properties: {},
        required: [],
      };
    }
    const schema = jsonSchema[location];

    // 填充 properties
    schema.properties[name] = {
      type: type,
      description: description,
    };

    // 如果是必需参数，添加到 required 数组
    if (required) {
      schema.required.push(name);
    }
  });

  return jsonSchema;
}
