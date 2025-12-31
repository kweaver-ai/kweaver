const prefix = 'vega';
const version = '1.0.0';
const getKey = (key: string) => `${prefix}(${version}):${key}`;

/** session storage封装 */
const SessionStorage = {
  /* 解码取出 */
  get: (key: string, global?: boolean) => {
    const data: string | null = global ? window.sessionStorage.getItem(key) : window.sessionStorage.getItem(getKey(key));
    if (data === null) return null;
    return JSON.parse(data);
  },
  /* 编码存入 */
  set: (key: string, data: any, global?: boolean) => {
    const encodeData = JSON.stringify(data);
    if (global) {
      window.sessionStorage.setItem(key, encodeData);
    } else {
      window.sessionStorage.setItem(getKey(key), encodeData);
    }
  },
  /* 删除 */
  remove(key: string, global?: boolean) {
    if (global) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.removeItem(getKey(key));
    }
  },
  /* 清空sessionStorage */
  clear() {
    window.sessionStorage.clear();
  },
};

export default SessionStorage;
