import { useEffect, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import { Text, Title, Drawer, Button, MonacoEditor } from '@/common';

import GuideTable, { sourceData } from './GuideTable';

import styles from './index.module.less';

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

const getCode = (type: string, url: string, modelName: string) => {
  if (type === 'embedding') {
    return `curl 'https://${url}/api/mf-model-api/v1/small-model/embeddings' \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer $api_key' \\
-d '{
	"model":"${modelName}",
	"input":["Hi, who are you?"]
}' -k`;
  }

  if (type === 'reranker') {
    return `curl 'https://${url}/api/mf-model-api/v1/small-model/reranker' \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer $api_key' \\
-d '{
  "model": "${modelName}",
  "query": "who are",
  "documents": [
    "Hi, who are you?",
    "hello word",
    "come on"
  ]
}' -k`;
  }

  return '';
};

const GuideDrawer: React.FC<GuideDrawerProps> = props => {
  const host = window.location?.host;
  const { open, source, onCancel } = props;

  const [dataSource, setDataSource] = useState(sourceData());
  const [parameter, setParameter] = useState({ url: '{{base_url}}', name: 'AIshuReader', api_key: '$api_key' });

  useEffect(() => {
    const newData = _.cloneDeep(dataSource);
    newData[0].value = `https://${host}/api/mf-model-api/v1/`;

    setDataSource(newData);
    setParameter({ ...parameter, name: source?.model_name || 'AIshuReader', url: host });
  }, [source]);

  const code = getCode(source?.model_type, host, source?.model_name);
  const height: any = {
    embedding: '146px',
    reranker: '236px',
  };

  return (
    <Drawer title={intl.get('ModelManagement.apiGuide.title')} width={800} open={open} onClose={onCancel}>
      <Text className='g-mb-4'>{intl.get('ModelManagement.apiGuide.apiTitle')}</Text>

      <GuideTable dataSource={dataSource} />

      <Title className='g-mt-6' level={4}>
        {intl.get('ModelManagement.apiGuide.initiateRequest')}
      </Title>

      <div>
        <Title className='g-mt-4'>{intl.get('ModelManagement.apiGuide.method1_2')}</Title>
        <div className={classNames('g-mt-3 g-pt-2 g-border g-bg-hover', styles['guide-editor'])} style={{ borderRadius: 6 }}>
          <Button.Copy copyText={code} />
          <MonacoEditor height={height[source?.model_type] || '100px'} defaultLanguage='json' value={code} options={EDITOR_OPTIONS} />
        </div>
      </div>
    </Drawer>
  );
};

export default GuideDrawer;
