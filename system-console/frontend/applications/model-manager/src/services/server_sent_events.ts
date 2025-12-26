import { fetchEventSource } from '@microsoft/fetch-event-source';

import UTILS from '@/utils';
import { baseConfig } from './request';

const server_sent_events = async (url: any, data: any, abortControllerRef: any, config: any, reTry = false) => {
  const { _init, ...otherConfig } = config;
  const controller = new AbortController();
  abortControllerRef.current = controller;
  const signal = controller.signal;
  let finish = false;
  // get请求可用 EventSource，post 可用 fetchEventSource 或 fetch
  // 相对于 fetch 来讲，在 onmessage 中获取到的数据不需要再进行解析
  await fetchEventSource(url, {
    url,
    signal,
    method: data?.method,
    headers: {
      Connection: 'keep-alive',
      // Authorization: `Bearer ${baseConfig.token}`,
      Authorization: `Bearer ${UTILS.SessionStorage.get('token')}`,
      'Content-Type': 'application/json',
      'Accept-Language': baseConfig.lang === 'en-us' ? 'en-us' : 'zh-cn',
    },
    body: JSON.stringify(data?.body),
    openWhenHidden: true,
    async onopen(response: any) {
      if (finish) return;
      if (response.ok) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('连接成功建立', response);
          _init?.();
        } else {
          throw new Error('未能建立SSE连接');
        }
      } else {
        if (response?.status === 401) {
          if (reTry) return UTILS.message.error('token无效或已过期');
          baseConfig
            .refresh()
            .then(result => {
              if (!result) return UTILS.message.error('token无效或已过期');
              baseConfig.token = result?.access_token;
              UTILS.SessionStorage.set('token', result?.access_token);
              server_sent_events(url, data, abortControllerRef, config, true);
            })
            .catch(() => {
              UTILS.message.error('token无效或已过期');
            });
          return;
        }
        finish = true;
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
    },
    ...otherConfig,
  });
};

export { server_sent_events };
