import { useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, Card, Typography } from "antd";
import { useTranslate } from "@applet/common";
import useSize from "@react-hook/size";
import { getContent } from "../task-card";
import { OemConfigContext } from "../oem-provider";
import styles from "./template-card.module.less";

interface TemplateCardProps {
    template: any;
}

export const TemplateCard = ({ template }: TemplateCardProps) => {
    const { normal, hover, active } = useContext(OemConfigContext);
    const navigate = useNavigate();
    const t = useTranslate();
    const container = useRef<HTMLDivElement>(null);
    const [width] = useSize(container);
    const location = useLocation();

    return (
        <>
            <style type="text/css">
                {`
                    .${styles["template-card"]}:hover {
                        border-color: ${normal} !important;
                    }
                    .${styles["template-card"]}:hover .${styles["card-btn"]} {
                        background-color: ${normal} !important;
                    }
                    .${styles["template-card"]}:hover .${styles["card-btn"]}:hover {
                        background-color: ${hover} !important;
                    }
                    .${styles["template-card"]}:hover .${styles["card-btn"]}:active {
                        background-color: ${active} !important;
                    }
            `}
            </style>
            <Card className={styles["template-card"]}>
                <div className={styles["template-card-header"]}>
                    <Typography.Text
                        ellipsis
                        className={styles["header-title"]}
                        title={t(`${template.title}`)}
                    >
                        {t(`${template.title}`)}
                    </Typography.Text>
                </div>
                <div
                    className={styles["template-card-content"]}
                    ref={container}
                >
                    {getContent(template.actions, width)}
                </div>
                <div className={styles["template-card-footer"]}>
                    <Button
                        className={styles["card-btn"]}
                        onClick={() => {
                            if (location.pathname === "/") {
                                navigate(
                                    `/new?template=${template?.templateId}`
                                );
                            } else {
                                navigate(
                                    `/new?template=${
                                        template?.templateId
                                    }&back=${btoa(location.pathname)}`
                                );
                            }
                        }}
                    >
                        {t("template.use", "使用")}
                    </Button>
                </div>
            </Card>
        </>
    );
};
