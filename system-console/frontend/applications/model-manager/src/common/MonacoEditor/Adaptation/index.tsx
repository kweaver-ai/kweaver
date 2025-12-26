/**
 * @description 代码编辑器组件
 */
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import classNames from 'classnames';
import Editor from '@monaco-editor/react';
import type { EditorProps } from '@monaco-editor/react';

import styles from './index.module.less';

const EDITOR_OPTIONS = {
  folding: false, // 支持代码折叠
  wordWrap: 'on', // 折行控制
  lineHeight: 22,
  language: 'python',
  automaticLayout: true, // 窗口大小变化时自动调整布局
  renderLineHighlight: 'none', // 启用当前行高亮显示
  autoClosingBrackets: false, // 自动关闭括号的选项
  scrollBeyondLastLine: false, // 使滚动可以在最后一行之后移动一个屏幕大小, 默认值为true
  overviewRulerBorder: false, // 是否应围绕概览标尺绘制边框
  minimap: { enabled: false },
  unicodeHighlight: {
    ambiguousCharacters: false, // 禁用混淆字符检查
    invisibleCharacters: false, // 禁用不可见字符检查
  },
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
    useShadows: false,
    handleMouseWheel: true, // 允许编辑器响应滚轮事件
    alwaysConsumeMouseWheel: false, // 防止编辑器总是消费滚轮事件
  },
};

const Adaptation: React.FC<any> = forwardRef((props, ref) => {
  const { onChange: props_onChange, options: props_options, placeholder = '', ...otherProps } = props;
  const monacoRef = useRef<any>();
  const editorRef = useRef<any>();

  const [hasPlaceholder, setHasPlaceholder] = useState(true);

  useImperativeHandle(ref, () => ({
    getEditorInstance: () => editorRef.current,
    getMonacoInstance: () => monacoRef.current,
  }));

  const onBeforeMount = () => {
    editorRef.current?.dispose();
  };

  const onMount: EditorProps['onMount'] = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (editor.getValue()) setHasPlaceholder(false);
  };

  /** 值变化 */
  const handelChange: EditorProps['onChange'] = (value, ev) => {
    props_onChange?.(value, ev);
    if (value) setHasPlaceholder(false);
    else setHasPlaceholder(true);
  };

  return (
    <div className={classNames({ [styles['common-monaco-editor-adaptation-border']]: props_options?.border })} style={{ position: 'relative' }}>
      {hasPlaceholder && <div className={styles['common-monaco-editor-adaptation-placeholder']}>{placeholder}</div>}
      <Editor
        className={classNames(styles['common-monaco-editor-adaptation'], {
          [styles['common-monaco-editor-adaptation-disabled']]: props_options?.readOnly,
        })}
        defaultValue=''
        beforeMount={onBeforeMount}
        onMount={onMount}
        options={{ ...EDITOR_OPTIONS, ...props_options }}
        onChange={handelChange}
        {...otherProps}
      />
    </div>
  );
});

export default Adaptation;
