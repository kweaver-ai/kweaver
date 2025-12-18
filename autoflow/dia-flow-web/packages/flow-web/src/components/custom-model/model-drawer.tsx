import { Button, Drawer, Radio, RadioChangeEvent } from "antd";
import styles from "./styles/model-drawer.module.less";
import { useContext, useMemo, useState } from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { ExtensionContext } from "../extension-provider";
import { CardItem } from "../model-hub";
import { TagExtractExample } from "./tagExtract-example";
import clsx from "clsx";
import { useNavigate } from "react-router";
import { useHandleErrReq } from "../../utils/hooks";
import { TextExtractExample } from "./textExtract-example";

interface ModelDrawerProps {
    cardItem: CardItem;
    popupContainer?: HTMLElement;
    onClose: () => void;
}

interface IScene {
    icon: HTMLSpanElement;
    title: string;
    description: string;
}

export const ModelDrawer = ({
    cardItem,
    onClose,
    popupContainer,
}: ModelDrawerProps) => {
    const [tab, setTab] = useState("experience");
    const t = useTranslate();
    const { globalConfig } = useContext(ExtensionContext);
    const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
    const navigate = useNavigate();
    const handleErr = useHandleErrReq();

    const onChange = (e: RadioChangeEvent) => {
        setTab(e.target.value);
    };

    const getRenderComponent = () => {
        switch (cardItem.type) {
            case "tagExtract":
                return <TagExtractExample data={cardItem} />;
            case "textExtract":
                return <TextExtractExample data={cardItem} />;
            default:
                return <div></div>;
        }
    };

    const handleCreate = async () => {
        const type = cardItem.type;
        if (type === "tagExtract") {
            // 不是标签专员，无法使用 从文本中提取相关标签
            try {
                const { data } = await API.efast.eacpV1UserGetPost();
                const { data: result } = await API.axios.get(
                    `${prefixUrl}/api/ecotag/v1/tagging-operator/${data.userid}`
                );
                if (!result.length) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.notTaggingOperator",
                            "您不是标签专员，无法使用此能力"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                const { data: tagTree } = await API.axios.get(
                    `${prefixUrl}/api/ecotag/v1/tag-tree`
                );
                let hasEcotag = false;
                tagTree?.forEach((item: any) => {
                    if (item?.child_tags.length > 0) {
                        hasEcotag = true;
                    }
                });
                if (!hasEcotag) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.noEcotag",
                            "管理员暂未设置官方标签，无法使用此能力"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                navigate(`/model/${type}/new`);
            } catch (error: any) {
                handleErr({ error: error?.response });
                return;
            }
        } else if (type === "textExtract") {
            // 不在自定义文本提取白名单中无法使用
            try {
                const {
                    data: { enable },
                } = await API.axios.get(
                    `${prefixUrl}/api/appstore/v1/app/action_uie/accessible`
                );
                if (!enable) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.textExtract.noPermCreate",
                            "您未获新建权限，请联系管理员"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                const { data } = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/models`
                );
                const textExtractTask = (data || []).filter(
                    (i: any) => i.type === 1
                );
                if (textExtractTask.length > 0) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t(
                            "err.model.NumberOfTasksLimited",
                            "当前类型自定义能力数量已达上限。"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }

                navigate(`/model/${type}/new`);
            } catch (error: any) {
                handleErr({ error: error?.response });
                return;
            }
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
                maskClosable={false}
                getContainer={popupContainer}
                footerStyle={{
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "none",
                }}
                footer={
                    <Button
                        type="primary"
                        className={clsx(
                            "automate-oem-primary-btn",
                            styles["primary-btn"]
                        )}
                        onClick={handleCreate}
                    >
                        {t("model.newCustom", "新建自定义能力")}
                    </Button>
                }
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
                        <Radio.Button value="scene">
                            {t("model.sceneTab", "应用场景")}
                        </Radio.Button>
                    </Radio.Group>
                    {tab === "experience" && getRenderComponent()}
                    {tab === "scene" && (
                        <div style={{ marginTop: "40px" }}>
                            {cardItem?.value?.scene?.map((item: IScene) => (
                                <>
                                    <div className={styles["scene-item"]}>
                                        {item.icon}
                                        <div
                                            className={styles["scene-wrapper"]}
                                        >
                                            <div
                                                className={
                                                    styles["scene-title"]
                                                }
                                            >
                                                {item.title}
                                            </div>
                                            <div
                                                className={
                                                    styles["scene-description"]
                                                }
                                            >
                                                {item.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles["divider"]}></div>
                                </>
                            ))}
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
};
