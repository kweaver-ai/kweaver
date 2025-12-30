import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Typography, message } from 'antd';
import Form from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import ReactJson from 'react-json-view';
import './style.less';
import { debugMcp, debugTool, operatorDebug } from '@/apis/agent-operator-integration';
import { ControlOutlined, SettingOutlined } from '@ant-design/icons';
import { OperatorTypeEnum, StreamModeType } from '../OperatorList/types';
import { generateJsonSchema } from '@/utils/operator';
import { useMicroWidgetProps } from '@/hooks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ModelSettingsPopover from './settingsPopover';
import { getFormConfig } from './utils';
import JsonTextAreaWidget from './JsonTextAreaWidget';

const { Text } = Typography;

export default function DebugResult({ selectedTool, type }: any) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({});
  const [testResult, setTestResult] = useState<any>();
  const [schema, setSchema] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const box_id = searchParams.get('box_id') || '';
  const microWidgetProps = useMicroWidgetProps();
  const abortController: any = useRef();
  const [debugSettings, setDebugSettings] = useState<any>({});
  const debugSettingsRef = useRef(debugSettings);
  const [dataFormatJson, setDataFormatJson] = useState(true);
  const [inputHasError, setInputHasError] = useState<Record<string, boolean>>({});

  const { schema: modifiedSchema, uiSchema: modifiedUiSchema } = useMemo(() => getFormConfig(schema), [schema]);
  // 自定义 widgets(解决object、array格式，但是未定义key和items的问题)
  const widgets = useMemo(
    () => ({
      JsonTextAreaWidget: (widgetProps: any) => (
        <JsonTextAreaWidget
          {...widgetProps}
          onValidationError={(error: Record<string, boolean>) => setInputHasError(prev => ({ ...prev, ...error }))}
        />
      ),
    }),
    [selectedTool]
  );

  useEffect(() => {
    setInputHasError({});
  }, [selectedTool]);

  // Schema初始化逻辑
  useEffect(() => {
    setFormData({});
    setTestResult(null);
    if (type === OperatorTypeEnum.MCP) {
      const generateSchema = {
        type: 'object',
        ...selectedTool?.inputSchema,
        // parameters: {
        //     properties: selectedTool?.inputSchema?.properties,
        // }
      };

      setSchema(generateSchema);
    } else {
      const jsonSchema = selectedTool?.metadata?.api_spec;
      const generateSchema = {
        type: 'object',
        properties: {
          ...generateJsonSchema(jsonSchema?.parameters),
          body:
            jsonSchema?.request_body?.content['application/json']?.schema ||
            jsonSchema?.request_body?.content['application/json'],
        },
        components: jsonSchema?.components,
      };

      setSchema(generateSchema);

      if (generateSchema?.properties?.header?.properties?.Authorization) {
        setFormData({
          header: {
            Authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}`,
          },
        });
      }
    }
  }, [selectedTool]); // 依赖jsonSchema变化

  const normalModeRun = async () => {
    setLoading(true);
    setTestResult(null);
    let mockResult: any = {};
    try {
      if (type === OperatorTypeEnum.MCP) {
        mockResult = await debugMcp(selectedTool?.mcp_id, selectedTool?.name, formData);
      } else if (type === OperatorTypeEnum.ToolBox) {
        mockResult = await debugTool(box_id, selectedTool?.tool_id, {
          ...formData,
          timeout: debugSettingsRef.current?.timeout,
        });
      } else {
        const { operator_id, version } = selectedTool;
        mockResult = await operatorDebug({ operator_id, version, ...formData });
      }

      setTestResult(mockResult);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  // 执行测试
  const handleRunTest = async () => {
    if (Object.values(inputHasError).some(Boolean)) {
      message.info('格式错误，请修正后重试');
      return;
    }

    const currentSettings = debugSettingsRef.current;
    if (currentSettings.stream && currentSettings.mode === StreamModeType.HTTP) {
      httpDebugRun();
    } else if (currentSettings.stream && currentSettings.mode === StreamModeType.SSE) {
      sseDebugRun();
    } else {
      normalModeRun();
    }
  };

  //解析SSE 流式传输
  const sseDebugRun = async () => {
    setTestResult(null);
    setLoading(true);

    const url = `/api/agent-operator-integration/v1/tool-box/${box_id}/tool/${selectedTool?.tool_id}/debug?stream=true&mode=sse`;
    const eventSource: any = await fetchEventSource(url, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}`,
        // "Content-Type": 'text/event-stream',
      },
      body: JSON.stringify({
        ...formData,
        timeout: debugSettingsRef.current?.timeout,
      }),
      signal: abortController.current?.signal,
      openWhenHidden: true,
      onmessage(ev) {
        setLoading(false);
        const message = ev.data.trim();
        if (message && message !== '[DONE]') {
          const parsedData = JSON.parse(message);
          setTestResult((prev: any) => [...(prev || []), parsedData]);
        }
      },
      onclose() {
        setLoading(false);
        abortController.current?.abort();
      },
      onerror(e) {
        setLoading(false);
        eventSource?.close();
        abortController.current?.abort();
        message.error('流式请求发生错误');
        throw new Error('Stop retrying');
      },
    });
  };

  //解析HTTP Streaming（HTTP 流式传输）
  const httpDebugRun = async () => {
    setLoading(true);
    setTestResult(null);

    const response = await fetch(
      `/api/agent-operator-integration/v1/tool-box/${box_id}/tool/${selectedTool?.tool_id}/debug?stream=true&mode=http`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}` },
        body: JSON.stringify({
          ...formData,
          timeout: debugSettingsRef.current?.timeout,
        }),
      }
    );
    const contentType = response.headers.get('Content-Type');

    if (contentType === 'application/json') {
      setLoading(false);
      setDataFormatJson(true);
      const result = await response.json();
      setTestResult(result);
      return;
    }
    if (contentType === 'text/html') {
      setLoading(false);
      setDataFormatJson(true);
      const result = await response.text();
      setTestResult({ body: result });
      return;
    }

    if (!response.body) {
      console.error('No readable stream found.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 自定义递归函数 processText
    const processText = async ({ done, value }: any) => {
      if (done) {
        setLoading(false);
        return;
      }

      // 解码数据块
      const decodedChunk = decoder.decode(value, { stream: true });
      // 解析 JSON 数据
      try {
        setLoading(false);
        const dataMessages = decodedChunk.split(/(?=data: )/).filter(Boolean);
        dataMessages.forEach(message => {
          const jsonString = message.trim().replace(/^data: /, '');
          if (jsonString && jsonString !== '[DONE]') {
            // 确保非空
            const parsedData = JSON.parse(jsonString);
            setTestResult((prev: any) => [...(prev || []), parsedData]);
          }
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        message.error('接收数据格式错误');
      }
      // 递归读取下一个数据块
      const nextChunk = await reader.read();
      processText(nextChunk);
    };

    // 开始读取第一个数据块
    const firstChunk = await reader.read();
    processText(firstChunk);
  };

  const handleModelSettingsUpdate = (settings: any) => {
    setTestResult(settings?.stream ? [] : null);
    setDebugSettings(settings);
    debugSettingsRef.current = settings;
    setDataFormatJson(!settings?.stream);
  };

  return selectedTool?.name ? (
    <div className="debug-result">
      <div className="space-y-4">
        <Text strong style={{ marginBottom: '10px', display: 'block' }}>
          <ControlOutlined /> 调试
        </Text>
        <div style={{ padding: '0 16px' }}>
          <Text strong className="block mb-2">
            输入
          </Text>
          <div className="bg-gray-50 p-4 rounded">
            <Form
              schema={modifiedSchema}
              uiSchema={modifiedUiSchema}
              formData={formData}
              widgets={widgets}
              onChange={({ formData }) => setFormData(formData)}
              validator={validator}
              showErrorList={false}
              className="rjsf-jsonschema"
            >
              <div style={{ margin: '16px 0' }}>
                <Button type="primary" variant="outlined" onClick={handleRunTest} loading={loading}>
                  运行
                </Button>
                {type === OperatorTypeEnum.ToolBox && (
                  <ModelSettingsPopover onSettingsChange={settings => handleModelSettingsUpdate(settings)}>
                    <SettingOutlined className="dip-c-subtext" style={{ fontSize: '16px', margin: '34px 0 0 12px' }} />
                  </ModelSettingsPopover>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* 测试结果区域 */}
      <div className="min-h-[300px]">
        <Text strong style={{ marginBottom: '10px', display: 'block' }}>
          调试结果
        </Text>
        {testResult ? (
          <>
            {dataFormatJson ? (
              <ReactJson
                src={testResult}
                theme="rjv-default"
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={true}
                // collapsed={1}
                name={false}
                collapsed={false}
                style={{
                  backgroundColor: '#fafafa',
                  padding: '16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            ) : (
              <div className="debug-result-stream">
                {testResult?.map((chunk: any, index: number) => (
                  <div key={index} className="debug-result-stream-data">
                    data: {JSON.stringify(chunk, null, 2)}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="debug-result-default">
            <Text>测试结果将显示在这里</Text>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
