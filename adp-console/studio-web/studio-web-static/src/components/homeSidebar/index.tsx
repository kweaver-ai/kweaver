import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.less";
import { ReactComponent as AccountIcon } from "./assets/account.svg";
import { ReactComponent as CopilotPlusIcon } from "./assets/CopilotPlus.svg";
import { ReactComponent as SettingsIcon } from "./assets/menu_backstage.svg";
import { ReactComponent as LanguageIcon } from "./assets/language.svg";
import { ReactComponent as HelpIcon } from "./assets/help.svg";
import { ReactComponent as UserAgreementIcon } from "./assets/UserAgreement.svg";
import { ReactComponent as PrivacyPolicyIcon } from "./assets/privacypolicy.svg";
import Icon from "@ant-design/icons";
import { Avatar, Menu, Dropdown, Modal, Button, Select } from "antd";
import type { MenuProps } from "antd";
import __ from "./locale";
import {
    openOnlineHelp,
    openPrivacyPolicy,
    openUserAgreement,
} from "../../core/about";
import { Locale } from "@aishu-tech/workshop-framework-studio";
import { Domain } from "../../core/workshop-framework/declare";
import { PageTag, defaultPathList, getPathnameByTag } from "../../core/path";
import { signup } from "../../core/auth";
import { getLocaleByEnv, setLanguage } from "../../core/language";
import { UserInfo } from "../../api/oauth/declare";
import {
    newDefaultFavicon,
    oldDefaultFavicon,
} from "../../core/bootstrap/favicon";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { RegistryInfo } from "../../api/workstation-backend/declare";
import { LogoImage, SiderBarRefBottomType } from "./method";

interface Props {
    lang: Locale;
    prefix: string;
    domain: Domain;
    userInfo: UserInfo;
    oemConfig: OemConfigInfo;
    registryInfos: { [key: string]: RegistryInfo };
}
export const HomeSideBar: FC<Props> = ({
    lang,
    prefix,
    domain,
    userInfo,
    oemConfig,
    registryInfos,
}) => {
    const [isShowLangModal, setIsShowLangModal] = useState(false);
    const [langKey, setLangKey] = useState(lang);
    const [siderBarRefBottomType, setSiderBarRefBottomType] = useState(
        SiderBarRefBottomType.Large
    );

    const siderBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateSiderBarRefBottomType = () => {
            if (!siderBarRef.current) return;
            const bottomDist =
                0.8 * window.innerHeight - siderBarRef.current.clientHeight;
            setSiderBarRefBottomType(
                bottomDist > 170
                    ? SiderBarRefBottomType.Large
                    : bottomDist > 0
                    ? SiderBarRefBottomType.Middle
                    : SiderBarRefBottomType.Small
            );
        };
        window.addEventListener("resize", updateSiderBarRefBottomType);
        updateSiderBarRefBottomType();
        return () => {
            window.removeEventListener("resize", updateSiderBarRefBottomType);
        };
    }, [siderBarRef, setSiderBarRefBottomType]);

    const { protocol, port, host } = domain;
    type MenuItem = Required<MenuProps>["items"][number];

    const getAccountName = useCallback(() => {
        return userInfo && typeof userInfo !== "string"
            ? userInfo.user["displayName"] || userInfo.user["loginName"]
            : userInfo;
    }, [userInfo]);

    const items: MenuItem[] = [
        {
            key: "account",
            icon: (
                <Avatar
                    size={24}
                    icon={<AccountIcon />}
                    style={{
                        backgroundColor: "#8A90A5",
                    }}
                />
            ),
            label: getAccountName(),
            className: styles["account"],
            disabled: true,
        },
        { type: "divider" },
        {
            key: "language",
            icon: (
                <Icon component={LanguageIcon} style={{ fontSize: "14px" }} />
            ),
            label: __("语言设置"),
        },
        {
            key: "online-help",
            icon: <Icon component={HelpIcon} style={{ fontSize: "14px" }} />,
            label: __("在线帮助"),
        },
        {
            key: "user-agreement",
            icon: (
                <Icon
                    component={UserAgreementIcon}
                    style={{ fontSize: "14px" }}
                />
            ),
            label: __("用户协议"),
        },
        {
            key: "privacy-policy",
            icon: (
                <Icon
                    component={PrivacyPolicyIcon}
                    style={{ fontSize: "14px" }}
                />
            ),
            label: __("隐私政策"),
        },
        { type: "divider" },
        { key: "logout", label: __("登出") },
    ];
    const handleClickSideBar = ({ key }: { key: string }) => {
        switch (key) {
            case "online-help":
                openOnlineHelp(lang);
                break;
            case "user-agreement":
                openUserAgreement(lang, host, port, prefix, protocol);
                break;
            case "privacy-policy":
                openPrivacyPolicy(lang, host, port, prefix, protocol);
                break;
            case "logout":
                signup(defaultPathList[1]);
                break;
            case "language":
                setIsShowLangModal(true);
                break;
        }
    };

    const handleOk = () => {
        setLanguage(langKey);
        window.location.reload();
    };

    const handleCancel = () => {
        setLangKey(lang);
        setIsShowLangModal(false);
    };

    return (
        <>
            <div
                className={styles["sidebar-container"]}
                style={
                    siderBarRefBottomType !== SiderBarRefBottomType.Small
                        ? { top: "20%" }
                        : { bottom: 0 }
                }
                ref={siderBarRef}
            >
                <img
                    src={`data:image/png;base64,${oemConfig["favicon.ico"]}`}
                    style={{ width: "28px", height: "28px" }}
                />
                <div className={styles["split"]}></div>
                <div className={styles["sidebar-item-home"]}>
                    {registryInfos[PageTag.Home]?.app?.icon ? (
                        <LogoImage
                            icon={registryInfos[PageTag.Home]?.app?.icon}
                            prefix={prefix}
                        />
                    ) : (
                        <Icon
                            component={CopilotPlusIcon}
                            style={{ fontSize: "20px" }}
                        />
                    )}
                    <div
                        className={styles["item-text"]}
                        title={
                            registryInfos[PageTag.Home]
                                ? getLocaleByEnv(
                                      registryInfos[PageTag.Home].app?.textZHCN,
                                      registryInfos[PageTag.Home].app?.textZHTW,
                                      registryInfos[PageTag.Home].app?.textENUS
                                  )
                                : __("超级助手")
                        }
                    >
                        {registryInfos[PageTag.Home]
                            ? getLocaleByEnv(
                                  registryInfos[PageTag.Home].app?.textZHCN,
                                  registryInfos[PageTag.Home].app?.textZHTW,
                                  registryInfos[PageTag.Home].app?.textENUS
                              )
                            : __("超级助手")}
                    </div>
                </div>
                {Object.values(registryInfos)
                    .filter(
                        (item) =>
                            !["home"].includes(item.name) &&
                            item.bottom !== true
                    )
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((registryInfo) => {
                        return (
                            <div
                                className={styles["sidebar-item"]}
                                onClick={() =>
                                    window.location.assign(
                                        getPathnameByTag(registryInfo.name)
                                    )
                                }
                            >
                                <LogoImage
                                    icon={registryInfo?.app?.icon}
                                    prefix={prefix}
                                />
                                <div
                                    className={styles["item-text"]}
                                    title={getLocaleByEnv(
                                        registryInfo.app?.textZHCN,
                                        registryInfo.app?.textZHTW,
                                        registryInfo.app?.textENUS
                                    )}
                                >
                                    {getLocaleByEnv(
                                        registryInfo.app?.textZHCN,
                                        registryInfo.app?.textZHTW,
                                        registryInfo.app?.textENUS
                                    )}
                                </div>
                            </div>
                        );
                    })}
                <div className={styles["split"]}></div>
                {Object.values(registryInfos)
                    .filter(
                        (item) =>
                            !["home"].includes(item.name) &&
                            item.bottom === true
                    )
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((registryInfo) => {
                        return (
                            <div
                                className={styles["sidebar-item"]}
                                onClick={() =>
                                    window.location.assign(
                                        getPathnameByTag(registryInfo.name)
                                    )
                                }
                            >
                                <LogoImage
                                    icon={registryInfo?.app?.icon}
                                    prefix={prefix}
                                />
                                <div
                                    className={styles["item-text"]}
                                    title={getLocaleByEnv(
                                        registryInfo.app?.textZHCN,
                                        registryInfo.app?.textZHTW,
                                        registryInfo.app?.textENUS
                                    )}
                                >
                                    {getLocaleByEnv(
                                        registryInfo.app?.textZHCN,
                                        registryInfo.app?.textZHTW,
                                        registryInfo.app?.textENUS
                                    )}
                                </div>
                            </div>
                        );
                    })}
                <Dropdown
                    overlay={
                        <div
                            style={{
                                marginLeft: "58px",
                                marginBottom:
                                    siderBarRefBottomType ===
                                    SiderBarRefBottomType.Large
                                        ? "-220px"
                                        : "-45px",
                            }}
                        >
                            <Menu
                                onClick={handleClickSideBar}
                                style={{ width: 268 }}
                                mode="vertical"
                                items={items}
                            />
                        </div>
                    }
                    placement="topRight"
                    getPopupContainer={() => document.body}
                    trigger={["hover"]}
                >
                    <Avatar
                        size={32}
                        icon={<AccountIcon />}
                        style={{
                            backgroundColor: "#8A90A5",
                            fontSize: "28px",
                            marginTop: "8px",
                            cursor: "pointer",
                        }}
                    />
                </Dropdown>
            </div>
            <Modal
                title={__("语言设置")}
                open={isShowLangModal}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={__("保存")}
                wrapClassName="lang-modal"
                footer={[
                    <Button
                        type="primary"
                        onClick={handleOk}
                        style={{ width: "74px" }}
                    >
                        {__("保存")}
                    </Button>,
                    <Button
                        type="default"
                        onClick={handleCancel}
                        style={{ width: "74px" }}
                    >
                        {__("取消")}
                    </Button>,
                ]}
            >
                <Select
                    value={langKey}
                    style={{ width: "100%" }}
                    onChange={(val) => setLangKey(val)}
                    options={[
                        {
                            value: "zh-cn",
                            label: "简体中文",
                        },
                        {
                            value: "zh-tw",
                            label: "繁體中文",
                        },
                        {
                            value: "en-us",
                            label: "English",
                        },
                    ]}
                />
            </Modal>
        </>
    );
};
