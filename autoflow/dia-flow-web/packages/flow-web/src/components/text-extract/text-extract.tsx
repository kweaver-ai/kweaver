import { Button, Layout, PageHeader, Space, Steps } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useLocation, useNavigate, useParams } from "react-router";
import textExtractSVG from "../../extensions/ai/assets/text-extract.svg";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
    AbilityDetails,
    DetailsValidate,
} from "../tag-extract/ability-details";
import { ExtractExperience } from "./extract-experience";
import { AnnotationFile } from "./annotation-file";
import styles from "./styles/text-extract.module.less";
import { useHandleErrReq } from "../../utils/hooks";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";

const { Step } = Steps;
const { Sider, Content, Footer } = Layout;

export const TextExtract = () => {
    const [annotationDetails, setAnnotationDetails] =
        useState<Record<string, any>>();
    const t = useTranslate();
    const [detail, setDetail] = useState<Record<string, any>>({
        name: t("customModel.defaultTitle", "未命名自定义能力"),
        description: "",
        status: 0,
        created_at: "",
        updated_at: "",
    });
    const navigate = useNavigate();
    const [params, setSearchParams] = useSearchParams();
    const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
    const handleErr = useHandleErrReq();
    const location = useLocation();
    const { id: taskId = "" } = useParams<{ id: string }>();
    const detailsRef = useRef<DetailsValidate>(null);

    const isEditMode = useMemo(() => {
        if (location.pathname.indexOf("/edit") > -1) {
            return true;
        }
        return false;
    }, [location.pathname]);
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 0);

    const back = () => {
        const from = params.get("back");
        if (from) {
            try {
                navigate(atob(from));
                return;
            } catch (error) {
                console.error(error);
            }
        }
        navigate("/nav/model/custom");
    };

    const handleStepsChange = (val: number) => {
        if (isEditMode && val === 0) {
            return;
        }
        if (val < 0 || val > 2) {
            return;
        }
        // 校验 是否完成前面步骤
        if (!isEditMode && !annotationDetails?.id && val !== 0) {
            microWidgetProps?.components?.toast.info(
                t("model.stepMessage", "请先完成前面的步骤")
            );
            return;
        }
        setCurrentStep(val);
        const newParams = new URLSearchParams(params);
        newParams.set("step", String(val));
        setSearchParams(newParams);
    };

    const handleSave = async (status: number) => {
        if (detailsRef.current) {
            const isValid = await detailsRef.current.validate();
            if (!isValid) {
                return;
            }
        }
        try {
            if (!isEditMode) {
                // 不在自定义文本提取白名单中无法使用
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
            }

            await API.axios.put(
                `${prefixUrl}/api/automation/v1/models/${annotationDetails?.id}`,
                {
                    name: detail.name,
                    description: detail?.description || "",
                    status: status,
                }
            );
            microWidgetProps?.components?.toast?.success(
                t("save.success", "保存成功")
            );
            back();
        } catch (error: any) {
            if (
                error?.response?.data.code ===
                "ContentAutomation.DuplicatedName"
            ) {
                detailsRef.current?.duplicateName(true);
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
        }
    };

    const content = useMemo(() => {
        switch (currentStep) {
            case 0: {
                return (
                    <AnnotationFile
                        annotationDetails={annotationDetails}
                        onFinish={(val) => {
                            setAnnotationDetails(val);
                        }}
                        onStepChange={() => {
                            setCurrentStep(1);
                        }}
                    />
                );
            }
            case 1:
                return <ExtractExperience id={annotationDetails?.id} />;
            case 2:
                return (
                    <AbilityDetails
                        data={detail}
                        ref={detailsRef}
                        onChange={(val) => {
                            setDetail(val);
                        }}
                    />
                );
            default: {
                return null;
            }
        }
    }, [currentStep, detail]);

    const getTaskInfo = async () => {
        try {
            const { data } = await API.axios.get(
                `${prefixUrl}/api/automation/v1/models/${taskId}`
            );
            setDetail(data);
            setAnnotationDetails({ id: data.id });
        } catch (error: any) {
            if (
                error?.response?.data?.code === "ContentAutomation.TaskNotFound"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title", "无法完成操作"),
                    message: t(
                        "err.ability.notFound",
                        "该自定义能力已不存在。"
                    ),
                    okText: t("ok", "确定"),
                    onOk: () => back(),
                });
                return;
            }
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                navigate("/disable");
                return;
            }
            handleErr({ error: error?.response });
        }
    };

    useEffect(() => {
        if (isEditMode) {
            getTaskInfo();
            const step = Number(params.get("step") || 2);
            if (step > 0 && step <= 2) {
                setCurrentStep(Number(step));
            }
        }
    }, []);

    return (
        <Layout className={styles["container"]}>
            <PageHeader
                title={
                    <div title={detail.name || ""} className={styles["title"]}>
                        <img
                            src={textExtractSVG}
                            alt=""
                            className={styles["header-icon"]}
                        ></img>
                        {detail.name || ""}
                    </div>
                }
                className={styles["header"]}
                backIcon={<LeftOutlined className={styles["back-icon"]} />}
                onBack={back}
            />
            <Layout>
                <Sider theme="light" width={250} className={styles["sider"]}>
                    <Steps
                        direction="vertical"
                        size="small"
                        current={currentStep}
                        className={styles["steps"]}
                        onChange={handleStepsChange}
                    >
                        <Step
                            title={t(
                                "model.annotationStep.label",
                                "上传标注文件并训练"
                            )}
                            description={t(
                                "model.annotationStep.description",
                                "通过标注文件定义您的提取规则"
                            )}
                            stepIndex={0}
                            disabled={isEditMode}
                            className={clsx({
                                [styles["edit-mode"]]: isEditMode,
                            })}
                        />
                        <Step
                            title={t(
                                "model.text.testCapability",
                                "测试能力效果"
                            )}
                            stepIndex={1}
                        />
                        <Step title={t("model.save", "保存")} stepIndex={2} />
                    </Steps>
                </Sider>
                <Layout>
                    <Content className={styles["content"]}>{content}</Content>
                    <Footer className={styles["footer"]}>
                        <Button
                            className={clsx({
                                [styles["hidden"]]: currentStep === 0,
                            })}
                            onClick={() => {
                                handleStepsChange(currentStep - 1);
                            }}
                        >
                            {t("model.step.back", "上一步")}
                        </Button>
                        <Space size={8}>
                            {currentStep === 2 ? (
                                <>
                                    {detail.status === 1 ? (
                                        <Button
                                            type="primary"
                                            className={clsx(
                                                "automate-oem-primary-btn"
                                            )}
                                            onClick={debounce(() =>
                                                handleSave(1)
                                            )}
                                        >
                                            {t("model.save", "保存")}
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                type="primary"
                                                className={clsx(
                                                    "automate-oem-primary-btn",
                                                    styles["next-btn"]
                                                )}
                                                onClick={debounce(() =>
                                                    handleSave(1)
                                                )}
                                            >
                                                {t(
                                                    "model.save.publish",
                                                    "保存并发布到工作流"
                                                )}
                                            </Button>
                                            <Button
                                                onClick={debounce(() =>
                                                    handleSave(0)
                                                )}
                                            >
                                                {t("model.save.only", "仅保存")}
                                            </Button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Button
                                    type="primary"
                                    className={clsx(
                                        "automate-oem-primary-btn",
                                        styles["next-btn"]
                                    )}
                                    onClick={() =>
                                        handleStepsChange(currentStep + 1)
                                    }
                                >
                                    {t("model.step.next", "下一步")}
                                </Button>
                            )}
                            <Button onClick={back}>
                                {t("cancel", "取消")}
                            </Button>
                        </Space>
                    </Footer>
                </Layout>
            </Layout>
        </Layout>
    );
};
