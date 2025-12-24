import { FC, useContext, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Dropdown, Layout, Menu, PageHeader, Spin } from "antd";
import clsx from "clsx";
import useSWR from "swr";
import { LeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { LogCard } from "../log-card";
import { Empty, getLoadStatus } from "../table-empty";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./log-panel.module.less";
import { createPortal } from "react-dom";
import { Virtuoso as DynamicList } from "react-virtuoso";

export enum ExpandStatus {
  ExpandAll = "expandAll",
  CollapseAll = "collapseAll",
  Neither = "neither",
}

interface ILogPanel {
  taskId: string;
  recordId: string;
  onClose: () => void;
}

export const LogPanel: FC<ILogPanel> = ({
  taskId,
  recordId,
  onClose,
}: ILogPanel) => {
  const [expandStatus, setExpandStatus] = useState<ExpandStatus>(
    ExpandStatus.ExpandAll
  );
  // 新增分页和虚拟滚动相关状态
  const [page, setPage] = useState(0);
  const limit = 10;
  const [logs, setLogs] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const t = useTranslate();
  const navigate = useNavigate();
  const { microWidgetProps } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();
  const { prefixUrl } = useContext(MicroAppContext);

  // 获取运行日志
  const { data, error, mutate } = useSWR(
    [
      `/dag/${taskId}/result/${recordId}?page=${page}&limit=${limit}`,
      recordId,
      page,
    ],
    () => {
      return API.axios.get(
        `${prefixUrl}/api/automation/v2/dag/${taskId}/result/${recordId}?page=${page}&limit=${limit}`
      );
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      refreshInterval: 0, // 关闭自动轮询，改为滚动加载
      onSuccess: (newData) => {
        const results = newData?.data?.results;
        if (!results) return;

        if (page === 0) {
          setLogs(results);
        } else {
          setLogs((prev) => [...prev, ...results]);
        }

        setHasMore(results?.length >= limit);
        setLoadingMore(false);
      },
      onError(error) {
        setLoadingMore(false);
        // 任务不存在
        if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
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
          error?.response?.data?.code === "ContentAutomation.DagInsNotFound"
        ) {
          microWidgetProps?.components?.messageBox({
            type: "info",
            title: t("err.title", "无法完成操作"),
            message: t("err.log.notFound", "该运行记录已不存在。"),
            okText: t("task.back.detail", "返回任务详情"),
            onOk: onClose,
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

  // 新增加载更多函数
  const loadMore = () => {
    if (hasMore && !loadingMore && !error) {
      setLoadingMore(true);
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleMenuClick = (e: any) => {
    const { key = "expandAll" } = e;
    if (key === ExpandStatus.ExpandAll) {
      setExpandStatus(ExpandStatus.ExpandAll);
    } else {
      setExpandStatus(ExpandStatus.CollapseAll);
    }
  };

  return createPortal(
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
        onBack={onClose}
      />
      <Button
        className={styles["log-refresh"]}
        onClick={() => {
          setLogs([]);
          setPage(0);
          mutate();
        }}
        icon={<ReloadOutlined />}
      >
        {t("log.refresh", "刷新")}
      </Button>
      <Dropdown
        overlay={
          logs.length ? (
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
            [styles["empty"]]: !logs.length,
          })}
        >
          {logs.length ? (
            <DynamicList
              data={logs}
              height="100%"
              itemContent={(index, item) => (
                <div className={styles["log-virtuoso-list"]}>
                  <LogCard
                    log={item}
                    key={item.id}
                    expandStatus={expandStatus}
                    onExpandStatusChange={() =>
                      setExpandStatus(ExpandStatus.Neither)
                    }
                  />
                </div>
              )}
              endReached={loadMore}
            />
          ) : data ? (
            <Empty
              loadStatus={getLoadStatus({
                isLoading: false,
                error,
                data: logs,
              })}
              height={0}
              emptyText={t("log.empty", "日志为空")}
            />
          ) : (
            <Spin />
          )}
        </Layout.Content>
      </Dropdown>
    </Layout>,
    document.getElementById("content-automation-root") || document.body
  );
};
