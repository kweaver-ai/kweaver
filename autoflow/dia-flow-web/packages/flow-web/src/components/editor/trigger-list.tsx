import { FC, useContext, useMemo } from "react";
import { NavigationContext, useTranslate } from "@applet/common";
import { Trigger, Extension, Group } from "../extension";
import {
    useExtensionTranslateFn,
    useTranslateExtension,
    useTrigger,
} from "../extension-provider";
import { Tile } from "./tile";
import styles from "./editor.module.less";

export interface TriggerListProps {
    current?: Trigger;
    triggers: Trigger[];
    onChange(item: Trigger): void;
    group?: Group;
}

export const TriggerList: FC<TriggerListProps> = ({
    current,
    triggers,
    onChange,
    group,
}) => {
    const t = useTranslate();
    const et = useExtensionTranslateFn();
    const { getLocale } = useContext(NavigationContext);
    // 适配导航栏OEM
    const documents = useMemo(() => {
        return getLocale && getLocale("documents");
    }, [getLocale]);

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
                    {et(triggers[0].extensionName, group.name)}
                    {t("colon", ":")}
                </div>
            ) : null}
            <div className={styles.tileWrapper}>
                {triggers?.map((item) => (
                    <Tile
                        key={item.name}
                        name={
                            item.name === "TDocument"
                                ? et(item.extensionName, "TDocumentCustom", {
                                      name: documents,
                                  })
                                : et(item.extensionName, item.name)
                        }
                        description={
                            item.description &&
                            et(item.extensionName, item.description)
                        }
                        icon={item.icon}
                        selected={current === item}
                        onClick={() => onChange(item)}
                    />
                ))}
            </div>
        </>
    );
};
