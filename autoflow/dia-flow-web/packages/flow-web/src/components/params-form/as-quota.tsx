import { API, MicroAppContext, useTranslate } from "@applet/common";
import { InputNumber } from "antd";
import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import styles from "./styles/params-form.module.less";
import { ItemCallback } from "./params-form";
import { InvalidStatus } from "./as-suffix";

interface AsQuotaProps {
    value?: any;
    onChange?: any;
    items?: any;
    required?: boolean;
}

export const AsQuota = forwardRef<ItemCallback, AsQuotaProps>(
    ({ items, value, onChange, required = false }, ref) => {
        const { prefixUrl } = useContext(MicroAppContext);
        const t = useTranslate();

        const [quotaValue, setQuotaValue] = useState(value);
        const [inValidStatus, setInvalidStatus] = useState<InvalidStatus>();
        const [freeSpace, setFreeSpace] = useState<number>();
        // const [usedSpace, setUsedSpace] = useState<number>(0);

        const handleChange = async (val: number) => {
            // 校验
            if (required && val === 0) {
                setInvalidStatus({
                    type: "empty",
                    message: t(`emptyMessage`),
                });
            } else if (
                inValidStatus?.type === "empty" &&
                typeof val === "number" &&
                val > 0
            ) {
                setInvalidStatus(undefined);
            }

            // 判断当前配额空间
            // if (usedSpace > val) {
            //     setInvalidStatus({
            //         type: "belowUsed",
            //         message: t(
            //             "quota.belowUsed",
            //             `配额空间不能小于当前已使用空间。`
            //         ),
            //     });
            // } else if (inValidStatus?.type === "belowUsed") {
            //     setInvalidStatus(undefined);
            // }

            // 判断父级文件夹剩余配额空间
            let space = freeSpace;
            if (!freeSpace) {
                space = await getFreeSpace();
            }
            if (space && space < val) {
                setInvalidStatus({
                    type: "overLimit",
                    message: t(
                        "quota.overLimit",
                        `当前文档管理剩余可分配空间为${formatDataToQuota(
                            space
                        )}GB。`,
                        { data: formatDataToQuota(space) || "-" }
                    ),
                });
            } else if (
                inValidStatus?.type === "overLimit" &&
                space &&
                space >= val
            ) {
                setInvalidStatus(undefined);
            }

            setQuotaValue(val);
            onChange(val);
        };

        const getFreeSpace = async () => {
            try {
                let space;
                if (items[0].docid.length > 71) {
                    const dirObjectId = items[0].docid.slice(-65, -33);
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/document/v1/dirs/${dirObjectId}/attributes/space_quota`
                    );
                    space = data.allocated - data.used;
                } else {
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/efast/v1/quota/doc-lib/${encodeURIComponent(
                            items[0].docid.slice(0, 38)
                        )}`
                    );
                    space = data.allocated - data.used;
                }

                setFreeSpace(space);
                return space;
            } catch (error: any) {
                console.error(error);
                return undefined;
            }
        };

        // const getUsedSpace = async () => {
        //     try {
        //         if (items[0].size === -1) {
        //             const dirObjectId = items[0].docid.slice(-32);
        //             const { data } = await API.axios.get(
        //                 `${prefixUrl}/api/document/v1/dirs/${dirObjectId}/attributes/space_quota`
        //             );

        //             if (data.used) {
        //                 setUsedSpace(data.used);
        //             }
        //         }
        //     } catch (error: any) {
        //         console.error(error);
        //     }
        // };

        useEffect(() => {
            getFreeSpace();
            // getUsedSpace();
        }, []);

        useImperativeHandle(
            ref,
            () => {
                return {
                    async submitCallback() {
                        if (items[0].size !== -1) {
                            return Promise.resolve();
                        }
                        if (
                            required &&
                            (typeof quotaValue !== "number" || quotaValue === 0)
                        ) {
                            setInvalidStatus({
                                type: "empty",
                                message: t(`emptyMessage`),
                            });
                            return Promise.reject("empty");
                        } else {
                            // 判断父级文件夹配额空间
                            let space = freeSpace;
                            if (!freeSpace) {
                                space = await getFreeSpace();
                            }
                            if (space && space < quotaValue) {
                                setInvalidStatus({
                                    type: "overLimit",
                                    message: t(
                                        "quota.overLimit",
                                        `当前文档管理剩余可分配剩余空间为${formatData(
                                            space
                                        )}GB。`,
                                        {
                                            data: formatData(space) || "-",
                                        }
                                    ),
                                });
                                return Promise.reject("overLimit");
                            }
                            if (!inValidStatus) {
                                onChange(quotaValue);
                                return Promise.resolve();
                            }
                        }
                        return Promise.reject("quota");
                    },
                };
            },
            [freeSpace, inValidStatus, onChange, quotaValue, required, t]
        );

        return (
            <>
                <QuotaInput
                    value={quotaValue}
                    onChange={handleChange}
                    status={inValidStatus}
                />
                {inValidStatus && (
                    <div className={styles["explain-error"]}>
                        {inValidStatus.message}
                    </div>
                )}
            </>
        );
    }
);

interface QuotaInputProps {
    value?: number;
    onChange?: (val: number) => void;
    status?: InvalidStatus;
}

/**
 * 将获取的配额空间数据转换成GB 保留两位小数
 * @param data 接口数据  配额空间
 */
export const formatDataToQuota = (data?: number): number | undefined => {
    if (typeof data === "number") {
        return Number((data / Math.pow(1024, 3)).toFixed(2));
    }
    return data;
};

// 不四舍五入
const formatData = (data: number): string => {
    if (typeof data === "number") {
        const res = data / Math.pow(1024, 3);
        if (res < 0.01) {
            return "0.00";
        }
        const resString = String(res);
        const decimalIndex = resString.indexOf(".");
        if (decimalIndex > -1) {
            return resString.slice(0, decimalIndex + 3);
        }
        return resString;
    }
    return "";
};

/**
 * 将表单的配额空间数据转换成B 并四舍五入取整
 * @param quota 前端表单数据  配额空间
 */
export const formatQuotaToData = (quota: number): number =>
    Math.round(quota * Math.pow(1024, 3));

export const QuotaInput = ({ value, onChange, status }: QuotaInputProps) => {
    const t = useTranslate();
    const transferVal = useMemo(() => formatDataToQuota(value), [value]);
    const handleChange = (val: number | null) => {
        if (val) {
            const reg = /^\d+(\.?)(\d{0,2}?$)/;
            if (reg.test(String(val))) {
                onChange && onChange(formatQuotaToData(val));
            }
        } else {
            onChange && onChange(0);
        }
    };
    return (
        <div className={styles["quota-wrapper"]}>
            <InputNumber
                value={transferVal}
                onChange={handleChange}
                min={0}
                max={1000000}
                precision={2}
                controls={false}
                style={{ width: "100%" }}
                placeholder={t("form.placeholder", "请输入")}
                className={styles["inputNumber"]}
                keyboard={false}
                status={status?.type ? "error" : undefined}
            />
            <span className={styles["addonAfter"]}>GB</span>
        </div>
    );
};
