import { useMemo } from 'react';
import { useLocation } from 'react-router';

/**
 * 获取url中的参数信息
 */
export const useQuery = () => {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
};
