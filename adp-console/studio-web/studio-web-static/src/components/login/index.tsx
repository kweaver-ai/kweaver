import React, { FC, useEffect, useState } from "react";
import { getDisplay } from "../../core/mediator";
import { Props } from "./declare";
import cookie from "js-cookie";
import {
    FontStyle,
    LoginBackgroundType,
    LoginBoxStyleType,
    TemplateType,
} from "../../core/oem-config";
import { oauth2Ui } from "../../api/oauth2-ui";
import Template from "@aishu-tech/template";
import "@aishu-tech/template/style.css";
import { HeaderBar } from "../HeaderBar/component.view";
import { Languages } from "../../core/language";
import LoginCluster from "../LoginCluster/component.view";

export const Login: FC<Props> = React.memo(
    ({ lang, pathname, hostname, oemConfigs, moduleConfigs }) => {
        const [loginHeight, setLoginHeight] = useState(410);
        const {
                webTemplate,
                regularFont,
                loginBackgroundType,
                loginBoxLocation,
                loginBoxStyle,
            } = oemConfigs,
            changeStyle =
                webTemplate === TemplateType.Regular &&
                regularFont === FontStyle.Light,
            isCNLang = lang
                ? [Languages[0]["language"], Languages[1]["language"]].includes(
                      lang
                  )
                : true,
            background = `${getDisplay(
                webTemplate === TemplateType.Regular &&
                    loginBackgroundType === LoginBackgroundType.Animated
                    ? oemConfigs[`regularLiveBackground.gif`]
                    : oemConfigs[`${oemConfigs["webTemplate"]}Background.png`],
                lang
            )}`,
            isAsDIP =
                webTemplate === TemplateType.Regular &&
                loginBoxStyle === LoginBoxStyleType.Transparent;

        const newBackground = "data:image/png;base64," + background;

        const initLoginHeight = async () => {
            const { height } = await oauth2Ui.getLoginHeight();
            setLoginHeight(height);
        };

        useEffect(() => {
            initLoginHeight();
        }, []);

        useEffect(() => {
            if (!location.search.includes("redirect=true")) {
                cookie.remove("studio.previous_url");
            }
        }, []);

        return (
            <Template
                header={
                    <HeaderBar
                        isCNLang={isCNLang}
                        moduleConfigs={moduleConfigs}
                    />
                }
                content={<LoginCluster lang={lang} loginHeight={loginHeight} />}
                footer={null}
                about={null}
                template={webTemplate}
                fontStyle={regularFont}
                background={newBackground}
                loginHeight={loginHeight}
                loginBoxLocation={loginBoxLocation}
                loginBoxStyle={loginBoxStyle}
            />
        );
    }
);
