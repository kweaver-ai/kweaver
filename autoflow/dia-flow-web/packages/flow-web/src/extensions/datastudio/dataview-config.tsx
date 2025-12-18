import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Segmented,
  Select,
  Tooltip,
} from "antd";
import {
  createRef,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import FormItem from "antd/es/form/FormItem";
import TriggerDataviewlSVG from "./assets/dataview.svg";
import SelectDataView from "../../components/data-studio/data-view/select-data-view";
import moment from "moment";
import { API, MicroAppContext } from "@applet/common";
import { SyncModeType } from "./types";
import IncrementalDataView from "../../components/data-studio/data-view/incremental-data-view";
import styles from "./dataview-config.module.less";
import { QuestionCircleOutlined, ToolFilled } from "@ant-design/icons";
import { find } from "lodash";

const { RangePicker } = DatePicker;

const FormTriggerConfig = forwardRef(
  ({ t, parameters, onChange }: any, ref) => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataViewOptions, setDataViewOptions] = useState<any>([]);
    const [mode, setMode] = useState();
    const { prefixUrl } = useContext(MicroAppContext);
    const [syncMode, setSyncMode] = useState<string>(
      parameters?.syncMode || SyncModeType.Full
    );
    const [dataViewsInfo, setDataViewsInfo] = useState({
      fields: [],
      query_type: "",
      sql_str: "",
    });
    const [incrementFieldSelect, setIncrementFieldSelect] = useState({
      type: "",
    });

    const [isIncrementOpen, setIsIncrementOpen] = useState(false);
    const refs = useMemo(() => {
      return parameters?.fields?.map(() => createRef<any>()) || [];
    }, [parameters?.fields]);

    const initialValues = {
      batchSize: 1000,
      syncMode: SyncModeType.Full,
      ...parameters,
      // 如果参数中有duration值（毫秒），转换为秒进行回显
      duration: parameters?.duration
        ? Math.floor(parameters.duration / 1000)
        : undefined,
    };

    useEffect(() => {
      setMode(parameters?.mode);
    }, [parameters]);

    useEffect(() => {
      setMode(parameters?.mode);
      if (parameters?.id) dataViewsTab(parameters?.id);
    }, [parameters?.id]);

    const dataViewsTab = async (id: string) => {
      try {
        const { data } = await API.axios.get(
          `${prefixUrl}/api/mdl-data-model/v1/data-views/${id}`
        );

        form.setFieldValue("fields", data?.[0]?.fields);
        onChange(form.getFieldsValue());
        setDataViewsInfo(data?.[0]);
        const value = { value: data?.[0]?.id, label: data?.[0]?.name };
        setDataViewOptions([value]);
        if (data?.[0]?.query_type !== "SQL") {
          setSyncMode(SyncModeType.Full);
          form.setFieldValue("syncMode", SyncModeType.Full);
        }

        // 编辑时处理增量字段的回填
        if (parameters?.incrementField && data?.[0]?.fields) {
          const result = find(data?.[0]?.fields, {
            name: parameters?.incrementField,
          });
          setIncrementFieldSelect(result);
        }
      } catch (error) {
        console.error(error);
      }
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          validate() {
            return Promise.all([
              ...refs.map(
                (ref: any) =>
                  typeof ref.current?.validate !== "function" ||
                  ref.current?.validate()
              ),
              form.validateFields().then(
                () => true,
                () => false
              ),
            ]).then((results) => results.every((r) => r));
          },
        };
      },
      [form, refs]
    );

    const closeModalOpen = () => {
      setIsModalOpen(false);
    };

    const selectDataView = (data: any) => {
      // form.resetFields();
      setDataViewOptions([data]);
      dataViewsTab(data?.value);
      form.setFieldValue("id", data?.value);
      dataViewsTab(data?.value);
      // onChange(form.getFieldsValue());
    };

    // 处理时间范围选择
    const handleTimeChange = (dates: any) => {
      if (dates && dates.length === 2) {
        const start = dates[0].valueOf(); // 开始时间的13位时间戳
        const end = dates[1].valueOf(); // 结束时间的13位时间戳
        form.setFieldValue("start", start); // 更新表单值
        form.setFieldValue("end", end); // 更新表单值
        onChange(form.getFieldsValue());
      }
    };

    const incrementFieldChange = (_: string, data: any) => {
      setIncrementFieldSelect(data);
      form.setFieldValue("incrementValue", undefined); 
    };

    const incrementFieldHtml = () => {
      if (
        [
          "number",
          "int",
          "integer",
          "float",
          "double",
          "real",
          "DOUBLE",
        ].includes(incrementFieldSelect?.type)
      ) {
        return <InputNumber style={{ width: "100%" }} />;
      } else {
        return <Input autoComplete="off" placeholder="请输入" />;
      }
    };

    // 处理日期选择器变化，将日期转换为YYYY-MM-DD HH:mm:ss格式
    const onChangeDatePicker = (date: any) => {
      if (date) {
        // 将moment对象转换为13位时间戳（毫秒）
        // const timestamp = date.valueOf();
        // form.setFieldValue("incrementValue", timestamp);
        const formattedDate = date.format("YYYY-MM-DD HH:mm:ss");
        form.setFieldValue("incrementValue", formattedDate);
        onChange(form.getFieldsValue());
      } else {
        form.setFieldValue("incrementValue", undefined);
        onChange(form.getFieldsValue());
      }
    };

    return (
      <>
        <Form
          form={form}
          initialValues={initialValues}
          layout="vertical"
          onFieldsChange={() => {
            if (typeof onChange === "function") {
              setTimeout(() => {
                const formValues = form.getFieldsValue();
                if (formValues.incrementValue === null) {
                  formValues.incrementValue = undefined;
                }
                // 如果mode是duration且有duration值，将秒转换为毫秒
                if (formValues.mode === "duration" && formValues.duration) {
                  const convertedValues = {
                    ...formValues,
                    duration: formValues.duration * 1000, // 秒转毫秒
                  };
                  onChange(convertedValues);
                } else {
                  onChange(formValues);
                }
              }, 100);
            }
          }}
        >
          <FormItem noStyle>
            <FormItem
              label="数据视图"
              name="id"
              rules={[
                {
                  required: true,
                  message: "请选择数据视图",
                },
              ]}
              style={{
                width: "360px",
                marginRight: "10px",
                display: "inline-block",
              }}
            >
              <Select
                showArrow={false}
                disabled
                options={dataViewOptions}
                placeholder="请选择数据视图"
                style={{ background: "white" }}
              />
            </FormItem>
            <Button
              onClick={() => {
                setIsModalOpen(true);
              }}
              style={{ marginTop: "28px" }}
            >
              选择
            </Button>
          </FormItem>
          {parameters?.id && (
            <>
              <FormItem
                label="获取数据的方式"
                name="syncMode"
                hidden={dataViewsInfo?.query_type !== "SQL"}
              >
                <Segmented
                  className={styles["data-view-segmented"]}
                  value={syncMode}
                  onChange={(val: any) => {
                    setSyncMode(val);
                  }}
                  options={[
                    { label: "全量获取", value: SyncModeType.Full },
                    { label: "增量获取", value: SyncModeType.Incremental },
                  ]}
                />
              </FormItem>
              {syncMode === SyncModeType.Incremental &&
                dataViewsInfo?.query_type === "SQL" && (
                  <>
                    <FormItem
                      required
                      label="增量字段"
                      name="incrementField"
                      rules={[
                        {
                          required: true,
                          message: t("emptyMessage"),
                        },
                      ]}
                    >
                      <Select
                        placeholder="请选择"
                        fieldNames={{ label: "name", value: "name" }}
                        options={dataViewsInfo?.fields}
                        onChange={incrementFieldChange}
                      />
                    </FormItem>
                    {["datatime", "timestamp", "time", "data"].includes(
                      incrementFieldSelect?.type
                    ) ? (
                      <>
                        <FormItem
                          label="增量字段的初始值"
                        >
                          <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            value={
                              form.getFieldValue("incrementValue")
                                ? moment(
                                    form.getFieldValue("incrementValue")
                                  )
                                : null
                            }
                            onChange={onChangeDatePicker}
                          />
                        </FormItem>
                        <FormItem name="incrementValue" hidden>
                          <Input />
                        </FormItem>
                      </>
                    ) : (
                      <FormItem
                        label="增量字段的初始值"
                        name="incrementValue"
                        // rules={[
                        //   {
                        //     required: true,
                        //     message: t("emptyMessage"),
                        //   },
                        // ]}
                      >
                        {incrementFieldHtml()}
                      </FormItem>
                    )}
                    <FormItem
                      label={
                        <span>
                          过滤规则
                          <Tooltip
                            title={`示例: "分区" = to_char((CURRENT_DATE - INTERVAL '1 day'),'yyyymmdd') and "区域"= '275'`}
                          >
                            <QuestionCircleOutlined
                              style={{ marginLeft: "6px", cursor: "pointer" }}
                            />
                          </Tooltip>
                        </span>
                      }
                      name="filter"
                      // rules={[
                      //   {
                      //     required: true,
                      //     message: t("emptyMessage"),
                      //   },
                      // ]}
                    >
                      <Input.TextArea autoComplete="off" placeholder="请输入" />
                    </FormItem>
                  </>
                )}
              {dataViewsInfo?.query_type !== "SQL" &&
                syncMode === SyncModeType.Full && (
                  <FormItem label="时间范围" name="mode">
                    <Radio.Group>
                      <Radio
                        value="duration"
                        style={{ width: "100%", marginBottom: "6px" }}
                      >
                        <div style={{ marginBottom: "6px" }}>快速选择</div>
                        {mode === "duration" && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span>最近</span>
                            <FormItem
                              name="duration"
                              style={{
                                width: "100px",
                                margin: "0 6px",
                                display: "inline-block",
                              }}
                              rules={[
                                {
                                  required: mode === "duration",
                                  message: "请选择最近多少秒!",
                                },
                              ]}
                            >
                              <InputNumber min={0} />
                            </FormItem>
                            <span> 秒</span>
                          </div>
                        )}
                      </Radio>
                      <Radio
                        value="range"
                        style={{ width: "100%", marginBottom: "6px" }}
                      >
                        <div style={{ marginBottom: "6px" }}>时间段选择</div>
                        {mode === "range" && (
                          <div>
                            <FormItem
                              name="start"
                              hidden
                              rules={[
                                {
                                  required: mode === "range",
                                  message: "请选择开始时间!",
                                },
                              ]}
                            >
                              <Input />
                            </FormItem>
                            <FormItem
                              name="end"
                              hidden
                              rules={[
                                {
                                  required: mode === "range",
                                  message: "请选择结束时间!",
                                },
                              ]}
                            >
                              <Input />
                            </FormItem>
                            <RangePicker
                              format="YYYY-MM-DD HH:mm:ss"
                              showTime
                              onChange={handleTimeChange}
                              style={{ margin: "6px 0" }}
                              value={
                                form.getFieldValue("start") &&
                                form.getFieldValue("end")
                                  ? [
                                      moment(form.getFieldValue("start")),
                                      moment(form.getFieldValue("end")),
                                    ]
                                  : null
                              }
                            />
                          </div>
                        )}
                      </Radio>
                      <Radio value="none">不设置</Radio>
                    </Radio.Group>
                  </FormItem>
                )}
              <FormItem label="批大小" required name="batchSize">
                <InputNumber min={1} max={10000} style={{ width: "100%" }} />
              </FormItem>
              <FormItem label="fileds" hidden name="fields">
                <Input />
              </FormItem>
              {dataViewsInfo?.query_type === "SQL" &&
                syncMode === SyncModeType.Incremental && (
                  <FormItem>
                    <p style={{ opacity: "0.5" }}>
                      若您已配置完成数据源，可进行数据预览
                    </p>
                    <Button
                      htmlType="submit"
                      onClick={() => {
                        const { incrementField, incrementValue, filter } =
                          form.getFieldsValue();
                        if (!incrementField) {
                          return false;
                        }
                        setIsIncrementOpen(true);
                      }}
                    >
                      数据预览
                    </Button>
                  </FormItem>
                )}
            </>
          )}
        </Form>
        {isModalOpen && (
          <SelectDataView
            isModalOpen={isModalOpen}
            closeModalOpen={closeModalOpen}
            selectDataView={selectDataView}
          />
        )}

        {isIncrementOpen && (
          <IncrementalDataView
            isModalOpen={isIncrementOpen}
            closeModalOpen={() => {
              setIsIncrementOpen(false);
            }}
            selectDataView={{
              sql_str: dataViewsInfo?.sql_str,
              ...form.getFieldsValue(),
              type: incrementFieldSelect?.type,
            }}
          />
        )}
      </>
    );
  }
);

export const DataviewTriggerAction: any = {
  name: "MdlDataDataview",
  description: "MdlDataDataviewDes",
  operator: "@trigger/dataview",
  icon: TriggerDataviewlSVG,
  outputs(step: any) {
    // console.log(423423, step.parameters)
    return [
      {
        key: ".data",
        name: "data",
        type: "array",
      },
    ];
    // if (Array.isArray(step.parameters?.fields)) {
    //   return [
    //     ...step.parameters.fields.map((field: any) => {
    //         return {
    //             key: `.data.${field.name}`,
    //             name: field.name || field.display_name,
    //             type: 'any',
    //             isCustom: true,
    //         };
    //     }),
    //   ];
    // }
    // return [];
  },
  components: {
    Config: FormTriggerConfig,
  },
};
