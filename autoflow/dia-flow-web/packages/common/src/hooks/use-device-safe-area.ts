import { useContext, useState } from "react";
import { MicroAppContext } from "../components";
import { useMount } from "./use-mount";

export interface SafeArea {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export function useDeviceSafeArea() {
    const { microWidgetProps } = useContext(MicroAppContext);

    const [safeArea, setSafeArea] = useState<SafeArea>({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    });

    useMount(() => {
        const getDeviceSafeArea =
            microWidgetProps?.app?.jssdk?.getDeviceSafeArea;
        if (typeof getDeviceSafeArea === "function") {
            getDeviceSafeArea({
                data: {},
                success(res: any) {
                    if (res?.status) {
                        setSafeArea(res.data);
                    }
                },
            });
        }
    });

    return safeArea;
}
