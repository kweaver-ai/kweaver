import "whatwg-fetch";
import "custom-event-polyfill";
import "core-js/stable/promise";
import "core-js/stable/symbol";
import "core-js/stable/string/starts-with";
import "core-js/web/url";
import React, { useState, FC, useEffect, useCallback } from "react";
import { getDefaultAppConfig } from "../../core/bootstrap";
import { FrameWork } from "@kweaver-ai/workshop-framework-studio";
import { session } from "../../core/mediator";
import { Props } from "./declare";
import { signup } from "../../core/auth";
import { HomeSideBar } from "../homeSidebar";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../../core/url";
import { defaultPathList, homePathname } from "../../core/path";
import { RegistryInfo } from "../../api/workstation-backend/declare";
import cookie from "js-cookie";
import { user } from "../../api/oauth";
import { businessDomain } from "../../api/business-domain";
import { handleError } from "../../tools/request-utils/handleError";
import { BusinessDomainConfig } from "../../api/business-domain/declare";
import ChangePassword from "../ChangePassword/component.view";

// let timer: any = null;

export const App: FC<Props> = React.memo(
    ({
        lang,
        domain,
        userInfo,
        oemConfig,
        defaultAppConfig,
        moduleConfigs,
        prefix,
        pathname,
    }) => {
        const [appConfig, setAppConfig] = useState(defaultAppConfig);
        // 是否显示修改密码
        const [isShowChangePwd, setIsShowChangePwd] = useState<boolean>(false);
        // 业务域列表
        const [businessDomainList, setBusinessDomainList] = useState<
            BusinessDomainConfig[]
        >([]);

        useEffect(() => {
            const htmlDOM = document.getElementsByTagName("html")[0];
            const designWidth = 1920; // 设计稿的宽度  --- 已知
            const designHtmlFontSize = 100; // 设计稿上面的html font-size的大小  --- 已知
            let actualHtmlFontSize; // 实际html font-size的大小 --- 未知
            function setRootFontSize() {
                const viewportWidth =
                    document.documentElement.clientWidth ||
                    document.body.clientWidth; // 实际浏览器视口的宽度 ---- 已知
                actualHtmlFontSize =
                    (viewportWidth * designHtmlFontSize) / designWidth; // 3个已知条件，1个未知条件
                htmlDOM.style.fontSize = actualHtmlFontSize + "px";
            }

            setRootFontSize();
            window.addEventListener("resize", setRootFontSize);
            return () => window.removeEventListener("resize", setRootFontSize);
        }, []);

        useEffect(() => {
            const compareUserLogin = async () => {
                if (
                    document.visibilityState === "visible" &&
                    session.get("studio.tempToken") !==
                        cookie.get("studio.oauth2_token")
                ) {
                    try {
                        const userInfo = await user.get();
                        if (
                            userInfo.user.loginName !==
                            session.get("studio.username")
                        ) {
                            window.location.assign(defaultPathList[0]);
                        }
                    } catch (e) {}
                } else if (document.visibilityState === "hidden") {
                    session.set(
                        "studio.tempToken",
                        cookie.get("studio.oauth2_token")
                    );
                }
            };
            // 监听可见性变化事件
            document.addEventListener("visibilitychange", compareUserLogin);
            return () =>
                document.removeEventListener(
                    "visibilitychange",
                    compareUserLogin
                );
        }, []);

        useEffect(() => {
            getBusinessDomain();
        }, []);

        const getBusinessDomain = async () => {
            try {
                const result = await businessDomain.get();

                const currentBusinessDomainID = session.get(
                    "studio.businessDomainID"
                );
                if (
                    !currentBusinessDomainID ||
                    !result.some(
                        (domain) => domain.id === currentBusinessDomainID
                    )
                ) {
                    session.set("studio.businessDomainID", result[0].id);
                }
                setBusinessDomainList(result);
            } catch (e) {
                handleError(e);
            }
        };

        const onChangePwd = () => setIsShowChangePwd(true);
        const getConfig = async (forceSetConfig?: boolean) => {
            // 获取侧边栏配置信息
            const [isChange, _appConfig, _registryInfos] =
                await getDefaultAppConfig(
                    oemConfig,
                    lang,
                    domain,
                    userInfo!,
                    false,
                    moduleConfigs,
                    prefix,
                    onChangePwd,
                    pathname,
                    getConfig,
                    businessDomainList
                );
            if (forceSetConfig || isChange) {
                setAppConfig(_appConfig);
            }
        };
        // 组件挂载后强制更新appConfig，为修改密码功能提供弹窗控制函数
        useEffect(() => {
            getConfig(true);
        }, [businessDomainList]);

        return (
            <>
                <FrameWork config={appConfig} />
                {isShowChangePwd && (
                    <ChangePassword
                        account={session.get("studio.userInfo").user.loginName}
                        onChangePwdSuccess={() => setIsShowChangePwd(false)}
                        onChangePwdCancel={() => setIsShowChangePwd(false)}
                        onUserLocked={() => location.replace(location.pathname)}
                        signup={signup}
                    />
                )}
            </>
        );
    }
);
