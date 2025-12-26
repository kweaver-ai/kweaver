import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Breadcrumb, Typography, Tabs, type TabsProps } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

import { Title } from '@/common';

import styles from '../index.module.less';

const items: TabsProps['items'] = [
  { key: 'description', label: '评测数据介绍' },
  { key: 'fileAndVersions', label: '文件与版本' },
  { key: 'setting', label: '设置' },
];

type HeaderProps = {
  activeKey: string;
  sourceData: any;
  goBack: () => void;
  onChangeActive: (key: string) => void;
};

const Header = (props: HeaderProps) => {
  const { activeKey, sourceData, goBack, onChangeActive } = props;
  const [expanded, setExpanded] = useState(false); // 展开/折叠

  /** 展开/折叠 */
  const onExpand = (_: any, info: any) => setExpanded(info.expanded);

  return (
    <React.Fragment>
      <Breadcrumb separator='>' items={[{ title: <a>评测数据</a>, onClick: goBack }, { title: sourceData?.name }]} />
      <Title className='g-mt-4' level={7}>
        {sourceData?.name}
      </Title>
      <Typography.Paragraph className='g-mt-2 g-c-text' ellipsis={{ rows: 1, expandable: 'collapsible', expanded, onExpand: onExpand }}>
        {sourceData?.description}
      </Typography.Paragraph>
      <div className='g-mt-2 g-flex-align-center'>
        <div className='g-mr-6 g-flex-align-center'>
          <UserOutlined className='g-mr-2' />
          {sourceData?.create_user}
        </div>
        <div className='g-flex-align-center'>
          <ClockCircleOutlined className='g-mr-2' />
          {dayjs(sourceData?.update_time).format('YYYY/MM/DD HH:mm:ss')}
        </div>
      </div>
      <Tabs
        className={styles['page-evaluation-data-detail-title-tabs']}
        items={items}
        activeKey={activeKey}
        defaultActiveKey='description'
        onChange={(key: string) => onChangeActive(key)}
      />
    </React.Fragment>
  );
};

export default Header;
