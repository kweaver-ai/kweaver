import React, { Suspense, StrictMode } from "react";
import cookie from "js-cookie";
import { store } from "./store";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { noop } from "lodash";
import { App } from "./components/app";
import { Login } from "./components/login";
import { Language } from "./core/language";
import { defaultPathList } from "./core/path";
import { Root, createRoot } from "react-dom/client";
import { oemConfigDefault, oemConfigWithoutSupport } from "./core/oem-config";
import {
    login,
    unlogin,
    setupLocale,
    getDefaultAppConfig,
    setupAppStyle,
    setupAPIPathBase,
    getModuleConfig,
    logoutTimer,
} from "./core/bootstrap";
import { local, session, getCurrentLang, setupTimer } from "./core/mediator";
import { UserInfo } from "./api/oauth/declare";
import { OemConfigInfo } from "./api/oem-config/declare";
import { Domain } from "./core/workshop-framework/declare";
import { ModuleConfigs } from "./api/module-config/declare";
import {
    Config as WorkShopFrameWorkConfig,
    Locale,
} from "@kweaver-ai/workshop-framework-system";
import { Keys, Modules } from "./api/module-config";
import antenUS from "antd/es/locale/en_US";
import antzhCN from "antd/es/locale/zh_CN";
// css 顺序不要改变
import "@kweaver-ai/workshop-framework-system/dist/workshop-framework-system.umd.css";
import "antd/dist/antd.less";
import "./reset.less";

async function renderDeployStudio(root: Root) {
    // 不要将reload和assign导出使用，uncaught typeerror illegal invocation
    // 当调用一个函数时，如果该函数的此关键字未引用它最初引用的对象，即当函数的“上下文”丢失时，就会引发错误。
    const { pathname, protocol, href, hostname } = window.location;
    const prefix = cookie.get("X-Forwarded-Prefix") || "";

    // 点击浏览器回退箭头，由控制台跳转客户端时，已登录的用户需退出至登录界面。
    // 移除改功能，AS管理控制台和AS客户端已经不再支持该功能
    // checkVisitedOrigin(origin(), href);
    // 设置 APi请求路径
    const domainInfo: Domain = await setupAPIPathBase(protocol, prefix);

    // 获取语言，模块服务信息
    const localLang: Locale = local.get("lang"),
        sessionLang: Locale = session.get("lang");

    // 获取用户信息，语言，站点角色，oem配置，等
    let userInfo: UserInfo | null | undefined = local.get("deploy.userInfo"),
        lang = localLang || sessionLang,
        oemConfig: OemConfigInfo = oemConfigDefault,
        appConfig: WorkShopFrameWorkConfig,
        isChange: Boolean, // 标志是否需要更新
        moduleConfigs: ModuleConfigs,
        navItem: any,
        menusItems: any;

    if (userInfo) {
        // 已登录
        login(userInfo, pathname, localLang, sessionLang);
    } else {
        // 未登录
        userInfo = await unlogin(pathname, href);
    }

    // 获取默认模块化配置
    moduleConfigs = await getModuleConfig();

    // 设置超时登出时间
    setupTimer({
        [Modules.LoginTimePolicy]:
            moduleConfigs && moduleConfigs[Modules.LoginTimePolicy]
                ? moduleConfigs[Modules.LoginTimePolicy][Keys.Status]
                : 0,
    });

    oemConfig = oemConfigWithoutSupport;

    // 设置 app Favicon title等
    setupAppStyle(lang, oemConfig, !!moduleConfigs.isSecret.status);

    // 获取侧边栏配置信息
    [isChange, appConfig] = await getDefaultAppConfig(
        oemConfig,
        lang,
        domainInfo,
        userInfo!,
        moduleConfigs,
        prefix,
        noop
    );

    // 设置当前语言环境
    lang = (await getCurrentLang()).language;
    await setupLocale(lang);

    const antLocale = lang === Language.ENUS ? antenUS : antzhCN;

    if (!defaultPathList.includes(pathname)) {
        // 新增涉密超时登出机制
        logoutTimer();
    }

    // 渲染 app
    root.render(
        <StrictMode>
            <Suspense fallback={<div>loading</div>}>
                <ConfigProvider prefixCls="deploy-web" locale={antLocale}>
                    <Provider store={store}>
                        {defaultPathList.includes(pathname) ? (
                            <Login
                                lang={lang}
                                hostname={hostname}
                                pathname={pathname}
                                appIp={domainInfo.host}
                                oemConfigs={oemConfig}
                                moduleConfigs={moduleConfigs!}
                            />
                        ) : (
                            <App
                                lang={lang}
                                domain={domainInfo}
                                moduleConfigs={moduleConfigs!}
                                defaultAppConfig={appConfig!}
                                menusItems={menusItems}
                                oemConfig={oemConfig}
                                userInfo={userInfo!}
                                item={navItem}
                                prefix={prefix}
                            />
                        )}
                    </Provider>
                </ConfigProvider>
            </Suspense>
        </StrictMode>
    );
}

async function bootstrap() {
    // 获取根容器
    const container = document.getElementById("root")!; // The exclamation mark is the non-null assertion operator in TypeScript.
    const root = createRoot(container);

    renderDeployStudio(root);
}

bootstrap();
