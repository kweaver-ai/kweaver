import { Button } from "antd";
import { InteractiveCreate } from "../../components/interactive-create";
import { TemplateList } from "../../components/template-list";
import styles from "./home.module.less";
import { useNavigate } from "react-router-dom";
import { useTranslate } from "@applet/common";

export const HomePage = () => {
    const navigate = useNavigate();
    const t = useTranslate();

    return (
        <div className={styles["home-content"]}>
            <InteractiveCreate />
            <div className={styles["category-container"]}>
                <div className={styles["category-bar"]}>
                    <div className={styles["label-wrapper"]}>
                        <div className={styles["label"]} />
                        <span>{t("nav.template", "流程模板")}</span>
                    </div>
                    <div className={styles["link"]}>
                        <span>{t("goTemplate", "更多模板，前往")} </span>
                        <Button
                            type="link"
                            onClick={() => {
                                navigate("/nav/template");
                            }}
                        >
                            {t("nav.template", "流程模板")}
                        </Button>
                    </div>
                </div>
                <TemplateList showCategoryName={false} />
            </div>
        </div>
    );
};
