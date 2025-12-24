import { Card, Table, Tooltip } from "antd";
import styles from "./index.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { formatNumber } from "../../utils/format-number";
import { memo, useContext, useEffect, useState } from "react";
import { API, MicroAppContext } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";

export const OverviewRunning = memo(({ trigger,random }: any) => {
  const columns = [
    {
      title: "管道名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "总运行次数",
      dataIndex: "status_summary",
      key: "total",
      render: (status_summary: any) => formatNumber(status_summary?.total),
    },
    {
      title: "成功率",
      dataIndex: "metric",
      key: "success_rate",
      render: (metric: any) => `${metric?.success_rate}%`,
    },
    {
      title: "成功次数",
      dataIndex: "status_summary",
      key: "success",
      render: (status_summary: any) => formatNumber(status_summary?.success),
    },
    {
      title: "运行中次数",
      dataIndex: "status_summary",
      key: "running",
      render: (status_summary: any) => formatNumber(status_summary?.running),
    },
    {
      title: "失败次数",
      dataIndex: "status_summary",
      key: "failed",
      render: (status_summary: any) => formatNumber(status_summary?.failed),
    },
    {
      title: "平均耗时",
      dataIndex: "metric",
      key: "avg_run_duration",
      render: (metric: any) => `${metric?.avg_run_duration}s`,
    },
    {
      title: "创建人",
      dataIndex: "creator",
      key: "creator",
    },
  ];
  const [recentlyList, setRecentlyList] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const { prefixUrl } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();

  const getRecently = async () => {
    setRecentlyList([]);
    setLoading(true);
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/observability/recent`,
        {
          params: {
            trigger,
            type: "data-flow",
          },
        }
      );
      setRecentlyList(data || []);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecently();
  }, [trigger,random]);

  return (
    <Card className={styles["data-studio-card"]}>
      <div className={styles["data-studio-card-title"]}>
        正在运行
        <Tooltip
          placement="top"
          title="统计最近正在运行的10条管道在近7天内产生的运行数据。"
        >
          <QuestionCircleOutlined className={styles["data-studio-card-icon"]} />
        </Tooltip>
      </div>
      <Table
        dataSource={recentlyList}
        columns={columns}
        pagination={false}
        loading={loading}
        size="small"
      />
    </Card>
  );
});
