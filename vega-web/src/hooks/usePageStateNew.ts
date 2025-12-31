import { useEffect, useState } from 'react';

const INIT_STATE = {
  page: 1,
  limit: 50,
  count: 0,
  direction: 'desc',
  sort: 'update_time',
};
type StateConfigType = {
  page?: number;
  limit?: number;
  count?: number;
  direction?: string;
  sort?: string;
};
const usePageState = (paginationConfig: StateConfigType = INIT_STATE) => {
  const [pageState, setPageState] = useState({ ...INIT_STATE, ...paginationConfig });

  useEffect(() => {
    onUpdateState({ count: pageState?.count || 0 });
  }, [pageState?.count]);

  const onUpdateState = (data: StateConfigType) => {
    if (data.limit !== pageState.limit) {
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
      pageSize: pageState.limit,
    },
    onUpdateState,
  };
};

export default usePageState;
