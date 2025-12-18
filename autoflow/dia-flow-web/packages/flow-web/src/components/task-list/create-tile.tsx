import { FC } from "react";
import styles from "./task-list.module.less";

interface TileProps {
    name: string;
    description?: string;
    icon: any;
    onClick?(): void;
}

export const CreateTile: FC<TileProps> = ({
    name,
    description,
    icon,
    onClick,
}) => {
    return (
        <div className={styles["tile"]} onClick={onClick}>
            <div className={styles["nameRow"]}>
                {icon}
                <span className={styles["name"]} title={name}>
                    {name}
                </span>
            </div>
            <div className={styles["description"]} title={description}>
                {description}
            </div>
        </div>
    );
};
