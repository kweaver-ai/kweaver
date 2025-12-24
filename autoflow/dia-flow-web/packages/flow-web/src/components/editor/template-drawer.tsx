import { useTranslate } from "@applet/common";
import { TemplateColored } from "@applet/icons";
import { Button, Card, Drawer, Typography } from "antd";
import { useContext } from "react";
import { EditorContext } from "./editor-context";
import styles from "./editor.module.less";
import { ITemplate } from "./upload-template";

interface TemplateDrawerProps {
    open: boolean;
    data: ITemplate[];
    onClose: () => void;
    onChoose: (template: ITemplate) => void;
}

export const TemplateDrawer = ({
    data,
    open,
    onClose,
    onChoose,
}: TemplateDrawerProps) => {
    const t = useTranslate();
    const { getPopupContainer } = useContext(EditorContext);

    return (
        <>
            <style type="text/css">
                {`
                .${styles["template-drawer-card"]}:hover {
                    border-color: rgba(84,126,232,1) !important;
                }

                .${styles["template-drawer-card"]}:hover button {
                    visibility:visible !important;
                }
            `}
            </style>
            <Drawer
                className={styles["configDrawer"]}
                // style={{ position: "absolute" }}
                width={432}
                push={false}
                maskClosable
                placement="left"
                open={open}
                onClose={onClose}
                getContainer={getPopupContainer}
                title={
                    <div className={styles["template-drawerTitle"]}>
                        {t("uploadTemplate.title", "从执行规则模板中选择")}
                    </div>
                }
            >
                <div>
                    {data.map((item) => (
                        <Card
                            key={item.key}
                            className={styles["template-drawer-card"]}
                            title={
                                <div className={styles["card-title"]}>
                                    <TemplateColored
                                        className={styles["template-icon"]}
                                    />
                                    <Typography.Text
                                        ellipsis
                                        title={t(item.title)}
                                        className={styles["value"]}
                                    >
                                        {t(item.title)}
                                    </Typography.Text>
                                </div>
                            }
                            extra={
                                <Button
                                    type="link"
                                    className={styles["expand-btn"]}
                                    onClick={() => {
                                        onChoose(item);
                                        onClose();
                                    }}
                                >
                                    {t("template.use", "使用")}
                                </Button>
                            }
                        >
                            <div className={styles["card-description"]}>
                                {t(item.description)}
                            </div>
                        </Card>
                    ))}
                </div>
            </Drawer>
        </>
    );
};
