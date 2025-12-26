/**
 * @description 代码编辑器组件
 */
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import Editor from '@monaco-editor/react';
import type { EditorProps } from '@monaco-editor/react';

import styles from './index.module.less';

const EDITOR_OPTIONS = {
  folding: false, // 支持代码折叠
  wordWrap: 'on', // 折行控制
  lineHeight: 22,
  lineNumbers: 'off', // 控制行号的呈现
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

const Prompt: React.FC<any> = forwardRef((props, ref) => {
  const { variables, onChange: props_onChange, options: props_options, placeholder = '', ...otherProps } = props;
  const monacoRef = useRef<any>();
  const editorRef = useRef<any>();
  const variablesRef = useRef<any>();

  const decorationIdsRef = useRef([]); // 用于存储当前的装饰器ID
  const [hasPlaceholder, setHasPlaceholder] = useState(true);

  useImperativeHandle(ref, () => ({
    getEditorInstance: () => editorRef.current,
    getMonacoInstance: () => monacoRef.current,
    getVariables: () => variablesRef.current,
    onInsertText,
    moveCursorToFirst,
    moveCursorToEnd,
  }));

  const onBeforeMount = () => {
    editorRef.current?.dispose();
  };

  const onMount: EditorProps['onMount'] = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    updateDecorations();

    if (editor.getValue()) setHasPlaceholder(false);
  };

  useEffect(() => {
    if (!variables) return;
    updateDecorations();
  }, [JSON.stringify(variables)]);

  const pushItem = (item: string, items: any) => {
    if (_.isArray(items)) {
      if (!_.includes(items, item)) items.push(item);
    } else {
      items = [item];
    }
  };

  /** 更新装饰器，为变量添加背景色 */
  const updateDecorations = _.debounce(() => {
    if (!editorRef.current || !monacoRef.current || (variables !== undefined && _.isEmpty(variables))) return;

    const model = editorRef.current.getModel();
    const text = model.getValue();
    const decorations = [];

    let match: any;
    // 这里是通过variables进行匹配
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = variables ? new RegExp(variables.map((t: any) => escapeRegExp(`{{${t.var_name}}}`)).join('|'), 'g') : /\{\{[\w-]+\}\}/g;

    const temp: any = [];
    // biome-ignore lint/suspicious/noAssignInExpressions: off
    while ((match = regex.exec(text)) !== null) {
      // console.log('匹配变量', match);
      const item = match[0].slice(2, -2);
      pushItem(item, temp);
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      decorations.push({
        range: new monacoRef.current.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: {
          inlineClassName: 'var-highlight', // 用于文本颜色的类名
        },
      });
    }
    variablesRef.current = temp;

    // 先清除所有旧的装饰器，再添加新的
    decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, decorations);
  }, 300);

  /** 值变化 */
  const handelChange: EditorProps['onChange'] = (value, ev) => {
    props_onChange?.(value, ev);
    updateDecorations();
    if (value) setHasPlaceholder(false);
    else setHasPlaceholder(true);
  };

  /** 插入文本 */
  const onInsertText = (text: string) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    // 获取当前光标位置
    const position = editor.getPosition();

    // 插入文本
    editor.executeEdits('insert-text', [{ range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), text: text }]);

    // 移动光标到插入文本的末尾
    editor.setPosition({ lineNumber: position.lineNumber, column: position.column + text.length });

    // 聚焦编辑器
    editor.focus();
  };

  /** 光标移动到第一行 */
  const moveCursorToFirst = () => {
    const editor = editorRef.current;
    editor.setPosition({ lineNumber: 1, column: 1 });
    editor.focus();
    editor.revealPositionInCenter({ lineNumber: 1, column: 1 });
  };

  /** 光标移动到最后一行 */
  const moveCursorToEnd = () => {
    const editor = editorRef.current;
    const model = editor.getModel();
    const lineCount = model.getLineCount();
    const lastLineLength = model.getLineMaxColumn(lineCount);
    editor.setPosition({ lineNumber: lineCount, column: lastLineLength });
    editor.focus();
    editor.revealPositionInCenter({ lineNumber: lineCount, column: lastLineLength });
  };

  return (
    <div className={classNames({ [styles['common-monaco-editor-prompt-border']]: props_options?.border })} style={{ position: 'relative' }}>
      {hasPlaceholder && <div className={styles['common-monaco-editor-prompt-placeholder']}>{placeholder}</div>}
      <Editor
        className={classNames(styles['common-monaco-editor-prompt'], {
          [styles['common-monaco-editor-prompt-disabled']]: props_options?.readOnly,
        })}
        defaultValue=''
        beforeMount={onBeforeMount}
        onMount={onMount}
        defaultLanguage='plaintext'
        options={{ ...EDITOR_OPTIONS, ...props_options }}
        onChange={handelChange}
        {...otherProps}
        width={otherProps.width - 12}
        height={otherProps.height - 4}
      />
    </div>
  );
});

export default Prompt;
