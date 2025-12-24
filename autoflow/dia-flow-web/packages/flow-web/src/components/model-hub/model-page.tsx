import { useContext, useMemo, useRef, useState } from "react";
import { TranslateFn, stopPropagation, useTranslate } from "@applet/common";
import clsx from "clsx";
import styles from "./styles/model-page.module.less";
import useSize from "@react-hook/size";
import { Card, List, Popover, Tag, Typography } from "antd";
import { ExtensionContext } from "../extension-provider";
import {
    ModelEleinvoiceOutlined,
    ModelIdcardOutlined,
    ModelMeetingOutlined,
    ModelSummaryOutlined,
    ModelGeneralOutlined,
} from "@applet/icons";
import {
    identifyInvoice,
    identifyIdCard,
    docSummary,
    meetingSummary,
    recognizeResume,
    recognizeMove,
} from "../../extensions/templates";
import { Empty, getLoadStatus } from "../table-empty";
import einvoiceImg from "../../assets/einvoice.png";
import idcardImg from "../../assets/idcard.png";
import handwritingImg from "../../assets/handwriting.png";
import AudioSvg from "../../extensions/ai/assets/audio.svg";
import { ModelDrawer } from "./model-drawer";

export interface CardItem {
    key: string;
    icon: string | JSX.Element;
    title: string;
    value?: Record<string, any>;
    tags: string[];
    type: string;
    operator?: string;
    template: any[];
    dependency?: string[];
}

const getModelList = (t: TranslateFn, globalConfig: Record<string, any>) => {
    const supportPDF = globalConfig?.["@anyshare/ocr/general"] === "fileReader";

    const modelList = [
        {
            key: "eleinvoice",
            icon: <ModelEleinvoiceOutlined />,
            title: t("model.einvoice", "从发票中提取信息"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "ocr",
            operator: "@anyshare/ocr/eleinvoice",
            template: [identifyInvoice],
            value: {
                img: einvoiceImg,
                content: {
                    invoice_code: "012002100611",
                    invoice_number: "62846818",
                    title: "天津增值税电子普通发票",
                    issue_date: "2022年06月21日",
                    buyer_name: "数据项素(北京)技术有限公司",
                    buyer_tax_id: "91110105MA01REA15H",
                    item_name: "*运输服务*货物运输费",
                    amount: "65.55",
                    total_amount_in_words: "陆拾伍圆伍角伍分",
                    total_amount_numeric: "￥65.55",
                    seller_name: "天津货拉拉科技有限公司",
                    seller_tax_id: "91120118MA06YHFMX5",
                    total_amount_excluding_tax: "￥65.55",
                    total_tax_amount: "",
                    verification_code: "12829373928109033228",
                    tax_rate: "",
                    tax_amount: "",
                },
            },
            dependency: ["@anyshare/ocr/general"],
        },
        {
            key: "idcard",
            icon: <ModelIdcardOutlined />,
            title: t("model.idcard", "从身份证中提取信息"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "ocr",
            operator: "@anyshare/ocr/idcard",
            template: [identifyIdCard],
            dependency: ["@anyshare/ocr/general"],
            value: {
                img: idcardImg,
                content: {
                    name: "代用名",
                    gender: "男",
                    date_of_birth: "2013年05月06日",
                    ethnicity: "汉",
                    address: "湖南省长沙市开福区巡道街幸福小区居民组",
                    id_number: "430512198908131367",
                    issuing_authority: "",
                    expiration_date: "",
                },
            },
        },
        {
            key: "general",
            icon: <ModelGeneralOutlined />,
            title: supportPDF
                ? t("model.handwriting", "提取照片或PDF文档中的所有文本")
                : t("model.handwriting.img"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "ocr",
            operator: "@anyshare/ocr/general",
            template: [recognizeResume, recognizeMove],
            dependency: ["@anyshare/ocr/general"],
            value: {
                img: handwritingImg,
                content: {
                    1: "王兴木",
                    2: "临海市辉昌眼镜有限公司",
                    3: "施胤杰",
                    4: "邹城中化石油化工有限公司第一加油加气站",
                },
            },
        },
        {
            key: "1012",
            icon: <ModelSummaryOutlined />,
            title: t("model.docSummary", "从发布文档中总结信息"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "model",
            template: [docSummary],
            dependency: ["@cognitive-assistant/doc-summarize"],
        },
        {
            key: "1011",
            icon: <ModelMeetingOutlined />,
            title: t("model.meetingSummary", "从会议文件中总结会议纪要"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "model",
            template: [meetingSummary],
            dependency: ["@cognitive-assistant/doc-summarize"],
        },
        {
            key: "audio",
            icon: AudioSvg,
            title: t("model.audio", "从音频文件中提取信息"),
            tags: [t("model.tag.inner", "内置能力")],
            type: "audio",
            template: [meetingSummary],
            dependency: ["@audio/transfer"],
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

export const ModelPage = () => {
    const [selectData, setSelectData] = useState<CardItem>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width] = useSize(containerRef);
    const { globalConfig } = useContext(ExtensionContext);
    const t = useTranslate();
    const popupContainer = useRef<HTMLDivElement>(null);

    const getTagInfo = (tag: string) => {
        switch (tag) {
            case t("model.tag.inner", "内置能力"):
                return (
                    <>
                        <Typography.Text style={{ fontWeight: "bold" }}>
                            {t("model.tag.innerTip1", "什么是内置能力？")}
                        </Typography.Text>
                        <div style={{ marginTop: "8px" }}>
                            <Typography.Text>
                                {t(
                                    "model.tag.innerTip2",
                                    "内置模型提供了开箱即用的 AI 能力，能够处理通用的文档、图片等非结构化数据，以及身份证和增值税发票这样的制式文档。"
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
        <div>
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
                    dataSource={getModelList(t, globalConfig)}
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
                                height={window.innerHeight - 400}
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
        </div>
    );
};
