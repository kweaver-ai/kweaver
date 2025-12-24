import { API, MicroAppContext, useTranslate } from "@applet/common";
import { Button } from "antd";
import clsx from "clsx";
import { find } from "lodash";
import { CSSProperties, FC, HTMLAttributes, useContext, useEffect, useRef } from "react";
import useSWR from "swr";
import EmptyFilePng from "../../assets/empty.png";
import styles from "./as-file-preview.module.less";

export interface IDocItem {
    docid: string;
    name: string;
    size: number;
    [key: string]: any;
}

export const AsFilePreview: FC<
    { file: IDocItem } & HTMLAttributes<HTMLDivElement>
> = ({ file, className, ...props }) => {
    const { microWidgetProps, functionId } = useContext(MicroAppContext);
    const frame = useRef<any>();
    const container = useRef<HTMLDivElement>(null);
    const { data, error } = usePreviewConfig(file);
    // const [loading, setLoading] = useState(true);
    const t = useTranslate();

    useEffect(() => {
        if (data) {
            const { url } = data;
            if (typeof microWidgetProps?.frame?.creactAsFrame === "function") {
                // setLoading(true);
                if (!frame.current) {
                    const instance = microWidgetProps.frame.creactAsFrame({
                        functionid: functionId,
                        config: {
                            url,
                            mount: container.current,
                            autoResize: true,
                        },
                    });

                    // instance.iframe.onload = () => {
                    //     setLoading(false);
                    // };

                    instance.on("FrameSdkOnTokenExpire", async () => {
                        const token =
                            await microWidgetProps.token?.refreshOauth2Token();
                        if (token?.access_token) {
                            instance?.setToken(token?.access_token);
                        }
                    });

                    frame.current = instance;
                } else {
                    frame.current.changeIframeUrl(url);
                }
            } else {
                window.open(url);
            }
        }
    }, [data, microWidgetProps]);

    const downloadFile = (file: IDocItem) => {
        microWidgetProps?.contextMenu?.downloadFn({
            item: {
                ...file,
            },
        });
    };

    return (
        <div {...props} className={clsx(className, styles.container)}>
            <div
                ref={container}
                className={clsx(
                    styles.frameContainer,
                    (!data || error) && styles.hidden
                )}
                style={data?.style}
            />
            {/* {!error && loading && (
                <Spin
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                    }}
                />
            )} */}
            {error ? (
                <div className={styles.errorContainer}>
                    <img
                        className={styles.errorIcon}
                        src={EmptyFilePng}
                        alt="error"
                    />
                    <div className={styles.errorMessage}>
                        {error === NotSupport
                            ? t(
                                  "asFilePreview.notSupport",
                                  "文件格式不支持在线打开，您可以<download></download>文件到本地查看",
                                  {
                                      download: () => (
                                          <Button
                                              type="link"
                                              onClick={() => downloadFile(file)}
                                          >
                                              {t(
                                                  "asFilePreview.download",
                                                  "下载"
                                              )}
                                          </Button>
                                      ),
                                  }
                              )
                            : null}
                        {error === NotFound
                            ? t(
                                  "asFilePreview.notFound",
                                  "文件不存在，可能其所在路径发生变更"
                              )
                            : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const NotSupport = new Error("file type not support");
const NotFound = new Error("file not found");

interface PreviewConfig {
    url: string;
    style?: CSSProperties;
}

function usePreviewConfig(file: IDocItem) {
    const { microWidgetProps, functionId, prefixUrl } =
        useContext(MicroAppContext);
    return useSWR<PreviewConfig | undefined>(
        ["PREVIEW_CONFIG", file.name, file.docid],
        async () => {
            if (!file.docid) {
                throw NotFound;
            }
            const lang = microWidgetProps?.language?.getLanguage || "zh-cn";
            if (
                typeof microWidgetProps?.contextMenu?.openMethodsFn ===
                "function"
            ) {
                try {
                    const methods =
                        await microWidgetProps.contextMenu.openMethodsFn({
                            functionid: functionId,
                            item: {
                                docid: file.docid,
                                name: file.name,
                                size: 1,
                            },
                        });

                    if (methods && methods.length) {
                        const { key } = methods[0];
                        switch (key) {
                            case "foxitreader": {
                                const params = new URLSearchParams({
                                    _tb: "none",
                                    gns: file.docid.slice(6),
                                    name: file.name,
                                });
                                return {
                                    url: `${prefixUrl}/anyshare/${lang}/foxitreader?${params.toString()}`,
                                    style: {
                                        top: 0,
                                    },
                                };
                            }
                            case "wps": {
                                const params = new URLSearchParams({
                                    _tb: "none",
                                    gns: file.docid.slice(6),
                                    name: file.name,
                                });
                                return {
                                    url: `${prefixUrl}/anyshare/${lang}/wpspreview?${params.toString()}`,
                                    style: {
                                        top: 0,
                                    },
                                };
                            }
                            case "officeonline": {
                                const params = new URLSearchParams({
                                    _tb: "none",
                                    gns: file.docid.slice(6),
                                    name: file.name,
                                });
                                return {
                                    url: `${prefixUrl}/anyshare/${lang}/officeonline?${params.toString()}`,
                                    style: {
                                        top: 0,
                                    },
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
                try {
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/appstore/v2/applist`
                    );
                    if (data.apps?.length) {
                        const yozo = data.apps.find(
                            (app: any) => app.name === "preview/yozowo"
                        );
                        if (
                            yozo &&
                            (
                                yozo.openmethodConfig as any
                            )?.supportDefaultPreviewMethodExtensions?.some(
                                (ext: any) => file.name.endsWith(ext)
                            )
                        ) {
                            const { data } =
                                await API.efast.efastV1EntryDocLibGet();
                            const entryDoc = data.find((item) =>
                                file.docid.startsWith(item.id)
                            );
                            if (entryDoc) {
                                const params = new URLSearchParams({
                                    _docid: file.docid,
                                    _name: file.name,
                                    _type: entryDoc.type,
                                });
                                return {
                                    url: `${prefixUrl}/anyshare/${lang}/microappsfullscreen/${
                                        yozo.functionid
                                    }/preview/yozowo?${params.toString()}`,
                                    style: {
                                        top: 0,
                                    },
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (/\.(dwg|dwt|dxf|ocf)$/i.test(file.name)) {
                const params = new URLSearchParams({
                    _tb: "none",
                    gns: file.docid.slice(6),
                    name: file.name,
                });
                return {
                    url: `${prefixUrl}/anyshare/${lang}/cadpreview?${params.toString()}`,
                    style: {
                        top: 0,
                    },
                };
            } else if (
                /\.(mp3|wav|ogg|flac|m4a|ape|aac|wma|avi|rmvb|rm|mp4|3gp|mkv|mov|mpg|mpeg|wmv|flv|asf|h264|x264|mts|m2ts)$/i.test(
                    file.name
                )
            ) {
                const params = new URLSearchParams({
                    _tb: "none",
                    gns: file.docid.slice(6),
                    name: file.name,
                });
                return {
                    url: `${prefixUrl}/anyshare/${lang}/play?${params.toString()}`,
                    style: {
                        top: 0,
                    },
                };
            } else if (
                /\.(jpg|jpeg|gif|bmp|png|emf|tif|wmf|JPG|JPEG|GIF|BMP|PNG|EMF|TIF|psd)$/i.test(
                    file.name
                )
            ) {
                const params = new URLSearchParams({
                    _tb: "none",
                    docid: file.docid,
                    name: file.name,
                    size: "0",
                });
                return {
                    url: `${prefixUrl}/anyshare/${lang}/previewimg?${params.toString()}`,
                    style: {
                        top: 0,
                    },
                };
            } else if (/\.drawio$/i.test(file.name)) {
                const docid = file.docid;
                try {
                    const { data } = await API.efast.efastV1EntryDocLibGet();
                    let { type } = find(
                        data,
                        (item: any) =>
                            item.id === `gns://${docid.split("/")[2]}`
                    )!;
                    let docLibType;
                    if (type === "shared_user_doc_lib") {
                        docLibType = "user_doc_lib";
                    } else {
                        docLibType = type;
                    }
                    const {
                        data: { apps = [] },
                    } = await API.axios.get(
                        `${prefixUrl}/api/appstore/v2/applist`
                    );
                    const { functionid } = find(
                        apps,
                        (item) => item.command === "drawio"
                    );

                    if (functionid) {
                        return {
                            url: `${prefixUrl}/anyshare/${lang}/microappsfullscreen/${functionid}/flowChart?_docid=${encodeURIComponent(
                                docid
                            )}&_name=${encodeURIComponent(
                                file.name
                            )}&_tb=none&_type=${docLibType}`,
                            style: {
                                top: 0,
                            },
                        };
                    }
                    throw NotSupport;
                } catch (error: any) {
                    if (
                        error?.response?.data?.code === 404002006 ||
                        error?.response?.data?.code === 404002005
                    ) {
                        throw NotFound;
                    }
                }
            } else {
                throw NotSupport;
            }
        },
        {
            revalidateOnFocus: false,
        }
    );
}
