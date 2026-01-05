import React, { FC, useEffect, useState } from "react";
import Template from "@kweaver-ai/template";
import "@kweaver-ai/template/style.css";
import { newBackgroundImage } from "./background";
import { Props } from "./declare";
import { oauth2Ui } from "../../api/oauth2-ui";
import { HeaderBar } from "../HeaderBar/component.view";
import { Languages } from "../../core/language";
import LoginCluster from "../LoginCluster/component.view";

export const Login: FC<Props> = React.memo(
    ({ lang, pathname, hostname, oemConfigs, moduleConfigs }) => {
        const [loginHeight, setLoginHeight] = useState(410);
        const isCNLang = lang
            ? [Languages[0]["language"], Languages[1]["language"]].includes(
                  lang
              )
            : true;
        const newBackground = `data:image/png;base64,${newBackgroundImage}`;

        const initLoginHeight = async () => {
            const { height } = await oauth2Ui.getLoginHeight();
            setLoginHeight(height);
        };

        useEffect(() => {
            initLoginHeight();
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
                template={"default"}
                fontStyle={"light"}
                background={newBackground}
                loginHeight={loginHeight}
            />
        );
    }
);
