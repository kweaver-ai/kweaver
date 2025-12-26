/**
 * @description 按钮组件，对 antd 的 Form 组件进行拓展，
 * 增加了 ViewOrEditItem 预制 Form.Item
 */
import { Form as AntdForm } from 'antd';

import ViewOrEditItem from './ViewOrEditItem';

export type FormProps = typeof AntdForm & {
  /**
   * 预设Form.Item
   * 支持纯查看、编辑两种模式
   * @param props       FormProps Antd的Form组件props
   * @param {boolean}   [props.isView]      是否展示
   * @param {boolean}   [props.view]        是否为查看模式
   * @param {function}  [props.viewRender]  查看模式下的渲染函数
   */
  ViewOrEditItem: typeof ViewOrEditItem;
};

const Form = Object.assign(AntdForm, { ViewOrEditItem }) as FormProps;

export default Form;
