import { adCookie, isJSONString, sessionStore } from '@/utils/handleFunction';
import _ from 'lodash';
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * 设置请求头
 */
const requestInterceptors = (config: any = {}) => {
  const anyDataLang = adCookie.get('anyDataLang');
  const sessionidCookie = adCookie.get('sessionid') || '';
  const sessionidStorage = sessionStore.get('sessionid') || '';
  const uuid = adCookie.get('uuid');
  const token = adCookie.get('token');
  const sourceType = adCookie.get('source_type') || 0;

  if (sessionidCookie && sessionidCookie !== sessionidStorage) {
    sessionStore.set('sessionid', sessionidCookie);
    window.location.reload();
  }
  if (!config.headers) {
    config.headers = {};
  }
  if (token && config.url !== '/api/rbac/v1/login') {
    config.headers.token = token;
  }
  if (uuid) {
    config.headers.uuid = uuid;
  }
  if (sessionidCookie) {
    config.headers.sessionid = sessionidCookie;
  }
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
  }
  config.headers['Accept-Language'] = anyDataLang === 'en-US' ? 'en-US' : 'zh-CN';
  config.headers['source-type'] = sourceType;
  config.headers['Connection'] = 'keep-alive';
  config.headers['responseType'] = 'text/event-stream';
  // 临时联调参数
  // config.headers['userid'] = '44554144-5dd8-11ef-9f40-923eb954c1e0';

  return config;
};

export type StreamingOutServerType = {
  url: string; // 请求的URL
  method?: 'POST' | 'GET'; // 请求方式 默认post方式
  body: any; // 请求的参数
  onMessage?: (event: EventSourceMessage) => void; //接收一次数据段时回调，因为是流式返回，所以这个回调会被调用多次
  onClose?: () => void; //正常结束的回调
  onError?: (error: any) => void; // 各种错误最终都会走这个回调
  onOpen?: (controller: AbortController) => void; // 建立连接的时候
};

/** 流式http请求 （所有流式请求统一使用这个发起） */
const streamingOutHttp = (param: StreamingOutServerType): AbortController => {
  const { url, body, method = 'POST', onMessage, onError, onClose, onOpen } = param;
  const controller = new AbortController();
  const signal = controller.signal;
  let errorInfo = {};
  fetchEventSource(url, {
    ...requestInterceptors({
      url,
      method,
      signal,
      body: JSON.stringify(body),
    }),
    openWhenHidden: true,
    // 建立连接的回调
    async onopen(response: Response) {
      // console.log(response, 'onopen - response');
      if (!response.ok) {
        if (response.status === 403) {
          // 说明token过期， 要自动续
          streamingOutHttp(param);
          return;
        }
        // 说明建立连接异常
        const reader = response.body?.getReader();
        const textDecoder = new TextDecoder('utf-8');
        const chunk = await reader?.read();
        const valueError = textDecoder.decode(chunk?.value);
        const description = typeof valueError === 'string' ? (isJSONString(valueError) ? JSON.parse(valueError) : valueError) : valueError;
        errorInfo = { error: description, code: response.status };
        throw new Error(valueError);
      }
      onOpen?.(controller);
    },
    //接收一次数据段时回调，因为是流式返回，所以这个回调会被调用多次
    onmessage: event => {
      onMessage?.(event);
    },
    //正常结束的回调
    onclose: () => {
      controller.abort();
      onClose?.();
    },
    //连接出现异常回调
    onerror: error => {
      controller.abort();
      onError?.(errorInfo);
      if (!_.isEmpty(error)) {
        throw new Error(error);
      }
    },
  });
  return controller;
};

export default streamingOutHttp;
