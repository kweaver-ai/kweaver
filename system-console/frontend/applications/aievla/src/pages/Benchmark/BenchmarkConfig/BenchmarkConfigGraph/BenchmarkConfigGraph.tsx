import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import Hooks from '@/hooks';
import { tipModalFunc } from '@/components/TipModal';
import AdExitBar from '@/components/AdExitBar/AdExitBar';
import AdX6TopToolBar from '@/components/AdReactX6/ToolBar/AdX6TopToolBar/AdX6TopToolBar';

import OperateBtn from './OperateBtn/OperateBtn';
import ConfigGraph from './ConfigGraph/ConfigGraph';
import { useConfigGraphContext } from './ConfigGraphContext';
import { generateBenchmarkEditConfigDataByX6Data, getConfigNodeInitPosition } from './ConfigGraph/assistant';

const { useAdHistory } = Hooks;
const BenchmarkConfigGraph = () => {
  const history = useAdHistory(); // 路由

  const { configGraphStore } = useConfigGraphContext();
  const { configData, graph, readOnly } = configGraphStore;
  const [configName, setConfigName] = useState(configData!.name);

  /** 获取配置是否发生变化 */
  const getConfigChange = () => {
    const configNodeInitPosition = getConfigNodeInitPosition();
    const previousConfigData: any = _.cloneDeep(configData!);
    delete previousConfigData.id;
    Object.keys(previousConfigData).forEach(key => {
      if (previousConfigData[key] === undefined && key !== 'x' && key !== 'y') {
        delete previousConfigData[key];
      }
    });
    const currentConfigData = generateBenchmarkEditConfigDataByX6Data(graph!, false);
    let isChange = false;
    if (previousConfigData.x === undefined && currentConfigData.x !== configNodeInitPosition.x) {
      isChange = true;
    }
    if (previousConfigData.y === undefined && currentConfigData.y !== configNodeInitPosition.y) {
      isChange = true;
    }
    if (!isChange) {
      Object.keys(previousConfigData).forEach(key => {
        if (!['task', 'x', 'y'].includes(key)) {
          if (previousConfigData[key] !== currentConfigData[key]) isChange = true;
        }
      });
    }
    if (isChange) return true;
    return !_.isEqual(previousConfigData.task, currentConfigData.task);
  };

  const updateConfigName = (value: string) => {
    setConfigName(value);
  };

  return (
    <div className='ad-w-100 ad-h-100 ad-flex-column'>
      <AdExitBar
        style={{ height: 48 }}
        onExit={async () => {
          if (!readOnly) {
            const isChange = getConfigChange();
            console.log(isChange, 'isChange');
            if (isChange) {
              const isOk = await tipModalFunc({
                title: intl.get('global.existTitle'),
                content: intl.get('benchmark.config.exitTips'),
              });
              if (!isOk) return;
            }
          }
          history.goBack();
        }}
        extraContent={
          <div className='ad-space-between'>
            <span className='ad-align-center'>
              <div className='ad-ellipsis' title={configData!.name} style={{ maxWidth: 120 }}>
                {configName}
              </div>
            </span>
            <AdX6TopToolBar graph={graph!} />
            <span style={{ visibility: readOnly ? 'hidden' : 'visible' }}>
              <OperateBtn />
            </span>
          </div>
        }
      />
      <div className='ad-flex-item-full-height'>
        <ConfigGraph updateConfigName={updateConfigName} />
      </div>
    </div>
  );
};

export default BenchmarkConfigGraph;
