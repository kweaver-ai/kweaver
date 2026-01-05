import "whatwg-fetch";
import "custom-event-polyfill";
import "core-js/stable/promise";
import "core-js/stable/symbol";
import "core-js/stable/string/starts-with";
import "core-js/web/url";
import React, { useState, FC, useEffect } from "react";
import { getDefaultAppConfig } from "../../core/bootstrap";
import { FrameWork } from "@kweaver-ai/workshop-framework-system";
import { Props } from "./declare";
import { signup } from "../../core/auth";
import { session } from "../../core/mediator";
import ChangePassword from "../ChangePassword/component.view";

export const App: FC<Props> = React.memo(
    ({
        lang,
        domain,
        userInfo,
        oemConfig,
        defaultAppConfig,
        moduleConfigs,
        prefix,
    }) => {
        const [appConfig, setAppConfig] = useState(defaultAppConfig);
        // 是否显示修改密码
        const [isShowChangePwd, setIsShowChangePwd] = useState<boolean>(false);

        const onChangePwd = () => setIsShowChangePwd(true);
        const getConfig = async (forceSetConfig?: boolean) => {
            // 获取侧边栏配置信息
            const [isChange, _appConfig] = await getDefaultAppConfig(
                oemConfig,
                lang,
                domain,
                userInfo!,
                moduleConfigs,
                prefix,
                onChangePwd
            );
            (forceSetConfig || isChange) && setAppConfig(_appConfig);
        };
        // 组件挂载后强制更新appConfig，为修改密码功能提供弹窗控制函数
        useEffect(() => {
            getConfig(true);
        }, []);
        /**
         * 每隔5s更新一次配置
         */
        // const getConfigAtCertainIntervals = () => {
        //     getConfig();
        //     setTimeout(getConfigAtCertainIntervals, 5000);
        // };
        // getConfigAtCertainIntervals();
        return (
            <>
                <FrameWork config={appConfig} />
                {isShowChangePwd && (
                    <ChangePassword
                        account={session.get("deploy.userInfo").user.loginName}
                        onChangePwdSuccess={() => setIsShowChangePwd(false)}
                        onChangePwdCancel={() => setIsShowChangePwd(false)}
                        onUserLocked={() => location.replace(location.pathname)}
                        signup={(...args: any[]) => {
                            signup(...args);
                        }}
                    />
                )}
            </>
        );
    }
);
