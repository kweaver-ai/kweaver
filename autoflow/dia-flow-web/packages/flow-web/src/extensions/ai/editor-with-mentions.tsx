import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {
  $getRoot,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  $createParagraphNode,
  DecoratorNode,
  $isTextNode,
  EditorState,
  $setSelection,
  LexicalNode,
  LexicalEditor,
  $createRangeSelection,
  $getNodeByKey,
} from 'lexical';
import 'antd/dist/antd.css';
import { VariablePicker } from '../../components/editor/variable-picker';
import { VariableEditorModal } from './variable-editor-modal';
import { TagNodeComponent } from './tag-node-component';
import { StepConfigContext } from '../../components/editor/step-config-context';
import { EditorContext } from '../../components/editor/editor-context';

// =========================== 类型定义 ===========================
interface Variable {
  name?: string;
  key?: string;
  value: string;
  [key: string]: any;
}

interface EditorWithMentionsProps {
  onChange?: (content: string,itemName: any) => void;
  parameters?: string;
  itemName: any;
}

interface SuggestionPosition {
  top: number;
  left: number;
}

// =========================== 自定义节点 ===========================
class TagNode extends DecoratorNode<JSX.Element> {
  __variable: Variable;

  static getType(): string {
    return 'tag';
  }

  static clone(node: TagNode): TagNode {
    return new TagNode(node.__variable, node.__key);
  }

  constructor(variable: Variable, key?: string) {
    super(key);
    this.__variable = variable;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'editor-tag-node';
    element.style.display = 'inline-block';
    element.style.margin = '0 2px';
    element.style.cursor = 'pointer';
    
    // 添加特殊属性以便光标能够正确导航
    element.setAttribute('contenteditable', 'false');
    element.setAttribute('data-lexical-tag-node', 'true');
    
    return element;
  }

  updateDOM(): false {
    return false;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
       <TagNodeComponent
        variable={this.__variable}
        nodeKey={this.getKey()}
        editor={editor}
        onRemove={() => {
          editor.update(() => {
            this.remove();
          });
        }}
      />
    );
  }

  getVariable(): Variable {
    return this.__variable;
  }

  setVariable(variable: Variable): void {
    this.__variable = variable;
  }
}


function TagEditPlugin() {
  const [editor] = useLexicalComposerContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNodeKey, setEditingNodeKey] = useState<string | null>(null);
  const [editingVariable, setEditingVariable] = useState<string>('');

  useEffect(() => {
    const handleTagEditClick = (event: CustomEvent) => {
      const { variable, nodeKey, editor: targetEditor } = event.detail;
      
      if (targetEditor === editor) {
        setEditingNodeKey(nodeKey);
        setEditingVariable(variable);
        setModalVisible(true);
      }
    };

    const eventHandler = (e: Event) => {
      if (e instanceof CustomEvent) {
        handleTagEditClick(e);
      }
    };
    
    document.addEventListener('tag-edit-click', eventHandler);
    
    return () => {
      document.removeEventListener('tag-edit-click', eventHandler);
    };
  }, [editor]);

  const handleConfirm = useCallback((newVariable: any) => {
    if (!editingNodeKey) return;

    editor.update(() => {
      const node = $getNodeByKey(editingNodeKey);
      if ($isTagNode(node)) {
        // 正确的方法：创建新节点替换旧节点
        const newTagNode = $createTagNode(newVariable);
        
        // 获取旧节点的位置
        const selection = $createRangeSelection();
        selection.anchor.set(node.getKey(), 0, 'element');
        selection.focus.set(node.getKey(), 1, 'element');
        
        // 用新节点替换旧节点
        selection.insertNodes([newTagNode]);
        
        // 移除旧节点
        node.remove();
      }
    });

    setModalVisible(false);
    setEditingNodeKey(null);
    setEditingVariable('');
  }, [editor, editingNodeKey]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingNodeKey(null);
    // setEditingVariable('');
  }, []);

  return (
    <>
      <VariableEditorModal
        visible={modalVisible}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        initialVariable={editingVariable}
      />
    </>
  );
}

// 创建Tag节点
function $createTagNode(variable: Variable): TagNode {
  return new TagNode(variable);
}

// 检查是否是Tag节点
function $isTagNode(node: unknown): node is TagNode {
  return node instanceof TagNode;
}

// =========================== 插件组件 ===========================
function MentionPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition>({ top: 0, left: 0 });
  const [query, setQuery] = useState('');
  const [triggerInfo, setTriggerInfo] = useState<{index: number; key: string; timestamp: number} | null>(null);

  const { step } = useContext(StepConfigContext);
  const { pickVariable, stepNodes, stepOutputs } = useContext(EditorContext);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements }) => {
      if (dirtyElements.size === 0) return;

      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          if (triggerInfo) {
            setTriggerInfo(null);
            setShowSuggestions(false);
          }
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;
        const anchorKey = selection.anchor.key;
        const text = anchorNode.getTextContent();

        // 检测是否输入了{
        const triggerIndex = text.lastIndexOf('{', anchorOffset);
        
        // 如果之前已经触发了建议，检查是否应该关闭
        if (showSuggestions && triggerInfo) {
          const hasMovedAway = triggerInfo.key !== anchorKey || 
                            triggerInfo.index !== triggerIndex;
          
          // 如果用户移动了光标、删除了{，关闭弹窗
          if (hasMovedAway || triggerIndex === -1) {
            setShowSuggestions(false);
            setTriggerInfo(null);
          }
        }

        // 只有在{后面没有跟随其他字符时才触发
        if (triggerIndex !== -1 && anchorOffset - triggerIndex === 1) {
          // 获取光标位置
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const editorWrapper = document.querySelector('.editor-wrapper');
            if (editorWrapper) {
              const editorRect = editorWrapper.getBoundingClientRect();
              setSuggestionPosition({
                top: rect.bottom - editorRect.top + editorWrapper.scrollTop,
                left: rect.left - editorRect.left + editorWrapper.scrollLeft,
              });
            } else {
              setSuggestionPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
              });
            }
          }
          //调用弹窗组件
          pickVariable((step && stepNodes[step.id]?.path) || [], '', {
            targetRect: undefined,
          }).then((value:string) => {
              const variableKey = value;
              // 从 stepOutputs 中查找对应的变量信息
              const variableInfo = stepOutputs[variableKey];
              insertMention({value: variableKey, ...variableInfo, key:variableKey});
              setShowSuggestions(false);
              setTriggerInfo(null);
          })

          setShowSuggestions(true);
          setQuery('');
          setTriggerInfo({ 
            index: triggerIndex, 
            key: anchorKey,
            timestamp: Date.now()
          });
        }
      });
    });
  }, [editor, showSuggestions, triggerInfo]);

  // 插入变量的函数
const insertMention = useCallback((variable: Variable) => {
  editor.update(() => {
    setShowSuggestions(false);
    setTriggerInfo(null);
    
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const anchorOffset = selection.anchor.offset;
      
      if ($isTextNode(anchorNode)) {
        const text = anchorNode.getTextContent();
        const triggerIndex = text.lastIndexOf('{', anchorOffset);
        
        if (triggerIndex !== -1) {
          // 分割文本节点：{前 | { | {后
          const textBefore = text.substring(0, triggerIndex);
          const textAfter = text.substring(anchorOffset);
          
          // 获取父节点和位置
          const parent = anchorNode.getParent();
          if (!parent) return;
          
          const nodeIndex = anchorNode.getIndexWithinParent();
          
          // 创建新节点数组
          const newNodes = [];
          
          // 1. 添加{前的文本
          if (textBefore.length > 0) {
            newNodes.push($createTextNode(textBefore));
          }
          
          // 2. 添加变量节点
          newNodes.push($createTagNode(variable));
          
          // 3. 添加{后的文本（使用空文本节点替代零宽空格）
          if (textAfter.length > 0) {
            // 直接使用原文本，不添加特殊字符
            newNodes.push($createTextNode(textAfter));
          } else {
            // 添加空文本节点用于光标定位
            newNodes.push($createTextNode(''));
          }
          
          // 替换原文本节点
          anchorNode.remove();
          newNodes.forEach((node, i) => {
            parent.splice(nodeIndex + i, 0, [node]);
          });
          
          // 设置光标到最后一个节点的开始位置
          if (newNodes.length > 0) {
            const lastNode = newNodes[newNodes.length - 1];
            if ($isTextNode(lastNode)) {
              selection.setTextNodeRange(lastNode, 0, lastNode, 0);
            }
          }
        }
      } else {
        // 处理在TagNode前插入的情况
        const parent = anchorNode.getParent();
        if (parent && $isTagNode(anchorNode)) {
          const index = anchorNode.getIndexWithinParent();
          const tagNode = $createTagNode(variable);
          
          // 去掉零宽空格，直接插入变量节点和空文本节点
          const emptyNode = $createTextNode('');
          parent.splice(index, 0, [tagNode, emptyNode]);
          selection.setTextNodeRange(emptyNode, 0, emptyNode, 0);
        }
      }
    } else {
      // 选择无效时的备选方案
      const root: any = $getRoot();
      
      let found = false;
      root.getChildren().forEach((paragraph: any) => {
        if (found || paragraph.getType() !== 'paragraph') return;
        
        const children = paragraph.getChildren();
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if ($isTextNode(child)) {
            const text = child.getTextContent();
            const triggerIndex = text.indexOf('{');
            
            if (triggerIndex !== -1) {
              // 分割文本
              const textBefore = text.substring(0, triggerIndex);
              const textAfter = text.substring(triggerIndex + 1);
              
              // 创建新节点
              const newNodes = [];
              
              if (textBefore.length > 0) {
                newNodes.push($createTextNode(textBefore));
              }
              
              newNodes.push($createTagNode(variable));
              
              if (textAfter.length > 0) {
                // 直接使用原文本
                newNodes.push($createTextNode(textAfter));
              } else {
                newNodes.push($createTextNode(''));
              }
              
              // 替换
              child.remove();
              newNodes.forEach((node, j) => {
                paragraph.splice(i + j, 0, [node]);
              });
              
              found = true;
              return;
            }
          }
        }
      });
      
      // 如果没找到{，在末尾插入
      if (!found) {
        const lastParagraph = root.getLastChild() || $createParagraphNode();
        if (!root.contains(lastParagraph)) {
          root.append(lastParagraph);
        }
        
        const tagNode = $createTagNode(variable);
        // 添加变量节点和空文本节点
        const emptyNode = $createTextNode('');
        lastParagraph.append(tagNode, emptyNode);
        
        // 设置光标到空文本节点
        const selection = $createRangeSelection();
        selection.setTextNodeRange(emptyNode, 0, emptyNode, 0);
        $setSelection(selection);
      }
    }
  });
}, [editor]);

  // 处理选择完成
  const handleFinish = useCallback((val: string, item: any) => {
    insertMention({value:val, ...item});
    setShowSuggestions(false);
    setTriggerInfo(null);
  }, [insertMention]);

  // 处理取消选择
  const handleCancel = useCallback(() => {
    setShowSuggestions(false);
    setTriggerInfo(null);
  }, []);

  const variablePickerProps = useMemo(() => ({
    targetRect: undefined,
    width: 464,
    height: 400,
    type: "string",
    scope: [],
    loop: false,
    onFinish: handleFinish,
    onCancel: handleCancel,
  }), [handleFinish, handleCancel]);

  return null;
}

// 统一的键盘事件处理插件 - 简化版本，只在必要时干预
function UnifiedKeyboardHandlerPlugin({ 
  editorContainerRef 
}: { 
  editorContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInEditor = editorContainerRef.current?.contains(target);
      
      // 只有在编辑器内才处理这些按键
      if (!isInEditor || !editor.isEditable()) {
        return;
      }

      // 处理删除键 - 只在完全选择TagNode时干预
      if (event.key === 'Backspace' || event.key === 'Delete') {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            const nodes = selection.getNodes();
            
            // 只有当选择完全包含TagNode时才删除
            const hasTagNode = nodes.some(node => $isTagNode(node));
            const hasOnlyTagNodes = nodes.length > 0 && nodes.every(node => $isTagNode(node));
            
            if (hasTagNode && hasOnlyTagNodes) {
              nodes.forEach(node => {
                if ($isTagNode(node)) {
                  node.remove();
                }
              });
              event.stopPropagation();
              event.preventDefault();
            }
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, editorContainerRef]);

  return null;
}

// 简单的删除处理插件
function TagDeleteHandlerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleClick = (event: any) => {
      // 检查是否点击了关闭按钮
      const closeButton = event?.target?.closest('.ant-tag-close-icon');
      if (closeButton) {
        event.preventDefault();
        event.stopPropagation();

        const tagElement = closeButton.closest('.ant-tag');
        if (tagElement) {
          editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();
            for (let i = 0; i < children.length; i++) {
              const child:any = children[i];
              if (child.getType() === 'paragraph') {
                const paragraphChildren = child.getChildren();
                for (let j = 0; j < paragraphChildren.length; j++) {
                  const node = paragraphChildren[j];
                  if ($isTagNode(node)) {
                    const variable = node.getVariable();
                    if (tagElement.textContent?.includes(variable.value)) {
                      node.remove();
                      return;
                    }
                  }
                }
              }
            }
          });
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [editor]);

  return null;
}

// 添加内容初始化插件
function ContentInitializerPlugin({
  parameters,
  parseContent
}: {
  parameters?: string;
  parseContent: (content: string) => LexicalNode[];
}) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!editor || !parameters || isInitialized) return;

    editor.update(() => {
      const root = $getRoot();
      // 只有在编辑器为空时才初始化内容
      if (root.getTextContent().trim() === '') {
        root.clear();
        const paragraph = $createParagraphNode();
        const nodes = parseContent(parameters);
        paragraph.append(...nodes);
        root.append(paragraph);
        
        // 设置光标到编辑器末尾
        const lastNode = paragraph.getLastChild() || paragraph;
        const selection = $createRangeSelection();
        
        if ($isTextNode(lastNode)) {
          selection.anchor.set(lastNode.getKey(), lastNode.getTextContentSize(), 'text');
          selection.focus.set(lastNode.getKey(), lastNode.getTextContentSize(), 'text');
        } else {
          selection.anchor.set(paragraph.getKey(), paragraph.getChildrenSize(), 'element');
          selection.focus.set(paragraph.getKey(), paragraph.getChildrenSize(), 'element');
        }
        
        $setSelection(selection);
        setIsInitialized(true);
      }
    });
  }, [editor, parameters, parseContent, isInitialized]);

  return null;
}

// =========================== 主题配置 ===========================
const theme = {
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
  },
  paragraph: 'editor-paragraph',
  tag: 'editor-tag-node',
};

// =========================== 编辑器配置 ===========================
const initialConfig = {
  namespace: 'MyEditor',
  theme,
  nodes: [TagNode],
  onError(error:any) {
    console.error('Lexical Editor Error:', error);
  },
};

// 改进的焦点保护插件 - 只处理Backspace导致的焦点跳转
function FocusProtectionPlugin({ 
  editorContainerRef
}: { 
  editorContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const lastBackspaceTimeRef = useRef<number>(0);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 记录最后聚焦的元素
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!editorContainerRef.current?.contains(target)) {
        lastFocusedElementRef.current = target;
      }
    };

    // 检测Backspace按键
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        const isOtherInput = 
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
          !editorContainerRef.current?.contains(target);
        
        if (isOtherInput) {
          lastBackspaceTimeRef.current = Date.now();
          lastFocusedElementRef.current = target;
        }
      }
    };

    // 处理焦点跳转 - 只在Backspace后短时间内检测
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const editorContent = editorContainerRef.current?.querySelector('.editor-content');
      
      // 如果焦点跳转到编辑器，并且是在Backspace后短时间内发生的
      if (target === editorContent && 
          Date.now() - lastBackspaceTimeRef.current < 100 && 
          lastFocusedElementRef.current) {
        
        // 立即将焦点恢复回去
        setTimeout(() => {
          if (lastFocusedElementRef.current && document.activeElement === editorContent) {
            lastFocusedElementRef.current.focus();
          }
        }, 0);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocus, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocus, true);
    };
  }, [editorContainerRef]);

  return null;
}

// =========================== 主编辑器组件 ===========================
export default function EditorWithMentions({
  onChange,
  parameters,
  itemName,
}: EditorWithMentionsProps) {

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // 优化参数解析函数
  const parseContent = useCallback((content: string) => {
    const nodes: LexicalNode[] = [];
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        // 添加普通文本节点
        nodes.push($createTextNode(content.substring(lastIndex, match.index)));
      }
      // 添加变量节点
      const variableName = match[1].trim();
      nodes.push($createTagNode({ value: variableName }));
      lastIndex = variableRegex.lastIndex;
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      nodes.push($createTextNode(content.substring(lastIndex)));
    }

    return nodes;
  }, []);

  // 提取编辑器内容的函数
  const extractContent = useCallback((state: EditorState) => {
    return state.read(() => {
      let content = '';
      const root = $getRoot();
      const children = root.getChildren();
      children.forEach((child:any) => {
        if (child.getType() === 'paragraph') {
          const paragraphChildren = child.getChildren();
          paragraphChildren.forEach((node:any) => {
            if ($isTextNode(node)) {
              // 处理文本节点
              content += node.getTextContent();
            } else if ($isTagNode(node)) {
              // 处理自定义TagNode节点
              content += `{{${node.getVariable().value}}}`;
            }
          });
          content += '\n';
        }
      });
      return content.trim();
    });
  }, []);

  const handleEditorChange = useCallback((editorState: EditorState) => {
    if (!editorState) return;
    const content = extractContent(editorState);
    // 过滤掉非中断空格字符 (U+00A0)
    const filteredContent = content.replace(/\u00A0/g, ' ');
    onChange?.(filteredContent,itemName);
  }, [onChange, extractContent]);

  return (
    <div className="editor-container" ref={editorContainerRef} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="editor-wrapper" style={{
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '4px 10px',
        minHeight: '200px',
        background: '#fff',
        position: 'relative',
        maxHeight: '300px',
        overflowY:'auto'
      }}>
        <LexicalComposer initialConfig={initialConfig}>
          <ContentInitializerPlugin parameters={parameters} parseContent={parseContent} />
          <RichTextPlugin
            contentEditable={<ContentEditable
              className="editor-content"
              style={{
                minHeight: '150px',
                outline: 'none',
                padding: '4px',
                lineHeight: '1.5'
              }}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
            />}
            placeholder={<div className="editor-placeholder" style={{
              position: 'absolute',
              top: '4px',
              left: '10px',
              color: '#bfbfbf',
              pointerEvents: 'none',
              userSelect: 'none'
            }}>{'输入{可选择变量置入文本框'}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MentionPlugin />
          <UnifiedKeyboardHandlerPlugin editorContainerRef={editorContainerRef} />
          <TagDeleteHandlerPlugin />
          <TagEditPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <FocusProtectionPlugin editorContainerRef={editorContainerRef} />
        </LexicalComposer>
      </div>
    </div>
  );
}