import { hexMd5, b64 } from '@/utils/ar-md5';

function randomString(length) {
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = length; i > 0; --i) result += str[Math.floor(Math.random() * str.length)];

  return result;
}

const compose = (...fns) => {
  // 处理空参数情况
  if (fns.length === 0) return (arg) => arg;

  // 如果只有一个函数，直接返回它
  if (fns.length === 1) return fns[0];

  // 从右向左组合函数
  return fns.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  );
};

/**
 * 修改`url`的格式为：`/api/xxx?nonce=xxx&timestamp=xxx&_id=ar&signature=xxx`
 * 数字签名算法：`signature = base64(hexMd5(base64(url)))`
 */
const changeUrl = (url) => {
  let newUrl = '';

  if (url.indexOf('?') !== -1) {
    newUrl = `${url}&nonce=${randomString(40)}`;
  } else {
    newUrl = `${url}?nonce=${randomString(40)}`;
  }

  const signature = compose(b64, hexMd5, b64)(newUrl);

  return `${newUrl}&timestamp=${+new Date()}&_id=ar&signature=${signature}`;
};

export default changeUrl;
