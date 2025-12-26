/**
 * @description 输入组件，对 antd 的 Input 组件进行拓展
 */
import { Input as AntdInput } from 'antd';

import Spell from './Spell';
import Search from './Search';

export type InputProps = typeof AntdInput & {
  /**
   * 预设输入框-适配中文输入法
   */
  Spell: typeof Spell;
  /**
   * 预设输入框-搜索
   * @default suffix={<IconFont type="icon-dip-search" style={{ color: '#d9d9d9' }} />}
   */
  Search: typeof Search;
};

const Input = Object.assign(AntdInput, {
  Spell,
  Search,
}) as InputProps;

export default Input;
