import { Button } from "antd";
import { useContext, useState } from "react";
import { MicroAppContext, TranslateFn } from "@applet/common";
import styles from "./index.module.less";
import clsx from "clsx";

interface SampleVerifyProps {
    t: TranslateFn;
    scene?: string;
}

export const SampleVerify = ({ t, scene }: SampleVerifyProps) => {
    const [data, setData] = useState<any[]>([]);
    const { microWidgetProps, functionId } = useContext(MicroAppContext);
    const [isGeneral, setGeneral] = useState(true);

    const handleSelect = async () => {
        try {
            let result: any = await microWidgetProps?.contextMenu?.selectFn({
                functionid: functionId,
                selectType: 1,
                title: t("fileSelectTitle"),
            });
            const { docid } = result[0];
            // TODO 请求获取识别结果
            if (scene) {
                // 提取结构化数据
            } else {
                // 提取识别文字
            }

            // 当scene支持结构化数据时显示结构化数据 raw_result
            if (scene) {
                setGeneral(false);
            }
        } catch (e) {
            console.error(e);
        }
    };
    return (
        <>
            <p className={styles["verify-description"]}>
                {t(
                    "ocr.verifyDescription",
                    "为了验证动作可用，您可以选择样本文件进行效果测试"
                )}
            </p>
            <Button className={styles["verify-btn"]} onClick={handleSelect}>
                {t("ocr.selectSampleFile", "选择样本文件并测试")}
            </Button>
            {data.length > 0 && (
                <div className={styles["verify-results"]}>
                    <div className={styles["header"]}>
                        {t("ocr.result", "识别结果")}
                    </div>
                    <div className={styles["table-wrapper"]}>
                        <div
                            className={clsx(styles["content"], {
                                [styles["raw"]]: !isGeneral,
                            })}
                        >
                            {isGeneral
                                ? data.map((item: string, index) => (
                                      <p key={index}>{item}</p>
                                  ))
                                : data.map((item: any[], index) => (
                                      <div
                                          key={index}
                                          className={styles["row"]}
                                      >
                                          <div
                                              className={clsx(
                                                  styles["col"],
                                                  styles["label-col"]
                                              )}
                                              title={item[0]}
                                          >
                                              {item[0]}
                                          </div>
                                          <div
                                              className={styles["col"]}
                                              title={item[1]}
                                          >
                                              {item[1] === "" ? (
                                                  <span
                                                      className={
                                                          styles["verify-empty"]
                                                      }
                                                  >
                                                      {t(
                                                          "ocr.unrecognized",
                                                          "未识别"
                                                      )}
                                                  </span>
                                              ) : (
                                                  item[1]
                                              )}
                                          </div>
                                      </div>
                                  ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
