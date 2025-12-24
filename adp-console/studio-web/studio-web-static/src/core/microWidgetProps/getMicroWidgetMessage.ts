import { message } from "antd";
import { MicroWidgetMessageType } from "./types";

export const getMicroWidgetMessage = (): MicroWidgetMessageType => {
    const config = () => {
        console.error("toast未开放config配置");
    };
    const destroy = () => {
        console.error("toast未开放destroy方法");
    };
    return { ...message, config, destroy };
};
