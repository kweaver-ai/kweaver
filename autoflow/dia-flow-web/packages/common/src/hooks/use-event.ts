import { useCallback, useRef } from "react";

export function useEvent<T extends (...args: any[]) => any>(callback: T): T {
    const ref = useRef(callback);
    ref.current = callback;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback(
        ((...args: Parameters<T>) => ref.current(...args)) as T,
        []
    );
}
