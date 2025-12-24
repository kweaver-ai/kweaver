import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { MicroAppContext, QiankunApp, useTranslate } from "@applet/common";
import { ItemCallback } from "./params-form";

interface AsLevelProps {
    value?: any;
    onChange?: any;
    items?: any;
    required?: boolean;
}

export const AsLevel = forwardRef<ItemCallback, AsLevelProps>(
    ({ items, onChange, required = false }, ref) => {
        const { prefixUrl } = useContext(MicroAppContext);
        const t = useTranslate();
        const itemRef = useRef<any>();
        const registerSubmitCallback = (params: any) => {
            itemRef.current = params;
        };
        const devEntry = sessionStorage.getItem("form_devtool_securityLevel");

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        try {
                            if (itemRef.current) {
                                let val = await itemRef.current();
                                if (
                                    val &&
                                    val?.csfinfo?.scope &&
                                    typeof val.csfinfo.scope !== "string"
                                ) {
                                    val = JSON.parse(JSON.stringify(val));

                                    val.csfinfo.scope = JSON.stringify(
                                        val.csfinfo.scope
                                    );
                                }
                                onChange && onChange(val);
                                return Promise.resolve(val);
                            }
                        } catch (error) {
                            onChange && onChange(undefined);
                            return Promise.reject();
                        }
                    },
                };
            },
            []
        );

        const entry = useMemo(() => {
            if (devEntry) {
                return devEntry;
            }
            return `${prefixUrl}/anyshare/widget/webmicroapps/securityLevelComponent.html`;
        }, [prefixUrl, devEntry]);

        return (
            <div>
                <QiankunApp
                    name="securityLevelComponent"
                    entry={entry}
                    style={{ height: "100%" }}
                    appProps={{
                        items,
                        attrs: {
                            title: t("setLevel", "设置密级信息"),
                            required: required,
                            errorTip: t("emptyMessage"),
                        },
                        registerSubmitCallback,
                    }}
                ></QiankunApp>
            </div>
        );
    }
);
