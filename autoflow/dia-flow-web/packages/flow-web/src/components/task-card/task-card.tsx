import { useContext, useMemo, useRef, useState } from "react";
import moment from "moment";
import {
    Button,
    Card as AntCard,
    Dropdown,
    Menu,
    Switch,
    Typography,
    message,
} from "antd";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router";
import { isString } from "lodash";
import {
    AutomationFolderColored,
    AutomationBranchesColored,
    AutomationMoreColored,
    OperationOutlined,
    FormOutlined,
    PreviewOutlined,
    DeleteOutlined,
} from "@applet/icons";
import useSize from "@react-hook/size";
import { PlaySquareOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslate, API, MicroAppContext } from "@applet/common";
import { DeleteModal } from "../delete-task-modal";
import styles from "./task-card.module.less";
import { useHandleErrReq } from "../../utils/hooks";
import { useFormTriggerModal } from "./use-form-trigger-modal";
import { ExtensionContext } from "../extension-provider";
import { IntelliinfoTransfer } from "../../extensions/datastudio/graph-database";
import DataBaseSVG from "../../extensions/datastudio/assets/database.svg";

export interface ITask {
    id: string;
    title: string;
    updated_at: number;
    status: string;
    actions: string[];
    creator: string;
    userid: string;
}

interface CardProps {
    task: ITask;
    onChange: (id: string, type: string, value?: string) => void;
    refresh: () => void;
    isShare?: boolean;
}

/**
 * @param 节点信息
 * @returns 节点图标
 */
export const BoxImg = ({ item }: { item: string }) => {
    const { triggers, executors } = useContext(ExtensionContext);

    let operator = item;
    if (!isString(operator)) {
        operator = String(operator);
    }
    switch (true) {
        // 分支
        case item.indexOf("branches") > -1:
            return <AutomationBranchesColored className={styles["box-img"]} />;
        // 其他类型节点
        default: {
            if (executors[item] && executors[item][0]?.icon) {
                return (
                    <img
                        src={executors[item][0].icon}
                        className={styles["box-img"]}
                        alt=""
                    />
                );
            }
            if (triggers[item] && triggers[item][0]?.icon) {
                return (
                    <img
                        src={triggers[item][0].icon}
                        className={styles["box-img"]}
                        alt=""
                    />
                );
            }

            return <AutomationFolderColored className={styles["box-img"]} />;
        }
    }
};

/**
 * @param 任务节点信息 模板actions
 * @returns 可显示的节点图标内容
 */
export const getContent = (content: string[], width: number) => {
    // 全部显示
    if ((width + 36) / 72 > content?.length) {
        return content.map((item: string, key: number) => {
            if (key < content.length - 1) {
                return (
                    <>
                        <div className={styles["card-content-box"]}>
                            <BoxImg item={item} />
                        </div>
                        <div className={styles["card-content-arrow"]}>
                            <RightOutlined className={styles["arrow-img"]} />
                        </div>
                    </>
                );
            } else {
                return (
                    <div className={styles["card-content-box"]}>
                        <BoxImg item={item} />
                    </div>
                );
            }
        });
    } else {
        // 加载更多显示图标
        const length = (width - 36) / 72;
        const contents = content?.slice(0, length).map((item: any) => (
            <>
                <div className={styles["card-content-box"]}>
                    <BoxImg item={item} />
                </div>
                <div className={styles["card-content-arrow"]}>
                    <RightOutlined className={styles["arrow-img"]} />
                </div>
            </>
        ));
        return (
            <>
                {contents}
                <div className={styles["card-content-box"]}>
                    <AutomationMoreColored className={styles["box-img"]} />
                </div>
            </>
        );
    }
};

export const Card = ({
    task,
    onChange,
    refresh,
    isShare = false,
}: CardProps) => {
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const navigate = useNavigate();
    const t = useTranslate();
    const container = useRef<HTMLDivElement>(null);
    const [width] = useSize(container);
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const handleErr = useHandleErrReq();
    const enable = useRef(true);
    const location = useLocation();

    const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
        if (!timestamp) {
            return "";
        }
        return moment(timestamp * 1000).format(format);
    };
    const flowType = useMemo(() => {
        switch (task.actions[0]) {
            case "@trigger/form":
                return t("type.form", "表单");
            case "@trigger/manual":
            case "@trigger/selected-file":
                return t("type.manual", "手动");
            default:
                return t("type.event", "事件");
        }
    }, [t, task.actions]);

    const [getFormTriggerParameters, ModalElement] = useFormTriggerModal();

    // 运行任务
    const handleRun = async (task: ITask) => {
        if (task.status === "normal") {
            if (!enable.current) {
                return;
            }
            enable.current = false;
            // 任务状态处于【启用中】可手动运行任务

            try {
                if (task.actions[0] === "@trigger/form") {
                    const {
                        data: { steps },
                        data,
                    } = await API.automation.dagDagIdGet(task.id);

                    if (
                        steps[0].parameters &&
                        Array.isArray((steps[0].parameters as any).fields)
                    ) {
                        const parameters = await getFormTriggerParameters(
                            (steps[0].parameters as any).fields,
                            data.title
                        );

                        await API.axios.post(
                            `${prefixUrl}/api/automation/v1/run-instance-form/${task.id}`,
                            {
                                data: parameters,
                            }
                        );
                    }
                } else {
                    await API.automation.runInstanceDagIdPost(task.id);
                }
                message.success(
                    t("run.success", "任务开始运行")
                );
            } catch (error: any) {
                if (!error) {
                    return;
                }
                // 任务不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.run", "无法运行此任务"),
                        message: t("err.task.notFound", "该任务已不存在。"),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            // 手动变更数据
                            onChange(task.id, "delete");
                        },
                    });
                    return;
                }
                // 触发器文件夹不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskSourceNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.run", "无法运行此任务"),
                        message: t(
                            "err.trigger.notFound",
                            "任务的执行目标已不存在。"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                // 对触发器文件夹没有权限
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskSourceNotPerm"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.run", "无法运行此任务"),
                        message: t(
                            "err.trigger.noPerm",
                            "您对任务的执行目标没有显示权限。"
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                // 任务状态已停用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.DagStatusNotNormal"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.run", "无法运行此任务"),
                        message: t("err.task.notNormal", "该任务已停用。"),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            // 手动变更数据
                            onChange(task.id, "switch", "stopped");
                        },
                    });
                    return;
                }
                // 不是手动任务
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ErrorIncorretTrigger"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title.run", "无法运行此任务"),
                        message: t(
                            "err.task.incorrectTrigger",
                            "该任务不支持手动运行。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => refresh(),
                    });
                    return;
                }
                handleErr({ error: error?.response });
            } finally {
                enable.current = true;
            }
        }
    };

    // 查看操作
    const handleOpen = (id: string) => {
        navigate(`/details/${id}?back=${btoa(location.pathname)}`);
    };

    // 编辑操作
    const handleEdit = (id: string) => {
        navigate(`/edit/${id}?back=${btoa(location.pathname)}`);
    };

    // 开关
    const handleSwitch = async (task: ITask) => {
        try {
            const nextStatus = task.status === "normal" ? "stopped" : "normal";
            // 请求切换启用/停用
            await API.automation.dagDagIdPut(task.id, { status: nextStatus });
            onChange(task.id, "switch", nextStatus);
        } catch (error: any) {
            // 错误提示
            if (
                error?.response?.data?.code === "ContentAutomation.TaskNotFound"
            ) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title", "无法完成操作"),
                    message: t("err.task.notFound", "该任务已不存在。"),
                    okText: t("ok", "确定"),
                    onOk: () => {
                        // 手动变更数据
                        onChange(task.id, "delete");
                    },
                });
                return;
            }
            handleErr({ error: error?.response });
        }
    };

    const handleMenuClick = (e: any, task: ITask) => {
        const { key = "view" } = e;
        switch (key) {
            case "run":
                handleRun(task);
                break;
            case "view":
                handleOpen(task.id);
                break;
            case "edit":
                handleEdit(task.id);
                break;
            default:
                // 删除
                setIsDeleteModalVisible(true);
        }
    };

    // 操作菜单
    const getMenu = (record: any) => {
        const isManual =
            record?.actions.includes("@trigger/manual") ||
            record?.actions.includes("@trigger/form");
        return (
            <Menu onClick={(e) => handleMenuClick(e, record)}>
                {isManual && (
                    <Menu.Item
                        key="run"
                        icon={
                            <PlaySquareOutlined style={{ fontSize: "16px" }} />
                        }
                        // 任务状态处于【启用中】可用
                        className={clsx({
                            [styles["disable"]]: task.status === "stopped",
                        })}
                    >
                        {t("run", "运行")}
                    </Menu.Item>
                )}
                {!isShare && (
                    <>
                        <Menu.Item
                            hidden={isShare}
                            key="view"
                            icon={
                                <PreviewOutlined style={{ fontSize: "16px" }} />
                            }
                        >
                            {t("view", "查看")}
                        </Menu.Item>
                        <Menu.Item
                            hidden={isShare}
                            key="edit"
                            icon={<FormOutlined style={{ fontSize: "16px" }} />}
                        >
                            {t("edit", "编辑")}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            hidden={isShare}
                            key="delete"
                            icon={
                                <DeleteOutlined style={{ fontSize: "16px" }} />
                            }
                        >
                            {t("delete", "删除")}
                        </Menu.Item>
                    </>
                )}
            </Menu>
        );
    };

    const handleDeleteSuccess = async () => {
        setIsDeleteModalVisible(false);
        // 手动变更数据
        onChange(task.id, "delete");
    };

    return (
        <>
            <AntCard
                className={styles["card"]}
                onClick={() => {
                    if (!isShare) {
                        handleOpen(task.id);
                    }
                }}
            >
                <div className={styles["tag"]}>{flowType}</div>
                <div className={styles["card-header"]}>
                    <Typography.Text
                        ellipsis
                        className={styles["header-title"]}
                        title={task.title}
                    >
                        {task.title}
                    </Typography.Text>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Dropdown
                            overlay={getMenu(task)}
                            trigger={["click"]}
                            transitionName=""
                            overlayClassName={styles["card-drop-menu"]}
                        >
                            <Button
                                className={styles["card-operation-btn"]}
                                type="text"
                            >
                                <OperationOutlined
                                    style={{ fontSize: "16px" }}
                                />
                            </Button>
                        </Dropdown>
                    </div>
                </div>
                <div className={styles["card-content"]} ref={container}>
                    {getContent(task.actions, width)}
                </div>
                <div className={styles["card-footer"]}>
                    <div
                        className={styles["card-time"]}
                        title={formatTime(task.updated_at)}
                    >
                        {formatTime(task.updated_at)}
                    </div>
                    {!isShare
                        ? (
                            <div className={styles["card-btn-wrapper"]}>
                                {task.status === "normal" ? (
                                    <span className={styles["running"]}>
                                        {t("task.status.normal", "启用中")}
                                    </span>
                                ) : (
                                    <span className={styles["stop"]}>
                                        {t("task.status.stopped", "已停用")}
                                    </span>
                                )}
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Switch
                                        size="small"
                                        checked={task.status === "normal"}
                                        style={{
                                            pointerEvents: isShare
                                                ? "none"
                                                : "auto",
                                        }}
                                        onChange={() => {
                                            if (!isShare) {
                                                handleSwitch(task);
                                            }
                                        }}
                                    />
                                </span>
                            </div>
                        )
                        : (
                            <div
                                className={styles["card-time"]}
                                title={t("task.assignee", "分配者") + task.creator}
                            >
                                {t("task.assignee", "分配者") + task.creator}
                            </div>
                        )
                    }
                </div>
            </AntCard>
            {/* 删除弹窗 */}
            {isDeleteModalVisible && (
                <DeleteModal
                    isModalVisible={isDeleteModalVisible}
                    onDeleteSuccess={handleDeleteSuccess}
                    onCancel={() => setIsDeleteModalVisible(false)}
                    taskId={task.id}
                />
            )}
            {ModalElement}
        </>
    );
};
