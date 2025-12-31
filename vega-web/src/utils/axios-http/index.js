import axios from 'axios';
import Cookie from 'js-cookie';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import frameworkProps from './frameworkProps';
import resolveError from './resolveError';

const language = localStorage.getItem('lang') === 'en-us' ? 'en-us' : 'zh-cn';
const copyLanguage = language === 'zh-cn' ? 'zh_cn' : language === 'en-us' ? 'en_us' : '';

// 请求列表
const requestList = [];

// 取消列表
const { CancelToken } = axios;

let sources = {};

const service = axios.create({
  baseURL: '/', // 挂载在 process 下的环境变量
  timeout: 120000, // 超时取消请求
});

// 请求拦截处理
// let needError = true; // 默认全部需要走拦截器

service.interceptors.request.use(
  (config) => {
    // 由于对kibana的请求，为了防止xsrf攻击需要在请求头部增加kbn-xsrf字段才能正常请求 @zheng.guolei 2019/3/28 3.0.8
    config.headers['kbn-xsrf'] = 'anything';
    config.headers.language = copyLanguage; // 在请求头中添加language字段
    config.headers['Accept-Language'] = language; // 重置Accept-Language 字段
    config.headers['x-language'] = language;

    // TODO 临时认证 工作台联调去掉 start
    const authorization = localStorage.getItem('authorization');

    if (authorization) config.headers.Authorization = authorization;
    const oauth2_token = Cookie.get('studio.oauth2_token');
    if (oauth2_token) config.headers.Authorization = `Bearer ${oauth2_token}`;
    // config.headers.Authorization = 'Bearer ory_at_UagRbaFi6tQu2MfxgpM0OK_jSZKjPXuWoTevnXwuIIQ.9hb0uhPOrsY2GB6kNnkjgpuHi8cDiHqzKCa69a4QM2A';

    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    // 请求处理
    if (requestList.includes(request) && !/.*?\/manager\/loggroup\/.*?\/tree\?.*/.test(config.url)) {
      // 重复
      sources[request]('cancleRepeatRequest'); // 取消重复请求
    } else {
      // 不重复
      requestList.push(request);
    }

    config.cancelToken = new CancelToken((cancel) => {
      sources[request] = cancel;
    });

    return config;
  },
  (error) => {
    // 异常处理
    return Promise.reject(error);
  }
);

// 用于存储待重试的请求
let pendingRequests = [];
let isRefreshing = false;

// 响应拦截处理
service.interceptors.response.use(
  (response) => {
    const request = JSON.stringify(response.config.url) + JSON.stringify(response.config.data);

    // 获取响应后，请求列表里面去除这个值
    requestList.splice(
      requestList.findIndex((item) => item === request),
      1
    );

    // 错误 207 (只有删除部分错误才有)
    const errorStatus207 = response.status === 207 && response.data;

    if (errorStatus207) {
      const curResponse = {
        data: {
          code: '207',
          error_code: '207',
          description: '',
        },
      };

      return resolveError(curResponse);
    }

    // 错误 202
    const errorStatus202 = response.status === 202 && response.data && response.data.code;

    // 错误 success 为 0
    const success0 = response.data && response.data.success === 0 && response.data.code;

    // 错误码处理
    if (errorStatus202 || success0) {
      const errMsg = response.data.message; // message
      const needMsg = response.data.needMsg || false; // 异常判断字段，类型为Boolean，为false时按原方式处理,为true时抛出message

      // 不需要显示message的错误码
      if (!response?.config?.isNoHint) {
        if (!needMsg) {
          arNotification.error('');
        } else {
          arNotification.error(errMsg);
        }
      }
    }

    return response?.data?.error_code ? resolveError(response) : response;
  },
  (error) => {
    // 元数据视图 和 统一数据源 接口错误提示单独处理
    if (
      error.response.config.url.includes('/api/vega-logic-view') ||
      error.response.config.url.includes('/api/vega-data-source') ||
      error.response.config.url.includes('/api/dp-data-source')
    ) {
      arNotification.error(error.response.data.description);

      return Promise.reject(error);
    }
    // 没有权限返回登录也
    if (error.response.status === 401) {
      // 检测到 401 错误
      const originalRequest = error.response.config;

      if (!isRefreshing) {
        // 如果没有正在刷新 Token，开始刷新 Token
        isRefreshing = true;
        // jwt-token过期使用工作站的刷新token 接口
        frameworkProps.data.token
          .refreshOauth2Token()
          .then((token) => {
            // 重试所有待处理的请求
            pendingRequests.forEach((req) => {
              req(service);
            });
            pendingRequests = [];

            // 重试原请求
            originalRequest.headers.Authorization = `Bearer ${token}`;

            return service(originalRequest);
          })
          .catch(() => {
            // 刷新 Token 失败，清空 Token 并跳转到登录页面
            frameworkProps.data.token.onTokenExpired();
          })
          .finally(() => {
            isRefreshing = false;
          });
      } else {
        // 如果正在刷新 Token，将当前请求加入队列
        return new Promise((resolve) => {
          pendingRequests.push(() => {
            resolve(service(originalRequest));
          });
        });
      }

      return;
    }

    // 取消请求
    if (axios.isCancel(error)) {
      requestList.length = 0;
    }
    const request = JSON.stringify(error.response.config.url) + JSON.stringify(error.response.config.data);

    // 获取响应后，请求列表里面去除这个值
    requestList.splice(
      requestList.findIndex((item) => item === request),
      1
    );

    // 数据流格式报错， 转换JSON返回错误提示
    if (error?.response?.config?.responseType === 'blob') {
      const reader = new FileReader();

      reader.readAsText(error?.response?.data, 'utf-8'); // 读取blob数据为文本
      reader.onload = function (e) {
        try {
          // 将读取到的文本解析为JSON对象
          const jsonData = JSON.parse(e.target.result);
          // 在这里使用解析后的JSON数据
          const newResponse = {
            ...error.response,
            data: jsonData,
          };

          return resolveError(newResponse);
        } catch (error) {
          // 处理解析JSON时可能出现的错误
          console.error('Error parsing JSON:', error);

          return error.message.includes('timeout') ? arNotification.error('') : arNotification.error(error.message);
        }
      };

      return Promise.reject(error);
    }

    if (error?.response?.data?.error_code) {
      return resolveError(error.response);
    }

    // 取消重复请求，不提示错误信息
    if (error?.message !== 'cancleRepeatRequest' && error?.message !== '取消前页面请求') {
      error.message.includes('timeout') ? arNotification.error('') : arNotification.error(error.message);
    }

    return Promise.reject(error);
  }
);

// 取消全部等待中请求
const clearAllPendingRequest = () => {
  Object.keys(sources).forEach((item) => {
    sources[item]('取消前页面请求');
  });
  sources = {};
};

// axios 对请求的处理
export const request = (url, params, config, method, type) => {
  return new Promise((resolve, reject) => {
    // get delete合并param和config
    const paramsObj = ['get', 'delete'].includes(method) ? { ...params, ...config } : params;

    service[method](url, paramsObj, Object.assign({}, config))
      .then(
        (response) => {
          type === 'downLoad' ? resolve(response) : resolve(response?.data);
        },
        (err) => {
          if (err.Cancel) {
            // message.error(err);
          } else {
            requestList.length = 0;

            // 需要抛出来，不然promise.all捕捉不了错误
            reject();
          }
        }
      )
      .catch((err) => {
        reject(err);
      });
  });
};

// get方法
export const axiosGet = (url, params, config = {}, type = '') => {
  return request(url, params, config, 'get', type);
};

// get body转义
export const axiosGetEncode = (url, body, params, config = {}) => {
  const key = Object.keys(body);
  let str = '';

  key.map((value) => {
    if (!body[value] && body[value] !== 0) {
      return;
    }
    str += `${value}=${encodeURIComponent(body[value])}&`;

    return value;
  });

  return request(`${url}?${str.slice(0, str.length - 1)}`, params, config, 'get');
};

// delete 方法
export const axiosDelete = (url, params, config = {}) => {
  return request(url, params, config, 'delete');
};

// post方法
export const axiosPost = (url, params, config = {}, type = '') => {
  return request(url, params, config, 'post', type);
};

export const axiosPostOverridePut = (url, params, config = {}, type = '') => {
  return request(url, params, _.merge(config, { headers: { 'x-http-method-override': 'PUT' } }), 'post', type);
};

export const axiosPostOverrideGet = (url, params, config = {}, type = '') => {
  return request(url, params, _.merge(config, { headers: { 'x-http-method-override': 'GET' } }), 'post', type);
};

export const axiosPostOverrideDelete = (url, params, config = {}, type = '') => {
  return request(url, params, _.merge(config, { headers: { 'x-http-method-override': 'DELETE' } }), 'post', type);
};

export const axiosPostOverridePost = (url, params, config = {}, type = '') => {
  return request(url, params, _.merge(config, { headers: { 'x-http-method-override': 'POST' } }), 'post', type);
};

// put方法
export const axiosPut = (url, params, config = {}) => {
  return request(url, params, config, 'put');
};

// 通用请求方法
export const axiosRequest = async (params) => {
  const { type = 'get', url, data = {} } = params;

  if (!url) return;

  const urlType = type.toLocaleLowerCase();

  if (urlType === 'post') return await axiosPost(url, data);

  if (urlType === 'get') return await axiosGetEncode(url, data);
};

// fetch请求方法
export const fetchRequest = (url, config) => {
  const { headers = {}, ...others } = config;

  headers.language = copyLanguage; // 在请求头中添加language字段
  headers['Accept-Language'] = language; // 重置Accept-Language 字段
  headers['x-language'] = language;

  // if (currentUserApp) {
  //     const { userId, token } = JSON.parse(currentUserApp);

  //     headers.user = userId;
  //     headers.token = token;
  //     headers.common = { userId, token };
  // }

  return fetch(url, { headers, ...others });
};

export default {
  sources,
  clearAllPendingRequest,
  axiosGet,
  axiosGetEncode,
  axiosDelete,
  axiosPost,
  axiosPut,
  axiosRequest,
  axiosPostOverridePut,
  axiosPostOverrideGet,
  axiosPostOverrideDelete,
  axiosPostOverridePost,
  fetchRequest,
};
