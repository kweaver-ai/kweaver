import { Button, Input, Select } from "antd";
import { useContext } from "react";
import clsx from "clsx";
import styles from "./styles/as-user-select.module.less";
import { clamp } from "lodash";
import { MicroAppContext, useTranslate } from "@applet/common";

export interface DepItem {
    depid: string;
    name: string;
    path: string;
    isconfigable: boolean;
}

export interface UserItem {
    account: string;
    csflevel: number;
    deppath: string;
    mail: string;
    name: string;
    userid: string;
}

export interface UserGroupItem {
    id: string;
    name: string;
    sel_type: "group" | "user" | "department";
}

export interface ContactGroupItem {
    count: number;
    groupname: string;
    id: string;
}

export type ItemType = "user" | "department" | "contactor" | "group";
export type ItemSource = DepItem | UserItem | ContactGroupItem | UserGroupItem;

export interface Item {
    user_id: string;
    user_name: string;
    // type: ItemType;
}

export interface AsUserSelectProps<
    M extends boolean,
    V = M extends true ? Item[] : Item | undefined
> {
    multiple: M;
    value?: V;
    className?: string;
    title?: string;
    placeholder?: string;
    onFilter?(v: V): Promise<V> | V;
    onChange?(v: V): void;
}

function toItem(source: ItemSource): Item {
    return {
        user_id: getItemId(source),
        user_name: getItemName(source)!,
        // type: getItemType(source),
    };
}

function getItemId(item: ItemSource) {
    return (
        (item as UserItem).userid ||
        (item as ContactGroupItem).id ||
        (item as DepItem).depid
    );
}

function getItemName(item: ItemSource) {
    return (
        (item as UserItem | DepItem | undefined)?.name ||
        (item as ContactGroupItem | undefined)?.groupname
    );
}

function getItemType(item: ItemSource): ItemType {
    if ((item as UserItem).userid) {
        return "user";
    } else if (
        (item as DepItem).depid ||
        (item as UserGroupItem).sel_type === "department"
    ) {
        return "department";
    } else if ((item as ContactGroupItem).groupname) {
        return "contactor";
    } else if ((item as UserGroupItem).sel_type === "group") {
        return "group";
    } else {
        return "user";
    }
}

export function UserSelect<
    M extends boolean,
    V extends AsUserSelectProps<M>["value"] = AsUserSelectProps<M>["value"]
>({
    multiple = true as M,
    value = [] as unknown as V,
    className,
    title,
    placeholder,
    onFilter = (v: any) => v,
    onChange,
}: AsUserSelectProps<M>) {
    const { microWidgetProps, functionId } = useContext(MicroAppContext);
    const t = useTranslate();

    return (
        <div
            className={clsx(
                styles.container,
                className,
                multiple && "multiple"
            )}
        >
            {multiple ? (
                <Select
                    mode="tags"
                    className={clsx(styles.input, "input")}
                    open={false}
                    value={(value as Item[]).map((item) => item.user_id)}
                    showSearch={false}
                    searchValue=""
                    placeholder={placeholder}
                    onDeselect={(key: any) => {
                        onChange &&
                            onChange(
                                (value as Item[]).filter(
                                    (item) => item.user_id !== key
                                ) as any
                            );
                    }}
                >
                    {(value as Item[]).map((item) => (
                        <Select.Option key={item.user_id}>
                            {item.user_name}
                        </Select.Option>
                    ))}
                </Select>
            ) : (
                <Input
                    className={clsx(styles.input, "input")}
                    placeholder={placeholder}
                    readOnly
                    value={(value as Item)?.user_name}
                />
            )}
            <Button
                onClick={async () => {
                    try {
                        const source: ItemSource[] =
                            (await microWidgetProps?.contextMenu?.addAccessorFn(
                                {
                                    functionid: functionId,
                                    multiple,
                                    title,
                                    selectPermission: 2,
                                    groupOptions: { select: 3, drillDown: 1 },
                                    contactPermission: 2,
                                    selectedVisitorsCustomLabel: t(
                                        "selected",
                                        "已选："
                                    ),
                                    containerOptions: {
                                        height: clamp(
                                            window.innerHeight,
                                            400,
                                            584
                                        ),
                                    },
                                } as any
                            )) as any;
                        const items = source.map(toItem);
                        if (typeof onChange === "function") {
                            if (multiple) {
                                const newValue = [...((value || []) as Item[])];
                                const ids = new Set(
                                    newValue.map((item) => item.user_id)
                                );

                                items.forEach((item) => {
                                    if (!ids.has(item.user_id)) {
                                        newValue.push(item);
                                        ids.add(item.user_id);
                                    }
                                });
                                onChange(await onFilter(newValue as any));
                            } else {
                                onChange(await onFilter(items[0] as any));
                            }
                        }
                    } catch (e) {
                        console.error(e)
                    }
                }}
            >
                {t("select", "选择")}
            </Button>
        </div>
    );
}
