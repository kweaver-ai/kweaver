export interface PromiseWithResolvers<T = any> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: any): void;
}

export function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}
