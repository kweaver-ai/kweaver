import { API, TranslateFn } from "@applet/common";
import { Select } from "antd";
import { isNumber, isObject, toPairs } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { useSecurityLevel } from "../../components/log-card";
import { useHandleErrReq } from "../../utils/hooks";

export const getCsfText = (level?: number, enums?: object) => {
    if (!isNumber(level) || !isObject(enums)) {
        return level;
    }
    const res = Object.fromEntries(
        Object.entries(enums).map(([k, v]) => [v, k])
    );
    return res[level] ?? level;
};

export const CsfLevelSelect: FC<{
    t: TranslateFn;
    value?: number;
    customLevelPlaceholder?: string;
    onChange?(number: number): void;
}> = ({ t, value, onChange, customLevelPlaceholder }) => {
    const [csfOptions, setCsfOptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // 获取系统密级配置
    const [csf_level_enum] = useSecurityLevel();
    const handleErr = useHandleErrReq();

    async function getCsf() {
        setIsLoading(true);
        try {
            const options = [
                ...toPairs(csf_level_enum)
                    .sort((a: any, b: any) => a[1] - b[1])
                    .map(([text, level]) => ({ level, text })),
            ];
            setCsfOptions(options);
        } catch (error: any) {
            handleErr({ error: error?.response });
            setCsfOptions([]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleChange = (value: number) => {
        onChange && onChange(value);
    };

    const isEmpty = useMemo(() => csfOptions.length === 0, [csfOptions]);

    useEffect(() => {
        if (csf_level_enum) {
            getCsf();
        }
    }, [csf_level_enum]);

    return (
        <Select
            placeholder={customLevelPlaceholder}
            value={value}
            onChange={handleChange}
            loading={isEmpty}
            onDropdownVisibleChange={(open) => {
                if (open && !isLoading && isEmpty) {
                    getCsf();
                }
            }}
        >
            {!isEmpty &&
                csfOptions.map(({ level, text }) => (
                    <Select.Option key={level} value={level}>
                        {text}
                    </Select.Option>
                ))}
            {/* 请求错误时只显示已选密级 */}
            {isEmpty && value && csf_level_enum && (
                <Select.Option key={value} value={value}>
                    {getCsfText(value, csf_level_enum)}
                </Select.Option>
            )}
        </Select>
    );
};
