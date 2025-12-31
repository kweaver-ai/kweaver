// @ts-ignore
import Hierarchy from '@antv/hierarchy';
import { customAlphabet } from 'nanoid';

export function replaceObjectById(arr: any[], newObj: any) {
  const index = arr.findIndex((item) => item.id === newObj.id);
  if (index !== -1) {
    arr[index] = newObj;
  }
}

/**
 * 根据 data_scope 数组的 input_nodes 生成树结构
 * @param {Array} dataScope - 原始节点数组
 * @returns {Array} 树结构的根节点数组
 */
export function buildDataScopeTree(nodes: any[]) {
  // 步骤1：创建节点ID映射表，key为node.id，value为节点对象，方便快速查找
  const nodeMap = nodes.reduce((map, node) => {
    map[node.id] = node;
    return map;
  }, {});

  // 步骤2：收集所有被引用的节点ID（即所有input_nodes中的ID），用于识别根节点
  const referencedNodeIds = new Set();
  nodes.forEach((node) => {
    if (Array.isArray(node.input_nodes) && node.input_nodes.length > 0) {
      node.input_nodes.forEach((childId: any) => referencedNodeIds.add(childId));
    }
  });

  // 步骤3：定义递归函数，构建单个节点的子树
  function buildNodeSubtree(nodeId: any) {
    const currentNode = nodeMap[nodeId];
    if (!currentNode) return null; // 防止无效ID（如配置错误）

    // 构建当前节点的子节点数组（input_nodes对应的节点）
    const children = (currentNode.input_nodes || [])
      .map((childId: any) => buildNodeSubtree(childId)) // 递归处理子节点
      .filter((child: any) => child !== null); // 过滤无效子节点

    // 返回树结构的节点（只保留核心信息，可按需扩展字段）
    return {
      id: currentNode.id,
      title: currentNode.title,
      type: currentNode.type,
      children: children, // 子节点数组（input_nodes对应的节点树）
    };
  }

  // 步骤4：找到所有根节点（未被任何节点引用的节点），并构建完整树
  const rootNodes = nodes
    .filter((node) => !referencedNodeIds.has(node.id)) // 根节点：不在被引用列表中
    .map((rootNode) => buildNodeSubtree(rootNode.id)); // 为每个根节点构建子树

  return rootNodes;
}

// 格式化节点位置
export function formatNodePosition(dataScope: any[]): any[] {
  if (!dataScope?.length) {
    return [];
  }

  const treeRoots = buildDataScopeTree(dataScope);

  const treeData = Hierarchy.compactBox(
    { id: 'root', children: treeRoots },
    {
      direction: 'RL',
      getHeight() {
        return 108;
      },
      getWidth() {
        return 280;
      },
      getHGap() {
        return 100;
      },
    }
  );

  const result: any[] = [];

  const traverseTree = (node: any) => {
    if (node.children?.length) {
      node.children.forEach((child: any) => {
        traverseTree(child);
      });
    }
    const item = dataScope.find((item: any) => item.id === node.id);
    if (item) {
      result.push({
        ...item,
        position: {
          x: window.innerWidth + node.x,
          y: window.innerHeight / 2 + node.y,
        },
      });
    }
  };
  traverseTree(treeData);
  return result;
}

/**
 * 获取节点的所有输入节点（递归）
 * @param {Array} nodeList - 所有节点数组
 * @param {string} nodeId - 当前节点ID
 * @param {Array} result - 存储结果的数组（递归调用时传递）
 * @returns {Array} 所有输入节点的数组
 */
export const getInputNodes = (nodeList: any[], nodeId: string, result: any[] = []): any[] => {
  const currentNode = nodeList.find((item: any) => item.id === nodeId);

  if (!currentNode) {
    return result;
  }

  // 如果有输入节点，递归获取所有输入节点
  if (currentNode?.input_nodes?.length > 0) {
    currentNode.input_nodes.forEach((inputNodeId: string) => {
      const inputNodes = nodeList.find((item: any) => item.id === inputNodeId);
      if (inputNodes) {
        result.push(inputNodes);
      }
      getInputNodes(nodeList, inputNodeId, result);
    });
  }

  return result;
};

/**
 * 获取节点的所有输入节点（递归）
 * @param {Array} nodeList - 所有节点数组
 * @param {string} nodeId - 当前节点ID
 * @param {Array} result - 存储结果的数组（递归调用时传递）
 * @returns {Array} 所有输入节点的数组
 */
export const getTargetNodes = (nodeList: any[], nodeId: string, result: any[] = []): any[] => {
  if (!nodeList?.length) {
    return result;
  }
  const currentNode = nodeList.find((item: any) => item.id === nodeId);

  if (!currentNode) {
    return result;
  }

  const targetNode = nodeList.filter((item: any) => item.input_nodes.includes(nodeId));
  result.push(...targetNode);

  targetNode.forEach((item: any) => {
    getTargetNodes(nodeList, item.id, result);
  });

  return result;
};

export const nanoId = () => {
  return customAlphabet('123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 5)();
};

/**
 * 生成对象的复合标识（基于多个属性）
 * @param obj 目标对象
 * @param keys 用于生成标识的属性数组（必须是obj的属性名）
 * @returns 复合标识字符串（如"1|a"）
 */
function getCompositeKey<T extends object>(obj: T, keys: Array<keyof T>): string {
  return keys
    .map((key) => {
      const value = obj[key];
      // 处理 null/undefined，统一转为特殊标识避免冲突
      if (value === null || value === undefined) {
        return '___';
      }
      // 对对象类型的属性值进行序列化（避免引用类型导致的标识错误）
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    })
    .join('|'); // 用特殊分隔符拼接，避免不同属性组合冲突
}

/**
 * 获取多个对象数组的交集（基于多个属性判断对象相同）
 * @param arrays 要计算交集的对象数组列表
 * @param keys 用于判断对象相同的属性数组（必须是对象的属性名）
 * @returns 所有数组的交集（去重后的对象数组）
 */
export function getObjectArrayIntersectionByKeys<T extends object>(arrays: T[][], keys: Array<keyof T>): T[] {
  // 边缘情况处理
  if (arrays.length === 0 || keys.length === 0) {
    return [];
  }

  // 1. 为每个数组生成“复合标识Set”
  const keySetList: Set<string>[] = arrays.map((arr) => {
    const keySet = new Set<string>();
    arr.forEach((obj) => {
      const compositeKey = getCompositeKey(obj, keys);
      keySet.add(compositeKey);
    });
    return keySet;
  });

  // 2. 求所有复合标识的交集
  let commonKeys: string[] = [...keySetList[0]];
  for (let i = 1; i < keySetList.length; i++) {
    commonKeys = commonKeys.filter((key) => keySetList[i].has(key));
    if (commonKeys.length === 0) break; // 提前退出
  }

  // 3. 根据共同标识筛选对象（从第一个数组取，并去重）
  const resultMap = new Map<string, T>();
  arrays[0].forEach((obj) => {
    const key = getCompositeKey(obj, keys);
    if (commonKeys.includes(key) && !resultMap.has(key)) {
      resultMap.set(key, obj);
    }
  });

  return [...resultMap.values()];
}
