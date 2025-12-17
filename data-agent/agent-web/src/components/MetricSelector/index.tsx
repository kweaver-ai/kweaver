import { useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button } from 'antd';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { type MetricModelType } from '@/apis/data-model';
import { MetricSelectorStore, MetricSelectorContext } from './store';
import GroupList from './GroupList';
import MetricList from './MetricList';
import styles from './index.module.less';

interface MetricSelectorProps {
  onCancel: () => void;
  onConfirm: (metrics: Array<MetricModelType>) => void;
}

const MetricSelector = observer(({ onCancel, onConfirm }: MetricSelectorProps) => {
  const [store] = useState(new MetricSelectorStore());

  return (
    <MetricSelectorContext.Provider value={store}>
      <Modal
        title={intl.get('dataAgent.selectIndicator')}
        open
        centered
        destroyOnHidden
        maskClosable={false}
        width={800}
        onCancel={onCancel}
        footer={[
          <Button
            key="submit"
            type="primary"
            className="dip-min-width-72"
            disabled={!store.selectedMetrics.length}
            onClick={() => onConfirm(store.selectedMetrics)}
          >
            {intl.get('dataAgent.ok')}
          </Button>,
          <Button key="cancel" className="dip-min-width-72" onClick={onCancel}>
            {intl.get('dataAgent.cancel')}
          </Button>,
        ]}
      >
        <div className={classNames('dip-flex', styles['container'])}>
          <div className={styles['group']}>
            <GroupList />
          </div>
          <div className="dip-flex-item-full-width">
            <MetricList />
          </div>
        </div>
      </Modal>
    </MetricSelectorContext.Provider>
  );
});

export default MetricSelector;
