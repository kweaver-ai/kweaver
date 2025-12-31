import { useState } from 'react';

const INIT_STATE = {
  offset: 0,
  limit: 20,
  direction: 'desc',
  sort: 'update_time',
};
export type StateConfigType = {
  offset?: number;
  limit?: number;
  direction?: string;
  sort?: string;
};

interface ReturnObj {
  pageState: Required<StateConfigType>;
  pagination: {
    total: number;
    current: number;
    pageSize: number;
  };
  onUpdateState: (data: StateConfigType & { total?: number }) => void;
}

const usePageState = (paginationConfig: StateConfigType & { total?: number } = INIT_STATE): ReturnObj => {
  const { total: totalProps, ...rest } = paginationConfig;
  const [pageState, setPageState] = useState<Required<StateConfigType>>({ ...INIT_STATE, ...rest });
  const [total, setTotal] = useState(totalProps || 0);

  const onUpdateState = (data: StateConfigType & { total?: number }) => {
    const { total: totalParam, ...rest } = data;
    if (data.limit !== pageState.limit) {
      setPageState({ ...INIT_STATE, ...rest, offset: 0 });
      setTotal(totalParam || 0);
    } else {
      setPageState({ ...INIT_STATE, ...pageState, ...rest });
      setTotal(totalParam || 0);
    }
  };

  return {
    pageState,
    pagination: {
      total: total,
      current: (pageState.offset || 0) / (!pageState.limit || pageState.limit === -1 ? 20 : pageState.limit) + 1,
      pageSize: pageState.limit === -1 ? 20 : pageState.limit,
    },
    onUpdateState,
  };
};

export default usePageState;
