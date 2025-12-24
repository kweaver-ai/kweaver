import { useContext, useEffect, useRef, useState } from "react";
import { Button, Modal, PageHeader, Typography } from "antd";
import { useNavigate, useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { find, isFunction, isString } from "lodash";
import { ExclamationCircleOutlined, LeftOutlined, SettingOutlined } from "@ant-design/icons";
import { API, detectOSType, isLinuxRich, isMacRich, isWeb, MicroAppContext, useTranslate } from "@applet/common";
import { CalendarOutlined, ExportOutlined } from "@applet/icons";
import { Step } from "@applet/api/lib/content-automation";
import { TaskFormModal } from "./task-form-modal";
import { TaskFormDrawer } from "./task-form-drawer";
import { useHandleErrReq } from "../../utils/hooks";
import { TaskInfoContext, TaskStatus } from "../../pages/editor-panel";
import { taskTemplates } from "../../extensions/templates";
import styles from "./styles/header-bar.module.less";
const { confirm } = Modal;

/**
 * 客户端类型
 */
export enum ClientType {

    /**
     * Web客户端
     */
    WebPortal = "web_portal",

    /**
     * Windows富客户端
     */
    WindowsRichClient = "windows_rich_client",

    /**
     * Windows富客户端
     */
    MacRichClient = "mac_rich_client",

    /**
     * Linux富客户端
     */
    LinuxRichClient = "linux_rich_client",
}

export const getBackUrl = (taskId: string, from: string, toList = false) => {
    if (from === "") {
        if (toList) {
            return "/nav/list";
        }
        return "/";
    }
    const history = from.split(",");
    if (history.length > 1) {
        return `/details/${taskId}?back=${history.slice(1).join(",")}`;
    } else {
        if (history[0] === "detail") {
            return `/details/${taskId}`;
        } else {
            if (toList) {
                return "/nav/list";
            }
            return atob(history[0]);
        }
    }
};

export const HeaderBar = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const { microWidgetProps, functionId, prefixUrl, userInfo } =
        useContext(MicroAppContext);
    const urlRef = useRef("");

    const { id: taskId = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const enable = useRef(true);
    const {
        mode,
        hasChanges,
        title,
        description = "",
        status = TaskStatus.Normal,
        steps,
        accessors,
        handleDisable,
        handleChanges,
        onUpdate,
        onVerify,
        zoomCenter,
    } = useContext(TaskInfoContext);
    const [params] = useSearchParams();
    const from = params.get("back") || "";
    const templateId = params.get("template");
    const model = params.get("model");
    const local = params.get("local");

    const isManual = !!steps.length && ["@trigger/form", "@trigger/selected-file", "@trigger/selected-folder"].includes(steps[0].operator)

    const back = async () => {
        const clearModel = () => {
            if (model) {
                sessionStorage.removeItem(`automateTemplate-${model}`);
            }
        };
        // 若编辑器内存在未保存内容，则弹窗提示
        if (hasChanges) {
              confirm({
                title: t("unSave.title", "您有编辑内容未保存"),
                icon: <ExclamationCircleOutlined />,
                getContainer: microWidgetProps?.container,
                content: t(
                    "unSave.tips",
                    "返回将导致编辑内容丢失，确定返回吗？"
                ),
                onOk() {
                navigate(getBackUrl(taskId, from));
                clearModel();
                },
                onCancel() {
                clearModel();
                },
            });
            // const res = await microWidgetProps?.components?.messageBox({
            //     type: "info",
            //     title: t("unSave.title", "您有编辑内容未保存"),
            //     message: t(
            //         "unSave.tips",
            //         "返回将导致编辑内容丢失，确定返回吗？"
            //     ),
            //     buttons: [
            //         { label: t("ok", "确定"), type: "primary" },
            //         { label: t("cancel", "取消"), type: "normal" },
            //     ],
            // });
            // if (res?.button === 0) {
            //     navigate(getBackUrl(taskId, from));
            //     clearModel();
            // }
        } else if (from) {
            navigate(getBackUrl(taskId, from));
            clearModel();
        } else {
            navigate(`/`);
            clearModel();
        }
    };

    const handleSave = async () => {
        // 编辑时判断每个操作块输入是否正确
        if (isFunction(onVerify)) {
            const isValid = await onVerify();
            if (!isValid) {
                if (mode === "edit") {
                    microWidgetProps?.components?.toast.error(
                        t("save.fail", "保存失败")
                    );
                }
                return;
            }
        }
        if (steps.length === 1) {
            microWidgetProps?.components?.messageBox({
                type: "info",
                title: t("err.title.save", "无法保存自动任务"),
                message: t(
                    "err.invalidParameter.onlyOne",
                    "一个自动任务至少需包含一个执行节点"
                ),
                okText: t("ok", "确定"),
            });
            return;
        }
        // 编辑任务
        if (taskId) {
            if (!enable.current) {
                return;
            }
            // 其他节点改成表单时还需配置 适用范围
            if (isManual && !accessors.length) {
                setIsDrawerVisible(true);
                return;
            }
            enable.current = false;
            try {
                await API.automation.dagDagIdPut(taskId, {
                    title,
                    description,
                    status,
                    steps,
                    accessors: isManual ? accessors : [],
                });
                handleChanges && handleChanges(false);
                microWidgetProps?.components?.toast.success(
                    t("save.success", "保存成功")
                );
                navigate(getBackUrl(taskId, from));
            } catch (error: any) {
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.DuplicatedName"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.save", "无法保存自动任务"),
                        message: t("err.duplicatedName", "已存在同名任务。"),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.InvalidParameter"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.save", "无法保存自动任务"),
                        message: t("err.invalidParameter", "请检查参数。"),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    handleDisable && handleDisable();
                    return;
                }
                handleErr({ error: error?.response });
            } finally {
                enable.current = true;
            }
        } else {
            // 首次保存时，判断每个动作不为空且输入合法，弹出[保存任务设置]窗口
            setIsModalVisible(true);
        }
    };

    const handleEdit = () => {
        setIsDrawerVisible(true);
    };

    const handleExport = () => {
        let data = JSON.stringify({ title, description, steps, status });
        // 替换掉steps中审核节点的workflow信息
        data = data.replace(/"Process_[a-zA-Z0-9]{8}"/g, "null")
        const file = new Blob([data], { type: "application/json" });
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
        }
        urlRef.current = URL.createObjectURL(file);

        try {
            if (
                microWidgetProps?.config?.systemInfo.isInElectronTab ||
                microWidgetProps?.config?.systemInfo.platform === "electron"
            ) {
                // 富客户端iframe中调用插件方法下载文件
                (microWidgetProps?.contextMenu as any)?.downloadWithUrl({
                    functionid: functionId,
                    url: urlRef.current,
                    downloadName: title + ".json",
                });
            } else if (
                "msSaveOrOpenBlob" in navigator &&
                typeof (window.navigator as any).msSaveOrOpenBlob === "function"
            ) {
                (window.navigator as any).msSaveOrOpenBlob(
                    file,
                    title + ".json"
                );
            } else {
                microWidgetProps?.components?.toast.info(
                    t("export.waiting", "正在导出…")
                );
                const link = document.createElement("a");
                link.href = urlRef.current;
                link.style.display = "none";
                link.target = "_blank";
                link.download = title + ".json";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        // 新建任务时获取建议名称
        const getSuggestName = async (templateName?: string) => {
            try {
                let defaultName = t("suggestName", "未命名自动任务");
                if (isString(templateName) && templateName !== "") {
                    defaultName = t(templateName);
                }
                const {
                    data: { name },
                } = await API.automation.dagSuggestnameNameGet(defaultName);
                onUpdate && onUpdate({ type: "title", title: name });
                handleChanges && handleChanges(false);
            } catch (error: any) {
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    handleDisable && handleDisable();
                    return;
                }
                // 错误处理
                onUpdate &&
                    onUpdate({
                        type: "title",
                        title: t("suggestName", "未命名自动任务"),
                    });
                handleChanges && handleChanges(false);
                handleErr({ error: error?.response });
            }
        };

        if (mode === "new") {
            if (templateId) {
                // 获取模板信息
                const item = find(
                    taskTemplates,
                    (o) => o.template.templateId === templateId
                );
                getSuggestName(item?.template.title);
                if (onUpdate && item?.template.steps) {
                    onUpdate({
                        type: "steps",
                        steps: item.template.steps as Step[],
                    });
                }
            } else if (model) {
                try {
                    let jsonText =
                        sessionStorage.getItem(`automateTemplate-${model}`) ||
                        "";
                    // 替换掉steps中审核节点的workflow信息
                    jsonText = jsonText.replace(/"Process_[a-zA-Z0-9]{8}"/g, "null")
                    const config = JSON.parse(jsonText);
                    getSuggestName(config?.title);
                    if (onUpdate && config?.steps) {
                        onUpdate({
                            type: "steps",
                            steps: config.steps as Step[],
                        });
                        onUpdate({
                            type: "description",
                            title: config?.description || "",
                        });
                        onUpdate({
                            type: "status",
                            title: config?.status || TaskStatus.Normal,
                        });
                    }
                } catch (error) {
                    getSuggestName();
                }
            } else {
                getSuggestName();
            }
        }
        return () => {
            URL.revokeObjectURL(urlRef.current);
        };
    }, []);

    useEffect(() => {
        if (mode === "new" && zoomCenter) {
            zoomCenter({
                delay: 0,
                scale: false,
                left: "center",
                top: "content-start",
            });
        }
    }, [isFunction(zoomCenter)]);

    useEffect(() => {
        if (mode === "new" && (templateId || model) && onVerify) {
            setTimeout(async () => {
                await onVerify();
            }, 500);
        }
    }, [isFunction(onVerify)]);

    useEffect(() => {
        const report = async () => {
            const microProps = microWidgetProps as any
            try {
                let create_type = "直接新建";
                if (templateId) {
                    create_type = "从流程模板新建";
                } else if (model && local) {
                    create_type = "从本地导入";
                }

                await API.axios.post(
                    `${prefixUrl}/api/audit-log/v1/operation-log/content_automation`,
                    {
                        recorder: "Anyshare",
                        operation: "use_create",
                        description: `用户"${userInfo?.name || "---"}" 访问新建流程界面`,
                        operator: {
                            id: userInfo?.userid,
                            name: userInfo?.name,
                            type: 'authenticated_user',
                            department_path: [],
                            agent: {
                                type: isWeb(microProps)
                                    ? ClientType.WebPortal
                                    : isMacRich(microProps)
                                        ? ClientType.MacRichClient
                                        : isLinuxRich(microProps)
                                            ? ClientType.LinuxRichClient
                                            : ClientType.WindowsRichClient,
                                os_type: detectOSType(navigator?.userAgent || ''),
                                app_type: isWeb(microProps)
                                    ? 'web'
                                    : 'rich_client'
                            }
                        },
                        detail: {
                            create_type,
                            event_user: {
                                userid: userInfo?.userid || "---",
                                username: userInfo?.name || "---",
                            }
                        },
                    }
                );
            } catch (error) {
                console.error(error);
            }
        };
        if (!taskId && userInfo?.userid) {
            report();
        }
    }, [userInfo?.userid]);

    return (
        <>
            <PageHeader
                title={
                    <Typography.Text
                        ellipsis
                        title={title}
                        className={styles["title"]}
                    >
                        {title}
                    </Typography.Text>
                }
                className={styles["header"]}
                backIcon={
                    <LeftOutlined
                        className={styles["back-icon"]}
                        title={
                            from.split(",")[0] === "details"
                                ? t("task.back.detail", "返回任务详情")
                                : t("task.back", "返回任务列表")
                        }
                    />
                }
                onBack={back}
                extra={[
                    mode === "edit" ? (
                        <>
                            <Button
                                key="3"
                                type="link"
                                title={t("header.details", "任务详情")}
                                className={styles["link-btn"]}
                                icon={
                                    <CalendarOutlined
                                        className={styles["btn-icon"]}
                                    />
                                }
                                onClick={() => {
                                    navigate(
                                        `/details/${taskId}?back=${[
                                            "edit",
                                            ...from.split(","),
                                        ]
                                            .filter(Boolean)
                                            .join(",")}`
                                    );
                                }}
                            />
                            <Button
                                key="2"
                                type="link"
                                title={t("header.setting", "任务设置")}
                                className={styles["link-btn"]}
                                icon={
                                    <SettingOutlined
                                        className={styles["btn-icon"]}
                                    />
                                }
                                onClick={handleEdit}
                            />
                            <Button
                                key="4"
                                type="link"
                                title={t("header.export", "任务导出")}
                                className={styles["link-btn"]}
                                icon={
                                    <ExportOutlined
                                        className={styles["btn-icon"]}
                                    />
                                }
                                onClick={handleExport}
                            />
                        </>
                    ) : null,
                    <Button
                        key="1"
                        type="primary"
                        className={clsx(
                            styles["primary-btn"],
                            "automate-oem-primary-btn"
                        )}
                        onClick={handleSave}
                    >
                        {t("task.save", "保存")}
                    </Button>,
                ]}
            />
            {isModalVisible && (
                <TaskFormModal
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                />
            )}
            {isDrawerVisible && (
                <TaskFormDrawer
                    steps={steps}
                    visible={isDrawerVisible}
                    onClose={() => setIsDrawerVisible(false)}
                />
            )}
        </>
    );
};
