// import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { registerPythonCompletion } from './python-completion';

interface PythonEditorProps {
  className?: string;
  height?: string;
  value?: string;
  options?: editor.IStandaloneEditorConstructionOptions;
  onChange?: (newValue: string) => void;
}

function PythonEditor({ className, height, value, options, onChange }: PythonEditorProps) {
  const handleEditorDidMount = (editor, monaco) => {
    registerPythonCompletion(monaco);
  };

  return (
    <MonacoEditor
      className={className}
      height={height}
      language="python"
      value={value}
      onMount={handleEditorDidMount}
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

export default PythonEditor;
