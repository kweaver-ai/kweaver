import { EllipsisOutlined } from "@ant-design/icons";
import { useTranslate } from "@applet/common";
import {
    CustomExecutorColored,
    DeleteOutlined,
    PlusOutlined,
    PreviewOutlined,
} from "@applet/icons";
import { Button, Card, Dropdown, Menu } from "antd";
import { ExecutorDto } from "../../models/executor-dto";
import styles from "./custom-executor-card.module.less";

export interface CustomExecutorCardProps {
    isAccessible?: boolean;
    executor: ExecutorDto;
    onOpen(): void;
    onRemove(): void;
}

export function NewCustomExecutonCard({ onClick }: { onClick?(): void }) {
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
                    {t("newExecutor", "新建自定义节点")}
                </div>
            </div>
        </Card>
    );
}

export function CustomExecutorCard({
    isAccessible,
    executor,
    onOpen,
    onRemove,
}: CustomExecutorCardProps) {
    const t = useTranslate("customExecutor");

    return (
        <Card
            className={styles.Card}
            bodyStyle={{ padding: 0 }}
            data-status={executor.status ? "enabled" : "disabled"}
            onClick={(e) => {
                if (!e.defaultPrevented) {
                    onOpen();
                }
            }}
        >
            <header className={styles.Header}>
                <CustomExecutorColored className={styles.Icon} />
                <div className={styles.Title}>
                    <div className={styles.Name} title={executor.name}>
                        {executor.name}
                    </div>
                    <div className={styles.Status}>
                        {executor.status === 1
                            ? t("executorStatus.enabled", "启用中")
                            : t("executorStatus.disabled", "已停用")}
                    </div>
                </div>
                {isAccessible && (
                    <Dropdown
                        trigger={["click"]}
                        overlayClassName={styles.DropdownOverlay}
                        overlay={() => (
                            <Menu
                                items={[
                                    {
                                        key: "view",
                                        icon: <PreviewOutlined />,
                                        label: t("view", "查看"),
                                    },
                                    {
                                        key: "delete",
                                        icon: <DeleteOutlined />,
                                        label: t("delete", "删除"),
                                        onClick(info) {
                                            info.domEvent.preventDefault();
                                            onRemove();
                                        },
                                    },
                                ]}
                            />
                        )}
                    >
                        <Button
                            className={styles.MenuTriggerButton}
                            icon={<EllipsisOutlined />}
                            type="text"
                        />
                    </Dropdown>
                )}
            </header>
            <div className={styles.Description} title={executor.description}>
                {executor.description}
            </div>
        </Card>
    );
}
