/**
 * @description 文本组件，格式化文本(Text)、标题(Title)，统一样式
 */
import classnames from 'classnames';

import TextBase, { type TextProps } from './TextBase';

const Text = TextBase;
const Title = (props: TextProps) => <TextBase strong={6} {...props} className={classnames('g-c-title', props.className)} />;

export { Text, Title };
export type { TextProps };
