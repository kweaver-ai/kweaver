import React, { FC, useState } from "react";
import { clearUserInfo, signup } from "../../core/auth";
import { Props } from "./declare";
import { Modal, Button } from "antd";
import __ from "./locale";

export const CDLManage: FC<Props> = ({ entry, label, prefix }) => {
    const [isShow, setIsShow] = useState(false);

    const {
        protocol,
        // 带有端口=hostname+port
        host,
        // 不带端口
        hostname,
    } = window.location;
    const CDLAddr = `${protocol}//${host}${prefix}${entry.replace(
        /\/\/ip:port/,
        ""
    )}`;
    const OKJump = () => {
        window.open(CDLAddr, "_blank");
        setIsShow(false);
    };

    React.useEffect(() => {
        setIsShow(true);
    }, []);

    return (
        <Modal
            title={__("您即将前往新的页面")}
            wrapClassName="lang-modal"
            open={isShow}
            okText={__("确定")}
            cancelText={__("取消")}
            onOk={OKJump}
            onCancel={() => {
                window.history.go(-1);
                setTimeout(() => {
                    window.location.reload();
                }, 10);
            }}
            footer={[
                <Button
                    type="primary"
                    onClick={OKJump}
                    style={{ width: "74px" }}
                >
                    {__("确定")}
                </Button>,
                <Button
                    type="default"
                    onClick={() => {
                        window.history.go(-1);
                        setTimeout(() => {
                            window.location.reload();
                        }, 10);
                    }}
                    style={{ width: "74px" }}
                >
                    {__("取消")}
                </Button>,
            ]}
        >
            <div>{__("确定前往${label}界面吗？", { label })}</div>
        </Modal>
    );
};
