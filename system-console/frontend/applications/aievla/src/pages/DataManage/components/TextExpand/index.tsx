import * as React from 'react';
import { useEffect, useState } from 'react';

import intl from 'react-intl-universal';

import './style.less';

interface IndexProps {
  content: string; // 文本内容
  maxLen?: number; // 文字最大显示长度
  expandText?: string; // 展开按钮文字
  collapseText?: string; // 收起按钮文字
  contentRender: (text: string, handler: React.ReactNode) => React.ReactNode; // 自定义内容
  onExpand?: (expanded: boolean) => void; // 展开、收起后触发
}

/**
 * 自定义文字展开收起组件
 * @param props
 * @constructor
 */
const TextExpand = (props: IndexProps) => {
  const {
    content,
    maxLen = 300,
    expandText = intl.get('dataSet.expand'),
    collapseText = intl.get('dataSet.folding'),
    contentRender = (text: string, handler: React.ReactNode) => {},
    onExpand = (expanded: boolean) => {},
  } = props;
  const [body, setBody] = useState<any>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showBtn, setShowBtn] = useState<boolean>(false);

  useEffect(() => {
    let contentBody = content || '';
    if (contentBody.length > maxLen) {
      contentBody = getText(contentBody);
      setShowBtn(true);
    }
    setBody(contentBody);
    return () => {
      setExpanded(false);
      setShowBtn(false);
    };
  }, [content]);

  /**
   * 获取截断后的文字
   * @param text
   */
  const getText = (text: string): string => {
    return (text || '').slice(0, maxLen) + '...';
  };

  /**
   * 获取展开收起按钮
   * @param status
   */
  const getExpandBtn = (): React.ReactNode =>
    showBtn ? (
      <span className='custom-text-expanded-handler' onClick={() => expandToggle(!expanded)}>
        {expanded ? collapseText : expandText}
      </span>
    ) : null;

  /**
   * 展开、收起
   * @param status
   */
  const expandToggle = (status: boolean) => {
    const text = status ? content : getText(content);
    setExpanded(status);
    setBody(text);
    onExpand(status);
  };

  return <>{contentRender(body, getExpandBtn())}</>;
};

export default TextExpand;
