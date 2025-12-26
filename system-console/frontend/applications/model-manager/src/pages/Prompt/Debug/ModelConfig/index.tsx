import _ from 'lodash';
import intl from 'react-intl-universal';
import { Divider, Slider, Tooltip, InputNumber } from 'antd';
import { QuestionCircleFilled } from '@ant-design/icons';
import type { ModelDataType } from '@/pages/ModelManagement/types';

import ENUMS from '@/enums';
import { Title, Select } from '@/common';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

type ModelConfigProps = {
  source: any;
  modelList: ModelDataType[];
  onChangeModel: (id: string) => void;
  onChangeSelectData: (data: any) => void;
};

const ModelConfig = (props: ModelConfigProps) => {
  const { source, modelList, onChangeModel, onChangeSelectData } = props;

  const handleValueChange = (key: string, value: number) => {
    const newSource: any = _.cloneDeep(source);
    _.forEach(newSource?.model_para, item => {
      if (item.key === key) item.value = value;
    });
    onChangeSelectData(newSource);
  };

  return (
    <div className='g-p-4 g-dropdown-menu-root'>
      <Title noHeight>{intl.get('Prompt.debug.modelsAndParameter')}</Title>
      <Divider className='g-mt-3 g-mb-3' />
      <div>{intl.get('Prompt.debug.languageModel')}</div>
      <Select
        className='g-w-100 g-mt-2'
        value={source?.model_id}
        onChange={onChangeModel}
        options={_.map(modelList, item => {
          const modelIcon = MODEL_ICON_KV[item?.model_series]?.icon;
          return {
            value: item.model_id,
            label: (
              <div className='g-flex-align-center' title={item?.model_name}>
                {modelIcon && <img src={modelIcon} className='g-mr-2' style={{ width: 20, height: 20 }} />}
                <div className='g-ellipsis-1'>{item?.model_name}</div>
              </div>
            ),
          };
        })}
      />
      {_.map(source?.model_para, (item, index) => {
        const { key, value, label, props, tip } = item;
        return (
          <div key={index} className='g-mt-3'>
            <div>
              {label}
              <Tooltip title={tip}>
                <QuestionCircleFilled className='g-ml-2 g-c-disabled' />
              </Tooltip>
            </div>
            <div className='g-mt-2 g-flex-align-center'>
              <Slider
                style={{ flex: 1, minWidth: 0 }}
                {..._.pick(props, 'min', 'max', 'step')}
                value={value}
                onChange={value => handleValueChange(key, value)}
              />
              <InputNumber className='g-ml-4' size='small' {...props} value={value} onChange={(value: number) => handleValueChange(key, value)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelConfig;
