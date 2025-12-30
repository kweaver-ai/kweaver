import axios from 'axios';
import { curry } from 'lodash';
import qs from 'query-string';
import { config, OptionsType, LangType, businessDomainHeaderKey } from './types';
import { handleError } from './error-handler';
import axiosInstance from './axios-instance';

function convertLangType(lang: LangType): string {
  const [first, second] = lang.split('-');
  return [first.toLowerCase(), second.toUpperCase()].join('-');
}

function getConfig(key: string) {
  return (config as any)[key];
}

function setConfig(obj: Record<string, any>) {
  Object.keys(obj).forEach((key: string) => {
    (config as any)[key] = obj[key];
  });
}

/* 获取请求头部 */
function getCommonHttpHeaders() {
  const language = convertLangType(config.lang);
  return {
    Pragma: 'no-cache',
    Authorization: 'Bearer ' + config.getToken(),
    Token: config.getToken(),
    'Cache-Control': 'no-cache',
    'X-Requested-With': 'XMLHttpRequest',
    'x-language': language,
    'Accept-Language': language,
    [businessDomainHeaderKey]: config.businessDomainID,
  };
}

function getHttpBaseUrl() {
  const { protocol, host, port, prefix } = config;
  return `${protocol}//${host}:${port}${prefix}`;
}

const createHttpRequest = curry((method: string, url: string, options: OptionsType | undefined) => {
  const fullUrl = `${getHttpBaseUrl()}${url}`;
  const { body, headers, timeout = 60000, params, returnFullResponse, ...restOptions } = options || {};

  const CancelToken = axios.CancelToken;
  let cancel: (message?: string) => void;

  const axiosConfig = {
    ...restOptions,
    method: method.toLowerCase(),
    url: fullUrl,
    data: body,
    params,
    paramsSerializer: (params: any) => qs.stringify(params),
    headers: {
      ...getCommonHttpHeaders(),
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json;charset=UTF-8' }), // formData无需设置 content-type，axios 会自动设置
      ...headers,
    },
    timeout,
    cancelToken: new CancelToken(c => {
      cancel = c;
    }),
    transformRequest: [
      (data: any) => {
        if (data) {
          if (data instanceof FormData || typeof data === 'string') return data; // 不转换 FormData；不转换字符串

          try {
            return JSON.stringify(data);
          } catch {
            return data;
          }
        }
      },
    ],
    transformResponse: [
      (data: any) => {
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
      },
    ],
    validateStatus: (status: number) => status < 400,
  };

  const promise: any = new Promise(async (resolve, reject) => {
    try {
      let response;

      switch (method.toLowerCase()) {
        case 'get':
        case 'post':
        case 'put':
        case 'patch':
        case 'delete':
          response = await axiosInstance.request(axiosConfig);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (returnFullResponse) {
        // 有些场景，除了data还需要其它返回信息
        resolve(response);
      } else {
        resolve(response.data);
      }
    } catch (error) {
      handleError({
        error,
        url,
        reject,
        isOffline: !navigator.onLine,
      });
    }
  });

  promise.abort = () => cancel('CANCEL');
  return promise;
});

/**
 * 带有缓存功能的http
 */
const cacheableHttpFn = () => {
  const caches: Record<string, any> = {};

  return (method: string, url: string, options?: OptionsType & { expires?: number }) => {
    const { body, params, expires = -1 } = options || {};

    // 用 url + params + body 当做 key，来存储缓存
    const queryStr = qs.stringify(params || {});
    const key = `${method}:${url}${queryStr ? `?${queryStr}` : ''}${JSON.stringify(body || {})}`;

    if (!caches[key]) {
      caches[key] = createHttpRequest(method, url, options);

      if (expires !== -1) {
        setTimeout(() => {
          // 清除缓存
          delete caches[key];
        }, expires);
      }
    }

    return caches[key];
  };
};

const cacheableHttp = cacheableHttpFn();

export { createHttpRequest, cacheableHttp, setConfig, getConfig, getCommonHttpHeaders, getHttpBaseUrl };
