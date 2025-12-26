/**
 * 模拟类组件forceUpdate的hook
 */
import { useState, useCallback } from 'react';

export default function useForceUpdate() {
  const [, setValue] = useState(0);
  return useCallback(() => {
    setValue((val: number) => (val + 1) % (Number.MAX_SAFE_INTEGER - 1));
  }, []);

  // const [, forceUpdate] = useReducer(x => x + 1, 0);
  // return forceUpdate;
}
