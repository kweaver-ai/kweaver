import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Graph } from '@antv/x6';
import { useLocation } from 'react-router-dom';

import HOOKS from '@/hooks';
import { GetStateAction, Updater } from '@/hooks/useImmerState';
import { getBenchmarkConfigById } from '@/services/benchmark';

import LoadingMask from '@/components/LoadingMask';

import { EditBenchmarkConfigDataType } from '../types';
import { generateBenchmarkEditConfigDataByViewConfigData } from './ConfigGraph/assistant';

const { useImmerState } = HOOKS;

type InitialStateProps = {
  configData: EditBenchmarkConfigDataType | null;
  graph: Graph | null;
  readOnly: boolean;
  deleteAdapterFilePath: string[]; // 要删除的adapter文件key
};
const initialState: InitialStateProps = {
  configData: null,
  graph: null,
  readOnly: false,
  deleteAdapterFilePath: [],
};

interface ContextProps {
  configGraphStore: InitialStateProps;
  setConfigGraphStore: Updater<InitialStateProps>;
  getLatestStore: GetStateAction<InitialStateProps>; // 获取store中最新的数据
  refreshConfigData: (id: string) => void;
}

const context = createContext({} as ContextProps);

context.displayName = 'configGraphStore';

export const useConfigGraphContext = () => useContext(context);

const ConfigGraphContext: React.FC<any> = ({ children }) => {
  const location = useLocation<any>();
  const [store, setStore, getLatestStore] = useImmerState<InitialStateProps>(initialState);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const configId = location.state?.configId;
    configId && getConfigData(configId);
  }, []);

  const getConfigData = async (id: string) => {
    const res: any = await getBenchmarkConfigById(id);
    setLoading(false);
    if (res) {
      const readOnly = location.state?.readOnly || false;
      setStore(preState => ({
        ...preState,
        readOnly,
        configData: generateBenchmarkEditConfigDataByViewConfigData({ ...res, id }),
      }));
    }
  };

  return (
    <context.Provider
      value={{
        configGraphStore: store,
        setConfigGraphStore: setStore,
        getLatestStore,
        refreshConfigData: getConfigData,
      }}
    >
      <LoadingMask loading={loading} />
      {store.configData && children}
    </context.Provider>
  );
};

export default ConfigGraphContext;
