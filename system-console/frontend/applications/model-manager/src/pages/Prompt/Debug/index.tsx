import { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Dropdown } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ModelDataType } from '@/pages/ModelManagement/types';

import ENUMS from '@/enums';
import SERVICE from '@/services';
import { Title, Button, IconFont } from '@/common';

import ModelConfig from './ModelConfig';
import LlmConfig from './LlmConfig';

import styles from './index.module.less';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

type DebugProps = {
  visible: boolean;
  variables: string[];
  selectedPrompt: any;
  onCloseDebug: () => void;
};

const Debug = (props: DebugProps) => {
  const { visible, variables, selectedPrompt, onCloseDebug } = props;

  const [modelList, setModelList] = useState<ModelDataType[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(undefined);

  const MODEL_PARA = [
    {
      key: 'temperature',
      value: 1,
      label: intl.get('Prompt.debug.temperatureLabel'),
      tip: intl.get('Prompt.debug.temperatureLabel'),
      props: { min: 0, max: 2, step: 0.1, precision: 2 },
    },
    {
      key: 'top_p',
      value: 1,
      label: intl.get('Prompt.debug.topPLabel'),
      tip: intl.get('Prompt.debug.topPTip'),
      props: { min: 0, max: 1, step: 0.1, precision: 2 },
    },
    {
      key: 'max_tokens',
      value: 1000,
      label: intl.get('Prompt.debug.maxTokensLabel'),
      tip: intl.get('Prompt.debug.maxTokensTip'),
      props: { min: 10, max: 1000, step: 1, precision: 0 },
    },
    {
      key: 'top_k',
      value: 1,
      label: intl.get('Prompt.debug.topKLabel'),
      tip: intl.get('Prompt.debug.topKTip'),
      props: { min: 1, max: 1000, step: 1, precision: 0 },
    },
    {
      key: 'presence_penalty',
      value: 0,
      label: intl.get('Prompt.debug.presencePenaltyLabel'),
      tip: intl.get('Prompt.debug.presencePenaltyTip'),
      props: { min: -2, max: 2, step: 0.1, precision: 2 },
    },
    {
      key: 'frequency_penalty',
      value: 0,
      label: intl.get('Prompt.debug.frequencyPenaltyLabel'),
      tip: intl.get('Prompt.debug.frequencyPenaltyTip'),
      props: { min: -2, max: 2, step: 0.1, precision: 2 },
    },
  ];

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    try {
      const postData = { page: 1, size: 100 };
      const result = await SERVICE.llm.llmGetList(postData);
      if (!result) return;
      setModelList(result.data);
      const new_MODEL_PARA = _.cloneDeep(MODEL_PARA);
      new_MODEL_PARA[2].value = 1000;
      new_MODEL_PARA[2].props.max = result.data[0]?.max_model_len * 1000;
      setSelectedModel({ ...result.data[0], model_para: new_MODEL_PARA });
    } catch (error) {
      console.log(error);
    }
  };

  /** 切换模型 */
  const onChangeModel = (id: string) => {
    const selected: ModelDataType | undefined = _.find(modelList, (item: ModelDataType) => item.model_id === id);
    const new_MODEL_PARA = _.cloneDeep(MODEL_PARA);
    new_MODEL_PARA[2].value = 1000;
    new_MODEL_PARA[2].props.max = (selected as ModelDataType)?.max_model_len * 1000;
    setSelectedModel({ ...selected, model_para: new_MODEL_PARA });
  };

  const onChangeSelectData = (data: any) => setSelectedModel(data);

  const modelIcon = MODEL_ICON_KV[(selectedModel as ModelDataType)?.model_series]?.icon;

  return (
    <div className={styles['page-prompt-content-debug-root']} style={{ height: `calc(100% + ${visible ? 12 : 0}px)` }}>
      <div className='g-flex-space-between' style={{ marginTop: -12 }}>
        <Title noHeight>{intl.get('Prompt.debug.index')}</Title>
        <Button.Icon icon={<IconFont type='icon-dip-close' />} onClick={onCloseDebug} />
      </div>
      <Dropdown
        trigger={['click']}
        popupRender={() => <ModelConfig source={selectedModel} modelList={modelList} onChangeModel={onChangeModel} onChangeSelectData={onChangeSelectData} />}
      >
        <div className={styles['debug-llm-dropdown']}>
          <div className='g-flex ' title={selectedModel?.model_name}>
            {modelIcon && <img src={modelIcon} className='g-mr-2' style={{ width: 20, height: 20 }} />}
            <div className='g-ellipsis-1'>{selectedModel?.model_name}</div>
          </div>
          <SettingOutlined />
        </div>
      </Dropdown>
      <LlmConfig variables={variables} selectedModel={selectedModel} selectedPrompt={selectedPrompt} />
    </div>
  );
};

export default Debug;
