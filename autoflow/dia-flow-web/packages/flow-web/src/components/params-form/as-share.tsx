import {
    forwardRef,
    useCallback,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { difference } from 'lodash'
import { MicroAppContext, QiankunApp, useTranslate } from "@applet/common";
import moment from "moment";
import { ItemCallback } from "./params-form";
import styles from "./styles/as-share.module.less";

interface AsShareProps {
    value?: any;
    onChange?: any;
    items?: any;
    required?: boolean;
}

export const AsShare = forwardRef<ItemCallback, AsShareProps>(
    ({ items, onChange, required = false }, ref) => {
        const { prefixUrl } = useContext(MicroAppContext);
        const [checked, setChecked] = useState(false);
        const t = useTranslate();
        const itemRef = useRef<any>();
        const registerSubmitCallback = (params: any) => {
            itemRef.current = params;

            const btn = document.querySelector<HTMLElement>('.workcenter-form #shareComponent > div > button');

            if (btn && !checked) {
                btn.addEventListener('click', () => {
                    setTimeout(() => setChecked(true), 500)
                });
            }
        };
        const devEntry = sessionStorage.getItem("form_devtool_shareComponent");

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        try {
                            if (itemRef.current) {
                                let val = await itemRef.current();
                                if (val) {
                                    val = {
                                        inherit: val?.inherit || true,
                                        perminfos: val?.perminfos
                                            ?.filter((item: any) => {
                                                if (!item.allow && !item.deny) {
                                                    return false;
                                                }
                                                return true;
                                            })
                                            ?.map((item: any) => ({
                                                accessor: {
                                                    id: item.accessorid,
                                                    name: item.accessorname,
                                                    type: item.accessortype,
                                                },
                                                perm: {
                                                    allow: item.allow,
                                                    deny: item.deny,
                                                },
                                                endtime:
                                                    item.endtime === -1
                                                        ? -1
                                                        : moment(
                                                            item.endtime / 1000
                                                        )?.toISOString() ||
                                                        undefined,
                                            })),
                                    };
                                }
                                onChange && onChange(val);
                                return Promise.resolve(val);
                            }
                        } catch (error) {
                            // 未修改权限时 【await itemRef.current()】 会 throw undefined
                            if (error === undefined && checked) {
                                const val = {
                                    inherit: true,
                                    perminfos: []
                                }

                                onChange && onChange(val);
                                return Promise.resolve(val);
                            }

                            onChange && onChange(undefined);
                            return Promise.reject("share");
                        }
                    },
                };
            },
            [checked]
        );

        const showModal = useCallback(() => {
            const btn = (document.querySelector('.workcenter-form #shareComponent > div > button') ||
                document.querySelector('.workcenter-form #shareComponent > div > div > span:nth-child(1)')) as HTMLElement;

            if (btn && typeof btn?.click === 'function') {
                btn.click();
            }
        }, [])

        const entry = useMemo(() => {
            if (devEntry) {
                return devEntry;
            }
            return `${prefixUrl}/anyshare/widget/webmicroapps/shareComponent.html`;
        }, [prefixUrl, devEntry]);

        return (
            <>
                {
                    // 检查属性完整
                    !difference(['name', 'type', 'size', 'docid'], Object.keys(items[0])).length
                        ? (
                            <div className={`${styles['container']} workcenter-form`}>
                                <span
                                    style={!checked ? { display: 'none' } : {}}
                                    className={styles["text"]}
                                    onClick={showModal}
                                >
                                    {t("added", "已添加")}
                                </span>
                                <div style={checked ? { display: 'none' } : {}}>
                                    <QiankunApp
                                        name="shareComponent"
                                        entry={entry}
                                        style={{ height: "100%" }}
                                        appProps={{
                                            items,
                                            attrs: {
                                                title: t("setPerm", "设置权限"),
                                                required: required,
                                                errorTip: t("emptyMessage"),
                                            },
                                            registerSubmitCallback,
                                        }}
                                    ></QiankunApp>
                                </div>
                            </div>
                        )
                        : null
                }
            </>
        )
    }
);
