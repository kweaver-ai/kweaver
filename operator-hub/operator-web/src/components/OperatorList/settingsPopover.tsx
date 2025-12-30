import React, { useState } from 'react';
import { Popover, InputNumber, Form, Radio } from 'antd';
import './settings-popover.less';
import { StreamModeType } from './types';

interface ModelSettingsPopoverProps {
  onSettingsChange: (settings: any) => void;
  initialSettings?: any;
  children: React.ReactNode;
}

const ModelSettingsPopover: React.FC<ModelSettingsPopoverProps> = ({ onSettingsChange, children }) => {
  const [form] = Form.useForm();
  const [stream, setStream] = useState<boolean>(false);
  const initialValues = {
    stream: false,
    mode: StreamModeType.SSE,
  };

  const changeStream = (e: any) => {
    const { value } = e.target;
    setStream(value);
  };

  const content = (
    <div className="model-settings-content">
      <Form
        form={form}
        layout="vertical"
        className="settings-form"
        initialValues={initialValues}
        onFieldsChange={() => {
          onSettingsChange(form.getFieldsValue());
        }}
      >
        <div className="settings-title">运行设置</div>
        <Form.Item style={{ marginBottom: 10 }} label="超时时间（s）" name="timeout">
          <InputNumber placeholder="请输入" min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="输出方式" name="stream" style={{ marginBottom: '0' }}>
          <Radio.Group onChange={changeStream}>
            <Radio value={false}>普通输出</Radio>
            <Radio value={true} style={{ width: '100%', marginTop: '6px' }}>
              流式输出
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="mode" style={{ paddingLeft: '22px' }} hidden={stream === false}>
          <Radio.Group>
            <Radio value={StreamModeType.SSE}>SSE</Radio>
            <Radio value={StreamModeType.HTTP}>HTTP</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="top" overlayClassName="model-settings-popover">
      {children}
    </Popover>
  );
};

export default ModelSettingsPopover;
