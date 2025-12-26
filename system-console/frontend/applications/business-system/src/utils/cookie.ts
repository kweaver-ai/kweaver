import _ from 'lodash';
import Cookies from 'js-cookie';

const prefix = 'mf';
const version = '1.0.0';
const getKey = (key: string) => `${prefix}(${version}):${key}`;

/** 为d mf 的cookie添加前缀 */
const Cookie = {
  set: (key: string, value: string, options: Cookies.CookieAttributes = {}) => {
    Cookies.set(getKey(key), value, options);
  },
  get: (key: string) => {
    return Cookies.get(getKey(key));
  },
  remove: (key: string, options: Cookies.CookieAttributes = {}) => {
    Cookies.remove(getKey(key), options);
  },
  clear: (cookies: string[]) => {
    _.forEach(cookies, (key: string) => Cookies.remove(getKey(key)));
  },
};

export default Cookie;
