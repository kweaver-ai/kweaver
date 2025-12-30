import React, { useState } from 'react';
import { Input } from 'antd';

const { TextArea } = Input;
const errorMsg = '格式错误';

interface JsonTextAreaWidgetProps {
  id: string;
  schema: any;
  uiSchema: any;
  value: any;
  onChange: (value: any) => void;
  onValidationError: (param: { [id: string]: boolean }) => void;
}

/**
 * JSON 文本域编辑器组件
 */
const JsonTextAreaWidget: React.FC<JsonTextAreaWidgetProps> = props => {
  const id = props.id;
  const [value, setValue] = useState(() => {
    if (props.value !== undefined) {
      if (typeof props.value === 'object') {
        try {
          return JSON.stringify(props.value, null, 2);
        } catch {
          return String(props.value);
        }
      } else if (typeof props.value === 'string') {
        return props.value;
      } else {
        return '';
      }
    } else {
      return '';
    }
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (!newValue.trim()) {
      setError('');
      props.onValidationError({ [id]: false });
      props.onChange(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(newValue);
      let hasError: boolean = false;
      switch (props.schema?.format) {
        case 'json:object':
          if (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object') {
            hasError = true;
          }
          break;
        case 'json:array':
          if (!Array.isArray(parsed)) {
            hasError = true;
          }
          break;
        default:
          break;
      }
      if (hasError) {
        setError(errorMsg);
        props.onValidationError({ [id]: true });
        props.onChange(undefined);
      } else {
        setError('');
        props.onValidationError({ [id]: false });
        props.onChange(parsed);
      }
    } catch {
      setError(errorMsg);
      props.onValidationError({ [id]: true });
      props.onChange(undefined);
    }
  };

  return (
    <div>
      <TextArea
        value={value}
        onChange={handleChange}
        rows={3}
        status={error ? 'error' : ''}
        style={{ fontFamily: 'monospace' }}
        placeholder={props.schema?.format === 'json:object' ? '例如：{"key": "value"}' : '例如：["item1", "item2"]'}
      />

      {error && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
};

export default JsonTextAreaWidget;
