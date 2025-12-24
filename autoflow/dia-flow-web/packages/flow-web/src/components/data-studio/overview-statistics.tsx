import { Card, Table, Tooltip } from "antd";
import styles from "./index.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { SelectTime } from "./select-time";
import { memo, useContext, useEffect, useMemo, useState } from "react";
import { API, MicroAppContext } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import InfiniteScroll from "react-infinite-scroll-component";
import { formatNumber } from "../../utils/format-number";

export const OverviewStatistics = memo(({ trigger, random }: any) => {
  const { prefixUrl } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();
  const limit = 20;
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [runtimeViewList, setRuntimeViewList] = useState<any>([]);
  const [runtimeDatePicker, setRuntimeDatePicker] = useState<any>();
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

  const getRuntimeView = async ({ page = 0 }: any) => {
    setLoading(true);
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/observability/runtime-view`,
        {
          params: {
            trigger,
            ...runtimeDatePicker,
            type: "data-flow",
            page,
            limit,
          },
        }
      );
      const result = data?.datas || []

      setRuntimeViewList(page === 0 ? result : (prev: any) => [...prev, ...result]);
      setHasMore(data?.datas.length >= limit);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false);
    }
  };

  const mergedCondition = useMemo(() => {
    return { trigger, runtimeDatePicker, random };
  }, [trigger, runtimeDatePicker, random]);

  useEffect(() => {
    setPage(0);
    setHasMore(false);
    setRuntimeViewList([]);
    if(runtimeDatePicker?.start_time & runtimeDatePicker?.end_time) {
      setTimeout(() => {
        getRuntimeView({});
      }, 0);
    }
  }, [mergedCondition]);

  const fetchMoreData = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      getRuntimeView({ page: nextPage });
    }
  };

  const getTimeChange = ({ start_time, end_time }: any) => {
    setRuntimeDatePicker({ start_time, end_time });
  };

  return (
    <Card className={styles["data-studio-card"]}>
      <div className={styles["data-studio-card-header"]}>
        <div className={styles["data-studio-card-title"]}>
          运行统计
          <Tooltip placement="top" title="统计所有管道在一段时间内的运行数据。">
            <QuestionCircleOutlined
              className={styles["data-studio-card-icon"]}
            />
          </Tooltip>
        </div>
        <SelectTime getTimeChange={getTimeChange} />
      </div>
      <div id="scrollableDiv" style={{ maxHeight: "550px", overflow: "auto" }}>
        <InfiniteScroll
          dataLength={runtimeViewList.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<></>}
          scrollableTarget="scrollableDiv"
        >
          <Table
            dataSource={runtimeViewList}
            columns={columns}
            pagination={false}
            rowKey="id"
            loading={loading}
            // scroll={{ y: 500 }}
          />
        </InfiniteScroll>
      </div>
    </Card>
  );
});
