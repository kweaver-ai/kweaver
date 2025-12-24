import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin } from "antd";
import { SyncuccessColored } from "@applet/icons";
import styles from "./auth-callback.module.less";

export const AuthCallBack = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const lang = params.get("lang") || "";

    const getTip = (lang = "zh-cn") => {
        switch (lang) {
            case "en-us":
                return "Authorized!";
            case "zh-tw":
                return "授權成功！";
            default:
                return "授权成功！";
        }
    };

    useEffect(() => {
        // 不是授权则跳转首页
        if (!lang) {
            navigate("/", { replace: true });
        }
    }, []);

    return lang ? (
        <>
            <div className={styles["container"]}>
                <SyncuccessColored className={styles["icon"]} />
                <div className={styles["text"]}>{getTip(lang)}</div>
            </div>
        </>
    ) : (
        <div className={styles["container"]}>
            <Spin />
        </div>
    );
};
