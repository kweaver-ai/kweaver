import React from 'react';
import { Button, Card, Dropdown, Menu, Typography } from 'antd';
import moment from 'moment';
import { useTranslate } from "@applet/common";
import { DeleteOutlined, OperationOutlined } from '@applet/icons';
import { PackageInfo } from '../../pages/python-packages';
import styles from './package-card.module.less';

interface PackageCardProps {
    packageInfo: PackageInfo;
    onRequestDelete: ({ name, id }: { name: string, id: string }) => void
}

function PackageCard({
    packageInfo: { id, name, created_at, creator_name },
    onRequestDelete
}: PackageCardProps): JSX.Element {
    const t = useTranslate();

    return (
        <Card className={styles["card"]}>
            <div className={styles["card-header"]}>
                <Typography.Text
                    ellipsis
                    className={styles["header-title"]}
                    title={name}
                >
                    {name}
                </Typography.Text>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <Dropdown
                        overlay={(
                            <Menu>
                                <Menu.Item
                                    key="delete"
                                    icon={
                                        <DeleteOutlined style={{ fontSize: "16px" }} />
                                    }
                                    onClick={() => onRequestDelete({ name, id })}
                                >
                                    {t("delete", "删除")}
                                </Menu.Item>
                            </Menu>
                        )}
                        trigger={["click"]}
                        transitionName=""
                        overlayClassName={styles["card-drop-menu"]}
                    >
                        <Button
                            className={styles["card-operation-btn"]}
                            type="text"
                        >
                            <OperationOutlined
                                style={{ fontSize: "16px" }}
                            />
                        </Button>
                    </Dropdown>
                </div>
            </div>
            <div className={styles["card-footer"]}>
                <div
                    className={styles["card-time"]}
                    title={formatTime(created_at)}
                >
                    {formatTime(created_at)}
                </div>
                <div
                    className={styles["card-time"]}
                    title={t("pythonPackage.installer", "Installer") + creator_name}
                >
                    {t("pythonPackage.installer", "Installer") + creator_name}
                </div>
            </div>
        </Card>
    )
};

function formatTime(timestamp?: number, format = "YYYY/MM/DD HH:mm") {
    if (!timestamp) {
        return "";
    }
    return moment(timestamp * 1000).format(format);
};

export { PackageCard };