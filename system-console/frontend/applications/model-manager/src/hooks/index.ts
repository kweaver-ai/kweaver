import useForceUpdate from './useForceUpdate';
import { globalInitData, globalConfigReduce, useGlobalContext, GlobalProvider } from './useGlobal';
import useNavigationGuard from './useNavigationGuard';
import usePageState from './usePageState';
import useSize from './useSize';
import useWindowSize from './useWindowSize';

const HOOKS = {
  useForceUpdate,
  globalInitData,
  globalConfigReduce,
  useGlobalContext,
  GlobalProvider,
  useNavigationGuard,
  usePageState,
  useSize,
  useWindowSize,
};

export default HOOKS;
