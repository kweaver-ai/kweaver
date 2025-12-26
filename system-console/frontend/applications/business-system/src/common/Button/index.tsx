/**
 * @description 按钮组件，对 antd 的 Button 组件进行拓展，
 * 增加了 Create、Copy、Delete、Icon、Link 五个预制按钮
 */
import { Button as AntdButton } from 'antd';

import Create from './Create';
import Delete from './Delete';
import Icon from './Icon';
import Link from './Link';

export type ButtonProps = typeof AntdButton & {
  /**
   * 预设按钮-创建
   * @default type="primary" icon={<IconFont type="icon-dip-jia" />} 国际化文案=common.button.Create
   */
  Create: typeof Create;
  /**
   * 预设按钮-删除
   * @default icon="icon-lajitong" 国际化文案=common.button.Delete
   */
  Delete: typeof Delete;
  /**
   * 预设按钮-图标
   * @default color="default" variant="text"
   */
  Icon: typeof Icon;
  /**
   * 预设按钮-链接
   * @default type="link"
   */
  Link: typeof Link;
};

const Button = Object.assign(AntdButton, {
  Create: Create,
  Delete: Delete,
  Icon: Icon,
  Link: Link,
}) as ButtonProps;

export default Button;
