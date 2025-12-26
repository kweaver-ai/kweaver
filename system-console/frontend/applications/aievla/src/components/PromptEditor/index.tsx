import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

import _ from 'lodash';
import classNames from 'classnames';

import CodeMirror from 'codemirror';
import 'codemirror/mode/meta'; // 提供所有模式的元信息, 可使用findModeByName、findModeByExtension、findModeByFileName
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/display/autorefresh';

import HOOKS from '@/hooks';
import { getVariablesPosition, getMarkVar } from './util';

import './style.less';

type TEditor = CodeMirror.Editor;
export type TVariables = { id: string; var_name: string; [key: string]: any }[];
export interface PromptEditorProps {
  className?: string;
  placeholder?: string;
  variables?: TVariables;
  width?: string | number;
  height?: string | number;
  value?: string;
  atomic?: boolean;
  mode?: string;
  theme?: string;
  readOnly?: boolean;
  options?: Record<string, any>;
  onValueChange?: (value: string) => void;
  // onVariableChange?: (variable: Array<Pick<TVariables[number], 'id' | 'var_name'>>) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onUsedVarChange?: (ids: string[]) => void; // 返回已使用的变量id,
  onSelect?: (cm: CodeMirror.Editor, evt?: any) => void;
}
export interface PromptEditorRef {
  codemirrorRef: React.MutableRefObject<CodeMirror.Editor | undefined>;
  getValue?: TEditor['getValue'];
  setValue?: TEditor['setValue'];
  init: (value: string, options?: { variables?: TVariables }) => void;
  addVariables: (positions: any[]) => void;
  updateVariable: (variable: TVariables[number]) => void;
  removeVariables: (variableNames: string[], isExclude?: boolean) => void;
  getSelection: () => any;
  getCursor: () => any;
  replaceSelection: (str: string) => void;
  replaceRange: (str: string, from: { line: number; ch: number }, to: { line: number; ch: number }) => void;
  cursorCoords: (
    where?: boolean | CodeMirror.Position | null | undefined,
    mode?: CodeMirror.CoordsMode | undefined,
  ) => {
    left: number;
    top: number;
    bottom: number;
  };
}

/**
 * prompt编辑器
 * @param props
 */
const PromptEditor: React.ForwardRefRenderFunction<PromptEditorRef, PromptEditorProps> = (props, ref) => {
  const { className, value, placeholder, atomic = true, mode = 'custom', theme, readOnly, width, height, onSelect, options: customOptions } = props;
  const selfProps = useRef<PromptEditorProps>(props); // 引用props解决hook闭包问题
  selfProps.current = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<TEditor>();
  const forceUpdate = HOOKS.useForceUpdate();
  const usedIdsCache = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    codemirrorRef: editorRef,
    init,
    addVariables,
    updateVariable,
    removeVariables,
    getValue: (seperator?: string) => editorRef.current?.getValue?.(seperator) || '',
    setValue: (content: string) => editorRef.current?.setValue?.(content),
    getSelection: () => editorRef.current?.getSelection?.(),
    getCursor: () => editorRef.current?.getCursor?.(),
    replaceSelection: (str: string) => editorRef.current?.replaceSelection?.(str),
    replaceRange: (str: string, from: { line: number; ch: number }, to: { line: number; ch: number }) => editorRef.current?.replaceRange(str, from, to),
    cursorCoords: (where?: boolean | CodeMirror.Position | null | undefined, mode?: CodeMirror.CoordsMode | undefined) =>
      editorRef.current!.cursorCoords(where, mode),
  }));

  useEffect(() => {
    renderCodeMirror();
  }, []);

  useEffect(() => {
    editorRef.current?.setOption('readOnly', readOnly ? 'nocursor' : false);
  }, [readOnly]);

  useEffect(() => {
    editorRef.current?.setValue(value || '');
  }, [value]);

  useEffect(() => {
    mode && setModeLanguage(mode);
  }, [mode]);

  useEffect(() => {
    theme && setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSize(width, height);
  }, [width, height]);

  const renderCodeMirror = () => {
    if (editorRef.current) return;
    const defaultOptions = {
      mode: 'custom', // 默认custom不是内置mode, 覆盖掉默认样式
      // theme,
      tabSize: 2,
      fontSize: '14px',
      placeholder,
      showCursorWhenSelecting: true, // 选中文字时是否显示光标
      lineWrapping: true, // 是否自动换行
      // lineNumbers: true, // 是否显示行号
      ...customOptions,
    };
    editorRef.current = CodeMirror.fromTextArea(textareaRef.current!, defaultOptions);
    editorRef.current.on('change', onCodeValueChange);
    editorRef.current.on('focus', focus);
    editorRef.current.on('blur', blur);
    editorRef.current.on('scroll', async (CodeMirrorInstance: any) => {
      // const preBtn = document.querySelector('.c-prompt-editor')!.parentNode?.querySelector('.add-var-btn');
      const preBtn = document.querySelector('.mf-prompt-config-root')?.querySelector('.add-var-btn');
      if (!preBtn) return;
      const cursorTop = CodeMirrorInstance!.cursorCoords(CodeMirrorInstance!.getCursor('from'), 'local').top;
      const scrollTop = CodeMirrorInstance.doc.scrollTop;

      const wrapperHeight = document.querySelector('.c-prompt-editor')!.parentElement!.offsetHeight;
      const isShow = cursorTop - scrollTop + 38 > 0 && cursorTop - scrollTop + 38 < wrapperHeight;

      if (!isShow) {
        preBtn?.setAttribute('style', preBtn!.getAttribute('style')!.replaceAll('display: block;', `display: none;`));
      } else {
        preBtn?.setAttribute(
          'style',
          preBtn!
            .getAttribute('style')!
            // .replace(/top:\s*(\d+px);/g, `top: ${cursorTop - scrollTop + 38}px;`)
            .replace(/top:\s*(\d+)px;/g, (matchText, $1, startIndex) => {
              // console.log($1);
              return `top: ${cursorTop - scrollTop + 38 + 48 + 44}px;`;
            })
            .replaceAll('display: none;', `display: block;`),
        );

        // console.log('dis---', cursorTop - scrollTop);
      }
      // console.log('rectTop --- scrollTop', scrollTop, preBtn!.getAttribute('style'));
    });

    editorRef.current.on('cursorActivity', handleSelect);
    editorRef.current.setValue(props.value || '');
    forceUpdate();
  };

  /**
   * 初始化
   * @param value 初始化的文本
   * @param options 配置项
   * @param noJudgeParams 不校验的参数
   */
  const init: PromptEditorRef['init'] = (value = '', options, noJudgeParams = []) => {
    editorRef.current?.setValue(value);
    const highlightText = options?.variables || selfProps.current.variables || [];
    const positions = getVariablesPosition(value, highlightText, noJudgeParams);
    addVariables(positions);
    selfProps.current.onUsedVarChange?.([...new Set(_.map(positions, pos => pos.id))]);
  };

  /**
   * 设置语言高亮, 注意在外部调用importThemes提前引入mode
   * @param language
   */
  const setModeLanguage = async (language: string) => {
    const mode = CodeMirror.findModeByName(language);
    editorRef.current?.setOption('mode', mode?.mode || language);
  };

  /**
   * 设置主题, 注意在外部调用importThemes提前引入主题样式
   * @param theme
   */
  const setTheme = async (theme: string) => {
    editorRef.current?.setOption('theme', theme);
  };

  /**
   * 设置宽高
   * @param width
   * @param height
   */
  const setSize = (width: PromptEditorProps['width'], height: PromptEditorProps['height']) => {
    const curWidth = typeof width === 'number' ? `${width}px` : width || '100%';
    const curHeight = typeof height === 'number' ? `${height}px` : height || '300px';
    editorRef.current?.setSize(curWidth, curHeight);
  };

  /**
   * 聚焦回调
   */
  const focus = (instance: TEditor) => {
    selfProps.current.onFocus?.(instance.getValue());
  };

  /**
   * 失焦回调
   */
  const blur = (instance: TEditor) => {
    selfProps.current.onBlur?.(instance.getValue());
  };

  /**
   * 添加变量
   * @param positions 变量数据的位置信息
   */
  const addVariables = (positions: any[]) => {
    positions.forEach(pos => {
      const existedMarks = editorRef.current?.findMarks(pos.from, pos.to);
      if (existedMarks?.length) return;

      editorRef.current?.markText(pos.from, pos.to, {
        className: 'ad-prompt-highlight',
        atomic, // 当涉及到光标移动时，原子范围充当单个单元——即不可能将光标放在它们内部
        // readOnly: true, // 设为true则mark不能删除
        attributes: { _type: 'prompt', _variable: pos.match, _id: pos.id }, // 自定义一个type字段, 标记它是`prompt变量`
      });
    });
    varChangedCallback();
  };

  /**
   * 编辑器值变化回调
   * @param instance 编辑器实例
   * @param change 变化的信息
   */
  const onCodeValueChange = (instance: TEditor, change: CodeMirror.EditorChange) => {
    if (!change.origin) return;
    const value = instance.getValue();
    selfProps.current.onValueChange?.(value);

    if (change.origin === 'setValue') return;

    const text = editorRef.current?.getValue?.() || '';
    const newVarsPositions = getVariablesPosition(text, selfProps.current.variables);

    // selfProps.current.variables = _.filter(selfProps.current.variables, pos =>
    //   _.some(newVarsPositions, item => item.id !== pos.id)
    // );
    // console.log('text', text, newVarsPositions, selfProps.current.variables);

    // const removeVars = _.filter(selfProps.current.variables, pos =>
    //   _.some(newVarsPositions, item => item.id !== pos.id)
    // );

    // removeVariables(
    //   _.map(removeVars, item => {
    //     return item.var_name;
    //   })
    // );

    const positions = getVariablesPosition(value, selfProps.current.variables || []);
    const allMark = instance.getAllMarks();
    let changed = false;
    const promptMark = _.filter(allMark, mark => {
      if (atomic) return mark?.attributes?._type === 'prompt';

      // 如果设置 atomic = false, 需要判断变量是否被更改
      try {
        if (mark?.attributes?._type === 'prompt') {
          const markText = getMarkVar(mark);
          if (markText !== mark?.attributes?._variable) {
            mark.clear();
            changed = true;
            return false;
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });

    if (positions.length !== promptMark.length || changed) {
      // promptMark.forEach(mark => mark.clear());
      addVariables(positions);
    }
    varChangedCallback();
  };

  /**
   * 更新变量
   * @param variable
   */
  const updateVariable = (variable: TVariables[number]) => {
    const marks = _.filter(editorRef.current?.getAllMarks(), item => item.attributes?._id === variable.id);
    _.forEach(marks, mark => {
      const { from, to }: any = mark.find();
      const newText = `{{${variable.var_name}}}`;
      editorRef.current?.replaceRange(newText, from, to);
      to.ch = from.ch + newText.length;
      addVariables([
        {
          id: variable.id,
          from,
          to,
          match: variable.var_name,
          value: newText,
        },
      ]);
    });
  };

  /**
   * 移除变量标记
   * @param variableNames 移除的变量名称数组
   * @param isExclude 是否反向移除，即：仅保留variableNames，移除其他的变量
   */
  const removeVariables = (variableNames: string[], isExclude = false) => {
    _.forEach(editorRef.current?.getAllMarks(), mark => {
      if (mark.attributes?._type !== 'prompt') return;
      const markVar = getMarkVar(mark);
      const isRemove = isExclude ? !variableNames.includes(markVar) : variableNames.includes(markVar);
      if (!isRemove) return;
      const { from, to }: any = mark.find();
      editorRef.current?.replaceRange(markVar, from, to);
    });
    varChangedCallback();
  };

  /**
   * 变量的增删改查之后, 返回剩余的id
   */
  const varChangedCallback = () => {
    const idMap: Record<string, any> = {};
    _.forEach(editorRef.current?.getAllMarks(), mark => {
      if (mark.attributes?._type !== 'prompt') return;
      idMap[mark.attributes._id] = true;
    });
    const ids = _.keys(idMap);
    if (!_.isEqual(ids, usedIdsCache.current)) {
      selfProps.current?.onUsedVarChange?.(ids);
      usedIdsCache.current = ids;
    }
  };

  const handleSelect = _.debounce(() => {
    onSelect?.(editorRef.current!);
  }, 0);

  return (
    <div className={classNames('c-prompt-editor', className)}>
      <textarea ref={textareaRef} />
    </div>
  );
};

export default forwardRef(PromptEditor);
export * from './util';
