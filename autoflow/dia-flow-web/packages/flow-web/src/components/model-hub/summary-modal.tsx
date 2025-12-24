import { useContext, useEffect, useRef, useState } from "react";
import { CardItem } from "./model-page";
import { Button, Spin } from "antd";
import styles from "./styles/summary-modal.module.less";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import { ModelFileColored } from "@applet/icons";
import clsx from "clsx";
import axios from "axios";
import { isFunction, toLower } from "lodash";

interface SummaryModalProps {
    data: CardItem;
}

interface IPrompt {
    prompt_desc: string;
    prompt_name: string;
    prompt_service_id: string;
}

export const SummaryModal = ({ data }: SummaryModalProps) => {
    const [docId, setDocId] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setLoading] = useState(false);
    const { microWidgetProps, functionId, prefixUrl } =
        useContext(MicroAppContext);
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const configRef = useRef<any>();
    const axiosCancelToken = useRef<any>();

    const handleSelectFile = async (path?: string) => {
        if (isLoading) {
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

            if (!type || !supportExtensions.includes(toLower(type))) {
                isSupportType = false;
            }
            if (isSupportType) {
                setDocId(selected.docid);
            } else {
                let path: string | undefined;
                if (selected) {
                    path = selected.docid.replace("gns://", "").slice(0, -33);
                }

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
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        async function getContent(docid: string, isPolling = false) {
            setLoading(true);
            try {
                if (!isPolling) {
                    // 判断是否有预览、下载权限
                    const { data: perm } =
                        await API.efast.eacpV1Perm1CheckallPost({
                            docid,
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
                }

                // 获取配置
                if (!configRef.current) {
                    const { data: promptData } = await API.axios.get(
                        `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt`
                    );
                    const cls = promptData.find(
                        (cls: any) => cls.class_name === "WorkCenter"
                    );

                    // 根据id来区分
                    const prompt = (cls?.prompt || []).filter(
                        (item: IPrompt) => {
                            return item.prompt_service_id === data.key;
                        }
                    );

                    configRef.current = prompt[0];
                }
                const serviceID = configRef.current?.prompt_service_id || "";
                // 获取内容
                const { data: contentData } = await API.axios.post(
                    `${prefixUrl}/api/automation/v1/cognitive-assistant/custom-prompt/${serviceID}`,
                    {
                        docid,
                    },
                    {
                        cancelToken: new axios.CancelToken(function executor(
                            c
                        ) {
                            // 设置 cancel token
                            axiosCancelToken.current = c;
                        }),
                    }
                );
                axiosCancelToken.current = null;
                setLoading(false);
                setContent(contentData?.result || "   ");
                setDocId("");
            } catch (error: any) {
                axiosCancelToken.current = null;
                // 提取中,轮询获取结果
                if (
                    error?.response?.data?.detail?.status === "processing" ||
                    error?.response?.data?.detail?.status === "ready"
                ) {
                    setTimeout(async () => {
                        await getContent(docid, true);
                    }, 1000);
                    return;
                }
                setLoading(false);
                setDocId("");
                // 文件内容为空或格式错误
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.FileTypeNotSupported"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "notSupport.type.ocr",
                            "当前文件格式不支持识别，请重新选择。"
                        ),
                        okText: t("ok"),
                    });
                    return;
                }
                // 文件超出10M大小
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.FileSizeExceed"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.log.fileSizeExceed.10m",
                            "文件已超过10M文件大小的限制。"
                        ),
                        okText: t("ok"),
                    });
                    return;
                }
                // 文件不存在
                if (error?.response?.data?.detail?.code === 404002006) {
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
        }
        if (docId) {
            getContent(docId);
        }
    }, [docId]);

    useEffect(() => {
        return () => {
            if (isFunction(axiosCancelToken.current)) {
                axiosCancelToken.current();
            }
        };
    }, []);

    return (
        <>
            <div
                className={clsx(styles["container"], {
                    [styles["selected"]]: content,
                })}
                onClick={() => {
                    if (!content) {
                        handleSelectFile();
                    }
                }}
            >
                {content ? (
                    <div className={styles["content"]}>{content}</div>
                ) : (
                    <div className={styles["empty"]}>
                        <div className={styles["file-icon"]}>
                            <ModelFileColored />
                        </div>
                        <div className={styles["description"]}>
                            {t(
                                "model.summary.select",
                                "选择文件测试，支持DOC/DOCX/PPTX/PPT/PDF/TXT"
                            )}
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className={styles["spin-container"]}>
                        <Spin></Spin>
                    </div>
                )}
            </div>
            <div className={styles["footer"]}>
                <Button
                    type="default"
                    className={clsx(styles["default-btn"], {
                        [styles["hidden"]]: !content,
                    })}
                    onClick={() => handleSelectFile()}
                    loading={isLoading}
                >
                    {t("model.reSelect", "重新选择")}
                </Button>
            </div>
        </>
    );
};
