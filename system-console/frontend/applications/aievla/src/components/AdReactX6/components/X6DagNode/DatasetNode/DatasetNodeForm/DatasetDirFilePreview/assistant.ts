/** 生成树节点数据格式 */
export const generateTreeNodeData = (
  dataSource: any,
  options: {
    parentKey?: string;
    isLeaf?: boolean;
    noIndent?: boolean;
  } = { parentKey: '', isLeaf: false, noIndent: false },
) => {
  const { parentKey, isLeaf, noIndent } = options;
  return dataSource.map((item: any) => {
    return {
      key: item.doc_id,
      title: item.name,
      children: [],
      sourceData: {
        ...item,
      },
      isLeaf,
      parentKey,
      selectable: item.type !== 1,
      className: noIndent && 'ad-treeNode-noIndent',
    };
  });
};

export const updateTreeData = (list: any, key: string, children: any) =>
  list.map((node: any) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

export const generateFilePreviewTableData = (data: Record<string, any>) => {
  return Object.keys(data).map(field => ({
    fieldName: field,
    fieldValue: data[field],
  }));
};
