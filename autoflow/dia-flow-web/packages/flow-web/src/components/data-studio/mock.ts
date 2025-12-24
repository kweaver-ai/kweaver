export function fetchMock (val: any) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([{
        productName: '数据产品1',
        triggerType: '手动触发',
        status: '运行中',
        updateTime: '2024-01-01 10:00:00',
        key: '1',
      }]);
    }, 1000);
  });
}
