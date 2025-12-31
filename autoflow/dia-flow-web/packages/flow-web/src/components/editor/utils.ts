/**
 * 检查嵌套结构中是否存在目标操作符
 * @param input 可以是单个步骤对象、步骤数组或包含嵌套结构的对象
 * @returns 如果嵌套结构中存在targetIds中的任何一个操作符，则返回true
 */
export const hasConfigOperator = (input: any): boolean => {
  // 目标操作符列表
  const targetIds = [
    "@intelliinfo/transfer",
    "@intelliinfo/transfer-person",
    "@intelliinfo/transfer-orgnization",
    "@intelliinfo/transfer-document",
    "@workflow/approval",
    "@internal/tool/py3",
  ];

  // 递归检查单个项目及其嵌套结构
  const checkItem = (item: any): boolean => {
    // 检查当前项目的 operator 是否在目标列表中，或者以 @operator/ 开头
    if ((item?.operator && (targetIds.includes(item.operator)) || item.operator.startsWith('@operator/'))) {
      return true;
    }

    // 检查 branches 中的项目
    if (item?.branches && Array.isArray(item.branches)) {
      for (const branch of item.branches) {
        // 检查分支本身的 operator
        if (checkItem(branch)) {
          return true;
        }
        // 检查分支中的 steps
        if (branch?.steps && Array.isArray(branch.steps)) {
          for (const step of branch.steps) {
            if (checkItem(step)) {
              return true;
            }
          }
        }
      }
    }

    // 检查直接的 steps
    if (item?.steps && Array.isArray(item.steps)) {
      for (const step of item.steps) {
        if (checkItem(step)) {
          return true;
        }
      }
    }

    return false;
  };

  // 根据输入类型选择检查方式
  if (Array.isArray(input)) {
    // 如果是数组，检查是否有任何一个元素匹配
    return input.some(checkItem);
  } else {
    // 如果是单个对象，直接检查
    return checkItem(input);
  }
};
