export function autoConvertToTableData(data: any) {
  // 提取所有可能的列名
  const allKeys = new Set();
  data.forEach((item: any) => {
    Object.keys(item).forEach((key) => allKeys.add(key));
  });

  // 构建列定义
  const columns = Array.from(allKeys).map((key: any) => ({
    title: key?.replace(/([A-Z])/g, " $1").trim(), // 将驼峰命名转换为标题格式
    dataIndex: key,
    key: key,
    width: 200,
    ellipsis: true,
  }));

  // 构建表格数据
  const dataSource = data.map((item: any) => {
    const row: any = {};
    columns.forEach((column: any) => {
      row[column.dataIndex] = item[column.dataIndex] || "";
    });
    return row;
  });

  return { columns, dataSource };
}
