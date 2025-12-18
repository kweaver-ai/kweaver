import { FC } from "react";
import { useNavigate, useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Layout, PageHeader } from "antd";
import useSWR from "swr";
import { LeftOutlined } from "@ant-design/icons";
import { API, useTranslate } from "@applet/common";
import { TaskInfo } from "../../components/task-info";
import { TaskStat } from "../../components/task-stat";
import styles from "./task-panel.module.less";

const getBackUrl = (taskId: string, from: string) => {
  const history = from.split(",");
  if (history.length > 1) {
    return `/edit/${taskId}?back=${history.slice(1).join(",")}`;
  } else {
    if (history[0] === "edit") {
      return `/edit/${taskId}`;
    } else {
      return atob(history[0]);
    }
  }
};

export const TaskPanel: FC = () => {
  const navigate = useNavigate();
  const t = useTranslate();
  const { id: taskId = "" } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const from = params.get("back") || "";

  // 获取任务详情
  const { data } = useSWR(
    [`/dags/${taskId}`],
    () => {
      return API.automation.dagDagIdGet(taskId);
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  const back = () => {
    if (from && from !== "null") {
      navigate(getBackUrl(taskId, from));
    } else {
      navigate("/");
    }
  };

  return (
    <Layout className={styles["container"]}>
      <PageHeader
        title={
          <div title={data?.data.title} className={styles["title"]}>
            {data?.data.title || " "}
          </div>
        }
        className={styles["header"]}
        backIcon={
          <LeftOutlined
            className={styles["back-icon"]}
            title={
              from.split(",")[0] === "edit"
                ? t("task.back.edit", "返回任务设置")
                : t("task.back", "返回任务列表")
            }
          />
        }
        onBack={back}
      />

      <Layout.Content className={styles["content"]}>
        <TaskInfo taskInfo={data?.data} />
        <TaskStat
          handleDisable={() => {
            navigate("/disable");
          }}
        />
      </Layout.Content>
    </Layout>
  );
};
