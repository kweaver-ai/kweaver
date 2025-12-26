import axios from 'axios';
import intl from 'react-intl-universal';
import { message } from 'antd';
import _ from 'lodash';

import { sessionStore } from '@/utils/handleFunction';

export const baseConfig: { token: string; lang: string; refresh: () => Promise<any> } = {
  token: '',
  lang: 'zh-cn',
  refresh: () => Promise.resolve(),
};
export const langTransform: any = { 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW', 'en-us': 'en-US' };

// 取消请求的信号数据
const requestCancelToken: Record<string, Function> = {};
const { CancelToken } = axios;
const service = axios.create({ baseURL: '/', timeout: 20000 });

service.interceptors.request.use(
  config => {
    config.cancelToken = new CancelToken(cancel => {
      requestCancelToken[config.url!] = cancel;
    });

    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = langTransform[baseConfig.lang] === 'en-us' ? 'en-us' : 'zh-cn';
    if (baseConfig.token) config.headers.Authorization = `Bearer ${baseConfig.token}`;
    const token = sessionStore.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data';
      const formData = new FormData();
      const { type, ...elseData } = config.data;
      for (const key in elseData) {
        if (Object.prototype.hasOwnProperty.call(elseData, key)) {
          const item = elseData[key];
          if (key === 'file' && Array.isArray(item)) {
            _.forEach(elseData[key], d => formData.append('file', d));
          } else {
            formData.append(key, item);
          }
        }
      }
      config.data = formData;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);
type RequestType = { url: string; data: any; config: any; method: 'get' | 'post' | 'delete' | 'put'; reTry?: boolean };
const request = ({ url, data, config, method, reTry = false }: RequestType): any => {
  const body = method === 'get' ? { params: data, ...config } : Array.isArray(data) ? [...data] : { ...data };
  return new Promise((resolve, reject) => {
    service[method](url, body, config)
      .then(response => {
        if (response) resolve(response?.data);
      })
      .catch(error => {
        if (axios.isCancel(error)) return reject({ code: -200, description: '请求已取消' });

        const { data: responseData = {}, status } = error.response || {};
        const { Description } = responseData || {};

        if (responseData?.Description?.includes('timeout') || error.message.includes('timeout')) {
          message.error(intl.get('global.timeOut'));
          return reject(error.response);
        }

        if (status === 401) {
          if (reTry) {
            message.error(Description);
            return reject(error.response);
          }
          baseConfig
            .refresh()
            .then(result => {
              if (!result) {
                reject(error);
                return message.error(Description || 'token 已过期');
              }
              baseConfig.token = result?.access_token;
              sessionStore.set('token', result?.access_token);
              request({ url, data, config, method, reTry: true })
                .then((_result: any) => {
                  console.log('222');
                  resolve(_result);
                })
                .catch((error: any) => {
                  console.log('333');
                  reject(error);
                });
            })
            .catch(() => {
              console.log('444');
              message.error(Description);
              reject(error.response);
            });
        } else if (status === 403) {
          return reject(error.response);
        } else if (status === 500) {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject({ type: 'message', config: error?.response?.config, response: responseData });
        } else if (status === 502) {
          return message.error(intl.get('global.getWayError'));
        } else if (status === 503) {
          message.error('服务器暂不可用，请稍后再试');
          return reject(error.response);
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
          return reject(error.response);
        } else {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject(error.response);
        }
      });
  });
};

const axiosGet = (url: string, data?: any, config = {}) => {
  return request({ url, data, config, method: 'get' });
};

const axiosDelete = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'delete' });
};

const axiosPost = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'post' });
};

const axiosPut = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'put' });
};

export default { axiosGet, axiosDelete, axiosPost, axiosPut };

/**
 * 取消请求, 若不传参则取消所有
 * @param url 取消的api
 */
export const cancelRequest = (url?: string | string[]) => {
  if (!url) return Object.values(requestCancelToken).forEach(cancel => cancel());
  const urls = typeof url === 'string' ? [url] : url;
  urls.forEach(key => {
    requestCancelToken[key]?.();
  });
};
