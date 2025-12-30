import MonacoEditor from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface JSONEditorProps {
  className?: string;
  height?: string;
  value?: string;
  onChange?: (newValue: string) => void;
  options?: editor.IStandaloneEditorConstructionOptions;
}

function JSONEditor({ className, height, value, options, onChange }: JSONEditorProps) {
  return (
    <MonacoEditor
      className={className}
      height={height}
      language="json"
      value={value}
      options={{
        scrollbar: {
          // 滚动条大小
          verticalScrollbarSize: 8, // 宽度
          horizontalScrollbarSize: 8, // 高度
        },
        fontSize: 14,
        minimap: { enabled: false },
        // 禁用聚焦行的边框
        renderLineHighlight: 'none',
        // 禁用滚动BeyondLastLine
        scrollBeyondLastLine: false,
        ...options,
      }}
      onChange={newValue => {
        onChange?.(newValue || '');
      }}
    />
  );
}

export default JSONEditor;
