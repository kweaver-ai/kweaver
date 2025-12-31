import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { LeftOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import classNames from 'classnames';
import { METRIC_TAB_KEYS } from '@/hooks/useConstants';
import api from '@/services/data-analysis/metric-model';
import { Drawer, Button, Title } from '@/web-library/common';
import Detail from '../Detail';
import Preview from '../Preview';
import styles from './index.module.less';

const DrawerTitle = (props: any) => {
  const { title, currentTab, showTabs, onClose, onChangeTab } = props;

  const items = [
    { key: METRIC_TAB_KEYS.DETAIL, label: intl.get('MetricModel.metricDetail') },
    { key: METRIC_TAB_KEYS.PREVIEW, label: intl.get('Global.dataPreview') },
  ];

  return (
    <div className={styles['detail-and-preview-title']}>
      <div className="g-flex-align-center" style={{ minWidth: 200 }}>
        <Button className="g-mr-2" type="text" size="small" icon={<LeftOutlined />} onClick={onClose}>
          {intl.get('Global.back')}
        </Button>
        <Title ellipsis>{title}</Title>
      </div>
      {showTabs && <Tabs className="g-w-100" activeKey={currentTab} items={items} centered={true} style={{ marginRight: 200 }} onChange={onChangeTab} />}
    </div>
  );
};

const DetailAndPreviewDrawer = (props: any) => {
  const { previewData, initTabActiveKey = METRIC_TAB_KEYS.DETAIL, onlyOneTab = false, onClose } = props;

  const [loading, setLoading] = useState(false);
  const [sourceData, setSourceData] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState(initTabActiveKey);

  useEffect(() => {
    if (previewData?._previewId) {
      getDetailData();
    } else {
      setSourceData(previewData);
    }
  }, [previewData?._previewId]);

  const getDetailData = async () => {
    try {
      setLoading(true);
      const result = await api.getMetricModelById([previewData?._previewId]);
      setLoading(false);
      setSourceData({ ...result, _previewId: result?.id });
    } catch (error) {
      setLoading(false);
    }
  };

  const onChangeTab = (key: string) => setCurrentTab(key);

  return (
    <Drawer
      className={classNames(styles['detail-and-preview-drawer-root'])}
      open={true}
      title={<DrawerTitle title={previewData?.name} currentTab={currentTab} showTabs={!onlyOneTab} onClose={onClose} onChangeTab={onChangeTab} />}
      width={'100%'}
      closable={false}
      maskClosable={true}
      onClose={onClose}
    >
      {currentTab === METRIC_TAB_KEYS.DETAIL && <Detail sourceData={sourceData} loading={loading} />}
      {currentTab === METRIC_TAB_KEYS.PREVIEW && !!sourceData && <Preview previewData={sourceData} />}
    </Drawer>
  );
};

export default DetailAndPreviewDrawer;
