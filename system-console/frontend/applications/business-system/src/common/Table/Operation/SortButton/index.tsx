import _ from 'lodash';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';

import { Button, IconFont } from '@/common';

export type SortButtonProps = {
  items: MenuProps['items'];
  order: string;
  rule: string;
  onChange: (data: any) => void;
  className?: string;
  style?: React.CSSProperties;
};

const SortButton: React.FC<SortButtonProps> = props => {
  const { className, style, items, order, rule, onChange } = props;
  return (
    <Dropdown
      trigger={['click']}
      placement='bottomRight'
      menu={{
        items: _.map(items, (item: any) => {
          return {
            ...item,
            ...(rule === item.key
              ? { icon: order ? <SortAscendingOutlined title='排序' /> : <SortDescendingOutlined title='排序' /> }
              : { style: { marginLeft: 22 } }),
          };
        }),
        onClick: onChange,
      }}
    >
      <Button.Icon className={className} icon={<IconFont type='icon-dip-sort-descending' title='排序' />} style={{ ...style }} />
    </Dropdown>
  );
};

export default SortButton;
