import { useContext, useEffect, useRef, useState } from "react";
import { Button, Col, Input, Row, Space, Upload, UploadProps } from "antd";
import clsx from "clsx";
import axios from "axios";
import { isFunction } from "lodash";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./styles/annotation-file.module.less";

interface AnnotationFileProps {
    annotationDetails?: Record<string, any>;
    onFinish: (details: Record<string, any>) => void;
    onStepChange: () => void;
}

export const AnnotationFile = ({
    annotationDetails,
    onFinish,
    onStepChange,
}: AnnotationFileProps) => {
    const [file, setFile] = useState<any>();
    const [details, setDetails] = useState<Record<string, any>>();
    const [isUploading, setUploading] = useState(false);
    const [isTrainingCompleted, setIsTrainingCompleted] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const t = useTranslate();
    const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
    const handleErr = useHandleErrReq();
    const axiosCancelToken = useRef<any>();

    const uploadProps: UploadProps = {
        name: "file",
        accept: ".json",
        multiple: false,
        maxCount: 1,
        directory: false,
        showUploadList: false,
        beforeUpload: async (file) => {
            setUploading(true);
            setFile(file);
            try {
                const formData = new FormData();
                formData.append("file", file);

                const { data } = await API.axios.post(
                    `${prefixUrl}/api/automation/v1/uie/training-file`,
                    formData,
                    {
                        cancelToken: new axios.CancelToken(function executor(
                            c
                        ) {
                            // 设置 cancel token
                            axiosCancelToken.current = c;
                        }),
                    }
                );
                setUploading(false);
                setDetails({
                    example: data.count,
                    text: data.schema,
                    id: data.id,
                    fileName: file.name,
                });
                setIsTrainingCompleted(false);
            } catch (error: any) {
                setUploading(false);
                setFile(undefined);
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.InvalidParameter"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t(
                            "err.file.InvalidParameter",
                            "导入的文件解析失败。"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                // 文件超出20M大小
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.FileSizeExceed"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t(
                            "err.fileSizeExceed.1g",
                            "当前文件大小超过1G，请重新选择。"
                        ),
                        okText: t("ok"),
                    });
                    return;
                }
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.OperationDenied.NumberOfTasksLimited"
                ) {
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

                handleErr({ error: error?.response });
            } finally {
                axiosCancelToken.current = null;
            }
            return false;
        },
    };

    const handelTrain = async () => {
        setIsTraining(true);
        try {
            await API.axios.post(
                `${prefixUrl}/api/automation/v1/uie/train`,
                {
                    id: details!.id,
                },
                {
                    cancelToken: new axios.CancelToken(function executor(c) {
                        // 设置 cancel token
                        axiosCancelToken.current = c;
                    }),
                }
            );
            setIsTraining(false);
            setIsTrainingCompleted(true);
            onFinish(details!);
        } catch (error: any) {
            setIsTraining(false);
            if (
                error?.response?.data.code ===
                "ContentAutomation.Forbidden.TrainingInProgress"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.tip", "提示"),
                    message: t(
                        t(
                            "err.TrainingInProgress",
                            "抱歉，当前已有其他任务正在训练中，请稍候再试。"
                        )
                    ),
                    okText: t("ok"),
                });
                return;
            }
            if (
                error?.response?.data.code ===
                "ContentAutomation.InternalError.ModelTrainFailed"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.tip", "提示"),
                    message: t(
                        t(
                            "err.ModelTrainFailed",
                            "训练失败，请确认标注文件内容无误后再试。"
                        )
                    ),
                    okText: t("ok"),
                });
                return;
            }
            if (
                error?.response?.data?.code ===
                "ContentAutomation.OperationDenied.NumberOfTasksLimited"
            ) {
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
            handleErr({ error: error?.response });
        } finally {
            axiosCancelToken.current = null;
        }
    };

    useEffect(() => {
        if (annotationDetails) {
            setDetails(annotationDetails);
            setIsTrainingCompleted(true);
        }
    }, [annotationDetails]);

    useEffect(() => {
        return () => {
            if (isFunction(axiosCancelToken.current)) {
                axiosCancelToken.current();
            }
        };
    }, []);

    return (
        <div className={styles["container"]}>
            <div className={styles["title"]}>
                {t("model.annotationFile", "标注文件")}
            </div>
            <div className={styles["description"]}>
                {t(
                    "model.annotationFile.description",
                    "您可以使用我们提供的线下标注工具，去标注一批样本文件，并将已标注好的样本文件上传"
                )}
            </div>
            <div style={{ marginTop: 32 }}>
                <Space size={8}>
                    <Input
                        readOnly
                        placeholder={t("select.placeholder")}
                        value={details?.fileName}
                        style={{ width: "300px" }}
                    ></Input>
                    {(isUploading || (!file && !details?.id)) && (
                        <Upload {...uploadProps} openFileDialogOnClick={!file}>
                            <Button
                                type="primary"
                                className={clsx("automate-oem-primary-btn")}
                                loading={isUploading}
                            >
                                {isUploading
                                    ? t("parsing", "正在解析")
                                    : t(
                                          "model.annotationFile.upload",
                                          "上传标注文件"
                                      )}
                            </Button>
                        </Upload>
                    )}
                    {isUploading && (
                        <Button
                            onClick={() => {
                                if (isFunction(axiosCancelToken.current)) {
                                    axiosCancelToken.current();
                                    setUploading(false);
                                }
                            }}
                        >
                            {t("cancel", "取消")}
                        </Button>
                    )}
                </Space>
            </div>
            {details && (
                <div className={styles["details"]}>
                    <div style={{ fontWeight: 600 }}>
                        {t(
                            "model.annotationFile.details",
                            "您上传的标注文件包含以下信息："
                        )}
                    </div>
                    <Row>
                        <Col>
                            {t("model.annotationFile.sample", "样本文件：")}
                        </Col>
                        <Col>
                            {details.example}
                            {t("model.annotationFile.number", "个")}
                        </Col>
                        <Col style={{ marginLeft: 32 }}>
                            {t("model.annotationFile.fields", "待提取字段：")}
                        </Col>
                        <Col>
                            {details.text}
                            {t("model.annotationFile.number", "个")}
                        </Col>
                    </Row>
                    {!isTrainingCompleted && (
                        <div style={{ marginTop: "12px" }}>
                            <Space size={8}>
                                <Button
                                    type="primary"
                                    className={clsx("automate-oem-primary-btn")}
                                    onClick={handelTrain}
                                    loading={isTraining}
                                >
                                    {t(
                                        "model.annotationFile.train",
                                        "开始训练"
                                    )}
                                </Button>

                                {!isTraining && (
                                    <Upload
                                        {...uploadProps}
                                        openFileDialogOnClick={!isTraining}
                                    >
                                        <Button>
                                            {t(
                                                "model.annotationFile.reUpload",
                                                "重新上传"
                                            )}
                                        </Button>
                                    </Upload>
                                )}
                            </Space>
                        </div>
                    )}
                </div>
            )}
            {isTrainingCompleted && (
                <div style={{ marginTop: "12px" }}>
                    <span>
                        {t("model.train.completed", "己训练完成，您可以去")}
                    </span>
                    <span className={styles["link"]} onClick={onStepChange}>
                        {t("model.text.testCapability", "测试能力效果")}
                    </span>
                    <span> {t("or", "或")} </span>
                    <Upload
                        {...uploadProps}
                        openFileDialogOnClick={!isUploading}
                    >
                        <span className={styles["link"]}>
                            {t("model.text.reSelect", "重新选择文件上传")}
                        </span>
                    </Upload>
                </div>
            )}
        </div>
    );
};
