import { useTranslate } from "@applet/common";
import { ExecutorAction, Extension, Group, TriggerAction } from "../extension";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import styles from "./editor.module.less";
import { Tile } from "./tile";
import { isFunction } from "lodash";
import { useContext } from "react";

const DescriptionHidden = [
    "@trigger/dataflow-tag",
    "@trigger/dataflow-user",
    "@trigger/dataflow-dept",
]

export interface ActionListProps<T extends ExecutorAction | TriggerAction> {
    extension: Extension;
    group?: Group;
    current?: T;
    actions: T[];
    onChange(action: T): void;
}

export function ActionList<T extends ExecutorAction | TriggerAction>({
    extension,
    group,
    current,
    actions,
    onChange,
}: ActionListProps<T>) {
    const t = useTranslate();
    const te = useTranslateExtension(extension.name);
    const { globalConfig } = useContext(ExtensionContext);

    return (
        <>
            {group ? (
                <div className={styles.groupTitle}>
                    {group.icon ? (
                        <img
                            className={styles.groupIcon}
                            src={group.icon}
                            alt={group.name}
                        />
                    ) : null}
                    {te(group.name)}
                    {t("colon", ":")}
                </div>
            ) : null}
            <div className={styles.tileWrapper}>
                {actions.map((item) => {
                    const isCustom = item.operator.startsWith("@custom");
                    return (
                        <Tile
                            key={item.operator}
                            name={
                                isCustom
                                    ? item.name
                                    : isFunction(item.name)
                                        ? te(item.name(globalConfig))
                                        : te(item.name)
                            }
                            description={
                                isCustom
                                    ? item.description
                                    : isFunction(item.description)
                                        ? te(item.description(globalConfig))
                                        : te(item.description || "")
                            }
                            hiddenDescription={DescriptionHidden.includes(item.operator) && !item.description}
                            icon={item.icon}
                            selected={current === item}
                            onClick={() => onChange(item)}
                        />
                    );
                })}
            </div>
        </>
    );
}
