import { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { Text, Title, Drawer } from '@/common';

import GuideTable, { sourceData } from './GuideTable';
import GuideMethod1 from './GuideMethod1';
import GuideMethod2 from './GuideMethod2';

export type GuideDrawerProps = {
  open: boolean;
  source: any;
  onCancel: () => void;
};

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  readOnly: true,
  domReadOnly: true,
  folding: false,
  overviewRulerLanes: 0,

  renderLineHighlight: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
    useShadows: false,
    handleMouseWheel: true, // 允许编辑器响应滚轮事件
    alwaysConsumeMouseWheel: false, // 防止编辑器总是消费滚轮事件
  },
};

const GuideDrawer: React.FC<GuideDrawerProps> = props => {
  const { open, source, onCancel } = props;

  const [dataSource, setDataSource] = useState(sourceData());
  const [parameter, setParameter] = useState({ url: '{{base_url}}', name: 'AIshuReader', api_key: '$api_key' });

  useEffect(() => {
    const host = window.location?.host;
    const newData = _.cloneDeep(dataSource);
    newData[0].value = `https://${host}/api/mf-model-api/v1/`;

    setDataSource(newData);
    setParameter({ ...parameter, name: source?.model_name || 'AIshuReader', url: host });
  }, [source]);

  return (
    <Drawer title={intl.get('ModelManagement.apiGuide.title')} width={800} open={open} onClose={onCancel}>
      <Text className='g-mb-4'>{intl.get('ModelManagement.apiGuide.apiTitle')}</Text>

      <GuideTable dataSource={dataSource} />

      <Title className='g-mt-6' level={4}>
        {intl.get('ModelManagement.apiGuide.initiateRequest')}
      </Title>

      <GuideMethod1 parameter={parameter} editorOptions={EDITOR_OPTIONS} />

      <GuideMethod2 parameter={parameter} editorOptions={EDITOR_OPTIONS} />
    </Drawer>
  );
};

export default GuideDrawer;
