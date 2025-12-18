import clsx from "clsx";
import { FC } from "react";
import styles from "./editor.module.less";

interface TileProps {
    name: string;
    description?: string;
    icon: string;
    selected: boolean;
    hiddenDescription?: boolean;
    className?: string;
    onClick?(): void;
}

export const Tile: FC<TileProps> = ({
    name, description, icon, selected, onClick, hiddenDescription = false, className = ''
}) => {
    return (
        <div
            style={{ height: `${hiddenDescription ? '56px' : ''}` }}
            className={clsx(styles.tile, selected && styles.selected, className)}
            onClick={onClick}
        >
            <div className={styles.nameRow}>
                <img className={styles.icon} src={icon} alt={name} />
                <span className={styles.name} title={name}>{name}</span>
            </div>
            {
                !hiddenDescription && (
                    <div className={styles.description} title={description}>
                        {description}
                    </div>
                )
            }
        </div>
    );
};
