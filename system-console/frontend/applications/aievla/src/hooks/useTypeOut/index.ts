import { useEffect, useRef } from 'react';
import useLatestState from '@/hooks/useLatestState';
import useDeepCompareMemo from '@/hooks/useDeepCompareMemo';
import streamingOutHttp, { StreamingOutServerType } from '@/utils/axios-http/streamingOutHttp';
import { isJSONString } from '@/utils/handleFunction';

export interface UseTypeOutConfig extends Omit<StreamingOutServerType, 'body'> {
  timeout?: number; // 字符之间的延迟输出间隔，默认 10ms
  errorCode?: string | string[]; // 流式输出过程中的错误代码
}

export type UseTypeOutResponse = {
  generating: boolean; // 是否正在生成
  pending: boolean; // 请求是否在响应中
  content: string; // 输出文本
};

type UseTypeOutStartFunc = (body: any) => void;
type UseTypeOutStopFunc = () => void;

type UseTypeOutState = [UseTypeOutResponse, UseTypeOutStartFunc, UseTypeOutStopFunc];

type TypeOutFunc = (initialState: UseTypeOutConfig) => UseTypeOutState;

/**
 * 对话框流式输出文本hook
 */
const useTypeOut: TypeOutFunc = config => {
  const { url, timeout = 10, errorCode = [], onOpen, onError, onClose, onMessage } = config;
  const [content, setContent, getValue, resetValue] = useLatestState('');
  const [streamStatus, setStreamStatus, getStreamStatus] = useLatestState({
    streamReqEnd: true, // 流式请求是否结束
    generating: false, // 是否正在生成
    pending: false, // 请求是否在响应中
    isTyping: false, // 是否正在打字
  });
  const typingQueueRef = useRef<string[]>([]); // 暂时存储流式返回文本的队列
  const controllerRef = useRef<AbortController>();

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const typeNextCharacter = () => {
    if (typingQueueRef.current.length === 0) {
      // 队列清空，不能代表结束，可能是中间请求过程流式接口响应慢
      setStreamStatus(prevState => ({
        ...prevState,
        isTyping: false,
      }));
      if (getStreamStatus().streamReqEnd) {
        setStreamStatus(prevState => ({
          ...prevState,
          generating: false,
        }));
      }
      return;
    }

    const nextChar = typingQueueRef.current.shift();
    setContent(prevState => `${prevState}${nextChar}`);

    setTimeout(() => {
      typeNextCharacter();
    }, timeout ?? 10);
  };

  const handleMessage = (e: any) => {
    if (isJSONString(e.data)) {
      const res = JSON.parse(e.data);
      const errorCodes = Array.isArray(errorCode) ? errorCode : [errorCode];
      if (errorCodes.includes(res.code)) {
        if (isJSONString(res.description)) {
          const { message } = JSON.parse(res.description);
          onError?.(message);
        } else {
          onError?.(res.description);
        }
        setStreamStatus(prevState => ({
          ...prevState,
          streamReqEnd: true,
          loading: false,
          pending: false,
        }));
        return;
      }
      const finishReason = res.choices[0].finish_reason;
      if (finishReason !== 'stop') {
        const text = res.choices[0].delta.content;
        if (text) {
          // 将新内容加入打字队列
          typingQueueRef.current.push(...text.split(''));
          // 如果当前没有在打字，开始打字
          if (!getStreamStatus().isTyping) {
            setStreamStatus(prevState => ({
              ...prevState,
              isTyping: true,
            }));
            typeNextCharacter();
          }
        }
      }
    }
  };

  const start = (body: any) => {
    typingQueueRef.current = [];
    setStreamStatus(prevState => ({
      ...prevState,
      streamReqEnd: false,
      generating: true,
      pending: true,
      isTyping: false,
    }));
    streamingOutHttp({
      url,
      body,
      onOpen: controller => {
        controllerRef.current = controller;
        onOpen?.(controller);
      },
      onMessage: event => {
        setStreamStatus(prevState => ({
          ...prevState,
          pending: false,
        }));
        handleMessage(event);
        onMessage?.(event);
      },
      onClose: () => {
        setStreamStatus(prevState => ({
          ...prevState,
          streamReqEnd: true,
        }));
        if (!getStreamStatus().isTyping) {
          setStreamStatus(prevState => ({
            ...prevState,
            generating: false,
          }));
        }
        onClose?.();
      },
      onError: (errorInfo: any) => {
        setStreamStatus(prevState => ({
          ...prevState,
          streamReqEnd: true,
          generating: false,
          pending: false,
        }));
        onError?.(errorInfo);
      },
    });
  };

  const stop = () => {
    controllerRef.current?.abort();
    setStreamStatus(prevState => ({
      ...prevState,
      streamReqEnd: true,
      generating: false,
      pending: false,
    }));
  };

  const response: UseTypeOutResponse = useDeepCompareMemo(() => {
    return {
      content: content,
      generating: streamStatus.generating,
      pending: streamStatus.pending,
    };
  }, [streamStatus, content]);

  return [response, start, stop];
};
export default useTypeOut;
