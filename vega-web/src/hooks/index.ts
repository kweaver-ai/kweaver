import useConstants from './useConstants';
import useDataView from './useDataView';
import useForceUpdate from './useForceUpdate';
import { globalInitData, globalConfigReduce, useGlobalContext, GlobalProvider } from './useGlobal';
import usePageState from './usePageState';
import usePageStateNew from './usePageStateNew';
import useSize from './useSize';

const HOOKS = {
  useForceUpdate,
  globalInitData,
  globalConfigReduce,
  useGlobalContext,
  GlobalProvider,
  usePageState,
  usePageStateNew,
  useSize,
  useConstants,
  useDataView,
};

export default HOOKS;
