/** 代码块编辑展示表单组件 */
import React, { useEffect, useRef, memo, useImperativeHandle, forwardRef } from 'react';
import classNames from 'classnames';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import './index.less';

interface Props {
  value?: { [index: string]: any } | string;
  onChange?: (json: { [index: string]: any } | string) => void; // json输入时回调
  onValidate?: (isValid: boolean) => void; // json数据格式是否正确,回调值true,false
  disabled?: boolean; // 是否禁用
  className?: string;
  style?: any;
  isSetValue?: boolean;
}

const JsonCodeInput: React.ForwardRefRenderFunction<unknown, Props> = (props: Props, ref): JSX.Element => {
  const { className, style, value = {}, disabled, isSetValue = true } = props;
  const { onChange, onValidate } = props;
  const contentRef = useRef<any>();

  const jsoneditor = useRef<any>();

  const onCodeChange = (jsonString: any): void => {
    try {
      const json = jsoneditor.current.get();

      onChange && onChange(json);
      onValidate && onValidate(true);
    } catch (e) {
      onChange && onChange(jsonString);
      onValidate && onValidate(false);
    }
  };

  const options: JSONEditorOptions = {
    mode: 'preview',
    history: true,
    mainMenuBar: false,
    statusBar: false,
    onChangeText: onCodeChange,
  };

  useEffect(() => {
    jsoneditor.current = new JSONEditor(contentRef.current, options);
    return (): void => {
      jsoneditor.current && jsoneditor.current.destroy();
    };
  }, []);

  useEffect(() => {
    try {
      const currentValue = jsoneditor.current.get();
      if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
        jsoneditor.current.set(value);
      }
    } catch {
      const currentValue = jsoneditor.current.getText();

      if (currentValue !== value) {
        isSetValue && jsoneditor.current.set(value);
      }
    }
  }, [value]);

  useEffect(() => {
    disabled ? jsoneditor.current.setMode('preview') : jsoneditor.current.setMode('code');
  }, [disabled]);

  useImperativeHandle(ref, () => ({
    jsoneditor,
    onCodeChange,
  }));

  return (
    <div
      className={classNames('json-editor-code', { 'json-disabled': disabled }, className)}
      ref={contentRef}
      style={style}
      onBlur={(): void => {
        try {
          // 获取文本框中内容
          const jsonObj = jsoneditor.current.get();
          // 格式化
          const formattedText = JSON.stringify(jsonObj, null, 2);

          // 重新set进文本框
          jsoneditor.current.setText(formattedText);
        } catch (e) {
          console.error(e);
        }
      }}
    ></div>
  );
};

export default memo(forwardRef(JsonCodeInput));
