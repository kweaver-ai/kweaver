import React, {
    forwardRef,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { MicroAppContext, QiankunApp, useTranslate } from "@applet/common";
import { ItemCallback } from "./params-form";

interface AsTagsProps {
    value?: string[];
    onChange?: (tags: string[]) => void;
    items?: any;
    required?: boolean;
}

export const AsTags = forwardRef<ItemCallback, AsTagsProps>(
    ({ value, onChange, items, required = false }, ref) => {
        const { prefixUrl } = useContext(MicroAppContext);
        const t = useTranslate();
        const itemRef = useRef<any>();
        const registerSubmitCallback = (params: any) => {
            itemRef.current = params;
        };
        const devEntry = sessionStorage.getItem("form_devtool_tag");

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        try {
                            if (itemRef.current) {
                                const val = await itemRef.current();
                                onChange && onChange(val);
                                return Promise.resolve(val);
                            }
                        } catch (error) {
                            onChange && onChange([]);
                            return Promise.reject();
                        }
                    },
                };
            },
            [onChange]
        );

        const entry = useMemo(() => {
            if (devEntry) {
                return devEntry;
            }
            return `${prefixUrl}/anyshare/widget/webmicroapps/tag.html`;
        }, [prefixUrl, devEntry]);
        return (
            <div>
                <QiankunApp
                    name="tag"
                    entry={entry}
                    style={{ height: "100%" }}
                    appProps={{
                        items,
                        attrs: {
                            title: t("setTags", "设置标签"),
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
