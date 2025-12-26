import { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import API from '@/services/api';
import { server_sent_events } from '@/services/server_sent_events';
import { Title, IconFont } from '@/common';

import Variables from './Variables';
import Result from './Result';

type VariableAndRunProps = {
  variables: string[];
  selectedModel: any;
  selectedPrompt: any;
};

const replaceTemplateVariables = (template: any, variables: any) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
};

const LlmConfig = (props: VariableAndRunProps) => {
  const { message } = HOOKS.useGlobalContext();
  const forceUpdate = HOOKS.useForceUpdate();
  const { variables, selectedModel, selectedPrompt } = props;
  const runConfigRef = useRef(null);
  const { height: runConfigHeight } = HOOKS.useSize(runConfigRef);

  const resultDivRef = useRef<any>(null);

  const [fileData, setFileData] = useState([]); // 上传的文件列表
  const [showConfig, setShowConfig] = useState(true); // 是否展示变量
  const [variablesData, setVariablesData] = useState<any>({}); // 变量
  const [responseFormat, setResponseFormat] = useState('text');

  const timeRef = useRef<any>(null);
  const fetching = useRef<boolean>(false); // 请求是否连接中
  const errorData = useRef<any>(null); // 错误数据
  const contentRef = useRef<any>(''); // 展示内容
  const reasoningContentRef = useRef<any>(''); // 思考过程内容
  const timeAndTokenRef = useRef<any>({}); // 花费时间和tokens
  const abortControllerRef = useRef<any>(null); // 请求截断句柄

  useEffect(() => {
    initData();
    setFileData([]);
    setVariablesData({});
  }, [selectedModel?.model_id]);

  const initData = () => {
    timeRef.current = null;
    fetching.current = false;
    errorData.current = null;
    contentRef.current = '';
    reasoningContentRef.current = '';
    timeAndTokenRef.current = {};
  };

  /** 文件url变化 */
  const onChangeFile = (data: any) => {
    setFileData(data);
  };
  /** 变量变化 */
  const onChangeVariables = (key: string, value: string) => {
    setVariablesData({ ...variablesData, [key]: value });
  };

  const onChangeFormat = (value: string) => {
    setResponseFormat(value);
  };

  /** 清空 */
  const onClear = () => {
    setFileData([]);
    setVariablesData({});
  };

  /** 滚动到底部 */
  const scrollToBottom = () => {
    if (!fetching) return;
    const currentScroll = resultDivRef.current.scrollTop;
    const clientHeight = resultDivRef.current.clientHeight;
    const scrollHeight = resultDivRef.current.scrollHeight;
    if (scrollHeight > clientHeight && scrollHeight - (clientHeight + currentScroll) < 60) resultDivRef.current.scrollTo(0, scrollHeight);
  };

  /** 运行 */
  const onRun = async () => {
    initData();

    const model_para = _.keyBy(selectedModel.model_para, 'key');
    const body = {
      model: selectedModel.model_name,
      temperature: model_para.temperature.value,
      top_p: model_para.top_p.value,
      max_tokens: model_para.max_tokens.value,
      top_k: model_para.top_k.value,
      presence_penalty: model_para.presence_penalty.value,
      frequency_penalty: model_para.frequency_penalty.value,
      stream: true,
      messages: [{ role: 'user', content: replaceTemplateVariables(selectedPrompt.messages, variablesData) }],
      response_format: {
        type: responseFormat,
      },
    };
    if (selectedModel?.model_type === 'vu') {
      const messageFileData: any = [];
      _.forEach(fileData, (item: any) => {
        if (item?.__fileType === 'image') {
          messageFileData.push({ type: 'image_url', image_url: { url: item?.__fileUrl } });
        }
        if (item?.__fileType === 'video') {
          messageFileData.push({ type: 'video_url', video_url: { url: item?.__fileUrl } });
        }
      });
      body.messages = [
        {
          role: 'user',
          content: [...messageFileData, { type: 'text', text: replaceTemplateVariables(selectedPrompt.messages, variablesData) }],
        },
      ];
    }

    fetching.current = true;
    forceUpdate();
    // 流式
    timeRef.current = Date.now();
    await server_sent_events(API.llmCompletions, { method: 'POST', body }, abortControllerRef, {
      async onmessage(event: any) {
        if (event.data?.includes('choices')) {
          const data = JSON.parse(event.data);
          const choice = data?.choices?.[0];
          const usage = data?.usage;
          if (_.isEmpty(usage)) {
            const message = choice?.delta?.content || '';
            if (responseFormat === 'json_object' && !contentRef.current) contentRef.current = '```json\n';
            contentRef.current = contentRef.current + message;
            const reasoning = choice?.delta?.reasoning_content || '';
            reasoningContentRef.current = reasoningContentRef.current + reasoning;
            scrollToBottom();
          } else {
            if (responseFormat === 'json_object') {
              if (!contentRef.current.endsWith('```')) contentRef.current = `${contentRef.current}\n\`\`\``;
            }
            timeAndTokenRef.current = { ...timeAndTokenRef.current, tokens: usage?.total_tokens };
          }
        }
        if (event.data?.includes('--error--')) {
          fetching.current = false;
          const data = JSON.parse(event.data.split('--error--')[1]);
          errorData.current = data;
        }
        forceUpdate();
      },
      onclose(err: any) {
        console.log('结束了', err);
        fetching.current = false;
        const timeEnd = Date.now();
        timeAndTokenRef.current = { ...timeAndTokenRef.current, time: timeEnd - timeRef.current };
        forceUpdate();
      },
      onerror(err: any) {
        console.log('出错了', err);
        const errorData = JSON.parse(err.message);
        message.error(errorData?.description || err.message);
        fetching.current = false;
        const timeEnd = Date.now();
        timeAndTokenRef.current = { ...timeAndTokenRef.current, time: timeEnd - timeRef.current };
        forceUpdate();
      },
    });
  };

  /** 中断 */
  const onInterrupt = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    fetching.current = false;
    const timeEnd = Date.now();
    timeAndTokenRef.current = { ...timeAndTokenRef.current, time: timeEnd - timeRef.current };
    forceUpdate();
  };

  return (
    <div style={{ height: 'calc(100% - 32px - 12px - 32px - 20px)' }}>
      <div ref={runConfigRef} className='g-p-3 g-mt-5 g-border g-border-radius'>
        <Title noHeight>
          <IconFont
            className={classNames('g-mr-2 g-pointer', { 'g-rotate-90': showConfig, 'g-rotate-0': !showConfig })}
            type='icon-dip-right'
            onClick={() => setShowConfig(!showConfig)}
          />
          {intl.get('Prompt.debug.userInput')}
        </Title>
        <Variables
          fileData={fileData}
          showConfig={showConfig}
          variables={variables}
          variablesData={variablesData}
          selectedModel={selectedModel}
          fetching={fetching}
          onRun={onRun}
          onClear={onClear}
          onChangeFile={onChangeFile}
          onChangeVariables={onChangeVariables}
        />
      </div>
      <div className='g-mt-6' style={{ height: `calc(100% - 24px - ${runConfigHeight}px)` }}>
        <Result
          resultDivRef={resultDivRef}
          fetching={fetching}
          errorData={errorData}
          contentRef={contentRef}
          responseFormat={responseFormat}
          reasoningContentRef={reasoningContentRef}
          timeAndTokenRef={timeAndTokenRef}
          onInterrupt={onInterrupt}
          onChangeFormat={onChangeFormat}
        />
      </div>
    </div>
  );
};

export default LlmConfig;
