import { Modal } from "antd";
export const hasTargetOperator = (arr: any) => {
  const targetIds = [
    "@intelliinfo/transfer",
    "@anyshare/file/create",
    "@anyshare/file/edit",
    "@internal/database/write",
    "@opensearch/bulk-upsert",
  ]; // 数据输出类型

  // 递归检查单个项目及其嵌套结构
  const checkItem = (item: any): boolean => {
    // 检查当前项目的 operator
    if (item?.operator && targetIds.includes(item.operator)) {
      return true;
    }

    // 检查 branches 中的项目
    if (item?.branches && Array.isArray(item.branches)) {
      for (const branch of item.branches) {
        // 检查 branch 本身
        if (checkItem(branch)) {
          return true;
        }
        // 检查 branch 中的 steps
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

  // 如果输入是数组，遍历检查每个项目
  if (Array.isArray(arr)) {
    return arr.some(item => checkItem(item));
  }
  
  // 如果输入是单个项目，直接检查
  return checkItem(arr);
};

export const hasOperatorMessage = (getContainer: any): Promise<boolean> => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '提示',
      content: '为确保数据流可正常执行，建议您至少配置一个数据输出节点 (如索引库写入、业务知识网络写入、文档库写入、数据连接写入等)',
      getContainer,
      okText: "直接保存",
      cancelText: '继续编辑',
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      },
    });
  });
};
