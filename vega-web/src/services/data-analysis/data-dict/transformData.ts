export const proxyData = (data: any): any => {
  const handler = {
    get: (data: any, key: any, receiver: any): any => {
      try {
        if (typeof key === 'string') {
          const underlineKey = key.replace(/[A-Z]/g, (word) => `_${word.toLowerCase()}`);

          const value = Reflect.get(data, underlineKey, receiver);

          return typeof value === 'undefined' ? Reflect.get(data, key, receiver) : value;
        }
      } catch (e) {
        console.error(`is not ${key}`);
      }
    },
  };

  return new Proxy(data, handler);
};

export function transformData<T>(data: any): T {
  if (typeof data !== 'object') return data;

  const newData = proxyData(data);

  const fn = (data: any): void => {
    Object.keys(data).map((key) => {
      if (typeof data[key] === 'object' && data[key]) {
        data[key] = proxyData(data[key]);
        fn(data[key]);
      }

      return key;
    });
  };

  fn(newData);

  return newData;
}
