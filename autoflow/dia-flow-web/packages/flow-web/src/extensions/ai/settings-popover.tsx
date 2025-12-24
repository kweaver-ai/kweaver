import React, { useState } from 'react';
import { Popover, InputNumber, Form, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import './settings-popover.less';

interface ModelSettingsPopoverProps {
  onSettingsChange: (settings: ModelSettings) => void;
  initialSettings?: any;
  children: React.ReactNode;
  isEditable?: boolean;
  t?: any;
}

export interface ModelSettings {
  temperature: number;
  top_p: number;
  max_tokens: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
}

const ModelSettingsPopover: React.FC<ModelSettingsPopoverProps> = ({
  onSettingsChange,
  initialSettings,
  children,
  isEditable = true,
  t,
}) => {
  const [settings, setSettings] = useState<ModelSettings>(initialSettings);
  const [form] = Form.useForm();

  const handleChange = (field: keyof ModelSettings, value: number | null) => {
    if (value !== null && isEditable) {
      const newSettings = { ...settings, [field]: value };
      setSettings(newSettings);
      onSettingsChange(newSettings);
    }
  };

  const content = (
    <div className="model-settings-content">
      <Form form={form} layout="vertical" className="settings-form">
        <div className="settings-title">{t('configurationParameters')}</div>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('temperatureParameter')}
              <Tooltip title={t('temperatureDescription')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.temperature}
            onChange={value => handleChange('temperature', value)}
            style={{ width: '100%' }}
            min={0}
            max={2}
            step={0.1}
            disabled={!isEditable}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('topPSampling')}
              <Tooltip title={t('topPDescription')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.top_p}
            onChange={value => handleChange('top_p', value)}
            style={{ width: '100%' }}
            min={0}
            max={1}
            step={0.1}
            disabled={!isEditable}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('maxTokensLimit')}
              <Tooltip title={t('maxTokensDescription')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.max_tokens}
            onChange={value => handleChange('max_tokens', value)}
            style={{ width: '100%' }}
            step={1}
            min={10}
            max={32000}
            disabled={!isEditable}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('topKSampling')}
              <Tooltip title={t('topKDescription')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.top_k}
            onChange={value => handleChange('top_k', value)}
            style={{ width: '100%' }}
            step={1}
            min={1}
            max={1000}
            disabled={!isEditable}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('topicFreshnessPresencePenalty')}
              <Tooltip title={t('preventRepetitionPrompt')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.presence_penalty}
            onChange={value => handleChange('presence_penalty', value)}
            style={{ width: '100%' }}
            step={0.1}
            min={-2}
            max={2}
            disabled={!isEditable}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: 10 }}
          label={
            <div className="param-label">
              {t('frequencyPenalty')}
              <Tooltip title={t('reduceRepetition')}>
                <QuestionCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          }
        >
          <InputNumber
            value={settings.frequency_penalty}
            onChange={value => handleChange('frequency_penalty', value)}
            style={{ width: '100%' }}
            step={0.1}
            min={-2}
            max={2}
            disabled={!isEditable}
          />
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
