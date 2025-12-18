import { useRef, useEffect } from "react";

export function useMount(callback: () => (() => void) | void) {
    const flag = useRef(false);
    const dispose = useRef<void | (() => void)>();

    if (!flag.current) {
        dispose.current = callback();
        flag.current = true;
    }

    useEffect(() => () => dispose.current && dispose.current(), []);
}
