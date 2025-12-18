import { FC, useContext, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Dropdown, Layout, Menu, PageHeader, Spin } from "antd";
import clsx from "clsx";
import useSWR from "swr";
import { LeftOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { LogCard } from "../../components/log-card";
import { Empty, getLoadStatus } from "../../components/table-empty";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./log-panel.module.less";
import { useSearchParams } from "react-router-dom";

export enum ExpandStatus {
    ExpandAll = "expandAll",
    CollapseAll = "collapseAll",
    Neither = "neither",
}

export const LogPanel: FC = () => {
    const [expandStatus, setExpandStatus] = useState<ExpandStatus>(
        ExpandStatus.ExpandAll
    );
    const t = useTranslate();
    const navigate = useNavigate();
    const { microWidgetProps } = useContext(MicroAppContext);
    const { id: taskId = "", recordId = "" } = useParams();
    const handleErr = useHandleErrReq();
    const intervalRef = useRef(5000);
    const [params] = useSearchParams();
    const from = params.get("back") || "";

    // 获取运行日志
    const { data, isValidating, error } = useSWR(
        [`/dag/${taskId}/result/${recordId}`, recordId],
        () => {
            return API.automation.dagDagIdResultResultIdGet(taskId, recordId);
        },
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            refreshInterval: intervalRef.current,
            onSuccess: (data) => {
                // 最后一个节点执行完或某节点执行失败后停止轮询
                if (data?.data?.length) {
                    const logs = data.data;
                    if (logs[logs.length - 1].status !== "undo") {
                        intervalRef.current = 0;
                        return;
                    }

                    for (let i = 0; i < logs.length; i++) {
                        if (logs[i].status === "failed") {
                            intervalRef.current = 0;
                            break;
                        }
                    }
                }
            },
            onError(error) {
                intervalRef.current = 0;
                // 任务不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t("err.task.notFound", "该任务已不存在。"),
                        okText: t("task.back", "返回任务列表"),
                        onOk: () => navigate("/nav/list"),
                    });
                    return;
                }
                // 任务实例不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.DagInsNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t("err.log.notFound", "该运行记录已不存在。"),
                        okText: t("task.back.detail", "返回任务详情"),
                        onOk: () =>
                            navigate(
                                `/details/${taskId}${
                                    from ? "?back=" + from : ""
                                }`
                            ),
                    });
                    return;
                }
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    navigate("/disable");
                    return;
                }
                handleErr({ error: error?.response });
            },
        }
    );

    const handleMenuClick = (e: any) => {
        const { key = "expandAll" } = e;
        if (key === ExpandStatus.ExpandAll) {
            setExpandStatus(ExpandStatus.ExpandAll);
        } else {
            setExpandStatus(ExpandStatus.CollapseAll);
        }
    };

    return (
        <Layout className={styles["log-container"]}>
            <PageHeader
                title={t("log.title", "单次运行日志")}
                className={styles["header"]}
                backIcon={
                    <LeftOutlined
                        className={styles["back-icon"]}
                        title={t("task.back.detail", "返回任务详情")}
                    />
                }
                onBack={() => {
                    navigate(
                        `/details/${taskId}${from ? "?back=" + from : ""}`
                    );
                }}
            />
            <Dropdown
                overlay={
                    data?.data?.length ? (
                        <Menu onClick={(e) => handleMenuClick(e)}>
                            <Menu.Item key={ExpandStatus.CollapseAll}>
                                {t("collapseAll", "全部折叠")}
                            </Menu.Item>
                            <Menu.Item key={ExpandStatus.ExpandAll}>
                                {t("expandAll", "全部展开")}
                            </Menu.Item>
                        </Menu>
                    ) : (
                        <></>
                    )
                }
                trigger={["contextMenu"]}
                overlayClassName={styles["log-drop-menu"]}
            >
                <Layout.Content
                    className={clsx(styles["content"], {
                        [styles["empty"]]: !data?.data?.length,
                    })}
                >
                    {data?.data?.length ? (
                        data.data.map((item) => (
                            <LogCard
                                log={item}
                                key={item.id}
                                expandStatus={expandStatus}
                                onExpandStatusChange={() =>
                                    setExpandStatus(ExpandStatus.Neither)
                                }
                            />
                        ))
                    ) : isValidating ? (
                        <Spin />
                    ) : (
                        <Empty
                            loadStatus={getLoadStatus({
                                isLoading: isValidating,
                                error,
                                data: data?.data,
                            })}
                            height={0}
                            emptyText={t("log.empty", "日志为空")}
                        />
                    )}
                </Layout.Content>
            </Dropdown>
        </Layout>
    );
};
