import { API, MicroAppContext, useTranslate } from "@applet/common";
import styles from "./styles/extract-experience.module.less";
import { useContext, useEffect, useState } from "react";
import { Button, Divider, Spin, Tag, Typography } from "antd";
import { ModelFileColored, SyncuccessColored } from "@applet/icons";
import emptyImg from "../../assets/empty.png";
import { map, toLower } from "lodash";
import { useHandleErrReq } from "../../utils/hooks";
import { AsFilePreview, IDocItem } from "../as-file-preview";
import { ExclamationCircleOutlined } from "@ant-design/icons";

export const transferExtractResult = (data: Record<string, any>) => {
    const result: Record<string, any> = {};
    // 若未识别出的字段，文本框中显示空状态
    map(data, (value, key) => {
        result[key] = value
            .map((item: Record<string, any>) => {
                return item?.text;
            })
            .filter(Boolean);
    });
    return result;
};

export const ExtractExperience = ({ id }: { id: string }) => {
    const t = useTranslate();
    const { microWidgetProps, prefixUrl, functionId } =
        useContext(MicroAppContext);
    const [result, setResult] = useState<Record<string, any>>({});
    const [selectDocItem, setSelectDocItem] = useState<IDocItem>();
    const [loading, setLoading] = useState(false);
    const handleErr = useHandleErrReq();

    const handleSelectFile = async (path?: string) => {
        let selected: any;
        try {
            selected = await microWidgetProps?.contextMenu?.selectFn({
                functionid: functionId,
                multiple: false,
                selectType: 1,
                title: t("selectFile", "选择文件"),
                path: path ? path : undefined,
            });
            if (Array.isArray(selected)) {
                selected = selected[0];
            }
            let isSupportType = true;
            const supportExtensions = [
                ".doc",
                ".docx",
                ".pptx",
                ".ppt",
                ".pdf",
                ".txt",
            ];
            const fileName = selected.name;
            const index = fileName.lastIndexOf(".");
            const type = index < 1 ? "" : fileName.slice(index);

            // 判断文件格式
            if (!type || !supportExtensions.includes(toLower(type))) {
                isSupportType = false;
            }
            // 判断大小<20M
            const isSupportSize = selected.size < 20 * 1024 * 1024;
            if (isSupportType && isSupportSize) {
                setLoading(true);
                try {
                    // 判断是否有预览、下载权限
                    const { data: perm } =
                        await API.efast.eacpV1Perm1CheckallPost({
                            docid: selected.docid,
                        });
                    if (!(perm as any)?.allow?.includes("preview")) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                t(
                                    "err.403001002.preview.ocr",
                                    "您对当前文件没有预览权限。"
                                )
                            ),
                            okText: t("ok"),
                        });
                        return;
                    }
                    if (!(perm as any)?.allow?.includes("download")) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                t(
                                    "err.403001002.download.ocr",
                                    "您对当前文件没有下载权限"
                                )
                            ),
                            okText: t("ok"),
                        });
                        return;
                    }
                    setSelectDocItem(selected as IDocItem);
                } catch (error: any) {
                    setLoading(false);
                    // 文件不存在
                    if (error?.response?.data?.code === 404002006) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                "err.404002006",
                                "当前文档已不存在或其路径发生变更。"
                            ),
                            okText: t("ok"),
                        });
                        return;
                    }
                    handleErr({ error: error?.response });
                }
            } else {
                let path: string | undefined;
                if (selected) {
                    path = selected.docid.replace("gns://", "").slice(0, -33);
                }
                if (!isSupportType) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "notSupport.type.model",
                            "当前文件格式不支持，请重新选择。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => handleSelectFile(path),
                    });
                } else {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.fileSizeExceed.20m",
                            "当前文件大小超过20M，请重新选择。"
                        ),
                        okText: t("ok"),
                        onOk: () => handleSelectFile(path),
                    });
                }
            }
        } catch (error) {
            if (error) {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        const getResult = async () => {
            try {
                // 获取提取标签
                const { data } = await API.axios.post(
                    `${prefixUrl}/api/automation/v1/uie/infer`,
                    { id, docid: selectDocItem?.docid }
                );
                setResult(transferExtractResult(data));
            } catch (error: any) {
                setResult([]);
                setSelectDocItem(undefined);
                handleErr({ error: error?.response });
            } finally {
                setLoading(false);
            }
        };
        if (selectDocItem?.docid) {
            getResult();
        }
    }, [handleErr, id, prefixUrl, selectDocItem]);

    return (
        <div className={styles["container"]}>
            <div className={styles["title"]}>
                {t("model.text.testCapability", "测试能力效果")}
            </div>
            <div className={styles["description"]}>
                {t(
                    "testCapability.text.description",
                    "您可以选择一个测试文件，来验证能力提取自定义信息的效果"
                )}
            </div>
            <div className={styles["content"]}>
                <div className={styles["input-container"]}>
                    {selectDocItem ? (
                        <>
                            <div className={styles["preview-wrapper"]}>
                                <AsFilePreview file={selectDocItem} />
                            </div>
                            <div className={styles["btn-wrapper"]}>
                                <Button
                                    className={styles["btn"]}
                                    onClick={() => handleSelectFile()}
                                    loading={loading}
                                >
                                    {t("model.reSelect", "重新选择")}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div
                            className={styles["empty-container"]}
                            onClick={() => {
                                handleSelectFile();
                            }}
                        >
                            <div className={styles["empty"]}>
                                <div className={styles["file-icon"]}>
                                    <ModelFileColored />
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "model.textExtract.select",
                                        "选择文件测试，支持DOC/DOCX/PPTX/PPT/PDF/TXT大小在20M以内"
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {loading && (
                        <div className={styles["spin-container"]}>
                            <Spin></Spin>
                        </div>
                    )}
                </div>
                <div className={styles["result-container"]}>
                    {selectDocItem && !loading && (
                        <div style={{ marginBottom: "16px" }}>
                            {t("extract.result", "提取结果")}
                        </div>
                    )}
                    <div className={styles["result"]}>
                        {selectDocItem && !loading ? (
                            map(result, (value, key) => {
                                return (
                                    <div className={styles["res-content"]}>
                                        <div>
                                            {value.length ? (
                                                <SyncuccessColored
                                                    className={
                                                        styles["status-icon"]
                                                    }
                                                />
                                            ) : (
                                                <ExclamationCircleOutlined
                                                    className={
                                                        styles["status-icon"]
                                                    }
                                                    style={{ color: "#faad14" }}
                                                />
                                            )}
                                            <Typography.Text
                                                className={styles["key"]}
                                            >
                                                {key}
                                            </Typography.Text>
                                        </div>
                                        <div
                                            className={styles["tag-container"]}
                                        >
                                            {value?.length ? (
                                                value.map((tag: string) => (
                                                    <Tag
                                                        className={
                                                            styles["val"]
                                                        }
                                                    >
                                                        {tag}
                                                    </Tag>
                                                ))
                                            ) : (
                                                <span style={{ color: "#999" }}>
                                                    {t(
                                                        "extract.unrecognized",
                                                        "未识别到"
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <Divider style={{ margin: "12px 0" }} />
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles["result-empty"]}>
                                <img
                                    className={styles["img"]}
                                    src={emptyImg}
                                    alt="empty"
                                />
                                <span className={styles["tip"]}>
                                    {t("tagExtract.select", "请先选择测试样本")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
