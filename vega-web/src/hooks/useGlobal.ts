import { useContext, createContext } from 'react';
import _ from 'lodash';
import UTILS from '@/utils';

export type GlobalStore = object;
export const globalInitData: GlobalStore = {};

export interface GlobalContext {
  baseProps: any;
  modal: any;
  message: any;
}

/** context 相关 */
const store = createContext<GlobalContext | null>(null);
export const GlobalProvider = store.Provider;
export const useGlobalContext = () => useContext(store) as GlobalContext;

export const globalConfigReduce = (state: any, action: any) => {
  if (!action.key || !action.payload) return state;

  const { key, payload } = action;
  switch (key) {
    case 'init':
      state = payload;
      return state;
    case 'update': {
      const newState = _.cloneDeep(state);
      _.forEach(Object.keys(payload), (key) => {
        const keys = key.split('.');
        if (keys.length > 0) {
          UTILS.mergeObjectBasePath(newState, keys, payload[key]);
        } else {
          if (UTILS.isInObject(newState, key)) newState[key] = payload[key];
        }
      });
      return newState;
    }
    default:
      return state;
  }
};
