import { Card, Checkbox, Dropdown, Input, Menu } from "antd";
import {
    useTranslate,
    useFormatPermText,
    AsPermValue,
    AllPerms,
    PermStr,
} from "../../hooks";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import styles from "./as-perm-select.module.less";
import { CheckboxChangeEvent } from "antd/es/checkbox";

export interface AsPermSelectProps {
    defaultValue?: AsPermValue;
    value?: AsPermValue;
    onChange?: (value: AsPermValue) => void;
}

const DefaultPermValue: AsPermValue = {
    allow: [],
    deny: [],
};

export { useFormatPermText, AllPerms, AsPermValue, PermStr };

export function AsPermSelect(props: AsPermSelectProps) {
    const t = useTranslate("common.asPermSelect");

    const [value, setValue] = useState(
        props.value || props.defaultValue || DefaultPermValue
    );

    const isControlled = "value" in props;

    useLayoutEffect(() => {
        if (props.value) {
            setValue(props.value);
        }
    }, [props.value]);

    const denySet = useMemo(() => new Set(value.deny), [value.deny]);
    const allowSet = useMemo(() => new Set(value.allow), [value.allow]);
    const formatPermText = useFormatPermText();
    const permText = useMemo(() => {
        return formatPermText(value);
    }, [value.allow, value.deny]);

    const changeValue = useCallback(
        (value: AsPermValue) => {
            if (value.allow.length === 0 && value.deny.length === 0) {
                return;
            }
            if (isControlled) {
                if (typeof props.onChange === "function") {
                    props.onChange(value);
                }
            } else {
                setValue(value);
            }
        },
        [props.onChange, isControlled]
    );

    function onAllowChange(perm: PermStr, e: CheckboxChangeEvent) {
        const allowSet = new Set(value.allow);
        if (e.target.checked) {
            allowSet.add(perm);

            if (!allowSet.has("display")) {
                allowSet.add("display");
            }

            if (allowSet.has("modify")) {
                if (!allowSet.has("preview") && !allowSet.has("download")) {
                    allowSet.add("preview");
                    allowSet.add("download");
                }
            }

            changeValue({
                allow: Array.from(allowSet),
                deny: value.deny.filter((perm) => !allowSet.has(perm)),
            });
        } else {
            allowSet.delete(perm);

            if (!allowSet.has("download") && !allowSet.has("preview")) {
                allowSet.delete("modify");
            }

            if (!allowSet.has("display")) {
                allowSet.clear();
            }

            changeValue({
                allow: Array.from(allowSet),
                deny: value.deny,
            });
        }
    }

    function onDenyChange(perm: PermStr, e: CheckboxChangeEvent) {
        const denySet = new Set(value.deny);

        if (e.target.checked) {
            denySet.add(perm);
            if (denySet.has("display")) {
                AllPerms.forEach((perm) => denySet.add(perm));
            }

            if (denySet.has("preview") && denySet.has("download")) {
                denySet.add("modify");
            }

            changeValue({
                allow: value.allow.filter((p) => !denySet.has(p)),
                deny: Array.from(denySet),
            });
        } else {
            denySet.delete(perm);
            changeValue({
                allow: value.allow,
                deny: Array.from(denySet),
            });
        }
    }

    return (
        <Dropdown
            trigger={["click"]}
            transitionName=""
            overlayStyle={{ width: 304, minWidth: 304 }}
            overlay={
                <Menu className={styles["menu"]}>
                    <table
                        style={{
                            width: "100%",
                            lineHeight: "24px",
                            textAlign: "center",
                        }}
                    >
                        <colgroup>
                            <col width="40%" />
                            <col width="30%" />
                            <col width="30%" />
                        </colgroup>
                        <thead>
                            <tr style={{ color: "rgba(0,0,0,.55)" }}>
                                <th>{t("perm", "访问权限")}</th>
                                <th>{t("allow", "允许")}</th>
                                <th>{t("deny", "拒绝")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {AllPerms.map((perm) => {
                                return (
                                    <tr>
                                        <td>{t(`perm.${perm}`)}</td>
                                        <td>
                                            <Checkbox
                                                style={{ width: "auto" }}
                                                checked={allowSet.has(perm)}
                                                onChange={onAllowChange.bind(
                                                    null,
                                                    perm
                                                )}
                                            />
                                        </td>
                                        <td>
                                            <Checkbox
                                                style={{ width: "auto" }}
                                                checked={denySet.has(perm)}
                                                onChange={onDenyChange.bind(
                                                    null,
                                                    perm
                                                )}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Menu>
            }
        >
            <Input
                readOnly
                value={permText}
                placeholder={t("selectPlaceholder")}
            />
        </Dropdown>
    );
}
