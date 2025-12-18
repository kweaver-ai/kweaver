import { Drawer, List, Radio, RadioChangeEvent } from "antd";
import { CardItem } from "./model-page";
import styles from "./styles/model-drawer.module.less";
import { useContext, useMemo, useState } from "react";
import { useTranslate } from "@applet/common";
import { OcrRecognitionModal } from "./ocr-recognition-modal";
import { ExtensionContext } from "../extension-provider";
import { CategoryCard } from "../template-list/category-card";
import { Empty, getLoadStatus } from "../table-empty";
import { SummaryModal } from "./summary-modal";
import { AudioModal } from "./audio-modal";

interface ModelDrawerProps {
    cardItem: CardItem;
    popupContainer?: HTMLElement;
    onClose: () => void;
}

export const ModelDrawer = ({
    cardItem,
    onClose,
    popupContainer,
}: ModelDrawerProps) => {
    const [tab, setTab] = useState("experience");
    const t = useTranslate();
    const { globalConfig } = useContext(ExtensionContext);

    const onChange = (e: RadioChangeEvent) => {
        setTab(e.target.value);
    };

    const getRenderComponent = () => {
        switch (cardItem.type) {
            case "ocr":
                return <OcrRecognitionModal data={cardItem} />;
            case "model":
                return <SummaryModal data={cardItem} />;
            case "audio":
                return <AudioModal data={cardItem} />;
            default:
                return <div></div>;
        }
    };

    // 根据依赖项过滤模板
    const filteredTemplate = useMemo(() => {
        if (cardItem?.template) {
            return cardItem.template
                .filter((item) => {
                    if (item?.dependency) {
                        let enable = true;
                        for (const dependency of item?.dependency) {
                            if (!globalConfig?.[dependency]) {
                                enable = false;
                                break;
                            }
                        }
                        if (!enable) {
                            return false;
                        }
                    }
                    return true;
                })
                .map((item) => {
                    // 国际化转换
                    return {
                        ...item,
                        title: t(item.title),
                        description: t(item.description),
                    };
                });
        }
        return [];
    }, [cardItem.template, globalConfig, t]);

    return (
        <>
            <Drawer
                open
                width={800}
                title={cardItem?.title || ""}
                className={styles["drawer"]}
                closable
                onClose={onClose}
                placement="right"
                style={{ position: "absolute" }}
                maskClosable
                getContainer={popupContainer}
            >
                <div style={{ position: "relative" }}>
                    <Radio.Group
                        value={tab}
                        onChange={onChange}
                        className={styles["btn-group"]}
                    >
                        <Radio.Button value="experience">
                            {t("model.experienceTab", "在线体验")}
                        </Radio.Button>
                        <Radio.Button value="template">
                            {t("model.TemplateTab", "相关模板")}
                        </Radio.Button>
                    </Radio.Group>
                    {tab === "experience" && getRenderComponent()}
                    {tab === "template" && (
                        <div>
                            <div
                                style={{ marginBottom: "16px" }}
                                hidden={filteredTemplate.length === 0}
                            >
                                {t(
                                    "model.templateTip",
                                    "以下流程模板中包含此能力，您可以直接选择流程模板后，新建工作流："
                                )}
                            </div>
                            <div className={styles["category-wrapper"]}>
                                <List
                                    grid={{
                                        gutter: 24,
                                        xs: 2,
                                        sm: 2,
                                        md: 2,
                                        lg: 2,
                                        xl: 2,
                                        xxl: 2,
                                    }}
                                    dataSource={filteredTemplate}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                loadStatus={getLoadStatus({
                                                    data: [],
                                                })}
                                                height={160}
                                                emptyText={t(
                                                    "model.templateEmpty",
                                                    "相关模板为空"
                                                )}
                                            />
                                        ),
                                    }}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <CategoryCard
                                                template={item}
                                            ></CategoryCard>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
};
