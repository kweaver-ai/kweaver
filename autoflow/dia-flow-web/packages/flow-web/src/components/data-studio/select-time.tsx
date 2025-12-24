import { useEffect, useState } from "react";
import { Button, DatePicker, DatePickerProps, Divider, Select } from "antd";
import moment from "moment";

export const SelectTime = ({ getTimeChange }: any) => {
  const [dateRange, setDateRange] = useState<any>();
  const [timeVal, setTimeVal] = useState<any>();
  const [isVisible, setIsVisible] = useState(false);
  const [timestamp, setTimestamp] = useState<any>();
  const [isCustomTime, setIsCustomTime] = useState<boolean>(true);

  const items = [
    {
      label: "最近7天",
      value: "7",
    },
    {
      label: "最近14天",
      value: "14",
    },
    {
      label: "最近30天",
      value: "30",
    },
  ];

  const onChangeStart: DatePickerProps["onChange"] = (date) => {
    setDateRange({ ...dateRange, start_time: date?.unix() });
    setTimestamp({ ...timestamp, startTimeVal: date });
  };
  const onChangeEnd: DatePickerProps["onChange"] = (date) => {
    setDateRange({ ...dateRange, end_time: date?.unix() });
    setTimestamp({ ...timestamp, endTimeVal: date });
  };
  const serachData = () => {
    const startTime = moment(timestamp?.startTimeVal).format("YYYY-MM-DD");
    const endTime = moment(timestamp?.endTimeVal).format("YYYY-MM-DD");
    setTimeVal({ label: `${startTime} -- ${endTime}`, value: "" });
    getTimeChange?.({ ...dateRange });
    setIsVisible(false);
  };

  const handleChange = (data: { value: string; label: React.ReactNode }) => {
    const { value } = data;
    setTimeVal(data);
    const endDate = moment().endOf("day");
    const startDate = moment()
      .subtract(Number(value) - 1, "days")
      .startOf("day");

    const start_time = Math.floor(startDate.valueOf() / 1000);
    const end_time = Math.floor(endDate.valueOf() / 1000);
    getTimeChange?.({ start_time, end_time });
    setIsVisible(false);
    setTimestamp({});
  };

  useEffect(() => {
    handleChange(items[0]);
  }, []);

  useEffect(() => {
    setIsCustomTime(true);
    if (timestamp?.startTimeVal && timestamp?.endTimeVal)
      setIsCustomTime(false);
  }, [timestamp]);

  const handleVisibleChange = (visible: boolean) => {
    if (visible) setIsVisible(visible);
  };

  const disabledStartDate = (current: any) => {
    return (
      (timestamp?.endTimeVal && current > timestamp?.endTimeVal) ||
      current > new Date()
    );
  };

  const disabledEndDate = (current: any) => {
    return (
      (timestamp?.startTimeVal && current < timestamp?.startTimeVal) ||
      current > new Date()
    );
  };

  return (
    <Select
      defaultValue={items[0]}
      labelInValue
      bordered={false}
      placement="bottomRight"
      dropdownMatchSelectWidth={150}
      value={timeVal}
      onChange={handleChange}
      open={isVisible}
      onDropdownVisibleChange={handleVisibleChange}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ padding: "0 12px" }}>
            <div>自定义</div>
            <DatePicker
              style={{ margin: "10px 0 8px 0" }}
              onChange={onChangeStart}
              placeholder="开始时间"
              value={timestamp?.startTimeVal}
              disabledDate={disabledStartDate}
            />
            <DatePicker
              onChange={onChangeEnd}
              placeholder="结束时间"
              value={timestamp?.endTimeVal}
              disabledDate={disabledEndDate}
            />
            <Button
              style={{ margin: "15px 0", float: "right" }}
              type="primary"
              size="small"
              onClick={serachData}
              disabled={isCustomTime}
            >
              确定
            </Button>
          </div>
        </div>
      )}
      options={items}
    />
  );
};
