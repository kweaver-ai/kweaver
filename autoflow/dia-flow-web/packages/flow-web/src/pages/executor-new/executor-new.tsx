import { LeftOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import {
    Button,
    Drawer,
    Form,
    FormInstance,
    Layout,
    PageHeader,
    Space,
    Steps,
} from "antd";
import { AxiosError } from "axios";
import clsx from "clsx";
import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
    CustomExecutorForm,
    ExecutorFormValues,
} from "../../components/custom-executor";
import {
    ActionFormValues,
    CustomExecutorActionForm,
} from "../../components/custom-executor/custom-executor-action-form";
import { CustomExecutorActions } from "../../components/custom-executor/custom-executor-actions";
import {
    ExecutorActionDto,
    ExecutorActionDtoTypeEnum,
} from "../../models/executor-action-dto";
import styles from "./executor-new.module.less";
import { useCustomExecutorErrorHandler } from "../../components/custom-executor/errors";

enum DrawerStatus {
    Idle = 0,
    New = 1,
    Edit = 2,
}

export function ExecutorNew() {
    const { modal, message } = useContext(MicroAppContext);
    const navigate = useNavigate();
    const t = useTranslate("customExecutor");
    const [step, setStep] = useState(0);
    const [form] = Form.useForm();
    const actionForm = useRef<FormInstance<ActionFormValues>>(null);
    const [executor, setExecutor] = useState<ExecutorFormValues>(() => ({
        name: "",
        status: true,
    }));
    const [actions, setActions] = useState<ExecutorActionDto[]>([]);
    const [currentActionIndex, setCurrentActionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState(DrawerStatus.Idle);
    const handleError = useCustomExecutorErrorHandler();

    const back = () => {
        modal.confirm({
            className: styles.ConfirmModal,
            transitionName: "",
            title: t("newExecutorCancelTitle", "您有编辑内容未保存"),
            content: t(
                "newExecutorCancelContent",
                "返回将导致编辑内容丢失，确定返回吗？"
            ),
            onOk() {
                navigate("/nav/executors");
            },
        });
    };

    const save = async () => {
        if (actions.length < 1) {
            message.info(t("noActions", "请新建自定义动作"));
            return;
        }

        setLoading(true);
        try {
            const { data } = await API.axios.post<{ id: string }>(
                "/api/automation/v1/executors",
                {
                    name: executor.name.trim(),
                    status: executor.status ? 1 : 0,
                    description:
                        executor.description && executor.description.trim(),
                    accessors: executor.accessors,
                    actions,
                }
            );
            message.success(t("newExecutorSuccess", "新建成功"));
            navigate(`/nav/executors`);
        } catch (e) {
            if (
                (e as AxiosError)?.response?.data?.code ===
                "ContentAutomation.DuplicatedName"
            ) {
                setStep(0);
                form.validateFields();
            } else {
                handleError(e);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Layout
                className={clsx(styles.Container, loading && styles.Loading)}
            >
                <PageHeader
                    title={
                        <div className={styles.Title}>
                            {t("newExecutor", "新建执行操作节点")}
                        </div>
                    }
                    className={styles.Header}
                    backIcon={
                        <LeftOutlined
                            className={styles.BackIcon}
                            title={t("back", "返回节点列表")}
                        />
                    }
                    onBack={back}
                />

                <Layout className={styles.Content}>
                    <Layout.Sider
                        theme="light"
                        className={styles.Sider}
                        width={264}
                    >
                        <Steps
                            direction="vertical"
                            current={step}
                            className={styles.Steps}
                        >
                            <Steps.Step
                                title={t("basicInfo", "基础信息")}
                                description={t(
                                    "basicInfoDesc",
                                    "设置节点名称及可用范围"
                                )}
                            ></Steps.Step>

                            <Steps.Step
                                title={t("newAction", "新建动作")}
                                description={t(
                                    "newActionDesc",
                                    "为节点新建执行动作"
                                )}
                            ></Steps.Step>
                        </Steps>
                    </Layout.Sider>

                    <Layout className={styles.Main}>
                        <Layout.Content className={styles.MainContent}>
                            <div
                                style={{
                                    display: step === 0 ? "block" : "none",
                                }}
                            >
                                <CustomExecutorForm
                                    form={form}
                                    initialValues={executor}
                                    onFinish={(value) => {
                                        setExecutor(value);
                                        setStep(1);
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: step === 1 ? "block" : "none",
                                }}
                            >
                                <CustomExecutorActions
                                    isAccessible
                                    actions={actions}
                                    onAdd={() => {
                                        setStatus(DrawerStatus.New);
                                        setCurrentActionIndex(-1);
                                    }}
                                    onEdit={(action) => {
                                        setStatus(DrawerStatus.Edit);
                                        setCurrentActionIndex(
                                            actions.indexOf(action)
                                        );
                                    }}
                                    onRemove={(action) => {
                                        modal.confirm({
                                            className: styles.ConfirmModal,
                                            transitionName: "",
                                            title: t(
                                                "removeActionTitle",
                                                "确定要删除此自定义动作吗？"
                                            ),
                                            content: t(
                                                "removeActionContent",
                                                "删除后，自定义动作将无法恢复。"
                                            ),
                                            onOk() {
                                                setActions((actions) =>
                                                    actions.filter(
                                                        (a) => a !== action
                                                    )
                                                );
                                            },
                                        });
                                    }}
                                />
                            </div>
                        </Layout.Content>

                        <Layout.Footer className={styles.MainFooter}>
                            {step == 1 ? (
                                <Button onClick={() => setStep(0)}>
                                    {t("prevStep", "上一步")}
                                </Button>
                            ) : null}
                            <Space className={styles.FooterRight}>
                                {step == 0 ? (
                                    <Button
                                        type="primary"
                                        onClick={() => form.submit()}
                                    >
                                        {t("nextStep", "下一步")}
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        loading={loading}
                                        onClick={save}
                                    >
                                        {t("save", "保存")}
                                    </Button>
                                )}

                                <Button onClick={back}>
                                    {t("cancel", "取消")}
                                </Button>
                            </Space>
                        </Layout.Footer>
                    </Layout>
                </Layout>
            </Layout>
            <Drawer
                title={
                    currentActionIndex === -1
                        ? t("newActionDrawerTitle", "新建自定义动作")
                        : t("editActionDrawerTitle", "编辑自定义动作")
                }
                open={status != DrawerStatus.Idle}
                maskClosable={false}
                width={528}
                className={styles.Drawer}
                footer={
                    <Space className={styles.DrawerFooterButtons}>
                        <Button
                            type="primary"
                            onClick={() => actionForm.current?.submit()}
                        >
                            {t("ok", "确定")}
                        </Button>
                        <Button
                            onClick={() => {
                                setStatus(DrawerStatus.Idle);
                                setCurrentActionIndex(-1);
                            }}
                        >
                            {t("cancel", "取消")}
                        </Button>
                    </Space>
                }
                destroyOnClose
                onClose={() => {
                    setStatus(DrawerStatus.Idle);
                    setCurrentActionIndex(-1);
                }}
            >
                <CustomExecutorActionForm
                    ref={actionForm}
                    action={
                        currentActionIndex > -1
                            ? actions[currentActionIndex]
                            : undefined
                    }
                    validateName={async (name) => {
                        return actions.every(
                            (action, index) =>
                                index === currentActionIndex ||
                                action.name != name
                        );
                    }}
                    onFinish={(values) => {
                        if (status === DrawerStatus.New) {
                            setActions([
                                ...actions,
                                {
                                    ...values,
                                    type: ExecutorActionDtoTypeEnum.Python,
                                },
                            ]);
                        } else {
                            setActions([
                                ...actions.slice(0, currentActionIndex),
                                { ...actions[currentActionIndex], ...values },
                                ...actions.slice(currentActionIndex + 1),
                            ]);
                        }
                        setStatus(DrawerStatus.Idle);
                        setCurrentActionIndex(-1);
                    }}
                />
            </Drawer>
        </>
    );
}
