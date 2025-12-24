import React, { FC, useState } from "react";
import { Dropdown } from "antd";
import { CaretDownOutlined } from "@ant-design/icons";
import Icon from "@ant-design/icons";
import styles from "./styles.module.less";
import { ReactComponent as BusinessDomainIcon } from "./assets/BusinessDomainIcon.svg";
import { ReactComponent as BusinessDomainFilledIcon } from "./assets/BusinessDomainFilledIcon.svg";
import __ from "./locale";
import { BusinessDomainConfig } from "../../api/business-domain/declare";
import { session } from "../../core/mediator";

interface IProps {
    businessDomainList: BusinessDomainConfig[];
}

export const BusinessDomain: FC<IProps> = ({ businessDomainList }) => {
    const [open, setOpen] = useState(false);

    // 判断业务域是否是当前业务域
    const isCurrent = (item: BusinessDomainConfig) => {
        return item.id === session.get("studio.businessDomainID");
    };
    const currentDomain =
        businessDomainList.find((item) => isCurrent(item)) ||
        businessDomainList[0];

    const handleClick = (id: string) => {
        if (id !== currentDomain?.id) {
            session.set("studio.businessDomainID", id);
            window.location.reload();
        }
        setOpen(false);
    };

    const dropdownRender = () => (
        <div className={styles["dropdown-content"]}>
            <div className={styles["dropdown-header"]}>{__("业务域")}</div>
            <div className={styles["domain-list"]}>
                {businessDomainList.map((option) => (
                    <div
                        key={option.id}
                        className={`${styles["domain-item"]} ${
                            isCurrent(option)
                                ? styles["domain-item-current"]
                                : ""
                        }`}
                        onClick={() => {
                            handleClick(option.id);
                        }}
                    >
                        <Icon
                            component={BusinessDomainFilledIcon}
                            className={styles["domain-icon"]}
                        />
                        <span
                            className={styles["domain-label"]}
                            title={option.name}
                        >
                            {option.name}
                        </span>
                        {isCurrent(option) && (
                            <span className={styles["current-badge"]}>
                                {__("当前")}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Dropdown
            dropdownRender={dropdownRender}
            trigger={["click"]}
            placement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
        >
            <div className={styles["domain-selector"]}>
                <Icon
                    component={BusinessDomainIcon}
                    className={styles["selector-icon"]}
                />
                <span
                    className={styles["selector-label"]}
                    title={currentDomain?.name}
                >
                    {currentDomain?.name}
                </span>
                <CaretDownOutlined
                    style={{ fontSize: "10px", color: "#00000072" }}
                />
            </div>
        </Dropdown>
    );
};
