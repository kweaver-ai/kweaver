import { useContext } from "react";
import { MicroAppContext } from "../components/micro-app/common";
import { useEvent } from "./use-event";
import { useTranslate } from "./use-translate";

let networkMessageVisible = false;

export function useIsOnline() {
    const { message } = useContext(MicroAppContext);
    const t = useTranslate();

    return useEvent(() => {
        if (!navigator.onLine && !networkMessageVisible) {
            networkMessageVisible = true;
            message.warning(
                t("common.err.noNetwork", "无法连接网络"),
                undefined,
                () => {
                    networkMessageVisible = false;
                }
            );
        }

        return navigator.onLine;
    });
}
