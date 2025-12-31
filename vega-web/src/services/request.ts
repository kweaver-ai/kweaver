import axios, { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import UTILS from '@/utils';

export const baseConfig: { lang: string; token: string; userid: string; roles: { id: string; name: string }[]; refresh: () => Promise<any> } = {
  lang: 'zh-cn',
  token: '',
  userid: '',
  roles: [],
  refresh: () => Promise.resolve(),
};

const cancelSources: any = {}; // 用于取消请求
const service = axios.create({ baseURL: '/', timeout: 20000 });

// 请求拦截器
service.interceptors.request.use(
  (config: any) => {
    // 添加中断机制
    if (config.cancelTokenKey) {
      config.cancelToken = new axios.CancelToken((cancel) => (cancelSources[config.cancelTokenKey] = cancel));
    }

    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = baseConfig.lang === 'en-us' ? 'en-us' : 'zh-cn';
    if (baseConfig.token) config.headers.Authorization = `Bearer ${baseConfig.token}`;
    if (!config.headers.Authorization) {
      const token = UTILS.SessionStorage.get('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data';
      const formData = new FormData();
      const { type, ...otherData } = config.data;
      for (const key in otherData) {
        if (Object.prototype.hasOwnProperty.call(otherData, key)) {
          const item = otherData[key];
          if (key === 'file' && Array.isArray(item)) {
            _.forEach(otherData[key], (d) => formData.append('file', d));
          } else {
            formData.append(key, item);
          }
        }
      }
      config.data = formData;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const key = (response?.config as any)?.cancelTokenKey;
    if (key && cancelSources[key]) delete cancelSources[key];
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) return { Code: -200, message: '取消请求', cause: '取消请求' };
    return Promise.reject(error);
  }
);

type Request = { url: string; method: string; data?: object; config?: AxiosRequestConfig & { isNoHint?: boolean }; reTry?: boolean };
const request = <T>({ url, method, data = {}, config = { isNoHint: false }, reTry = false }: Request): Promise<T> => {
  const body = method.toUpperCase() === 'GET' ? { params: data } : { data };
  return new Promise<T>((resolve, reject) => {
    const { isNoHint, ...rest } = config;
    return service({ url, method, ...body, ...rest })
      .then((response) => {
        if (response) resolve(response?.data);
      })
      .catch((error) => {
        const { data: responseData, status } = error.response || {};
        const { description } = responseData || {};

        if (status === 401) {
          if (reTry) {
            UTILS.message.error(description);
            return reject(error.response);
          }
          baseConfig
            .refresh()
            .then((result) => {
              if (!result) {
                UTILS.message.error(description || 'token无效或已过期');
                return reject(error);
              }
              baseConfig.token = result?.access_token;
              UTILS.SessionStorage.set('token', result?.access_token);
              request({ url, method, data, config, reTry: true })
                .then((_result: any) => resolve(_result))
                .catch((_error: any) => reject(_error));
            })
            .catch(() => {
              UTILS.message.error(description);
              reject(error.response);
            });
        } else if (isNoHint) {
          resolve(responseData);
        } else {
          if (description) UTILS.message.error(description || 'Error');
          reject(error.response);
        }
      });
  });
};

const requestGet = <T>(url: string, data?: object, config = {}): Promise<T> => request({ url, data, config, method: 'GET' });
const requestPost = <T>(url: string, data?: object, config = {}): Promise<T> => request({ url, data, config, method: 'POST' });
const requestPut = <T>(url: string, data?: object, config = {}): Promise<T> => request({ url, data, config, method: 'PUT' });
const requestDel = <T>(url: string, data?: object, config = {}): Promise<T> => request({ url, data, config, method: 'DELETE' });

const Request = {
  get: requestGet,
  post: requestPost,
  put: requestPut,
  delete: requestDel,
  cancels: cancelSources,
};

export default Request;
