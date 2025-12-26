import type React from 'react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import classNames from 'classnames';
import { i18nChangeLanguage } from '@wangeditor/editor';
import { Toolbar, Editor } from '@wangeditor/editor-for-react';

import { defaultToolbarConfig, defaultEditorConfig } from './defaultConfig';

import '@wangeditor/editor/dist/css/style.css';
import './index.less';

export interface WangEditorProps {
  className?: string;
  value?: string;
  type?: 'edit' | 'preview';
  height?: string | number; // 编辑器高度
  placeholder?: string;
  language?: string;
  onChange?: (value: string) => void;
}

export interface WangEditorRef {
  editor: any;
}

const WangEditor: React.ForwardRefRenderFunction<WangEditorRef, WangEditorProps> = (props, ref) => {
  const { className, value, type = 'edit', height, placeholder, language = 'zh-cn', onChange: props_onChange } = props;
  const [editor, setEditor] = useState<any>(null); // editor 实例

  useEffect(() => {
    i18nChangeLanguage(language === 'en-us' ? 'en' : 'zh-cn');
  }, [language]);

  useImperativeHandle(ref, () => ({ editor }));

  useEffect(() => {
    if (editor === null) return;
    return () => {
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  useEffect(() => {
    if (editor === null) return;
    if (type === 'edit') editor.enable();
    if (type === 'preview') editor.disable();
  }, [editor, type]);

  const onChange = (editor: any) => {
    const html = editor.getHtml();
    props_onChange?.(html);
  };

  return (
    <div className={classNames('common-rich-wrap', { 'common-rich-wrap-preview': type === 'preview', 'common-rich-wrap-edit': type === 'edit' }, className)}>
      <Toolbar className='common-wang-editor-tool' editor={editor} defaultConfig={defaultToolbarConfig} />
      <Editor
        className='common-wang-editor'
        mode='simple'
        value={value}
        style={{ height }}
        defaultConfig={{ ...defaultEditorConfig, placeholder }}
        onCreated={setEditor}
        onChange={onChange}
      />
    </div>
  );
};

export default forwardRef(WangEditor);
