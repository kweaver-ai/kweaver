/*
 * @Author: 林峰(Gabriel_lin) Gabriel.lin@aishu.cn
 * @Date: 2023-10-26 14:44:54
 * @LastEditors: 林峰(Gabriel_lin) Gabriel.lin@aishu.cn
 * @LastEditTime: 2023-12-05 14:36:45
 */
import React from 'react';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import classnames from 'classnames';

import './style.less';

export interface AdTabType extends TabsProps {
  className?: string;
}

const AdTab: React.FC<AdTabType> = props => {
  const { className, ...restTabsProps } = props;
  return <Tabs className={classnames(className, 'ad-tab ad-w-100 ad-h-100')} {...restTabsProps} />;
};

export default AdTab;
