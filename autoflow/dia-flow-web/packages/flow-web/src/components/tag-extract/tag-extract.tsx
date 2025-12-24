import { Button, Layout, PageHeader, Space, Steps } from "antd";
import styles from "./styles/tag-extract.module.less";
import { LeftOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useLocation, useNavigate, useParams } from "react-router";
import tagExtractSVG from "../../extensions/ai/assets/tag-extract.svg";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RuleList } from "./rule-list";
import clsx from "clsx";
import { ExtractExperience } from "./extract-experience";
import { AbilityDetails, DetailsValidate } from "./ability-details";
import { useSearchParams } from "react-router-dom";
import { useHandleErrReq } from "../../utils/hooks";
import { debounce } from "lodash";

const { Step } = Steps;
const { Sider, Content, Footer } = Layout;

export interface RuleItem {
    tag_id: string;
    tag_path: string;
    rule: {
        or: string[][];
    };
}

export const TagExtract = () => {
    const [tagRule, setTagRule] = useState<RuleItem[]>([]);
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

    const isEditMode = useMemo(() => {
        if (location.pathname.indexOf("/edit") > -1) {
            return true;
        }
        return false;
    }, [location.pathname]);
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 0);
    const { id: taskId = "" } = useParams<{ id: string }>();
    const detailsRef = useRef<DetailsValidate>(null);

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
        if (val < 0 || val > 2) {
            return;
        }
        // 校验 是否完成前面步骤
        if (tagRule.length === 0 && val !== 0) {
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
            if (isEditMode) {
                await API.axios.put(
                    `${prefixUrl}/api/automation/v1/models/${taskId}`,
                    {
                        name: detail.name,
                        description: detail?.description || "",
                        status,
                        rules: tagRule,
                    }
                );
            } else {
                await API.axios.post(
                    `${prefixUrl}/api/automation/v1/tags/rule`,
                    {
                        name: detail.name,
                        description: detail?.description || "",
                        status,
                        rules: tagRule,
                    }
                );
            }
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
            handleErr({ error: error?.response });
        }
    };

    const getTaskInfo = async () => {
        try {
            const { data } = await API.axios.get(
                `${prefixUrl}/api/automation/v1/models/${taskId}`
            );
            setDetail(data);
            setTagRule(data.rules);
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

    const getContent = () => {
        switch (currentStep) {
            case 0: {
                return (
                    <RuleList
                        tagRule={tagRule}
                        onChange={(val: RuleItem[]) => setTagRule(val)}
                    />
                );
            }
            case 1:
                return <ExtractExperience details={detail} rules={tagRule} />;
            case 2:
                return (
                    <AbilityDetails
                        ref={detailsRef}
                        data={detail}
                        onChange={(val) => {
                            setDetail(val);
                        }}
                    />
                );
            default: {
                return null;
            }
        }
    };

    useEffect(() => {
        if (isEditMode) {
            getTaskInfo();
            const step = Number(params.get("step") || 2);
            if (step >= 0 && step <= 2) {
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
                            src={tagExtractSVG}
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
                            title={t("model.createRule", "新建标签规则")}
                            description={
                                currentStep === 0
                                    ? t(
                                          "model.rule.description",
                                          "通过关键词组定义每个标签的特征"
                                      )
                                    : t(
                                          "model.rule.length",
                                          `已添加${tagRule.length}个标签`,
                                          { number: tagRule.length }
                                      )
                            }
                            stepIndex={0}
                        />
                        <Step
                            title={t(
                                "model.rule.testCapability",
                                "测试能力效果"
                            )}
                            stepIndex={1}
                        />
                        <Step title={t("model.save", "保存")} stepIndex={2} />
                    </Steps>
                </Sider>
                <Layout>
                    <Content className={styles["content"]}>
                        {getContent()}
                    </Content>
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
                                                    "automate-oem-primary-btn"
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
