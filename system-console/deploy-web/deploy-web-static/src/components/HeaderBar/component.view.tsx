import * as React from "react";
import styles from "./styles.module.less";
import Language from "../Language/component.view";
import HeaderBarBase from "./component.base";

export class HeaderBar extends HeaderBarBase {
    render() {
        const { isCNLang, moduleConfigs } = this.props;
        return (
            <div>
                <div className={styles["index-header"]}>
                    <span className={styles["index-nav-logo"]}></span>
                    <div
                        className={
                            isCNLang
                                ? styles["nav-language-cn"]
                                : styles["nav-language-other"]
                        }
                    >
                        <Language
                            indexView={true}
                            moduleConfigs={moduleConfigs}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default HeaderBar;
