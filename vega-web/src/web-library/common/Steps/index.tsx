/**
 * @description 步骤条，对 antd 的 Steps 组件进行拓展
 */
import { Steps as AntdSteps } from 'antd';
import GapIcon from './GapIcon';

export type StepsProps = typeof AntdSteps & {
  /**
   * 预设输入框-适配中文输入法
   */
  GapIcon: typeof GapIcon;
};

const Steps = Object.assign(AntdSteps, {
  GapIcon: GapIcon,
}) as StepsProps;

export default Steps;
