/**
 * @description 选择组件，对 antd 的 Select 组件进行拓展
 * 增加了 LabelSelect 组件，用以组合显示 label 和 Select
 */
import { Select as AntdSelect } from 'antd';

import LabelSelect from './LabelSelect';

export type SelectProps = typeof AntdSelect & {
  /**
   * 预设选择框-label
   * @param {string} label - 标签
   * @param {string} dir - 方向
   */
  LabelSelect: typeof LabelSelect;
};

const Select = Object.assign(AntdSelect, {
  LabelSelect,
}) as SelectProps;

export default Select;
