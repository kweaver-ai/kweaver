import { Button, Typography, Spin } from "antd";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { getDocument } from "pdfjs-dist";
import axios from "axios";
import { PDFDocumentLoadingTask } from "pdfjs-dist/types/display/api";
import { Position, Scaleable, ScaleableRef } from "react-scaleable";
import { clamp, find, isFunction, map, toLower } from "lodash";
import clsx from "clsx";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { EntryDocTypeEnum } from "@applet/api/lib/efast";
import {
    CenterOutlined,
    FileAudioColored,
    MinusOutlined,
    PlusOutlined,
} from "@applet/icons";
import "./pdf.worker.mjs";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import { detectIE } from "../../utils/browser";
import { Output } from "../extension";
import { CardItem } from "./model-page";
import { useHandleErrReq, useInfoModal } from "../../utils/hooks";
import styles from "./styles/ocr-recognition-modal.module.less";

interface OcrRecognitionModalProps {
    data: CardItem;
}

export interface ZoomCenter {
    delay?: number;
    scale?: boolean;
    left?: Position;
    top?: Position;
}

export const OcrRecognitionModal = ({
    data: ocrModel,
}: OcrRecognitionModalProps) => {
    const scaleable = useRef<ScaleableRef>(null);
    const wrapper = useRef<HTMLDivElement>(null);

    const [scaleValue, setScale] = useState(1);
    const [grabbing, setGrabbing] = useState(false);
    const t = useTranslate();
    const et = useTranslateExtension("ai");
    const { globalConfig, executors } = useContext(ExtensionContext);
    const { prefixUrl, microWidgetProps, functionId } =
        useContext(MicroAppContext);

    const handleErr = useHandleErrReq();
    const infoModal = useInfoModal();

    const [content, setContent] = useState<Record<string, string>>();
    const [isPdf, setIsPdf] = useState(false);
    const urlRef = useRef("");
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isLoading, setLoading] = useState(false);
    const axiosCancelToken = useRef<any>();

    const isIE = useMemo(() => {
        return detectIE();
    }, []);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const {
            scrollLeft,
            scrollTop,
            offsetWidth,
            offsetHeight,
            scrollWidth,
            scrollHeight,
        } = scaleable.current!.container!;

        let flag = false;

        const onMouseMove = (e: MouseEvent) => {
            if (
                !flag &&
                (Math.abs(e.clientX - clientX) > 3 ||
                    Math.abs(e.clientY - clientY) > 3)
            ) {
                flag = true;
                setGrabbing(true);
            }
            if (flag) {
                const left = clamp(
                    scrollLeft - e.clientX + clientX,
                    0,
                    scrollWidth - offsetWidth
                );
                const top = clamp(
                    scrollTop - e.clientY + clientY,
                    0,
                    scrollHeight - offsetHeight
                );
                requestAnimationFrame(() => {
                    scaleable.current?.scrollTo({
                        left,
                        top,
                    });
                });
            }
        };

        const onMouseUp = () => {
            if (flag) {
                flag = false;
                setGrabbing(false);
            }
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, []);

    const zoomCenter = (params = {} as ZoomCenter) => {
        const {
            delay = 33,
            scale = true,
            left = "center",
            top = "center",
        } = params;
        if (scaleable.current?.container && wrapper.current) {
            if (scale) {
                const scale = Math.min(
                    (scaleable.current.container.offsetWidth - 40) /
                        wrapper.current.offsetWidth,
                    (scaleable.current.container.offsetHeight - 40) /
                        wrapper.current.offsetHeight,
                    1
                );

                scaleable.current.scaleTo(scale);
                scaleable.current.scaleEnded();
            }

            setTimeout(() => {
                scaleable.current?.scrollTo({
                    left,
                    top,
                });
                if (top === "content-start") {
                    const { scrollTop } = scaleable.current!.container!;
                    setTimeout(() => {
                        scaleable.current?.scrollTo({
                            left,
                            top: scrollTop - 40,
                        });
                    }, 0);
                }
            }, delay);
        }
    };

    const supportPDF = useMemo(() => {
        return globalConfig?.["@anyshare/ocr/general"] === "fileReader";
    }, [globalConfig]);

    const outputs = useMemo(() => {
        return ocrModel?.operator
            ? (executors[ocrModel?.operator][0]?.outputs as Output[])?.filter(
                  (i) => i.key !== ".results"
              )
            : [];
    }, [ocrModel?.operator, executors]);

    const downloadFile = async (docid: string) => {
        try {
            const { data } = await API.efast.efastV1FileOsdownloadPost({
                docid,
                authtype: "QUERY_STRING",
                rev: "",
            });
            return data?.authrequest[1] || "";
        } catch (error: any) {
            return "";
        }
    };

    const downloadSubFile = async (itemId: string) => {
        try {
            const { data } = await API.axios.post(
                `${prefixUrl}/api/docset/v1/item/${itemId}`
            );
            return data?.url || "";
        } catch (error: any) {
            // 转码中
            if (error?.response?.data?.code === 503008001) {
                setTimeout(async () => {
                    const url: string = await downloadSubFile(itemId);
                    return url;
                }, 1000);
            }
            return "";
        }
    };

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
            const supportExtensions = [".jpg", ".jpeg", ".png"];
            if (supportPDF) {
                supportExtensions.push(".pdf");
            }
            const fileName = selected.name;
            const index = fileName.lastIndexOf(".");
            const type = index < 1 ? "" : fileName.slice(index);

            if (!type || !supportExtensions.includes(toLower(type))) {
                isSupportType = false;
            }
            if (isSupportType) {
                setLoading(true);
                // 根据读取策略 使用不同下载方法
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
                    // 获取文档库类型
                    const { data: entryDoc } =
                        await API.efast.efastV1EntryDocLibGet();
                    let docLibType = find(
                        entryDoc,
                        (item: any) =>
                            item.id === `gns://${selected.docid.split("/")[2]}`
                    )?.type;
                    if (docLibType === "shared_user_doc_lib") {
                        docLibType = EntryDocTypeEnum.UserDocLib;
                    }
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/read-policy/v2/doc-config`,
                        {
                            params: {
                                doc_id: selected?.docid,
                                doc_lib_type: docLibType || "user_doc_lib",
                                accessed_by: "accessed_by_users",
                                read_restriction: "download",
                            },
                        }
                    );
                    let url = "";
                    if (data?.result?.read_as === "sub_document") {
                        url = await downloadSubFile(selected.docid.slice(-32));
                    } else {
                        url = await downloadFile(selected.docid);
                    }
                    if (url) {
                        try {
                            const response = await fetch(url, {
                                method: "GET",
                            });
                            if (response.status === 200) {
                                const temporaryFile = await response.blob();
                                const reader = new FileReader();
                                reader.onload = function () {
                                    urlRef.current = reader.result as string;
                                    if (
                                        supportPDF &&
                                        selected.name?.slice(-4) === ".pdf"
                                    ) {
                                        setIsPdf(true);
                                        if (isIE) {
                                            setTimeout(() => {
                                                zoomCenter();
                                            }, 10);
                                            return;
                                        } else {
                                            if (pdfRef.current) {
                                                pdfRef.current.innerHTML = "";
                                            }

                                            const loadingPdf: PDFDocumentLoadingTask =
                                                getDocument(urlRef.current);
                                            loadingPdf.promise
                                                .then(function (pdf) {
                                                    const numPages =
                                                        pdf.numPages;

                                                    function renderPage(
                                                        pageNumber: number
                                                    ) {
                                                        const pdfCanvas =
                                                            document.createElement(
                                                                "canvas"
                                                            );
                                                        if (pdfRef.current) {
                                                            pdfRef.current.appendChild(
                                                                pdfCanvas
                                                            );
                                                        }
                                                        pdf.getPage(pageNumber)
                                                            .then(function (
                                                                page
                                                            ) {
                                                                const canvas =
                                                                    document.createElement(
                                                                        "canvas"
                                                                    );
                                                                const context =
                                                                    canvas.getContext(
                                                                        "2d"
                                                                    )!;

                                                                const viewport =
                                                                    page.getViewport(
                                                                        {
                                                                            scale: 2,
                                                                        }
                                                                    );

                                                                canvas.height =
                                                                    viewport.height;
                                                                canvas.width =
                                                                    viewport.width;

                                                                const renderContext =
                                                                    {
                                                                        canvasContext:
                                                                            context,
                                                                        viewport:
                                                                            viewport,
                                                                    };
                                                                page.render(
                                                                    renderContext
                                                                )
                                                                    .promise.then(
                                                                        function () {
                                                                            const imgData =
                                                                                canvas.toDataURL(
                                                                                    "image/png"
                                                                                );

                                                                            if (
                                                                                pdfRef.current
                                                                            ) {
                                                                                const c2 =
                                                                                    pdfCanvas.getContext(
                                                                                        "2d"
                                                                                    )!;
                                                                                const image =
                                                                                    new Image();
                                                                                image.src =
                                                                                    imgData;
                                                                                image.onload =
                                                                                    () => {
                                                                                        const _width =
                                                                                            image.naturalWidth *
                                                                                            1;
                                                                                        const _height =
                                                                                            image.naturalHeight *
                                                                                            1;
                                                                                        pdfCanvas.setAttribute(
                                                                                            "width",
                                                                                            _width +
                                                                                                "px"
                                                                                        );
                                                                                        pdfCanvas.setAttribute(
                                                                                            "height",
                                                                                            _height +
                                                                                                "px"
                                                                                        );
                                                                                        // 绘制图片
                                                                                        c2.drawImage(
                                                                                            image,
                                                                                            0,
                                                                                            0,
                                                                                            image.width,
                                                                                            image.height
                                                                                        );
                                                                                    };
                                                                            }
                                                                        }
                                                                    )
                                                                    .catch(
                                                                        (err) =>
                                                                            console.error(
                                                                                "render",
                                                                                err
                                                                            )
                                                                    );
                                                            })
                                                            .catch((err) =>
                                                                console.error(
                                                                    "renderPage",
                                                                    err
                                                                )
                                                            );
                                                    }

                                                    for (
                                                        let i = 0;
                                                        i < numPages;
                                                        i++
                                                    ) {
                                                        renderPage(i + 1);
                                                    }
                                                    setTimeout(() => {
                                                        zoomCenter({
                                                            delay: 10,
                                                            scale: false,
                                                            left: "content-start",
                                                            top: "content-start",
                                                        });
                                                    }, 10);
                                                })
                                                .catch((err) =>
                                                    console.error(
                                                        "loadingPdf",
                                                        err
                                                    )
                                                );
                                        }
                                    } else {
                                        setIsPdf(false);
                                        setTimeout(() => {
                                            zoomCenter();
                                        }, 10);
                                    }
                                };
                                reader.onerror = (e) => {
                                    console.error(e);
                                    microWidgetProps?.components?.toast.info(
                                        t("import.fail", "导入的文件解析失败。")
                                    );
                                };
                                reader.readAsDataURL(temporaryFile);
                            } else if (response.status === 404) {
                                microWidgetProps?.components?.messageBox({
                                    type: "info",
                                    title: t(
                                        "err.operation.title",
                                        "无法执行此操作"
                                    ),
                                    message: t(
                                        "err.404002006",
                                        "当前文档已不存在或其路径发生变更。"
                                    ),
                                    okText: t("ok"),
                                });
                                return;
                            } else {
                                console.error(data);
                                return;
                            }
                        } catch (error) {
                            console.error(data);
                            return;
                        }

                        let params: Record<string, any> = {
                            docid: selected.docid,
                            scene:
                                ocrModel.key === "general"
                                    ? "handwriting"
                                    : ocrModel.key,
                            rec_type: ocrModel.key,
                        };
                        if (supportPDF) {
                            params["task_type"] = 100;
                            params["uri"] = "/lab/ocr/predict/ticket";
                        }
                        const { data: ocrRes } = await API.axios.post(
                            `${prefixUrl}/api/automation/v1/ocr/task`,
                            params,
                            {
                                cancelToken: new axios.CancelToken(
                                    function executor(c) {
                                        // 设置 cancel token
                                        axiosCancelToken.current = c;
                                    }
                                ),
                            }
                        );
                        setContent(ocrRes);
                        axiosCancelToken.current = null;
                    }
                } catch (error: any) {
                    axiosCancelToken.current = null;

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
                    // 没有下载权限
                    if (error?.response?.data?.code === 403001002) {
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
                    // 受策略管控
                    if (error?.response?.data?.code === 403001203) {
                        infoModal("policy");
                        return;
                    }
                    handleErr({ error: error?.response });
                } finally {
                    setLoading(false);
                }
            } else {
                let path: string | undefined;
                if (selected) {
                    path = selected.docid.replace("gns://", "").slice(0, -33);
                }
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.operation.title", "无法执行此操作"),
                    message: t(
                        "notSupport.type.ocr",
                        "当前文件格式不支持识别，请重新选择。"
                    ),
                    okText: t("ok", "确定"),
                    onOk: () => handleSelectFile(path),
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getGeneralContent = (content: any): string[] => {
        if (typeof content === "object" && content[1] && content[2]) {
            return map(content, (item: string) => item);
        }

        let texts: string[] = [];

        if (typeof content === "object") {
            const subTaskList = content?.subTaskList;
            for (let i = 0; i < subTaskList.length; i += 1) {
                try {
                    let result = content.subTaskList[i]?.result;
                    if (typeof result === "string") {
                        result = JSON.parse(result);
                    }

                    texts = texts.concat(
                        result?.data?.json?.general_ocr_res?.texts || []
                    );
                } catch (error) {
                    console.error(error);
                }
            }
        }

        return texts;
    };

    useEffect(() => {
        if (ocrModel?.value) {
            urlRef.current = ocrModel?.value?.img || "";
            setContent(ocrModel?.value?.content);
        }
        setTimeout(() => {
            zoomCenter({
                delay: 10,
                scale: false,
                left: "center",
                top: "content-start",
            });
        }, 10);
        return () => {
            if (isFunction(axiosCancelToken.current)) {
                axiosCancelToken.current();
            }
        };
    }, []);

    return (
        <>
            <div className={styles["container"]}>
                <div className={styles["file-container"]}>
                    <div>{t("model.originalImage", "原始图片")}</div>
                    <Scaleable
                        ref={scaleable}
                        className={clsx(
                            styles["scaleable"],
                            grabbing && styles["grabbing"]
                        )}
                        scale={scaleValue}
                        wheel={{ enabled: false }}
                        onScale={setScale}
                        onMouseDown={onMouseDown}
                    >
                        <div ref={wrapper} title="test1">
                            {isPdf ? (
                                <div ref={pdfRef}>
                                    {isIE && (
                                        <FileAudioColored
                                            style={{ fontSize: "40px" }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <img
                                    className={styles["ocr-img"]}
                                    onDragStart={() => {
                                        return false;
                                    }}
                                    src={urlRef.current}
                                    alt=""
                                    width={460}
                                />
                            )}
                        </div>
                    </Scaleable>
                    <div className={styles["tool-bar"]}>
                        <Button
                            type="text"
                            icon={<PlusOutlined />}
                            disabled={scaleValue >= 2.0}
                            onClick={() => {
                                scaleable.current?.scaleTo((cur) =>
                                    clamp(
                                        Math.round((cur + 0.2) * 10) / 10,
                                        0.2,
                                        2.0
                                    )
                                );
                                scaleable.current?.scaleEnded();
                            }}
                        ></Button>
                        <Button
                            type="text"
                            icon={<MinusOutlined />}
                            disabled={scaleValue <= 0.2}
                            onClick={() => {
                                scaleable.current?.scaleTo((cur) =>
                                    clamp(
                                        Math.round((cur - 0.2) * 10) / 10,
                                        0.2,
                                        2.0
                                    )
                                );
                                scaleable.current?.scaleEnded();
                            }}
                        ></Button>
                        <Button
                            type="text"
                            icon={<CenterOutlined />}
                            onClick={() => zoomCenter()}
                        ></Button>
                    </div>
                </div>
                <div className={styles["result-container"]}>
                    <div>{t("model.orcResult", "识别结果")}</div>
                    <div className={styles["result"]}>
                        {ocrModel.operator === "@anyshare/ocr/general"
                            ? getGeneralContent(content).map(
                                  (item: string, index: number) => (
                                      <>
                                          <div className={styles["name"]}>
                                              {index + 1}
                                              {t("colon")}
                                          </div>
                                          <Typography.Text
                                              ellipsis
                                              className={styles["value"]}
                                              title={item}
                                          >
                                              {item}
                                          </Typography.Text>
                                      </>
                                  )
                              )
                            : outputs?.map((item) => (
                                  <>
                                      <div className={styles["name"]}>
                                          {et(item.name)}
                                      </div>
                                      <Typography.Text
                                          ellipsis
                                          className={styles["value"]}
                                          title={
                                              content?.[item.key?.slice(1)] ||
                                              ""
                                          }
                                      >
                                          {content?.[item.key?.slice(1)] || ""}
                                      </Typography.Text>
                                  </>
                              ))}
                    </div>
                </div>
                {isLoading && (
                    <div className={styles["spin-container"]}>
                        <Spin></Spin>
                    </div>
                )}
            </div>
            <div className={styles["footer"]}>
                <section>
                    <Button
                        type="default"
                        className={styles["default-btn"]}
                        loading={isLoading}
                        onClick={() => handleSelectFile()}
                    >
                        {t("model.selectFile", "选择文件测试")}
                    </Button>
                    <span className={styles["description"]}>
                        {supportPDF
                            ? t("model.supportTip", "支持JPG/JPEG/PNG/PDF格式")
                            : t("model.supportTip.img")}
                    </span>
                </section>
            </div>
        </>
    );
};
