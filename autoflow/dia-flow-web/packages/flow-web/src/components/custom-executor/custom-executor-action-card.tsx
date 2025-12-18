import { Button, Card, Space } from "antd";
import styles from "./custom-executor-action-card.module.less";
import {
    CustomActionColored,
    DeleteOutlined,
    FormOutlined,
    PlusOutlined,
} from "@applet/icons";
import { useTranslate } from "@applet/common";
import { ExecutorActionDto } from "../../models/executor-action-dto";

export interface CustomExecutorActionCardProps {
    isAccessible?: boolean;
    action: ExecutorActionDto;
    onEdit(): void;
    onRemove(): void;
}

export function NewCustomExecutorActionCard({ onClick }: { onClick?(): void }) {
    const t = useTranslate("customExecutor");

    return (
        <Card
            className={styles.Card}
            bodyStyle={{ padding: 0 }}
            onClick={onClick}
        >
            <div className={styles.NewCard}>
                <PlusOutlined style={{ fontSize: 24 }} />
                <div className={styles.NewCardTitle}>
                    {t("newAction", "新建自定义动作")}
                </div>
            </div>
        </Card>
    );
}

export function CustomExecutorActionCard({
    isAccessible,
    action,
    onEdit,
    onRemove,
}: CustomExecutorActionCardProps) {
    const t = useTranslate("customExecutor");

    return (
        <Card className={styles.Card} bodyStyle={{ padding: 0 }}>
            <header className={styles.Header}>
                <CustomActionColored className={styles.Icon} />
                <div className={styles.Title}>
                    <div className={styles.Name} title={action.name}>
                        {action.name}
                    </div>
                </div>
                {isAccessible && (
                    <Space>
                        <Button
                            className={styles.MenuTriggerButton}
                            icon={<FormOutlined />}
                            type="text"
                            onClick={onEdit}
                        />
                        <Button
                            className={styles.MenuTriggerButton}
                            icon={<DeleteOutlined />}
                            type="text"
                            onClick={onRemove}
                        />
                    </Space>
                )}
            </header>
            <div className={styles.Description} title={action.description}>
                {action.description}
            </div>
        </Card>
    );
}
