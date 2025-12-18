import { SwitcherOutlined } from "@ant-design/icons";
import { DagDetail } from "@applet/api/lib/content-automation";
import { API, MicroAppContext, useEvent, useTranslate } from "@applet/common";
import { DeleteOutlined, FormOutlined, OperationOutlined, PlayOutlined, PreviewOutlined } from "@applet/icons";
import { Button, Card, Dropdown, List, Menu, Space, Spin, Typography } from "antd";
import clsx from "clsx";
import { differenceBy, reject } from "lodash";
import { forwardRef, useContext, useImperativeHandle, useLayoutEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import useSWR from "swr";
import { useHandleErrReq } from "../../utils/hooks";
import { IDocItem } from "../as-file-preview";
import { IStep } from "../editor/expr";
import { TriggerAction } from "../extension";
import { useTrigger } from "../extension-provider";
import { DagEditor } from "./dag-editor";
import styles from "./related-dag.module.less";

type DagStatus = "normal" | "stopped";

export interface Dag {
  actions: string[];
  creator: string;
  id: string;
  status: DagStatus;
  title: string;
  created_at: number;
  updated_at: number;
  trigger_step?: IStep;
  is_owner?: boolean;
}

interface DagListResponseData {
  dags: Dag[];
  limit: number;
  page: number;
  total: number;
}

interface DagCardProps {
  doc: IDocItem;
  dag: Dag;
  onRun(dagId: string): void;
  onToggleStatus(dag: Dag): void;
  onEdit(dag: Dag): void;
  onRemove(dag: Dag): void;
}

function DagIcon({ action }: { action: TriggerAction }) {
  return <img crossOrigin="anonymous" className={styles.DagIcon} src={action.icon} />;
}

const DagCardDropdownTrigger = ["click" as const];

function DagCard(props: DagCardProps) {
  const { microWidgetProps } = useContext(MicroAppContext);
  const { dag, doc } = props;
  const t = useTranslate();

  const [action] = useTrigger(dag.actions[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const primaryAction = useMemo(() => {
    if (dag.status === "stopped") {
      return (
        <span className={styles.DagStatus} data-status={dag.status}>
          {t("task.status.stopped", "已停用")}
        </span>
      );
    }

    let canRun = action?.operator === "@trigger/manual";

    if (dag.trigger_step?.parameters && (action?.operator === "@trigger/selected-file" || action?.operator === "@trigger/selected-folder")) {
      let { docid, docids, inherit } = dag.trigger_step.parameters;
      const ids: string[] = [docids, docid].flat().filter(Boolean);

      const parent = doc.docid.slice(0, -33);

      if (!inherit) {
        canRun = ids.some((id) => id === parent);
      } else {
        canRun = ids.some((id) => parent.startsWith?.(id));
      }

      canRun = canRun || doc.size === -1 && ids.some(id => id === doc.docid)
    }

    if (canRun) {
      return (
        <Button
          className={styles.DagCardButton}
          type="text"
          title={t("run", "运行")}
          icon={<PlayOutlined />}
          onClick={() => {
            props.onRun(dag.id);
          }}
        />
      );
    }

    return (
      <span className={styles.DagStatus} data-status={dag.status}>
        {t("task.status.normal", "已启用")}
      </span>
    );
  }, [dag, t]);

  const handleMenuClick = useEvent((e: { key: string }) => {
    switch (e.key) {
      case "status":
        props.onToggleStatus(dag);
        break;
      case "edit":
        props.onEdit(dag);
        break;
      case "delete":
        props.onRemove(dag);
        break;
      case "reveal":
        microWidgetProps.history?.navigateToMicroWidget({
          command: "content-automation",
          path: `/details/${dag.id}`,
          isClose: false,
          isNewTab: true,
          isForceNewTab: true,
        });
        break;
    }

    setDropdownOpen(false);
  });

  return (
    <Card
      className={clsx(styles.DagCard, dropdownOpen && styles.DropdownOpen)}
      onClick={(e) => {
        if (e.defaultPrevented || !dag.is_owner) {
          return;
        }
        props.onEdit(dag);
      }}
    >
      {action && <DagIcon action={action} />}
      <Typography.Text className={styles.DagCardTitle} ellipsis title={dag.title}>
        {dag.title}
      </Typography.Text>
      <Space onClick={(e) => e.preventDefault()}>
        {primaryAction}
        {dag.is_owner ? (
          <Dropdown
            open={dropdownOpen}
            overlay={() => {
              return (
                <Menu className={styles.DagMenu} onClick={handleMenuClick}>
                  <Menu.Item key="status" icon={<SwitcherOutlined style={{ fontSize: "16px" }} />}>
                    {dag.status === "normal" ? t("disable", "禁用") : t("enable", "启用")}
                  </Menu.Item>
                  <Menu.Item key="edit" icon={<FormOutlined style={{ fontSize: "16px" }} />}>
                    {t("edit", "编辑")}
                  </Menu.Item>
                  <Menu.Item key="delete" icon={<DeleteOutlined style={{ fontSize: "16px" }} />}>
                    {t("delete", "删除")}
                  </Menu.Item>
                  <Menu.Item key="reveal" icon={<PreviewOutlined style={{ fontSize: "16px" }} />}>
                    {t("reveal", "在工作中心显示")}
                  </Menu.Item>
                </Menu>
              );
            }}
            transitionName=""
            trigger={DagCardDropdownTrigger}
            onOpenChange={setDropdownOpen}
          >
            <Button icon={<OperationOutlined />} type="text" className={styles.DagCardButton}></Button>
          </Dropdown>
        ) : null}
      </Space>
    </Card>
  );
}

export interface RelatedDagListProps {
  containerId: string;
  doc: IDocItem;
  onRun(dagId: string): void;
}

export interface RelatedDagListRef {
  reload(): void;
}

export const RelatedDagList = forwardRef<RelatedDagListRef, RelatedDagListProps>(({ doc, containerId, onRun }, ref) => {
  const { microWidgetProps, modal } = useContext(MicroAppContext);
  const t = useTranslate();
  const [dags, setDags] = useState<Dag[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentDag, setCurrentDag] = useState<DagDetail>();
  const handleErr = useHandleErrReq();

  useLayoutEffect(() => {
    setPage(0);
  }, [doc.docid]);

  const { error, mutate } = useSWR<DagListResponseData>(
    [`/api/automation/v1/related-dags`, doc.docid, page],
    async (url, docid) => {
      if (!docid) {
        return { dags: [], limit, page: 0, total: 0 };
      }

      const { data } = await API.axios.get<DagListResponseData>(url, {
        params: {
          docid,
          page,
        },
      });

      return data;
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      dedupingInterval: 0,
      onSuccess(data) {
        setLoading(false);

        if (data.limit === -1) {
          setHasMore(false);
        } else {
          setHasMore(data.limit * (data.page + 1) < data.total);
        }

        if (page === 0) {
          setDags(data.dags);
        } else {
          setDags((dags) => [...dags, ...differenceBy(data.dags, dags, "id")]);
        }
      },
      onError(error) {
        setLoading(false);
        setHasMore(false);
      },
    }
  );

  const toggleDagStatus = useEvent(async (dag: Dag) => {
    try {
      const nextStatus = dag.status === "normal" ? "stopped" : "normal";
      await API.automation.dagDagIdPut(dag.id, { status: nextStatus });
      setDags((dags) =>
        dags.map((item) => {
          if (dag.id === item.id) {
            return { ...item, status: nextStatus };
          }
          return item;
        })
      );
    } catch (e) {
      if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
        microWidgetProps?.components?.messageBox({
          type: "info",
          title: t("err.title", "无法完成操作"),
          message: t("err.task.notFound", "该任务已不存在。"),
          okText: t("ok", "确定"),
          onOk: () => {
            setDags((dags) => reject(dags, ["id", dag.id]));
          },
        });
        return;
      }
      handleErr({ error: error?.response });
    }
  });

  const removeDag = useEvent(async (dag: Dag) => {
    try {
      modal.confirm({
        title: t("deleteTitle", "确认删除"),
        content: <div>{t("task.delete.extra", "删除后任务将无法恢复")}</div>,
        maskClosable: false,
        width: 420,
        transitionName: "",
        okText: t("ok", "确定"),
        cancelText: t("cancel", "取消"),
        async onOk() {
          try {
            await API.automation.dagDagIdDelete(dag.id);
            setDags((dags) => reject(dags, ["id", dag.id]));
          } catch (e) {
            if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
              setDags((dags) => reject(dags, ["id", dag.id]));
              return;
            }
            handleErr({ error: error?.response });
          }
        },
      });
    } catch (e) { }
  });

  const editDag = useEvent(async (dag: Dag) => {
    const { data } = await API.automation.dagDagIdGet(dag.id);
    setCurrentDag(data);
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        reload() {
          mutate();
        },
      };
    },
    [mutate]
  );

  return (
    <>
      <InfiniteScroll
        dataLength={dags.length}
        next={() => {
          setPage((page) => page + 1);
        }}
        hasMore={hasMore}
        loader={
          loading ? null : (
            <div className={styles.SpinContainer}>
              <Spin />
            </div>
          )
        }
        scrollableTarget={containerId}
      >
        <List
          className={styles.DagList}
          dataSource={dags}
          rowKey={(item) => item.id}
          locale={{
            emptyText: null,
          }}
          renderItem={(item) => (
            <List.Item className={styles.DagListItem}>
              <DagCard dag={item} doc={doc} onEdit={editDag} onRemove={removeDag} onRun={onRun} onToggleStatus={toggleDagStatus} />
            </List.Item>
          )}
          bordered={false}
        />
      </InfiniteScroll>
      <DagEditor
        dag={currentDag}
        onClose={() => setCurrentDag(undefined)}
        onFinish={() => {
          setCurrentDag(undefined);
          mutate();
        }}
        onRun={onRun}
      />
    </>
  );
});
