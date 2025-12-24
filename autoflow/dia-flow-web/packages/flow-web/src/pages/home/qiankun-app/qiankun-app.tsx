import { loadMicroApp, MicroApp } from "qiankun";
import React, { useContext, useEffect, useState } from "react";
import { CSSProperties, FC, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MicroAppContext } from "@applet/common";
import { detect } from "../../../utils/detect-browser";

interface QiankunAppProps {
    name: string;
    entry: string;
    className?: string;
    platform?: string;
    style?: CSSProperties;
    appProps?: { [key: string]: any };
}

const browser: any = detect();

export const QiankunApp: FC<QiankunAppProps> = ({
    name,
    entry,
    className,
    platform,
    style,
    appProps = {},
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const { microWidgetProps } = useContext(MicroAppContext);
    const [loading, setLoading] = useState(true);
    const app: any = useRef<MicroApp>();

    const { history } = microWidgetProps;
    const location = useLocation();

    useEffect(() => {
        const appName =
            typeof microWidgetProps?._qiankun?.loadMicroApp === "function" &&
            browser.name === "ie"
                ? name
                : `${name}-${Math.random()}`;
        const config: any = {
            name: appName,
            entry,
            props: {
                microWidgetProps: {
                    ...microWidgetProps,
                    history: history && {
                        ...history,
                        getBasePath: `${history.getBasePath}${location.pathname}`,
                    },
                },
                ...appProps,
            },
            container: ref.current,
        };
        const loadApp: typeof loadMicroApp =
            typeof microWidgetProps?._qiankun?.loadMicroApp === "function"
                ? microWidgetProps._qiankun.loadMicroApp
                : loadMicroApp;
        app.current = loadApp(
            config,
            browser.name === "ie" || platform == "console"
                ? {}
                : {
                      sandbox: { experimentalStyleIsolation: true },
                  },
            { afterMount: async () => setLoading(false) }
        );

        return () => {
            app.current.unmount();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className={className} style={style} ref={ref}></div>;
};
