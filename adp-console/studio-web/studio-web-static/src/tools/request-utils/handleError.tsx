import React from "react";
import ErrorCode from "../request/errorCode/errorCode";
import { Modal } from "antd";
import __ from "./locale";

export const handleError = (error: any) => {
    Modal.error({
        title: __("错误"),
        okText: __("确定"),
        content: (
            <ErrorCode
                cause={error.cause}
                errorCode={error.code || "1"}
                description={error.message}
            />
        ),
    });
};
