import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { MicroAppContext, QiankunApp, useTranslate } from "@applet/common";
import { ItemCallback } from "./params-form";
import { assign, omit } from "lodash";

interface AsMetaDataProps {
    value?: any;
    onChange?: any;
    items?: any;
    required?: boolean;
}

export const AsMetaData = forwardRef<ItemCallback, AsMetaDataProps>(
    ({ items, onChange, required = false }, ref) => {
        const { prefixUrl } = useContext(MicroAppContext);
        const t = useTranslate();
        const itemRef = useRef<any>();
        const registerSubmitCallback = (params: any) => {
            itemRef.current = params;
        };
        const devEntry = sessionStorage.getItem(
            "form_devtool_metaDataComponent"
        );

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        try {
                            if (itemRef.current) {
                                let val = await itemRef.current();
                                if (val) {
                                    try {
                                        const results = {};
                                        val?.forEach((item: any) => {
                                            assign(results, {
                                                [item.key]: omit(item, "key"),
                                            });
                                        });
                                        val = results;
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }
                                // 处理编目
                                onChange && onChange(val);
                                return Promise.resolve(val);
                            }
                        } catch (error) {
                            onChange && onChange(undefined);
                            return Promise.reject("metadata");
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
            return `${prefixUrl}/anyshare/widget/webmicroapps/metaDataComponent.html`;
        }, [prefixUrl, devEntry]);

        return (
            <div>
                <QiankunApp
                    name="metaDataComponent"
                    entry={entry}
                    style={{ height: "100%" }}
                    appProps={{
                        items,
                        attrs: {
                            title: t("setMetaData", "设置编目"),
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
