import { memo, useContext, useEffect, useMemo, useState } from "react";
import styles from "./index.module.less";
import { OverviewRunning } from "./overview-running";
import { API, MicroAppContext } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import { OverviewStatistics } from "./overview-statistics";
import { Card, Col, Row, Select, Statistic } from "antd";
import { Pie } from "@ant-design/charts";
import { ReloadOutlined } from "@ant-design/icons";
import SumSVG from "./assets/sum.svg";
import EventSVG from "./assets/event.svg";
import CronSVG from "./assets/cron.svg";
import ManuallySVG from "./assets/manually.svg";
import { SelectTime } from "./select-time";
import { formatNumber } from "../../utils/format-number";

export const Overview = memo(({}) => {
  const [loading, setLoading] = useState(false);
  const [fullViewInfo, setFullViewInfo] = useState<any>();
  const { prefixUrl } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();
  const [pieData, setPieData] = useState<any>([
    { type: "运行中", value: 0, color: "#6395F9" },
    { type: "成功", value: 0, color: "#69DFAE" },
    { type: "失败", value: 0, color: "#E296B7" },
    { type: "取消", value: 0, color: "#EDC14E" },
    { type: "等待", value: 0, color: "#DADADA" },
  ]);
  const [trigger, setTrigger] = useState<string>("");
  const [fullDatePicker, setFullDatePicker] = useState<any>();
  const [random, setRandom] = useState<string>("");

  const pieConfig: any = useMemo(
    () => ({
      data: pieData,
      appendPadding: 10,
      angleField: "value",
      colorField: "type",
      radius: 0.8,
      pieStyle: {
        lineWidth: 0,
      },
      label: {
        type: "outer",
        content: "{name} {percentage}",
      },
      legend: {
        position: "right",
        itemName: {
          formatter: (text: string) => {
            const item = pieData.find((d: any) => d.type === text);
            return `${text}   ${formatNumber(item.value)}`;
          },
        },
      },
      interactions: [
        {
          type: "pie-legend-active",
        },
        {
          type: "element-active",
        },
      ],
      color: ["#6395F9", "#69DFAE", "#E296B7", "#EDC14E", "#DADADA"],
    }),
    [pieData]
  );

  const getFullView = async () => {
    setLoading(true);
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/observability/full-view`,
        {
          params: {
            trigger,
            ...fullDatePicker,
            type: "data-flow",
          },
        }
      );
      setFullViewInfo(data?.basic);
      const { success, failed, canceled, running, scheduled } = data?.run;
      setPieData([
        { type: "运行中", value: running, color: "#6395F9" },
        { type: "成功", value: success, color: "#69DFAE" },
        { type: "失败", value: failed, color: "#E296B7" },
        { type: "取消", value: canceled, color: "#EDC14E" },
        { type: "等待", value: scheduled, color: "#DADADA" },
      ]);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setTrigger(value);
  };

  const reset = () => {
    setRandom(Math.random().toString(36).substring(2));
  };

  const getTimeChange = ({ start_time, end_time }: any) => {
    setFullDatePicker({ start_time, end_time });
  };

  const mergedCondition = useMemo(() => {
    return { trigger, fullDatePicker, random };
  }, [trigger, fullDatePicker, random]);

  useEffect(() => {
    if(fullDatePicker?.start_time & fullDatePicker?.end_time) {
        getFullView();
     }
  }, [mergedCondition]);

  return (
    <div>
      <div className={styles["data-studio-operator"]}>
        触发方式：
        <Select
          defaultValue=""
          onChange={handleChange}
          bordered={false}
          options={[
            {
              value: "",
              label: "全部",
            },
            {
              value: "cron",
              label: "定时",
            },
            {
              value: "event",
              label: "事件",
            },
            {
              value: "manually",
              label: "手动",
            },
          ]}
        />
        <div
          style={{ marginLeft: "6px", cursor: "pointer" }}
          onClick={() => {
            reset();
          }}
        >
          <ReloadOutlined />
        </div>
      </div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            className={styles["data-studio-card"]}
            style={{ height: "244px" }}
            // loading={loading}
          >
            <div style={{ height: "120px" }}>
              <Statistic
                title={
                  <div className={styles["card-statistic-title"]}>
                    <img src={SumSVG} />
                    <div>管道总数</div>
                  </div>
                }
                value={formatNumber(fullViewInfo?.dag_total)}
                valueStyle={{ fontSize: "36px" }}
              />
            </div>
            <Row>
              <Col span={8}>
                <Statistic
                  title={
                    <div className={styles["card-statistic-title"]}>
                      <img src={CronSVG} />
                      <div>定时触发</div>
                    </div>
                  }
                  value={formatNumber(fullViewInfo?.cron)}
                  valueStyle={{ fontSize: "24px" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={
                    <div className={styles["card-statistic-title"]}>
                      <img src={EventSVG} />
                      <div>事件触发</div>
                    </div>
                  }
                  value={formatNumber(fullViewInfo?.event)}
                  valueStyle={{ fontSize: "24px" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={
                    <div className={styles["card-statistic-title"]}>
                      <img src={ManuallySVG} />
                      手动触发
                    </div>
                  }
                  value={formatNumber(fullViewInfo?.manually)}
                  valueStyle={{ fontSize: "24px" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            className={styles["data-studio-card"]}
            style={{ height: "244px" }}
            // loading={loading}
          >
            <div className={styles["data-studio-card-header"]}>
              <div className={styles["data-studio-card-title"]}>
                实例运行状态占比
              </div>
              <SelectTime getTimeChange={getTimeChange} />
            </div>
            <div className={styles["data-studio-card-pie"]}>
              <Pie {...pieConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      <OverviewRunning trigger={trigger} random={random} />
      <OverviewStatistics trigger={trigger} random={random} />
    </div>
  );
});
