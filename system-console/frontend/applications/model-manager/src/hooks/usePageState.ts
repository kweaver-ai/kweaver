import { useEffect, useState } from 'react';

const INIT_STATE = {
  page: 1,
  size: 20,
  count: 0,
  order: 'desc',
  rule: 'update_time',
};
type StateConfigType = {
  page?: number;
  size?: number;
  count?: number;
  order?: string;
  rule?: string;
};
const usePageState = (paginationConfig: StateConfigType = INIT_STATE) => {
  const [pageState, setPageState] = useState({ ...INIT_STATE, ...paginationConfig });

  useEffect(() => {
    onUpdateState({ count: pageState?.count || 0 });
  }, [pageState?.count]);

  const onUpdateState = (data: StateConfigType) => {
    if (data.size !== pageState.size) {
      setPageState({ ...pageState, ...data, page: 1 });
    } else {
      setPageState({ ...pageState, ...data });
    }
  };

  return {
    pageState,
    pagination: {
      total: pageState.count,
      current: pageState.page,
      pageSize: pageState.size,
    },
    onUpdateState,
  };
};

export default usePageState;
