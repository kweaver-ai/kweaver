import React, { createContext, useContext } from 'react';
import { useSetState } from 'ahooks';
import { noop } from 'lodash';
import { defaultValue, getOptionsWithDefaultValue } from '../utils';
import type { CronProps, Options } from '../types';
import type { SetState } from 'ahooks/lib/useSetState';

type StateProps = Options;

interface ContextProps {
  state: StateProps;
  updateSetState: SetState<StateProps>;
}

const Context = createContext<ContextProps>({
  state: defaultValue,
  updateSetState: noop,
});

export const ContextProvider = React.memo<{
  children: React.ReactNode;
  value?: CronProps['options'];
}>(({ children, value }) => {
  const [state, updateSetState] = useSetState<StateProps>(getOptionsWithDefaultValue(value));

  return <Context.Provider value={{ state, updateSetState }}>{children}</Context.Provider>;
});

export const useStateContext = (): ContextProps => useContext(Context);
