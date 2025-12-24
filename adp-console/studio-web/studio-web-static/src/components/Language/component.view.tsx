import React from "react";
import classnames from "classnames";
import { Dropdown, Menu } from "antd";
import { GlobalOutlined, DownOutlined } from "@ant-design/icons";
import { Languages } from "../../core/language";
import LanguageBase from "./component.base";
import styles from "./styles.module.less";

export default class Language extends LanguageBase {
    render() {
        const { languageList, currentLang } = this.state;

        if (languageList.length <= 1) {
            return null;
        }

        const currentLanguage = Languages.find(
            ({ language }) => language === currentLang
        );

        const menuItems = languageList.map(({ title, language }) => ({
            key: language,
            label: title,
        }));

        return (
            <Dropdown
                overlay={
                    <Menu
                        onClick={({ key }) => {
                            this.switchLanguages(key as string);
                        }}
                        selectedKeys={[currentLang]}
                    >
                        {menuItems.map((item) => (
                            <Menu.Item key={item.key}>{item.label}</Menu.Item>
                        ))}
                    </Menu>
                }
                placement="bottomRight"
                trigger={["hover"]}
            >
                <div
                    className={classnames(
                        styles["header-layout"],
                        styles["font"]
                    )}
                >
                    <GlobalOutlined
                        style={{ fontSize: 16, color: "#7f8391" }}
                        className={styles["header-icon"]}
                    />
                    <span className={styles["header-item"]}>
                        {currentLanguage?.title}
                    </span>
                    <DownOutlined
                        style={{ fontSize: 12, color: "#7f8391" }}
                        className={styles["header-icon"]}
                    />
                </div>
            </Dropdown>
        );
    }
}
