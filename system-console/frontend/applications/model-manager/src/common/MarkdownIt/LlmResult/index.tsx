import { useRef, useEffect } from 'react';
import classNames from 'classnames';
import markdownit from 'markdown-it';
import highlightJS from 'highlight.js';

import styles from './index.module.less';

const MarkdownIt = (props: any) => {
  const { type = '', content, className, style } = props;

  const markdownitRef = useRef<any>(null);

  const onCopy = (event: any, text: any) => {
    const target = event.target;
    const span = target.getElementsByTagName('span')?.[0];
    const use = target.getElementsByTagName('use')?.[0];
    if (span) span.style = 'margin-top: 1px; color: #52c41a; font-size: 18px;';
    if (use) use.href.baseVal = '#icon-dip-check';

    setTimeout(() => {
      if (!span || !use) return;
      span.style = 'margin-right: 4px;';
      use.href.baseVal = '#icon-dip-copy';
    }, 3000);

    const copyData = decodeURIComponent(text);
    if (navigator.clipboard) {
      try {
        navigator.clipboard.writeText(copyData);
      } catch (error) {
        console.log('copyToBoard:', error);
      }
    }
    if (typeof document.execCommand === 'function') {
      try {
        const input = document.createElement('textarea');
        input.style.cssText = 'position: absolute; left: -9999px; z-index: -1;';
        input.setAttribute('readonly', 'readonly');
        input.value = copyData;
        document.body.appendChild(input);
        input.select();
        if (document.execCommand('copy')) document.execCommand('copy');
        document.body.removeChild(input);
      } catch (_error) {}
    } else {
    }
  };

  const code_string = (language: any, code: any, source: any) => {
    return (
      '<div class="highlightRoot"><div class="code-header"><span>' +
      language +
      '</span><div class="code-header-copy" onClick="' +
      `(${onCopy})(event, \`${encodeURIComponent(source)}\`);` +
      '">' +
      '<span role="img" class="anticon" style="margin-right: 4px;">' +
      '<svg width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<use xlink:href="#icon-dip-copy"></use>' +
      '</svg>' +
      '</span>复制</div></div><pre><code>' +
      code +
      '</code></pre></div>'
    );
  };

  useEffect(() => {
    markdownitRef.current = markdownit({
      html: false,
      highlight(code: any, language: any) {
        const validLang = !!(language && highlightJS.getLanguage(language));
        if (validLang) {
          const lang = language ?? '';
          const highlighted = highlightJS.highlight(code, { language: lang }).value;
          const indented = highlighted
            .split('\n')
            .map(line => {
              return `<span·class="hljs-line">${line}</span>`;
            })
            .join('\n');
          return code_string(language, indented, code);
        }
        return code_string(language, markdownitRef.current?.utils.escapeHtml(code), code);
      },
    });

    markdownitRef.current.renderer.rules.table_open = () => '<div class="dip-markdown-table-wrapper"><table>';
    markdownitRef.current.renderer.rules.table_close = () => '</table></div>';
  }, []);

  return (
    <div
      className={classNames(className, {
        [styles['common-markdown-it']]: type === '',
        [styles['common-markdown-it-thinking']]: type === 'thinking',
      })}
      style={style}
      dangerouslySetInnerHTML={{ __html: markdownitRef?.current?.render(content)?.replace(/\\n/g, '<br/>') }}
    />
  );
};

export default MarkdownIt;
