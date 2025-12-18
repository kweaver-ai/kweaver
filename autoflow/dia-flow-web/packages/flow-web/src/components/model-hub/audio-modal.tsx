import { useContext, useEffect, useRef, useState } from "react";
import { CardItem } from "./model-page";
import { Button, Spin } from "antd";
import styles from "./styles/summary-modal.module.less";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import { AudioFileColored } from "@applet/icons";
import clsx from "clsx";
import { isFunction, toLower } from "lodash";
import axios from "axios";

interface AudioModalProps {
    data: CardItem;
}

export const AudioModal = ({ data }: AudioModalProps) => {
    const [docId, setDocId] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setLoading] = useState(false);
    const { microWidgetProps, functionId, prefixUrl } =
        useContext(MicroAppContext);
    const t = useTranslate();
    const handleErr = useHandleErrReq();
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
            const supportExtensions = [".mp3", ".wav", ".m4a", ".mp4"];
            const fileName = selected.name;
            const index = fileName.lastIndexOf(".");
            const type = index < 1 ? "" : fileName.slice(index);
            const isSupportSize = selected.size < 10 * 1024 * 1024;

            if (!type || !supportExtensions.includes(toLower(type))) {
                isSupportType = false;
            }
            if (isSupportType && isSupportSize) {
                setDocId(selected.docid);
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
                            "err.fileSizeExceed.audio",
                            "当前文件大小超过10M，请重新选择。"
                        ),
                        okText: t("ok"),
                        onOk: () => handleSelectFile(path),
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        async function getContent(docid: string) {
            setLoading(true);
            try {
                // 判断是否有预览、下载权限
                const { data: perm } = await API.efast.eacpV1Perm1CheckallPost({
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
                // 获取内容
                const data = await API.axios.post(
                    `${prefixUrl}/api/automation/v1/convert/task`,
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
                setContent(data?.data?.result || "");
                setDocId("");
            } catch (error: any) {
                axiosCancelToken.current = null;
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
                            "err.fileSizeExceed.audio",
                            "当前文件大小超过10M，请重新选择。"
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
                            <AudioFileColored />
                        </div>
                        <div className={styles["description"]}>
                            {t(
                                "model.audio.select",
                                "选择文件测试，支持mp3/wav/m4a/mp4格式，文件大小在10M以内"
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
