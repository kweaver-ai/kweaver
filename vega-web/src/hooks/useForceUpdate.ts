import { useState, useCallback } from 'react';

/** 强制更新 */
const useForceUpdate = () => {
  const [, setValue] = useState(0);
  return useCallback(() => {
    setValue((val: number) => (val + 1) % (Number.MAX_SAFE_INTEGER - 1));
  }, []);
};

export default useForceUpdate;
