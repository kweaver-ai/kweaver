import React, { useState, useEffect, useContext } from "react";
import { API, MicroAppContext } from "@applet/common";

interface IConfig {
    [key: string]: any;
}

interface ConfigType {
    config: IConfig;
    onChangeConfig: (newConfig: IConfig) => void;
}

/**
 * 判断是否比目标版本低
 * @param version  当前版本
 * @param target   比较版本
 */
const compareVersion = (version: string, target: string) => {
    try {
        const currentArr = version.split(".");
        const targetArr = target.split(".");
        let isLowerVersion = false;
        for (let i = 0; i < currentArr.length; i += 1) {
            if (Number(currentArr[i]) < Number(targetArr[i])) {
                isLowerVersion = true;
                break;
            }
            if (Number(currentArr[i]) > Number(targetArr[i])) {
                break;
            }
        }

        if (isLowerVersion) {
            return true;
        }
    } catch (error) {
        console.error(error);
    }

    return false;
};

export const ServiceConfigContext = React.createContext<ConfigType>({
    config: {},
    onChangeConfig: () => { },
});

export const ServiceConfigProvider: React.FC = ({ children }) => {
    const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
    const [config, setConfig] = useState<IConfig>({
        isServiceOpen: true,
        shouldShowGuide: false,
    });
    useEffect(() => {
        const getSwitch = async () => {
            try {
                const {
                    data: { enable = true },
                } = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/switch`
                );
                setConfig((pre) => ({ ...pre, isServiceOpen: enable }));
            } catch (error) {
                setConfig((pre) => ({ ...pre, isServiceOpen: false }));
            }
        };
        const getVersion = async () => {
            let currentVersion;
            if (microWidgetProps?.config?.getVersion) {
                currentVersion = await microWidgetProps?.config?.getVersion();
            }
            let showGuideFlag = true;
            if (currentVersion && !compareVersion(currentVersion, "7.0.5.4")) {
                showGuideFlag = false;
                localStorage.setItem("automateGuide", "1");
            }
            if (!localStorage.getItem("automateGuide") && showGuideFlag) {
                setConfig((pre) => ({ ...pre, shouldShowGuide: true }));
            }
        };

        // 判断用户是否工作中心管理员
        const checkWCAdmin = async () => {
            const userId = microWidgetProps?.config?.userInfo?.userid

            try {
                const {
                    data: { is_admin = false },
                } = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/admins/${userId}/is-admin`
                );

                setConfig((pre) => ({ ...pre, isAdmin: is_admin }));
            } catch (error) {
                setConfig((pre) => ({ ...pre, isAdmin: false }));
            }
        }

        getSwitch();
        getVersion();
        checkWCAdmin();
    }, [prefixUrl]);

    return (
        <ServiceConfigContext.Provider
            value={{
                config,
                onChangeConfig: (newConfig) => setConfig(newConfig),
            }}
        >
            {children}
        </ServiceConfigContext.Provider>
    );
};
