import * as React from "react";
import { Props } from "./index.d";
import styles from "./styles.module.less";
import classnames from "classnames";
// import GradientBorder from "../../common-components/GradientBorder";

export const Template: React.FunctionComponent<Props> = React.memo(
    ({
        header,
        content,
        footer,
        about,
        fontStyle = "light",
        className,
        loginHeight = 410,
    }) => {
        return (
            <div className={classnames(styles["container"], className)}>
                {/* <GradientBorder> */}
                <div className={styles["index"]}>
                    <div
                        className={styles["header-bar"]}
                        style={{ height: loginHeight % 2 ? "64px" : "63px" }}
                    >
                        {header}
                    </div>
                    <div className={styles["login"]}>{content}</div>
                    <div className={styles["footer"]}>{footer}</div>
                </div>
                {/* </GradientBorder> */}
                <div
                    className={classnames(
                        styles["about"],
                        fontStyle === "light" ? styles["font"] : ""
                    )}
                >
                    {about}
                </div>
            </div>
        );
    }
);
