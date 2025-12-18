import { TranslateFn } from "@applet/common";
import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import React, { useMemo } from "react";

interface InheritProps {
    value?: any;
    onChange?: any;
    t: TranslateFn;
}

export const Inherit = (props: InheritProps) => {
    const { value, onChange, t } = props;

    const checked = useMemo(() => {
        if (value === -1) {
            return true;
        }
        return false;
    }, [value]);

    const onCheckChange = (e: CheckboxChangeEvent) => {
        if (e.target.checked) {
            onChange(-1);
        } else {
            onChange(0);
        }
    };
    return (
        <Checkbox checked={checked} onChange={onCheckChange}>
            {t(
                "inheritDescription",
                "将该触发规则同时应用到目标文件夹的所有子文件夹"
            )}
        </Checkbox>
    );
};
