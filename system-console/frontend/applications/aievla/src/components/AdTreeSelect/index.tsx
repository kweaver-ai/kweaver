import React from 'react';
import './style.less';
import type { TreeSelectProps } from 'antd';
import { TreeSelect } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const AdTreeSelect: React.FC<TreeSelectProps> = (props: any) => {
  const { treeExpandAction = 'click', ...restProps } = props;
  return (
    <TreeSelect
      treeIcon
      treeLine={{
        showLeafIcon: false,
      }}
      getPopupContainer={triggerNode => triggerNode.parentElement! || document.getElementById('aievla-root')}
      switcherIcon={<DownOutlined />}
      treeExpandAction={treeExpandAction}
      {...restProps}
    />
  );
};

export default AdTreeSelect;
