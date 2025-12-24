import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useContext, useEffect, useState } from "react";
import { Button, Radio, RadioChangeEvent, Tag } from "antd";
import { ModelFileColored, OfficialColored } from "@applet/icons";
import { CustomTextArea } from "../custom-textarea";
import emptyImg from "../../assets/empty.png";
import { toLower } from "lodash";
import { useHandleErrReq } from "../../utils/hooks";
import { AsFilePreview, IDocItem } from "../as-file-preview";
import { RuleItem } from "./tag-extract";
import styles from "./styles/extract-experience.module.less";

interface ExtractExperienceProps {
    details: Record<string, any>;
    rules: RuleItem[];
}

export const ExtractExperience = ({
    details,
    rules,
}: ExtractExperienceProps) => {
    const [tab, setTab] = useState("file");
    const [inputText, setInputText] = useState("");
    const t = useTranslate();
    const { microWidgetProps, prefixUrl, functionId } =
        useContext(MicroAppContext);
    const [result, setResult] = useState<string[]>([]);
    const [selectDocItem, setSelectDocItem] = useState<IDocItem | undefined>();
    const [loading, setLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const handleErr = useHandleErrReq();

    const handleSelectFile = async (path?: string) => {
        if (loading) {
            return;
        }
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

    const handleTextTest = async () => {
        setLoading(true);
        try {
            // 获取提取标签
            const { data } = await API.axios.post(
                `${prefixUrl}/api/automation/v1/tags/extract-by-rule`,
                {
                    target: {
                        content: inputText,
                    },
                    rules: rules,
                }
            );
            setResult(data?.tags);
            setIsCompleted(true);
        } catch (error: any) {
            // 若未识别出的字段，文本框中显示空状态
            setResult([]);
            setIsCompleted(false);
            handleErr({ error: error?.response });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getResult = async () => {
            try {
                // 获取提取标签
                const { data } = await API.axios.post(
                    `${prefixUrl}/api/automation/v1/tags/extract-by-rule`,
                    {
                        target: {
                            docid: selectDocItem?.docid,
                        },
                        rules: rules,
                    }
                );
                setResult(data?.tags);
            } catch (error: any) {
                // 若未识别出的字段，文本框中显示空状态
                setResult([]);
                setSelectDocItem(undefined);
                if (
                    error?.response.data.code ===
                    "ContentAutomation.FileTypeNotSupported"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "notSupport.type.model",
                            "当前文件格式不支持，请重新选择。"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                handleErr({ error: error?.response });
            } finally {
                setLoading(false);
            }
        };
        if (selectDocItem?.docid) {
            getResult();
        }
    }, [details.id, details.rules, handleErr, prefixUrl, rules, selectDocItem]);

    return (
        <div className={styles["container"]}>
            <div className={styles["title"]}>
                {t("model.rule.testCapability", "测试能力效果")}
            </div>
            <div className={styles["description"]}>
                {t(
                    "testCapability.description",
                    "您可以选择一个测试文件，来验证能力提取标签的效果。若效果不理想，您可返回第一步优化标签的关键词组"
                )}
            </div>
            <div style={{ margin: "12px 0" }}>
                <Radio.Group
                    value={tab}
                    onChange={(e: RadioChangeEvent) => {
                        setTab(e.target.value);
                        if (e.target.value === "file") {
                            setSelectDocItem(undefined);
                        } else {
                            setInputText("");
                        }
                    }}
                    className={styles["btn-group"]}
                >
                    <Radio.Button value="file">
                        {t("model.fileTab", "选择文件测试")}
                    </Radio.Button>
                    <Radio.Button value="text">
                        {t("model.textTab", "输入文本测试")}
                    </Radio.Button>
                </Radio.Group>
            </div>
            <div className={styles["content"]}>
                <div className={styles["input-container"]}>
                    {tab === "file" &&
                        (selectDocItem ? (
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
                                            "model.tagExtract.select",
                                            "选择文件测试，支持DOC/DOCX/PPTX/PPT/PDF/TXT大小在20M以内"
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    {tab === "text" && (
                        <>
                            <CustomTextArea
                                placeholder={t("inputText", "请输入文本")}
                                maxLength={1000}
                                value={inputText}
                                onChange={(val) => {
                                    setInputText(val);
                                }}
                                class={styles["textarea"]}
                            />
                            <div className={styles["btn-wrapper"]}>
                                <Button
                                    className={styles["btn"]}
                                    onClick={handleTextTest}
                                    loading={loading}
                                >
                                    {t("startTest", "开始测试")}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles["result-container"]}>
                    {result.length > 0 && (
                        <div style={{ marginBottom: "4px" }}>
                            {t("extract.result", "提取结果")}
                        </div>
                    )}
                    <div className={styles["result"]}>
                        {result.length > 0 ? (
                            result.map((tag: string) => (
                                <Tag
                                    className={styles["example-result"]}
                                    title={tag?.substring(
                                        tag?.indexOf("/", 0) + 1
                                    )}
                                >
                                    <OfficialColored
                                        style={{
                                            marginRight: "8px",
                                            fontSize: "16px",
                                        }}
                                    />
                                    {tag?.substring(tag?.lastIndexOf("/") + 1)}
                                </Tag>
                            ))
                        ) : (
                            <div className={styles["result-empty"]}>
                                <img
                                    className={styles["img"]}
                                    src={emptyImg}
                                    alt="empty"
                                />
                                <span className={styles["tip"]}>
                                    {tab === "file"
                                        ? selectDocItem && !loading
                                            ? t(
                                                  "tagExtract.select.empty",
                                                  "未提取到任何标签，建议您重新选择文件或返回第一步优化标签规则"
                                              )
                                            : t(
                                                  "tagExtract.select",
                                                  "请先选择测试样本"
                                              )
                                        : !loading && isCompleted
                                        ? t(
                                              "tagExtract.input.empty",
                                              "未提取到任何标签，建议您重新输入或返回第一步优化标签规则"
                                          )
                                        : t(
                                              "tagExtract.input",
                                              "请先输入测试样本"
                                          )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
