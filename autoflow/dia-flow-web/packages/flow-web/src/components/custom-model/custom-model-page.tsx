import { TranslateFn, stopPropagation, useTranslate } from "@applet/common";
import styles from "./styles/styles.module.less";
import clsx from "clsx";
import useSize from "@react-hook/size";
import { List, Card, Typography, Popover, Tag } from "antd";
import { useState, useRef, useContext } from "react";
import { ExtensionContext } from "../extension-provider";
import { CardItem } from "../model-hub";
import { Empty, getLoadStatus } from "../table-empty";
import { ModelDrawer } from "./model-drawer";
import { ModelList } from "./model-list";
import noteImg from "../../assets/note.png";
import TextExtractImg from "../../extensions/ai/assets/text-extract.svg";
import TagExtractImg from "../../extensions/ai/assets/tag-extract.svg";
import { SceneTagColored, SceneTextColored } from "@applet/icons";

export const CustomModelPage = () => {
    const [selectData, setSelectData] = useState<CardItem>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width] = useSize(containerRef);
    const { globalConfig } = useContext(ExtensionContext);
    const popupContainer = useRef<HTMLDivElement>(null);
    const t = useTranslate();

    const getTagInfo = (tag: string) => {
        switch (tag) {
            case t("model.tag.custom", "自定义能力"):
                return (
                    <>
                        <Typography.Text style={{ fontWeight: "bold" }}>
                            {t("model.tag.customTip1", "什么是自定义能力？")}
                        </Typography.Text>
                        <div style={{ marginTop: "8px" }}>
                            <Typography.Text>
                                {t(
                                    "model.tag.customTip2",
                                    "自定义能力提供定制化 AI 能力，您可以通过上传业务数据，通过简单地标注、训练、测评，从而定制符合您业务场景 AI 能力，帮助您自动理解和处理专业领域的文档。"
                                )}
                            </Typography.Text>
                        </div>
                    </>
                );
            default:
                return <Typography.Text>{tag}</Typography.Text>;
        }
    };

    return (
        <div className={styles["custom-model"]}>
            <div
                className={clsx(styles["container"], {
                    [styles["max-1960"]]: width > 1960,
                })}
                ref={containerRef}
            >
                <List
                    grid={{
                        gutter: 24,
                        xs: 1,
                        sm: 2,
                        md: 2,
                        lg: 3,
                        xl: 4,
                        xxl: 5,
                    }}
                    dataSource={getCustomModelList(t, globalConfig)}
                    renderItem={(item) => (
                        <List.Item>
                            <Card
                                className={styles["card"]}
                                onClick={() => {
                                    setSelectData(item);
                                }}
                            >
                                <div className={styles["card-header"]}>
                                    {typeof item.icon === "string" ? (
                                        <img src={item.icon} alt="" />
                                    ) : (
                                        <div
                                            className={clsx(
                                                styles["head-icon"],
                                                styles[item.type]
                                            )}
                                        >
                                            {item.icon}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["card-content"]}>
                                    <Typography.Text
                                        ellipsis
                                        className={styles["header-title"]}
                                        title={item.title}
                                    >
                                        {item.title}
                                    </Typography.Text>
                                </div>
                                <div className={styles["card-footer"]}>
                                    {item.tags.map((tag) => (
                                        <Popover
                                            placement="bottomLeft"
                                            showArrow={false}
                                            content={() => (
                                                <div
                                                    style={{ width: 300 }}
                                                    onClick={stopPropagation}
                                                >
                                                    {getTagInfo(tag)}
                                                </div>
                                            )}
                                        >
                                            <Tag>{tag}</Tag>
                                        </Popover>
                                    ))}
                                </div>
                            </Card>
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                loadStatus={getLoadStatus({
                                    isLoading: false,
                                    data: [],
                                })}
                                height={24}
                                emptyText={t("empty", "列表为空")}
                            />
                        ),
                    }}
                />
            </div>
            <div ref={popupContainer}></div>
            {selectData && (
                <ModelDrawer
                    cardItem={selectData}
                    popupContainer={popupContainer.current!}
                    onClose={() => setSelectData(undefined)}
                />
            )}
            <div className={styles["label-wrapper"]}>
                <div className={styles["label"]} />
                <span>{t("model.customAI", "我定制的 AI 能力")}</span>
            </div>
            <ModelList />
        </div>
    );
};

const getCustomModelList = (
    t: TranslateFn,
    globalConfig: Record<string, any>
) => {
    const modelList: CardItem[] = [
        {
            key: "tagExtract",
            type: "tagExtract",
            icon: TagExtractImg,
            title: t("model.tagExtract", "从文本中提取相关标签"),
            tags: [t("model.tag.custom", "自定义能力")],
            operator: "@anyshare/ocr/tagExtract",
            template: [],
            value: {
                example: [
                    {
                        result: [
                            t("tagExtract.example1.tag1"),
                            t("tagExtract.example1.tag2"),
                            t("tagExtract.example1.tag3"),
                            t("tagExtract.example1.tag4"),
                            t("tagExtract.example1.tag5"),
                        ],
                        content: t("tagExtract.example1"),
                    },
                    {
                        result: [
                            t("tagExtract.example2.tag1"),
                            t("tagExtract.example2.tag2"),
                            t("tagExtract.example2.tag3"),
                            t("tagExtract.example2.tag4"),
                            t("tagExtract.example2.tag5"),
                            t("tagExtract.example2.tag6"),
                        ],
                        content: t("tagExtract.example2"),
                    },
                    {
                        result: [
                            t("tagExtract.example3.tag1"),
                            t("tagExtract.example3.tag2"),
                            t("tagExtract.example3.tag3"),
                            t("tagExtract.example3.tag4"),
                            t("tagExtract.example3.tag5"),
                            t("tagExtract.example3.tag6"),
                        ],
                        content: t("tagExtract.example3"),
                    },
                ],
                scene: [
                    {
                        icon: (
                            <SceneTagColored className={styles["scene-icon"]} />
                        ),
                        title: t("tagExtract.scene1.title"),
                        description: t("tagExtract.scene1.description"),
                    },
                ],
            },
            dependency: [],
        },
        {
            key: "textExtract",
            type: "textExtract",
            icon: TextExtractImg,
            title: t("model.textExtract", "从文档中提取自定义信息"),
            tags: [t("model.tag.custom", "自定义能力")],
            operator: "@anyshare/ocr/tagExtract",
            template: [],
            value: {
                example: [
                    {
                        img: noteImg,
                        content: {
                            姓名: "张三",
                            年龄: "31 岁",
                            性别: "男",
                            电话: "XXX-XXXX-XXXX",
                            邮箱: "mail@example.com",
                            工作年限: "6年经验",
                            求职意向: "财务总监",
                            意向城市: "上海",
                            期望薪资: "6000/月",
                            入职时间: "一个月内到岗",
                            教育背景: "XXX大学",
                            教育专业: "工商管理",
                            工作经验: "XXXX公司",
                            语言能力: "大学英语6级",
                            计算机能力: "二级证书",
                        },
                    },
                ],
                scene: [
                    {
                        icon: (
                            <SceneTextColored
                                className={styles["scene-icon"]}
                            />
                        ),
                        title: t("textExtract.scene1.title"),
                        description: t("textExtract.scene1.description"),
                    },
                    {
                        icon: (
                            <SceneTextColored
                                className={styles["scene-icon"]}
                            />
                        ),
                        title: t("textExtract.scene2.title"),
                        description: t("textExtract.scene2.description"),
                    },
                    {
                        icon: (
                            <SceneTextColored
                                className={styles["scene-icon"]}
                            />
                        ),
                        title: t("textExtract.scene3.title"),
                        description: t("textExtract.scene3.description"),
                    },
                ],
            },
            dependency: [],
        },
    ];

    return modelList.filter((item) => {
        // 根据依赖项屏蔽
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
    });
};
