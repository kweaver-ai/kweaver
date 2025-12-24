import { useTranslate } from "@applet/common";
import { errorBase64 } from "./error-base64";
import styles from "./table-empty.module.less";

// 无网或报错时加载提示
export default function OfflineTip() {
    const t = useTranslate();

    return (
        <div className={styles["empty-container"]}>
            <div className={styles["img-wrapper"]}>
                <img
                    src={errorBase64}
                    className={styles["error-img"]}
                    alt="error"
                />
            </div>
            <span className={styles["tip"]}>
                {t("err.loadFail", "抱歉，无法完成加载")}
            </span>
        </div>
    );
}
