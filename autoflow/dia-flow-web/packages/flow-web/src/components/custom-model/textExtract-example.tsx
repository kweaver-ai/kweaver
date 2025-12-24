import { useTranslate } from "@applet/common";
import { CardItem } from "../model-hub";
import { Button, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { CenterOutlined, MinusOutlined, PlusOutlined } from "@applet/icons";
import { Scaleable, ScaleableRef } from "react-scaleable";
import { ZoomCenter } from "../model-hub/ocr-recognition-modal";
import { clamp } from "lodash";
import clsx from "clsx";
import styles from "./styles/textExtract-example.module.less";

interface TextExtractExampleProps {
    data: CardItem;
}

export const TextExtractExample = ({ data }: TextExtractExampleProps) => {
    const [exampleIndex, setExampleIndex] = useState(0);
    const [imgSrc, setImgSrc] = useState("");
    const [result, setResult] = useState<any[]>([]);
    const t = useTranslate();

    const scaleable = useRef<ScaleableRef>(null);
    const wrapper = useRef<HTMLDivElement>(null);
    const [scaleValue, setScale] = useState(1);
    const [grabbing, setGrabbing] = useState(false);

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

    const handleToggle = () => {
        setExampleIndex((pre) => {
            if (pre + 1 < data.value?.["example"].length) {
                return pre + 1;
            }
            return 0;
        });
    };

    useEffect(() => {
        const current = data.value?.["example"][exampleIndex];
        if (current) {
            const res = Object.keys(current.content).map((key: any) => {
                return {
                    label: key,
                    value: current.content[key],
                };
            });
            setResult(res);
        }
        setImgSrc(current.img);
        setTimeout(() => {
            zoomCenter();
        }, 500);
    }, [exampleIndex]);

    return (
        <div className={styles["layout"]}>
            <section>
                <div className={styles["label-wrapper"]}>
                    <div className={styles["label"]}>
                        {t(
                            "model.textExtractTip",
                            "您可以通过少量样本文件，标注需要提取的文本，来创建符合业务场景的自定义文本提取模型"
                        )}
                    </div>
                    {/* <Button type="link" onClick={handleToggle}>
                        {t("model.toggle", "切换")}
                    </Button> */}
                </div>
                <div className={styles["container"]}>
                    <div className={styles["file-container"]}>
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
                                <img
                                    className={styles["ocr-img"]}
                                    onDragStart={() => {
                                        return false;
                                    }}
                                    src={imgSrc}
                                    alt=""
                                    width={460}
                                />
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
                        <div className={styles["result"]}>
                            {result.map((item: any) => (
                                <>
                                    <div className={styles["name"]}>
                                        {item.label}
                                    </div>
                                    <Typography.Text
                                        ellipsis
                                        className={styles["value"]}
                                        title={item.value}
                                    >
                                        {item.value}
                                    </Typography.Text>
                                </>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
