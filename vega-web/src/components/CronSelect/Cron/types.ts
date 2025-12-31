import React from 'react';
import { CronFieldName } from './utils';
import type { ButtonProps } from 'antd/lib/button';

type HTMLDivElementProps = Pick<React.HTMLAttributes<HTMLDivElement>, 'style' | 'className'>;

type PanelShow = {
  [key in CronFieldName]?: boolean;
};

export type CronFieldValues = {
  [key in CronFieldName]?: string;
};

export interface BaseConfigProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export interface CronFns {
  /** 解析Cron表达式到UI */
  onParse: () => Promise<any>;
  /** 获取值 */
  getValue: () => string;
}

export type BaseDetailConfig = {
  /** 是否显示 */
  visible?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 禁用的提示 */
  tooltip?: React.ReactNode;
};

type PanesDetailsOptions = {
  [key in CronFieldName]?: BaseDetailConfig;
};

export type Options = {
  /** 默认激活的 Tab */
  defaultTab: CronFieldName;
  /** 面板标题 */
  panelTitle?: React.ReactNode;
  /** 初始化最小年份 */
  minYear: number;
  /** 初始化最大年份 */
  maxYear: number;
  /** 是否显示配置面板右上角预览值 */
  showPreviewValue?: boolean;
  /** 面板配置项显示控制 */
  panesShow: PanelShow;
  /** 覆盖到面板详情各个配置项的显示或禁用控制（更加的粒度化） */
  panesDetailsOptions: PanesDetailsOptions;
  /** 关闭默认显示的页脚（采用自定义页脚默认会关闭） */
  showFooter: boolean;
  /** 默认的确认按钮的 Props */
  onOkBtnProps: ButtonProps;
};

export interface CronProps extends HTMLDivElementProps {
  /** Cron表达式，用来解析到UI */
  value?: string;
  /** 点击生成按钮时调用该回调 */
  onOk?: (value: string) => void;
  /** 获取组件方法 */
  getCronFns?: (cronFns: CronFns) => void;
  /** 自定义渲染页脚 */
  footer?: React.ReactNode;
  /** 配置项 */
  options?: Partial<Options>;
}
