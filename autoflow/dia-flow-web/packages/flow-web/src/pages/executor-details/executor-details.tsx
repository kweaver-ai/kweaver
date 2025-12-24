import { LeftOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { FormOutlined } from "@applet/icons";
import {
    Button,
    Drawer,
    Form,
    FormInstance,
    Layout,
    PageHeader,
    Space,
} from "antd";
import { useContext, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import {
    CustomExecutorBasicInfo,
    CustomExecutorForm,
    ExecutorFormValues,
} from "../../components/custom-executor";
import {
    ActionFormValues,
    CustomExecutorActionForm,
} from "../../components/custom-executor/custom-executor-action-form";
import { CustomExecutorActions } from "../../components/custom-executor/custom-executor-actions";
import { ExecutorActionDtoTypeEnum } from "../../models/executor-action-dto";
import { ExecutorDto } from "../../models/executor-dto";
import styles from "./executor-details.module.less";
import { useCustomExecutorAccessible } from "../../utils/hooks";
import { useCustomExecutorErrorHandler } from "../../components/custom-executor/errors";

enum DrawerStatus {
    Idle = 0,
    New = 1,
    Edit = 2,
}

export function ExecutorDetails() {
    const { modal } = useContext(MicroAppContext);
    const navigate = useNavigate();
    const { executorId } = useParams<{ executorId: string }>();
    const t = useTranslate("customExecutor");

    const handleError = useCustomExecutorErrorHandler();

    const isAccessible = useCustomExecutorAccessible();
    const { data, mutate } = useSWR(
        `/api/automation/v1/executors/${executorId}`,
        async (url) => {
            const { data } = await API.axios.get<ExecutorDto>(url);
            return data;
        },
        {
            onError(err) {
                handleError(err);
            },
        }
    );

    const [isEditing, setIsEditing] = useState(false);

    const actionForm = useRef<FormInstance<ActionFormValues>>(null);
    const [form] = Form.useForm<ExecutorFormValues>();

    const [status, setStatus] = useState(DrawerStatus.Idle);

    const [currentActionIndex, setCurrentActionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);

    return (
        <>
            <Layout className={styles.Container}>
                <PageHeader
                    title={
                        <div className={styles.Title} title={data?.name}>
                            {data?.name}
                        </div>
                    }
                    className={styles.Header}
                    backIcon={
                        <LeftOutlined
                            className={styles.BackIcon}
                            title={t("back", "返回节点列表")}
                        />
                    }
                    onBack={() => navigate("/nav/executors")}
                />
                <Layout.Content className={styles.Content}>
                    <section className={styles.Section}>
                        <header className={styles.SectionHeader}>
                            <div className={styles.SectionTitle}>
                                {t("basic", "基本信息")}
                            </div>
                            <div>
                                {!isEditing && data && isAccessible && (
                                    <Button
                                        type="link"
                                        icon={<FormOutlined />}
                                        onClick={() => {
                                            form.setFieldsValue({
                                                status: data.status
                                                    ? true
                                                    : false,
                                                name: data.name,
                                                description: data.description,
                                                accessors: data.accessors,
                                            });
                                            setIsEditing(true);
                                        }}
                                    >
                                        {t("edit", "编辑")}
                                    </Button>
                                )}
                            </div>
                        </header>

                        {data && (
                            <>
                                {isEditing ? (
                                    <CustomExecutorForm
                                        executorId={data.id}
                                        form={form}
                                        onCancel={() => {
                                            setIsEditing(false);
                                            form.resetFields();
                                        }}
                                        onFinish={() => {
                                            setIsEditing(false);
                                            form.resetFields();
                                            mutate();
                                        }}
                                    />
                                ) : (
                                    <CustomExecutorBasicInfo executor={data} />
                                )}
                            </>
                        )}
                    </section>
                    <section className={styles.Section}>
                        <header className={styles.SectionHeader}>
                            <div className={styles.SectionTitle}>
                                {t("actions", "自定义动作")}
                            </div>
                        </header>

                        {data ? (
                            <CustomExecutorActions
                                isAccessible={isAccessible}
                                actions={data.actions || []}
                                onAdd={() => {
                                    setStatus(DrawerStatus.New);
                                    setCurrentActionIndex(-1);
                                }}
                                onEdit={(action) => {
                                    if (data?.actions) {
                                        const actionIndex =
                                            data.actions.indexOf(action);
                                        if (actionIndex > -1) {
                                            setStatus(DrawerStatus.Edit);
                                            setCurrentActionIndex(actionIndex);
                                        }
                                    }
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
                                        async onOk() {
                                            try {
                                                await API.axios.delete(
                                                    `/api/automation/v1/executors/${executorId}/actions/${action.id}`
                                                );
                                                mutate();
                                            } catch (e) {
                                                handleError(e);
                                            }
                                        },
                                    });
                                }}
                            />
                        ) : null}
                    </section>
                </Layout.Content>
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
                            loading={loading}
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
                            ? data?.actions?.[currentActionIndex]
                            : undefined
                    }
                    validateName={async (name) => {
                        if (!name) return true;
                        if (currentActionIndex === -1) {
                            const { data } = await API.axios.post<{
                                result: boolean;
                            }>(
                                `/api/automation/v1/check/executors/${executorId}/actions`,
                                {
                                    name,
                                }
                            );
                            return data.result;
                        }

                        if (!data?.actions?.[currentActionIndex]) {
                            return true;
                        }

                        const {
                            data: { result },
                        } = await API.axios.put<{
                            result: boolean;
                        }>(
                            `/api/automation/v1/check/executors/${executorId}/actions/${
                                data!.actions![currentActionIndex].id
                            }`,
                            { name }
                        );

                        return result;
                    }}
                    onFinish={async (values) => {
                        try {
                            setLoading(true);

                            if (status === DrawerStatus.New) {
                                await API.axios.post(
                                    `/api/automation/v1/executors/${executorId}/actions`,
                                    {
                                        type: ExecutorActionDtoTypeEnum.Python,
                                        ...values,
                                    }
                                );
                            } else {
                                const currentAction =
                                    data?.actions?.[currentActionIndex];
                                if (currentAction) {
                                    await API.axios.put(
                                        `/api/automation/v1/executors/${executorId}/actions/${currentAction.id}`,
                                        values
                                    );
                                } else {
                                    modal.info({
                                        title: t(
                                            `errorTitle`,
                                            "无法执行此操作"
                                        ),
                                        content: t(
                                            `executorActionNotFoundMessage`,
                                            "此动作已不存在"
                                        ),
                                        transitionName: "",
                                        okText: t("ok", "确定"),
                                        cancelText: t("cancel", "取消"),
                                    });
                                }
                            }
                            mutate();
                            setStatus(DrawerStatus.Idle);
                            setCurrentActionIndex(-1);
                        } catch (e) {
                            handleError(e);
                        } finally {
                            setLoading(false);
                        }
                    }}
                />
            </Drawer>
        </>
    );
}
