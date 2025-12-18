import { Checkbox } from "antd";
import { CheckboxValueType } from "antd/es/checkbox/Group";
import React, { FC, useCallback, useMemo } from "react";
import styles from "./styles/params-form.module.less";
import { useTranslate } from "@applet/common";
import { difference, includes, uniq, without } from "lodash";

export type PermStr =
    | "cache"
    | "delete"
    | "modify"
    | "create"
    | "download"
    | "preview"
    | "display";

interface AsPermValue {
    allow: PermStr[];
}

interface AsPermProps {
    defaultValue?: AsPermValue;
    value?: AsPermValue;
    onChange?: (value?: object) => void;
    asPermOptions: PermStr[];
    disabledPerm?: PermStr[];
    hiddenPerm?: PermStr[]  // wiki分组权限申请界面隐藏下载 -【651917】
}

// 权限依赖项
const permRely: Record<string, PermStr[]> = {
    download: ['preview'],
    modify: ['preview', 'download']
}

// 权限被依赖项
const permBeRely: Record<string, PermStr[]> = {
    download: ['modify'],
    preview: ['modify', 'download']
}

export const AsPerm: FC<AsPermProps> = ({
    defaultValue,
    value,
    onChange,
    asPermOptions = ["preview", "download"],
    disabledPerm = [],
    hiddenPerm = []
}) => {
    const t = useTranslate();
    const defaultPerm = useMemo(
        () => (defaultValue ? defaultValue?.allow : undefined),
        [defaultValue]
    );

    const perm = useMemo(() => value?.allow, [value?.allow]);

    const onPermChange = useCallback(
        (list: CheckboxValueType[]) => {
            let newList = [...list] as PermStr[]
            const { allow } = value as { allow: PermStr[] }
            const isAdd = list.length > allow.length;
            const [perm] = difference([...isAdd ? list : allow], [...isAdd ? allow : list]) as [PermStr];

            if (isAdd) {
                newList = uniq([...newList, ...(permRely[perm] || [])])
            } else {
                newList = newList.filter((value) => !includes((permBeRely[perm] || []), value))
            }

            onChange && onChange({ allow: newList, deny: [] });
        },
        [onChange]
    );

    const filterAsPermOptions = without(asPermOptions, ...hiddenPerm)

    return (
        <Checkbox.Group
            className={styles["check-box-group"]}
            options={filterAsPermOptions.map((i) => ({
                value: i,
                label: t(`perm.${i}`),
                disabled: disabledPerm.includes(i)
            }))}
            defaultValue={defaultPerm}
            value={perm}
            onChange={onPermChange}
        />
    );
};
