import moment from "moment";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Button, Form, Input, Popover, Select, TimePicker, Typography } from "antd";
import cronParser from 'cron-parser';
import {
    ExecutorActionConfigProps,
    ExecutorActionInputProps,
    Extension,
    Validatable,
} from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import CronSVG from "./assets/cron.svg";
import CronTriggerSVG from "./assets/trigger-clock.svg";
import { FormItem } from "../../components/editor/form-item";
import styles from "./index.module.less";

const Format = "HH:mm";

// const getOutputs = (step: IStep) => {
//     if (!step.parameters?.dataSource?.operator) {
//         return [];
//     }
//     if (step.parameters?.dataSource?.operator.indexOf("folders") > -1) {
//         return [
//             {
//                 key: ".id",
//                 name: "DListFoldersOutputId",
//                 type: "asFolder",
//             },
//             {
//                 key: ".name",
//                 name: "DListFoldersOutputName",
//                 type: "string",
//             },
//             {
//                 key: ".path",
//                 name: "DListFoldersOutputPath",
//                 type: "string",
//             },
//             {
//                 key: ".create_time",
//                 name: "DListFoldersOutputCreateTime",
//                 type: "datetime",
//             },
//             {
//                 key: ".creator",
//                 name: "DListFoldersOutputCreator",
//                 type: "string",
//             },
//             {
//                 key: ".modify_time",
//                 name: "DListFoldersOutputModificationTime",
//                 type: "datetime",
//             },
//             {
//                 key: ".editor",
//                 name: "DListFoldersOutputModifiedBy",
//                 type: "string",
//             },
//         ];
//     }
//     return [
//         {
//             key: ".id",
//             name: "DListFilesOutputId",
//             type: "asFile",
//         },
//         {
//             key: ".name",
//             name: "DListFilesOutputName",
//             type: "string",
//         },
//         {
//             key: ".path",
//             name: "DListFilesOutputPath",
//             type: "string",
//         },
//         {
//             key: ".create_time",
//             name: "DListFilesOutputCreateTime",
//             type: "datetime",
//         },
//         {
//             key: ".creator",
//             name: "DListFilesOutputCreator",
//             type: "string",
//         },
//         {
//             key: ".size",
//             name: "DListFilesOutputSize",
//             type: "number",
//         },
//         {
//             key: ".modify_time",
//             name: "DListFilesOutputModificationTime",
//             type: "datetime",
//         },
//         {
//             key: ".editor",
//             name: "DListFilesOutputModifiedBy",
//             type: "string",
//         },
//     ];
// };

export default {
    name: "cron",
    triggers: [
        {
            name: "TCron",
            description: "TCronDescription",
            icon: CronTriggerSVG,
            group: {
                group: "autoTrigger",
                name: "TGroupAuto",
            },
            actions: [
                {
                    name: "TACronDay",
                    description: "TACronDayDescription",
                    operator: "@trigger/cron",
                    icon: CronSVG,
                    allowDataSource: true,
                    // outputs: getOutputs,
                    // 输出参考数据源，根据触发目标类型为文件/文件夹分别输出，若不选择则无输出
                    validate(parameters) {
                        return parameters && parameters?.cron;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters,
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const [form] = Form.useForm();
                                const dataSourceConfigRef =
                                    useRef<Validatable>(null);

                                const transferParameter = useMemo(() => {
                                    let time = undefined;
                                    // let weekend = false;
                                    if (parameters?.cron) {
                                        const cronArr =
                                            parameters?.cron.split(" ");
                                        time = moment(
                                            `${cronArr[2]}:${cronArr[1]}`,
                                            Format
                                        );
                                        // if (
                                        //     cronArr[5] === "?" ||
                                        //     cronArr[5] === "*"
                                        // ) {
                                        //     weekend = true;
                                        // }
                                    }
                                    return {
                                        ...parameters,
                                        time,
                                        // weekend,
                                    };
                                }, [parameters]);

                                useImperativeHandle(ref, () => {
                                    return {
                                        async validate() {
                                            const validateResults =
                                                await Promise.allSettled([
                                                    typeof dataSourceConfigRef
                                                        .current?.validate ===
                                                        "function"
                                                        ? dataSourceConfigRef.current.validate()
                                                        : true,
                                                    form.validateFields().then(
                                                        () => true,
                                                        () => false
                                                    ),
                                                ]);

                                            return validateResults.every(
                                                (v) =>
                                                    v.status === "fulfilled" &&
                                                    v.value
                                            );
                                        },
                                    };
                                });

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transferParameter}
                                        onFieldsChange={() => {
                                            const val = form.getFieldsValue();
                                            let cronArr = [
                                                "0",
                                                "*",
                                                "*",
                                                "*",
                                                "*",
                                                "?",
                                            ];
                                            // if (val.weekend === false) {
                                            //     cronArr[3] = "?";
                                            //     cronArr[5] = "MON-FRI";
                                            // } else {
                                            //     cronArr[3] = "*";
                                            //     cronArr[5] = "?";
                                            // }
                                            if (val.time) {
                                                const time = moment(val.time);
                                                cronArr[2] = String(
                                                    time.hours()
                                                );
                                                cronArr[1] = String(
                                                    time.minutes()
                                                );
                                            }

                                            onChange({
                                                cron: cronArr.join(" "),
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t(
                                                "trigger.time",
                                                "触发时间"
                                            )}
                                            name="time"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                    type: "date",
                                                },
                                            ]}
                                        >
                                            <TimePicker
                                                format={Format}
                                                popupClassName="automate-oem-primary"
                                                style={{ width: "100%" }}
                                                placeholder={t(
                                                    "time.placeholder",
                                                    "请选择触发的时间"
                                                )}
                                            />
                                        </FormItem>
                                        {/* <FormItem
                                            required
                                            label={t(
                                                "trigger.weekend",
                                                "是否在周末触发"
                                            )}
                                            name="weekend"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Radio.Group>
                                                <Radio value={false}>
                                                    {t("false", "否")}
                                                </Radio>
                                                <Radio value={true}>
                                                    {t("true", "是")}
                                                </Radio>
                                            </Radio.Group>
                                        </FormItem> */}
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => {
                            let time = "";
                            if (input?.cron) {
                                const cronArr = input?.cron.split(" ");
                                time = moment(
                                    `${cronArr[2]}:${cronArr[1]}`,
                                    Format
                                ).format(Format);
                            }
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className={styles.label}>
                                                {t("trigger.time", "触发时间")}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{time}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                {
                    name: "TACronWeek",
                    description: "TACronWeekDescription",
                    operator: "@trigger/cron/week",
                    icon: CronSVG,
                    allowDataSource: true,
                    // outputs: getOutputs,
                    // 输出参考数据源
                    validate(parameters) {
                        return parameters && parameters?.cron;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters,
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const [form] = Form.useForm();
                                const dataSourceConfigRef =
                                    useRef<Validatable>(null);

                                const transferParameter = useMemo(() => {
                                    let time = undefined;
                                    let week = undefined;
                                    if (parameters?.cron) {
                                        const cronArr =
                                            parameters?.cron.split(" ");
                                        time = moment(
                                            `${cronArr[2]}:${cronArr[1]}`,
                                            Format
                                        );
                                        week = cronArr[5];
                                    }
                                    return {
                                        ...parameters,
                                        time,
                                        week,
                                    };
                                }, [parameters]);

                                useImperativeHandle(ref, () => {
                                    return {
                                        async validate() {
                                            const validateResults =
                                                await Promise.allSettled([
                                                    typeof dataSourceConfigRef
                                                        .current?.validate ===
                                                        "function"
                                                        ? dataSourceConfigRef.current.validate()
                                                        : true,
                                                    form.validateFields().then(
                                                        () => true,
                                                        () => false
                                                    ),
                                                ]);

                                            return validateResults.every(
                                                (v) =>
                                                    v.status === "fulfilled" &&
                                                    v.value
                                            );
                                        },
                                    };
                                });

                                const weekOptions = [
                                    { label: t("week.0", "周日"), value: "0" },
                                    { label: t("week.1", "周一"), value: "1" },
                                    { label: t("week.2", "周二"), value: "2" },
                                    { label: t("week.3", "周三"), value: "3" },
                                    { label: t("week.4", "周四"), value: "4" },
                                    { label: t("week.5", "周五"), value: "5" },
                                    { label: t("week.6", "周六"), value: "6" },
                                ];

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transferParameter}
                                        onFieldsChange={() => {
                                            const val = form.getFieldsValue();
                                            let cronArr = [
                                                "0",
                                                "*",
                                                "*",
                                                "*",
                                                "*",
                                                "?",
                                            ];
                                            if (val.week) {
                                                cronArr[3] = "?";
                                                cronArr[5] = val.week;
                                            } else {
                                                cronArr[3] = "*";
                                                cronArr[5] = "?";
                                            }
                                            if (val.time) {
                                                const time = moment(val.time);
                                                cronArr[2] = String(
                                                    time.hours()
                                                );
                                                cronArr[1] = String(
                                                    time.minutes()
                                                );
                                            }

                                            onChange({
                                                cron: cronArr.join(" "),
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t(
                                                "week.label",
                                                "每周的哪天触发"
                                            )}
                                            name="week"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={weekOptions}
                                                placeholder={t(
                                                    "week.placeholder",
                                                    "选择每周中的一天"
                                                )}
                                            ></Select>
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "trigger.time",
                                                "触发时间"
                                            )}
                                            name="time"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                    type: "date",
                                                },
                                            ]}
                                        >
                                            <TimePicker
                                                style={{ width: "100%" }}
                                                format={Format}
                                                popupClassName="automate-oem-primary"
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => {
                            let time = "";
                            let week = "1";
                            if (input?.cron) {
                                const cronArr = input?.cron.split(" ");
                                time = moment(
                                    `${cronArr[2]}:${cronArr[1]}`,
                                    Format
                                ).format(Format);
                                week = cronArr[5];
                            }
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className={styles.label}>
                                                {t(
                                                    "week.label",
                                                    "每周的哪天触发"
                                                )}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{t(`week.${week}`)}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t("trigger.time", "触发时间")}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{time}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                {
                    name: "TACronMonth",
                    description: "TACronMonthDescription",
                    operator: "@trigger/cron/month",
                    icon: CronSVG,
                    allowDataSource: true,
                    // outputs: getOutputs,
                    // 输出参考数据源
                    validate(parameters) {
                        return parameters && parameters?.cron;
                    },
                    components: {
                        Config: forwardRef(
                            (
                                {
                                    t,
                                    parameters,
                                    onChange,
                                }: ExecutorActionConfigProps,
                                ref
                            ) => {
                                const [form] = Form.useForm();
                                const dataSourceConfigRef =
                                    useRef<Validatable>(null);

                                const transferParameter = useMemo(() => {
                                    let time = undefined;
                                    let day = undefined;
                                    if (parameters?.cron) {
                                        const cronArr =
                                            parameters?.cron.split(" ");
                                        time = moment(
                                            `${cronArr[2]}:${cronArr[1]}`,
                                            Format
                                        );
                                        day = cronArr[3];
                                    }
                                    return {
                                        ...parameters,
                                        time,
                                        day,
                                    };
                                }, [parameters]);

                                useImperativeHandle(ref, () => {
                                    return {
                                        async validate() {
                                            const validateResults =
                                                await Promise.allSettled([
                                                    typeof dataSourceConfigRef
                                                        .current?.validate ===
                                                        "function"
                                                        ? dataSourceConfigRef.current.validate()
                                                        : true,
                                                    form.validateFields().then(
                                                        () => true,
                                                        () => false
                                                    ),
                                                ]);

                                            return validateResults.every(
                                                (v) =>
                                                    v.status === "fulfilled" &&
                                                    v.value
                                            );
                                        },
                                    };
                                });

                                const range = (start: number, end: number) => {
                                    const result = [];
                                    for (let i = start; i <= end; i += 1) {
                                        let label = String(i);
                                        if (i === 29 || i === 30 || i === 31) {
                                            label =
                                                label +
                                                t(
                                                    "month.skipTip",
                                                    "（当月无此日则跳过执行）"
                                                );
                                        }
                                        const value = String(i);
                                        result.push({ label, value });
                                    }
                                    return result;
                                };

                                return (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={transferParameter}
                                        onFieldsChange={() => {
                                            const val = form.getFieldsValue();
                                            let cronArr = [
                                                "0",
                                                "*",
                                                "*",
                                                "*",
                                                "*",
                                                "?",
                                            ];
                                            if (val.day) {
                                                cronArr[3] = val.day;
                                            } else {
                                                cronArr[3] = "*";
                                            }
                                            if (val.time) {
                                                const time = moment(val.time);
                                                cronArr[2] = String(
                                                    time.hours()
                                                );
                                                cronArr[1] = String(
                                                    time.minutes()
                                                );
                                            }

                                            onChange({
                                                cron: cronArr.join(" "),
                                            });
                                        }}
                                    >
                                        <FormItem
                                            required
                                            label={t(
                                                "month.label",
                                                "每月的哪天触发"
                                            )}
                                            name="day"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={range(1, 31)}
                                                placeholder={t(
                                                    "month.placeholder",
                                                    "选择每月中的一天"
                                                )}
                                            ></Select>
                                        </FormItem>
                                        <FormItem
                                            required
                                            label={t(
                                                "trigger.time",
                                                "触发时间"
                                            )}
                                            name="time"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("emptyMessage"),
                                                    type: "date",
                                                },
                                            ]}
                                        >
                                            <TimePicker
                                                style={{ width: "100%" }}
                                                format={Format}
                                                popupClassName="automate-oem-primary"
                                            />
                                        </FormItem>
                                    </Form>
                                );
                            }
                        ),
                        FormattedInput: ({
                            t,
                            input,
                        }: ExecutorActionInputProps) => {
                            let time = "";
                            let month = "";
                            if (input?.cron) {
                                const cronArr = input?.cron.split(" ");
                                time = moment(
                                    `${cronArr[2]}:${cronArr[1]}`,
                                    Format
                                ).format(Format);
                                month = cronArr[3];
                            }
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className={styles.label}>
                                                <Typography.Paragraph
                                                    ellipsis={{
                                                        rows: 2,
                                                    }}
                                                    className="applet-table-label"
                                                    title={t(
                                                        "month.label",
                                                        "每月的哪天触发"
                                                    )}
                                                >
                                                    {t(
                                                        "month.label",
                                                        "每月的哪天触发"
                                                    )}
                                                </Typography.Paragraph>
                                                {t("colon", "：")}
                                            </td>
                                            <td>{month}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.label}>
                                                {t("trigger.time", "触发时间")}
                                                {t("colon", "：")}
                                            </td>
                                            <td>{time}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                },
                // 暂不支持自定义触发
                // {
                //     name: "TACronCustom",
                //     description: "TACronCustomDescription",
                //     operator: "@trigger/cron/custom",
                //     icon: CronSVG,
                //     // 输出参考数据源，根据触发目标类型为文件/文件夹分别输出，若不选择则无输出
                //     validate(parameters) {
                //         return parameters && parameters?.cron;
                //     },
                //     components: {
                //         Config: forwardRef(
                //             (
                //                 {
                //                     t,
                //                     parameters,
                //                     onChange,
                //                 }: ExecutorActionConfigProps,
                //                 ref
                //             ) => {
                //                 const [form] = Form.useForm();

                //                 const dataSourceConfigRef =
                //                     useRef<Validatable>(null);

                //                 const transferParameter = useMemo(() => {
                //                     let every = undefined;
                //                     let type = "day";
                //                     if (parameters?.cron) {
                //                         const cronArr =
                //                             parameters?.cron.split(" ");
                //                         if (cronArr[3]?.indexOf("1/") > -1) {
                //                             type = "day";
                //                             every = Number(
                //                                 cronArr[3].split("/")[1]
                //                             );
                //                         } else if (
                //                             cronArr[3]?.indexOf("*/") > -1
                //                         ) {
                //                             type = "week";
                //                             every =
                //                                 Number(
                //                                     cronArr[3].split("/")[1]
                //                                 ) / 7;
                //                         } else if (
                //                             cronArr[4]?.indexOf("*/") > -1
                //                         ) {
                //                             type = "month";
                //                             every = Number(
                //                                 cronArr[4].split("/")[1]
                //                             );
                //                         }
                //                     }
                //                     return {
                //                         ...parameters,
                //                         every,
                //                         type,
                //                     };
                //                 }, [parameters]);

                //                 useImperativeHandle(ref, () => {
                //                     return {
                //                         async validate() {
                //                             const validateResults =
                //                                 await Promise.allSettled([
                //                                     typeof dataSourceConfigRef
                //                                         .current?.validate ===
                //                                     "function"
                //                                         ? dataSourceConfigRef.current.validate()
                //                                         : true,
                //                                     form.validateFields().then(
                //                                         () => true,
                //                                         () => false
                //                                     ),
                //                                 ]);

                //                             return validateResults.every(
                //                                 (v) =>
                //                                     v.status === "fulfilled" &&
                //                                     v.value
                //                             );
                //                         },
                //                     };
                //                 });

                //                 const showInherit = useMemo(() => {
                //                     return (
                //                         parameters?.dataSource?.operator ===
                //                             "@anyshare-data/list-files" ||
                //                         parameters?.dataSource?.operator ===
                //                             "@anyshare-data/list-folders"
                //                     );
                //                 }, [parameters?.dataSource?.operator]);

                //                 const types = ["day", "week", "month"];

                //                 return (
                //                     <Form
                //                         form={form}
                //                         layout="vertical"
                //                         initialValues={transferParameter}
                //                         onFieldsChange={() => {
                //                             const val = form.getFieldsValue();
                //                             let cronArr = [
                //                                 "*",
                //                                 "*",
                //                                 "*",
                //                                 "*",
                //                                 "*",
                //                                 "?",
                //                             ];
                //                             if (val.every) {
                //                                 const nowTime = moment();
                //                                 cronArr[0] = "0";
                //                                 cronArr[1] = "0";
                //                                 cronArr[2] = "0";
                //                                 cronArr[3] = String(
                //                                     nowTime.date()
                //                                 );
                //                                 switch (val.type) {
                //                                     case "day": {
                //                                         cronArr[3] = `1/${val.every}`;
                //                                         break;
                //                                     }
                //                                     case "week": {
                //                                         cronArr[3] = `*/${
                //                                             val.every * 7
                //                                         } `;
                //                                         break;
                //                                     }
                //                                     case "month": {
                //                                         cronArr[4] = `*/${val.every}`;
                //                                         break;
                //                                     }
                //                                 }
                //                             }

                //                             onChange({
                //                                 cron: cronArr.join(" "),
                //                             });
                //                         }}
                //                     >
                //                         <FormItem
                //                             required
                //                             label={t(
                //                                 "frequency.rule",
                //                                 "重复规则"
                //                             )}
                //                         >
                //                             <Space
                //                                 className={
                //                                     styles["custom-rule"]
                //                                 }
                //                             >
                //                                 {t("rule.every", "每")}
                //                                 <Form.Item
                //                                     required
                //                                     rules={[
                //                                         {
                //                                             required: true,
                //                                             message:
                //                                                 t(
                //                                                     "emptyMessage"
                //                                                 ),
                //                                         },
                //                                     ]}
                //                                     name="every"
                //                                     className={
                //                                         styles[
                //                                             "custom-rule-item"
                //                                         ]
                //                                     }
                //                                 >
                //                                     <InputNumber
                //                                         min={1}
                //                                         precision={0}
                //                                         placeholder={t(
                //                                             "input.placeholder",
                //                                             "请输入"
                //                                         )}
                //                                         style={{
                //                                             width: "120px",
                //                                         }}
                //                                     ></InputNumber>
                //                                 </Form.Item>
                //                                 <Form.Item name="type" noStyle>
                //                                     <Select
                //                                         style={{
                //                                             width: "120px",
                //                                         }}
                //                                         options={types.map(
                //                                             (i) => ({
                //                                                 label: t(
                //                                                     `rule.${i}`
                //                                                 ),
                //                                                 value: i,
                //                                             })
                //                                         )}
                //                                     ></Select>
                //                                 </Form.Item>
                //                             </Space>
                //                         </FormItem>
                //                     </Form>
                //                 );
                //             }
                //         ),
                //     },
                // },
            ],
        },
    ],
    translations: {
        zhCN,
        zhTW,
        enUS,
        viVN
    },
} as Extension;

// DataStudio 自定义触发时间 - DataStudio
export const CronCustomAction = {
    name: "TACronCustom",
    description: "TACronCustomDescription",
    operator: "@trigger/cron/custom",
    icon: CronSVG,
    allowDataSource: true,
    components: {
        Config: forwardRef(
            (
                {
                    t,
                    parameters,
                    onChange,
                }: ExecutorActionConfigProps,
                ref
            ) => {
                const [form] = Form.useForm();

                useImperativeHandle(ref, () => {
                    return {
                        async validate() {
                            return form.validateFields().then(
                                () => true,
                                () => false
                            )
                        },
                    };
                });

                return (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={parameters}
                        onValuesChange={({ cron }) => {
                            onChange({ cron });
                        }}
                    >

                        <FormItem
                            label={t("CustomCron", "定时表达式")}
                            name="cron"
                            style={{ marginBottom: 0 }}
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage", "此项不允许为空"),
                                },
                                {
                                    validator: (_, value) => {
                                        if (value && !validateCron(value)) {
                                            return Promise.reject(new Error(t("CustomCron.rule", "表达式只能包含*？-/, 数字和空格。")));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <Input
                                placeholder={t("CustomCron.placeholder", "请输入")}
                                onChange={(e) => {
                                    form.setFieldValue('cron', e.target.value.trimStart())
                                }}
                            />
                        </FormItem>
                        <div style={{ marginBottom: '24px' }}>
                            <Popover
                                content={
                                    <div style={{ width: '300px' }}>
                                        {t("CustomCron.Examples.content1", "定时表达式是一个字符串，每个域以空格隔开，语法格式为 :秒 分 小时 日期 月份 星期")}
                                        <br /> <br />
                                        <div>
                                            {t("CustomCron.Examples.content2", "配置示例如下:")}
                                            <br />
                                            {t("CustomCron.Examples.content3", "每隔5秒执行一次: */5 * * * * ?")}
                                            <br />
                                            {t("CustomCron.Examples.content4", "每月1日的凌晨2點執行一次:0 0 2 1 * ?")}
                                            <br />
                                            {t("CustomCron.Examples.content5", "每天上午 10:15触发：0 15 10 * * ?")}
                                        </div>
                                    </div>
                                }
                                placement="bottomRight"
                            >
                                <Button type="link">{t("CustomCron.Examples", "查看示例")}</Button>
                            </Popover>
                        </div>
                    </Form>
                );
            }
        ),
    },
}

function validateCron(cronExpression: string): boolean {
    if (cronExpression.split('').length < 5) {
        return false
    }

    try {
        cronParser.parseExpression(cronExpression);
        return true;
    } catch (err) {
        return false;
    }
}

