import { useMemo } from "react";
import styles from "./model-panel.module.less";
import { useTranslate } from "@applet/common";
import clsx from "clsx";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ModelPage } from "../../components/model-hub";
import { CustomModelPage } from "../../components/custom-model";

export const ModelPanel = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const t = useTranslate();
    const pathName = location.pathname;

    const tabs = useMemo(
        () => [
            { key: "/nav/model", name: t("model.tab.inner", "内置能力") },
            {
                key: "/nav/model/custom",
                name: t("model.tab.custom", "自定义能力"),
            },
        ],
        [t]
    );

    const isChecked = (key: string) => {
        if (pathName === key) {
            return true;
        }
        return false;
    };

    return (
        <>
            <div className={styles["tabs"]}>
                {tabs.map((item, index) => {
                    return (
                        <span
                            key={item.key}
                            className={clsx(styles["nav-item"], {
                                checked: isChecked(item.key),
                            })}
                            data-oem="automate-oem-tab"
                            onClick={() => navigate(item.key)}
                        >
                            {item.name}
                        </span>
                    );
                })}
            </div>
            <Routes>
                <Route path="/" element={<ModelPage />} />
                <Route path="/custom" element={<CustomModelPage />} />
            </Routes>
        </>
    );
};
