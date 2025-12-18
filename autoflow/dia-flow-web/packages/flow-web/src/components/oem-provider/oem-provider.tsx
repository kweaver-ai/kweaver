import React, { useState, useEffect, useContext } from "react";
import { MicroAppContext } from "@applet/common";

export interface OemType {
    normal: string;
    hover: string;
    active: string;
    disabled: string;
}

export const initOemConfig = {
    normal: "#126ee3",
    hover: "#3a8ff0",
    active: "#064fbd",
    disabled: "#65b1fc",
};

export const OemConfigContext = React.createContext<OemType>(initOemConfig);

export const OemConfigProvider: React.FC = ({ children }) => {
    const { microWidgetProps, getTheme } = useContext(MicroAppContext);
    const [oemConfig, setOEMConfig] = useState<OemType>(initOemConfig);

    useEffect(() => {
        const theme =
            microWidgetProps?.config?.getTheme || getTheme;
        setOEMConfig({
            normal: theme?.normal || "#126ee3",
            hover: theme?.hover || "#3a8ff0",
            active: theme?.active || "#064fbd",
            disabled: theme?.disabled || "#65b1fc ",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <OemConfigContext.Provider value={oemConfig}>
            <style type="text/css">
                {`
                .automate-oem-primary-btn,
                .automate-oem-primary .${ANT_PREFIX}-btn-primary {
                    background: ${oemConfig?.normal} !important;
                    color: #ffffff !important;
                    border-color: transparent !important;
                }
                .automate-oem-primary .${ANT_PREFIX}-btn-primary {
                    -webkit-text-fill-color: #ffffff;
                }
                .automate-oem-primary-btn:hover,
                .automate-oem-primary .${ANT_PREFIX}-btn-primary:hover {
                    background: ${oemConfig?.hover} !important;
                }
                .automate-oem-primary-btn:active,
                .automate-oem-primary .${ANT_PREFIX}-btn-primary:active {
                    background: ${oemConfig?.active} !important;
                }
                .automate-oem-primary-btn.${ANT_PREFIX}-btn-primary[disabled],
                .automate-oem-primary-btn.${ANT_PREFIX}-btn-primary[disabled]:active,
                .automate-oem-primary-btn.${ANT_PREFIX}-btn-primary[disabled]:focus,
                .automate-oem-primary-btn.${ANT_PREFIX}-btn-primary[disabled]:hover {
                    background: ${oemConfig?.disabled} !important;
                    color: #ffffff !important;
                    -webkit-text-fill-color: #ffffff;
                }
                .automate-oem-tabs .${ANT_PREFIX}-tabs-ink-bar {
                    background: ${oemConfig?.normal} !important;
                }
                .automate-oem-tabs .${ANT_PREFIX}-tabs-tab:hover {
                    color: ${oemConfig?.hover} !important;
                }
                .automate-oem-tabs .${ANT_PREFIX}-tabs-tab-btn:active,
                .automate-oem-tabs .${ANT_PREFIX}-tabs-tab-remove:active {
                    color: ${oemConfig?.active} !important;
                }
                .automate-oem-tabs .${ANT_PREFIX}-tabs-tab.${ANT_PREFIX}-tabs-tab-active .${ANT_PREFIX}-tabs-tab-btn {
                    color: ${oemConfig?.normal} !important;
                }
                
                span[data-oem=automate-oem-tab]:hover {
                    color: ${oemConfig?.hover} !important;
                }
                span[data-oem=automate-oem-tab]:active {
                    color: ${oemConfig?.active} !important;
                }
                span[data-oem=automate-oem-tab].checked {
                    color: ${oemConfig?.normal} !important;
                    border-color:${oemConfig?.normal} !important;
                    font-weight:600;
                }
            `}
            </style>
            {children}
        </OemConfigContext.Provider>
    );
};
