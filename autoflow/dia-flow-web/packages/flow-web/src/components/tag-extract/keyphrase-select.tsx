import { Select, Tag } from "antd";
import { useContext, useState } from "react";
import { last } from "lodash";
import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles/keyphrase-select.module.less";
import clsx from "clsx";

/**
 * 检测字符串中是否含有 # \ / : * ? " < > | 非法字符
 */
export const testIllegalCharacter = (value: string): boolean => {
    return /[#\\/:*?"<>|]/.test(value);
};

const MaxLength = 50;

interface KeyPhraseProps {
    value?: string[];
    onChange?: (val: string[]) => void;
}
export const KeyPhrase = ({ value = [], onChange }: KeyPhraseProps) => {
    const [searchValue, setSearchValue] = useState<string>("");
    const { microWidgetProps } = useContext(MicroAppContext);
    const lang = microWidgetProps?.language?.getLanguage;
    const t = useTranslate();

    const handleChange = (tags: string[]) => {
        if (tags.length > value.length) {
            const customValue: string = last(tags) || "";
            //去掉标签的前后空格
            const newTag = customValue?.replace(/(^\s*)|(\s*$)/g, "");

            onChange && onChange([...value, newTag]);
        } else {
            onChange && onChange(tags);
        }

        setSearchValue("");
    };
    const handleSearch = (value: string) => {
        if (testIllegalCharacter(value)) {
            microWidgetProps?.components?.toast.info(
                t(
                    "keyPhrase.forbidden",
                    '不能包含#  / : * ? " < > |特殊字符，请重新输入。'
                )
            );
            return;
        }
        if (value.length > MaxLength) {
            microWidgetProps?.components?.toast.info(
                t("keyPhrase.overLimit", "单个标签最多输入50个字符。")
            );
            return;
        }
        setSearchValue(value);
    };

    return (
        <Select
            mode="tags"
            style={{ width: "100%", height: "90px" }}
            onChange={handleChange}
            className={clsx(styles["keyphrase"], {
                [styles["keyphrase-en"]]: lang === "en-us",
            })}
            options={[]}
            open={false}
            value={value}
            searchValue={searchValue}
            onSearch={handleSearch}
            onInputKeyDown={(e) => {
                if (e.key === "Enter") {
                    const tag = searchValue.trim();

                    if (value.includes(tag)) {
                        microWidgetProps?.components?.toast.info(
                            t("keyPhrase.repeat", "不允许添加重复的关键词组。")
                        );
                        return;
                    }
                }
            }}
            dropdownStyle={{
                maxWidth: 0,
                minWidth: 0,
                overflow: "auto",
                padding: 0,
                boxShadow: "none",
            }}
            placeholder={t(
                "keyPhrase.placeholder",
                "多个关键词之间为“或”关系，输入多标签时按回车键{Enter}进行分隔"
            )}
            tagRender={(props) => {
                const { value, onClose } = props as any;
                return (
                    <Tag
                        key={value}
                        closable={true}
                        onClose={onClose}
                        className={styles["tag"]}
                    >
                        <span key={value} title={value}>
                            {value}
                        </span>
                    </Tag>
                );
            }}
        ></Select>
    );
};
