import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles/tagExtract-example.module.less";
import { CardItem } from "../model-hub";
import { Button, Tag } from "antd";
import { useContext, useRef, useState } from "react";
import { CustomTextArea } from "../custom-textarea";

interface TagExtractExampleProps {
    data: CardItem;
}

export const TagExtractExample = ({ data }: TagExtractExampleProps) => {
    const [exampleIndex, setExampleIndex] = useState(0);
    const t = useTranslate();
    const divRef = useRef<HTMLDivElement>(null);
    const { microWidgetProps } = useContext(MicroAppContext);
    const lang = microWidgetProps?.language?.getLanguage;

    const handleToggle = () => {
        setExampleIndex((pre) => {
            if (pre + 1 < data.value?.["example"].length) {
                return pre + 1;
            }
            return 0;
        });
        if (divRef.current) {
            const textarea = divRef.current.querySelector("textarea");
            if (textarea) {
                textarea.scrollTop = 0;
            }
        }
    };
    return (
        <div className={styles["tagExtract-layout"]} ref={divRef}>
            <section>
                <div className={styles["label-wrapper"]}>
                    <div className={styles["label"]}>
                        {t("model.label.example", "样本示例：")}
                    </div>
                    <Button type="link" onClick={handleToggle}>
                        {t("model.toggle", "切换")}
                    </Button>
                </div>
                <CustomTextArea
                    maxLength={lang === "en-us" ? 4000 : 1000}
                    readOnly
                    height={280}
                    placeholder=""
                    class={styles["example"]}
                    value={data.value?.["example"][exampleIndex]["content"]}
                />
            </section>
            <section>
                <div className={styles["label-wrapper"]}>
                    <div className={styles["label"]}>
                        {t("model.label.extractResult", "提取结果：")}
                    </div>
                </div>
                <div className={styles["content"]}>
                    {data.value?.["example"][exampleIndex]["result"].map(
                        (res: string) => (
                            <Tag className={styles["example-result"]}>
                                {res}
                            </Tag>
                        )
                    )}
                </div>
            </section>
        </div>
    );
};
