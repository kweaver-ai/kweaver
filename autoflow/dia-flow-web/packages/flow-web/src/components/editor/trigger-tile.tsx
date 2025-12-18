import clsx from "clsx";
import { FC } from "react";
import { Extension, Trigger } from "../extension";
import { useTranslateExtension } from "../extension-provider";
import styles from "./editor.module.less";

interface TriggerTileProps {
    extension: Extension;
    selected?: boolean;
    trigger: Trigger;
    onSelected?(): void;
}

export const TriggerTile: FC<TriggerTileProps> = ({
    extension,
    trigger,
    selected,
    onSelected,
}) => {
    const te = useTranslateExtension(extension.name);

    return (
        <div
            className={clsx(styles.tile, selected && styles.selected)}
            onClick={onSelected}
        >
            <div className={styles.nameRow}>
                <img
                    className={styles.icon}
                    src={trigger.icon}
                    alt={te(trigger.name)}
                />
                <span className={styles.name}>{te(trigger.name)}</span>
            </div>
            <div
                className={styles.description}
                title={trigger.description && te(trigger.description)}
            >
                {trigger.description && te(trigger.description)}
            </div>
        </div>
    );
};
