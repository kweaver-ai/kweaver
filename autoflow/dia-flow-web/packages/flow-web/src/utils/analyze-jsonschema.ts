


export function resolveRefPath(ref:any, doc:any) {
    const parts = ref.split('/').filter((part:any) => part !== '#' && part !== '');
    let current = doc;
    for (const part of parts) {
        if (!current?.hasOwnProperty(part)) {
            // throw new Error(`Invalid $ref path: ${ref} (missing ${part})`);
        }
        current = current[part];
    }
    return current;
}

/**
 * 递归替换对象中的所有 $ref 引用
 * @param {object} obj - 需要处理的对象
 * @param {object} doc - 完整文档对象（用于解析 $ref）
 * @returns {object} 处理后的新对象
 */
export function dereference(obj:any, doc:any): object {
    // 处理基本类型
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map((item:any) => dereference(item, doc));
    }

    // 处理 $ref 引用
    if (obj.$ref) {
        const resolved = resolveRefPath(obj.$ref, doc);
        return dereference(resolved, doc); // 重要：用解析后的对象继续递归处理
    }

    // 处理普通对象
    const result:any = {};
    for (const key in obj) {
        if (obj?.hasOwnProperty(key)) {
            result[key] = dereference(obj[key], doc);
        }
    }
    return result;
}


export function convertSchemaToFields(schema:any) {
  const result:any = [];
  const traverse = (currentSchema:any, currentPath:any) => {
      const type = currentSchema.type;
      result.push({ key: currentPath, type, name: currentPath });

      if (type === 'object') {
          const properties = currentSchema.properties;
          if (properties) {
              for (const prop of Object.keys(properties)) {
                  const propSchema = properties[prop];
                  traverse(propSchema, `${currentPath}.${prop}`);
              }
          }
      } else if (type === 'array') {
          const items = currentSchema.items;
          if (items) {
              if (Array.isArray(items)) {
                  items.forEach((item, index) => {
                      traverse(item, `${currentPath}.${index}`);
                  });
              }
          }
      }
  };

  traverse(schema, '.data');
  return result;
}