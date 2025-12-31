import classnames from 'classnames';
import styles from './index.module.less';

export type TextProps = {
  level?: number;
  style?: React.CSSProperties;
  align?: 'start' | 'center' | 'end';
  strong?: number;
  noHeight?: boolean;
  className?: string;
  children?: React.ReactNode;
  block?: boolean;
  ellipsis?: boolean;
  subText?: boolean;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

/**
 * 文本组件
 * @param {Object}                 props - 组件属性
 * @param {React.CSSProperties}    [props.style]       - 内联样式
 * @param {string}                 [props.align]       - 剧中方式 start | center | end
 * @param {number}                 [props.level]       - 字体大小和行高级别, 默认为: 2, 1:12px | 2:14px | 3:16px | ...
 * @param {number}                 [props.strong]      - 字体粗细级别，默认为: 4, 1:100 | 2:200 | 3:300 | ...
 * @param {boolean}                [props.noHeight]    - 文字是否有高度，默认为: false
 * @param {string}                 [props.className]   - class名
 * @param {boolean}                [props.ellipsis]    - 单行超长是否显示省略号
 * @param {boolean}                [props.subText]     - 次文本
 * @param {string}                 [props.title]       - 原生html属性
 * @param {Function}               [props.onClick]     - 点击事件
 * @returns Component
 */
const TextBase = (props: TextProps) => {
  const { style, align, level = 2, strong = 4, noHeight = false, className, block, ellipsis, subText, title, onClick } = props;

  return (
    <div
      className={classnames(
        styles[`common-text-align-${align}`],
        styles[`common-text-font-strong-${strong}`],
        styles[`common-text-display-${block ? 'block' : 'inline-block'}`],
        styles[`common-text${noHeight ? '-no-height' : ''}-font-${level}`],
        { 'g-ellipsis-1': ellipsis },
        { 'g-c-text-sub': subText },
        className
      )}
      title={title}
      style={style}
      onClick={onClick}
    >
      {props.children}
    </div>
  );
};

export default TextBase;
