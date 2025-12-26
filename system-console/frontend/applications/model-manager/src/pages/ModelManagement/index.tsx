import intl from 'react-intl-universal';
import { Tabs, type TabsProps } from 'antd';

import { Title } from '@/common';

import LargeModel from './LargeModel';
import SmallModel from './SmallModel';

import styles from './index.module.less';

const ModelManagement: React.FC = () => {
  const items: TabsProps['items'] = [
    {
      key: 'large-model',
      label: <span className='g-ml-3'>{intl.get('ModelManagement.llm')}</span>,
      children: <LargeModel />,
    },
    { key: 'small-model', label: <span>{intl.get('ModelManagement.smallModel')}</span>, children: <SmallModel /> },
  ];

  return (
    <div className={styles['page-model-management']}>
      <Title>{intl.get('ModelManagement.modelManager')}</Title>
      <Tabs
        className='g-mt-2 '
        items={items}
        size='small'
        defaultActiveKey='large-model'
        style={{ height: 'calc(100% - 28px)' }}
        indicator={{ align: 'center', size: origin => origin + 24 }}
      />
    </div>
  );
};

export default ModelManagement;
