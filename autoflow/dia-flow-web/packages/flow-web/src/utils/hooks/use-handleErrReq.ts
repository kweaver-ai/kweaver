import { useTranslate } from "@applet/common";
import { message } from "antd";
import { useCallback } from "react";

export interface IHandleErrReq {
    error: any;
}

// 请求错误信息处理
export const useHandleErrReq = () => {
    const t = useTranslate();
    const handleReqCommonErr = (error: any) => {
        if (!error) {
            return;
        }
        const { status, data = {} } = error;
        message.destroy()

        if (data?.message || data?.description) {
            message.warning(data?.message || data?.description);
            return;
        }

        if (status === 500 || status === 503 || status === 404) {
            message.warning(t("err.service", "无法连接服务器"));
            return;
        }

        message.warning(t("err.unknownError", "未知错误"));
    };

    return useCallback(({ error }: IHandleErrReq) => {
        if (!navigator.onLine) {
            message.warning(t("err.noNetwork", "无法连接网络"));
            return;
        }

        if (error?.status === 401) {
            return;
        }

        switch (error?.data?.code) {
            case "ContentAutomation.UnAuthorization":
                break;
            case "ContentAutomation.InternalError":
            case "ContentAutomation.InternalError.ErrorDepencyService":
                message.warning(t("err.internalError", "服务器内部错误"));
                break;
            case 403001171:
                message.warning(t("err.frozen", "您的账号已被冻结"));
                break;
            default:
                handleReqCommonErr(error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
