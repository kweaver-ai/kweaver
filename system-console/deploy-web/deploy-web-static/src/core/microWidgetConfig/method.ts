import { MenuType } from "@kweaver-ai/workshop-framework-system";
import { MicroWidgetInfo } from ".";
import { getLocaleByEnv } from "../language";
import { defaultPathList } from "../path";
import { formatType, getIcon } from "../workshop-framework/method";
import { UserInfo } from "../../api/oauth/declare";
import { SystemRoleType } from "../roles";

// 格式化插件信息为qiankun框架所需的格式
export function formatApps(
    registryInfos: MicroWidgetInfo[],
    props: any
): any[] {
    return registryInfos.map((registryInfo) => {
        const {
            app: {
                textZHCN,
                textZHTW,
                textENUS,
                icon,
                pathname,
                customVisible,
                type,
                isDefaultOpen,
                roles = ["Supper", "Admin"],
            },
            subapp,
            orderIndex,
            pageTag,
            name,
        } = registryInfo;

        if (Object.keys(registryInfo?.subapp?.children).length === 0) {
            if (registryInfo?.subapp?.entry) {
                return {
                    label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                    orderIndex,
                    pageTag,
                    roles,
                    customVisible,
                    key: name,
                    path: `${defaultPathList[0]}${pathname}`,
                    registryRouter: subapp?.registryRouter
                        ? `${defaultPathList[0]}${subapp?.registryRouter}`
                        : undefined,
                    icon: getIcon(icon),
                    app: {
                        name: registryInfo.name,
                        entry: (subapp?.entry as string)?.replace(
                            "ip:port",
                            `${window.location.hostname}${
                                window.location.port
                                    ? ":" + window.location.port
                                    : ""
                            }${props.prefix}`
                        ),
                        props: subapp.baseRouter
                            ? {
                                  ...props,
                                  baseRouter: subapp.baseRouter,
                                  history: {
                                      ...props.history,
                                      getBasePath: `${defaultPathList[0]}${
                                          subapp?.registryRouter || pathname
                                      }`,
                                  },
                              }
                            : {
                                  ...props,
                                  history: {
                                      ...props.history,
                                      getBasePath: `${defaultPathList[0]}${
                                          subapp?.registryRouter || pathname
                                      }`,
                                  },
                              },
                    },
                };
            } else if (registryInfo?.subapp?.useEntryByRoute) {
                return {
                    label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                    orderIndex,
                    pageTag,
                    roles,
                    customVisible,
                    key: name,
                    path: `${defaultPathList[0]}${pathname}`,
                    registryRouter: subapp?.registryRouter
                        ? `${defaultPathList[0]}${subapp?.registryRouter}`
                        : undefined,
                    icon: getIcon(icon),
                };
            } else {
                return null;
            }
        } else {
            return {
                label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                key: name,
                orderIndex,
                pageTag,
                roles,
                customVisible,
                isDefaultOpen,
                icon: getIcon(icon),
                type: formatType(type),
                children: Object.keys(registryInfo?.subapp?.children).map(
                    (key: string) => {
                        return formatApps(
                            [registryInfo?.subapp?.children[key]],
                            props
                        )[0];
                    }
                ),
                ...(registryInfo?.subapp?.entry
                    ? {
                          path: `${defaultPathList[0]}${pathname}`,
                          registryRouter: subapp?.registryRouter
                              ? `${defaultPathList[0]}${subapp?.registryRouter}`
                              : undefined,
                          app: {
                              name: registryInfo.name,
                              entry: (subapp?.entry as string)?.replace(
                                  "ip:port",
                                  `${window.location.hostname}${
                                      window.location.port
                                          ? ":" + window.location.port
                                          : ""
                                  }${props.prefix}`
                              ),
                              props: subapp.baseRouter
                                  ? {
                                        ...props,
                                        baseRouter: subapp.baseRouter,
                                        history: {
                                            ...props.history,
                                            getBasePath: `${
                                                defaultPathList[0]
                                            }${
                                                subapp?.registryRouter ||
                                                pathname
                                            }`,
                                        },
                                    }
                                  : {
                                        ...props,
                                        history: {
                                            ...props.history,
                                            getBasePath: `${
                                                defaultPathList[0]
                                            }${
                                                subapp?.registryRouter ||
                                                pathname
                                            }`,
                                        },
                                    },
                          },
                      }
                    : {}),
            };
        }
    });
}

export function filterRoleApps(
    registryInfos: (MenuType & { roles: string[] })[],
    userInfo: UserInfo
) {
    return registryInfos.filter((registryInfo) => {
        if (registryInfo?.children) {
            registryInfo.children = filterRoleApps(
                registryInfo.children as (MenuType & { roles: string[] })[],
                userInfo
            );
        }
        return userInfo?.user?.roles?.some((role) => {
            return registryInfo?.roles
                .map((role: string) => SystemRoleType[role])
                .includes(role?.id);
        });
    });
}
