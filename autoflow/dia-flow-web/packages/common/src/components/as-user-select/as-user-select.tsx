import { Button, Space, Tag } from "antd";
import { clamp } from "lodash";
import React, { useContext, useLayoutEffect, useState } from "react";
import { TranslateFn, useEvent, useTranslate } from "../../hooks";
import { MicroAppContext } from "../micro-app";
// @ts-ignore
import { apis, components } from "@dip/components";
import { getRoleByUserInfo } from "../../utils/roles";

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

export function toItem(source: ItemSource): AsUserSelectItem {
  return {
    id: getItemId(source),
    name: getItemName(source),
    type: getItemType(source),
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

export interface AsUserSelectItem {
  id: string;
  name: string;
  type: ItemType;
}

export interface AsUserSelectChildProps {
  t: TranslateFn;
  items: AsUserSelectItem[];
  onAdd(): void;
  addItem(item: AsUserSelectItem): void;
  removeItem(item: AsUserSelectItem): void;
  removeAllItems(): void;
}

interface GroupOptionsType {
  select: 1 | 2 | 3;
  drillDown: 1 | 2;
}
export interface AsUserSelectProps {
  defaultValue?: AsUserSelectItem[];
  value?: AsUserSelectItem[];
  multiple?: boolean;
  title?: string;
  /**1表示仅可选择部门，2表示仅可选择个人，3表示均可选择，默认为3，部门和个人都可选择 */
  selectPermission?: 1 | 2 | 3;
  isBlockContact?: boolean;
  isBlockGroup?: boolean;
  groupOptions?: GroupOptionsType;
  selectedVisitorsCustomLabel?: string;
  children?(props: AsUserSelectChildProps): React.ReactElement;
  onChange?(items: AsUserSelectItem[]): void;
}

export function AsUserSelect(props: AsUserSelectProps) {
  const { children = defaultAsUserSelectChildRender } = props;
  const { microWidgetProps, functionId } = useContext(MicroAppContext);
  const t = useTranslate();
  const { isAdmin, roleType } = getRoleByUserInfo(
    microWidgetProps?.config?.userInfo
  );

  const [items, setItems] = useState(props.value || props.defaultValue || []);

  useLayoutEffect(() => {
    if (Array.isArray(props.value)) {
      setItems(props.value);
    }
  }, [props.value]);

  const isControlled = "value" in props;

  const changeItems = useEvent((items: AsUserSelectItem[]) => {
    if (isControlled) {
      if (typeof props.onChange === "function") {
        props.onChange(items);
      }
    } else {
      setItems(items);
    }
  });

  const {
    multiple = true,
    title = t("selectTitle", "选择"),
    selectedVisitorsCustomLabel = t("selected", "已选："),
    selectPermission = 3,
    isBlockContact = false,
    isBlockGroup = false,
    groupOptions = undefined,
  } = props;

  const onAdd = useEvent(async () => {
    // const addAccessorFn = microWidgetProps?.contextMenu?.addAccessorFn({
    //     functionid: functionId,
    //     multiple,
    //     title,
    //     selectedVisitorsCustomLabel,
    //     selectPermission,
    //     isBlockContact,
    //     groupOptions,
    //     containerOptions: {
    //         height: clamp(window.innerHeight, 400, 584),
    //     },
    // });

    const accessorPicker = apis.mountComponent(
      components.AccessorPicker,
      {
        range: selectPermission === 1 ? ["department"] : ["user", "group", "department"],
        tabs:
          selectPermission === 1 ? ["organization"] : ["organization", "group"],
        title: "选择范围",
        isAdmin,
        role: roleType,
        multiple,
        onSelect: (selections: any) => {
          const addAccessorFn = selections?.map((item: any) => {
            return {
              ...item,
              ...item?.user,
              name:
                item?.name || item?.user?.displayName || item?.user?.loginName,
              id: item?.id || item?.userid,
            };
          });

          if (isBlockGroup) {
            const blockGroup = (times: number) => {
              if (times > 5) {
                return;
              }
              setTimeout(() => {
                const groupTab = window.document.getElementById("tab-group");
                if (groupTab) {
                  groupTab.style.visibility = "hidden";
                } else {
                  blockGroup(times + 1);
                }
              }, 50);
            };
            blockGroup(1);
          }
          try {
            const accessors = addAccessorFn;

            if (accessors && accessors.length) {
              if (multiple) {
                const newItems = [...items];
                accessors.forEach((accessor: any) => {
                  const item = toItem(accessor as any);
                  if (!newItems.some(({ id }) => id === item.id)) {
                    newItems.push(item);
                  }
                });
                changeItems(newItems);
              } else {
                changeItems([toItem(accessors[0] as any)]);
              }
            }
          } catch (error) {
            if (error) {
              console.error(error);
            }
          } finally {
            if (isBlockGroup) {
              setTimeout(() => {
                const groupTab = window.document.getElementById("tab-group");
                if (groupTab) {
                  groupTab.style.visibility = "visible";
                }
              }, 1000);
            }
          }

          accessorPicker();
        },
        onCancel: () => {
          accessorPicker();
        },
      },
      document.createElement("div")
    );
  });

  const addItem = useEvent((item: AsUserSelectItem) => {
    if (!items.some(({ id }) => id === item.id)) {
      if (multiple) {
        changeItems([...items, item]);
      } else {
        changeItems([item]);
      }
    }
  });

  const removeItem = useEvent((item: AsUserSelectItem) => {
    if (items.some(({ id }) => id === item.id)) {
      changeItems(items.filter(({ id }) => id !== item.id));
    }
  });

  const removeAllItems = useEvent(() => {
    if (items.length) {
      changeItems([]);
    }
  });

  return children({ items, t, onAdd, addItem, removeItem, removeAllItems });
}

function defaultAsUserSelectChildRender({
  t,
  items,
  onAdd,
  removeItem,
}: AsUserSelectChildProps) {
  return (
    <Space size={[0, 8]} wrap>
      {items.map((item) => (
        <Tag key={item.id} closable onClose={() => removeItem(item)}>
          {item.name}
        </Tag>
      ))}
      <Button onClick={onAdd}>{t("common.useSelect.add", "添加")}</Button>
    </Space>
  );
}
