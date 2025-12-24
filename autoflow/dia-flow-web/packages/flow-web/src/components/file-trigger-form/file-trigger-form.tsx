import { Button, Form, Input, InputNumber, Radio, Space, Spin, Typography } from "antd";
import { createRef, useContext, useEffect, useMemo, useRef, useState } from "react";

import { API, AsPermSelect, AsUserSelect, DatePickerISO, MicroAppContext, useTranslate } from "@applet/common";
import clsx from "clsx";
import { isArray } from "lodash";
import { concatProtocol } from "../../utils/browser";
import { useHandleErrReq } from "../../utils/hooks";
import { IDocItem } from "../as-file-preview";
import { AsFileSelect } from "../as-file-select";
import { DescriptionType } from "../form-item-description";
import { AsLevel } from "../params-form/as-level";
import { AsMetaData } from "../params-form/as-metadata";
import { AsTags } from "../params-form/as-tags";
import { AsUserSelectChildRender } from "./childrenRender";
import styles from "./styles/file-trigger-form.module.less";

interface RelatedRatioItem {
    value: string;
    related: string[];
}

interface Field {
    key: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    data?: (string | RelatedRatioItem)[];
    description?: Record<string, any>;
}

function isRelatedRatio(value?: RelatedRatioItem | string): value is RelatedRatioItem {
    return Boolean(value && typeof value === "object");
}

export interface ItemCallback {
    submitCallback?(): Promise<any>;
}

// 预设执行参数组件类型
export enum FileTriggerFieldTypes {
    "Number" = "number",
    "Radio" = "radio",
    "Datetime" = "datetime",
    "String" = "string",
    "Long_string" = "long_string",
    "AsFile" = "asFile",
    "MultipleFiles" = "multipleFiles",
    "AsFolder" = "asFolder",
    "AsPerm" = "asPerm",
    "AsTags" = "asTags",
    "AsMetadata" = "asMetadata",
    "AsUsers" = "asUsers",
    "AsDepartments" = "asDepartments",
    "AsLevel" = "asLevel",
    // "AsAccessorPerms" = "asAccessorPerms",
}

interface FileTriggerFormProps {
    selection?: IDocItem[];
    taskId: string;
    onBack: () => void;
    onClose?(): void;
}

export const FileTriggerForm = ({ taskId, onBack, selection, onClose }: FileTriggerFormProps) => {
    const [fields, setFields] = useState<Field[]>([]);
    const [form] = Form.useForm();
    const { microWidgetProps, functionId, prefixUrl, message } = useContext(MicroAppContext);
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const isRequest = useRef(false);
    const [isLoading, setLoading] = useState(true);
    const dagDataRef = useRef<Record<string, any>>({});

    const selections = selection || microWidgetProps?.contextMenu?.getSelections;

    const selectItems = useMemo(() => {
        if (selections) {
            return [...selections].filter(Boolean).map((item) => ({
                ...item,
                object_id: item?.object_id || item?.docid.slice(-32),
            }));
        }
        return [];
    }, [selections]);

    const refs = useMemo(() => (fields || [])?.map(() => createRef<ItemCallback>()), [fields]);

    const closeDialog = () => {
        if (typeof onClose === "function") {
            onClose()
        } else {
            microWidgetProps?.dialog?.close({
                functionid: functionId,
            });
        }
    };

    const onSubmit = async () => {
        let isValid = true;
        await Promise.allSettled(
            refs.map(async (item) => {
                try {
                    if (item?.current?.submitCallback) {
                        const val = await item?.current?.submitCallback();
                        return Promise.resolve(val);
                    }
                    return Promise.resolve();
                } catch (error) {
                    isValid = false;
                    return Promise.reject(error);
                }
            })
        );
        if (isValid) {
            form.submit();
        } else {
            form.validateFields();
            setTimeout(() => {
                try {
                    // 滚动到第一个错误字段
                    const element = document.querySelector(".CONTENT_AUTOMATION-ant-form-item-has-error");
                    if (element) {
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch (error) {
                    console.warn(error)
                }
            }, 100)
        }
    };
    // 表单确认提交（无表单配置时直接提交）
    const onFinish = async (formValue: Record<string, any>) => {
        if (isRequest.current === true) {
            return;
        }
        isRequest.current = true;
        try {
            await API.axios.post(`${prefixUrl}/api/automation/v1/run-instance-with-doc/${taskId}`, {
                docid: selectItems[0].docid,
                data: formValue,
            });
            message.success(t("submit.success", "提交成功"));
            closeDialog();
        } catch (error: any) {
            // 任务不存在
            if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.flow.notFount", "工作流程已不存在。", {
                        name: dagDataRef.current?.title || "",
                    }),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 不在范围内
            if (error?.response?.data?.code === "ContentAutomation.Forbidden") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.flow.overRange", "您已不在适用范围之内。"),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 触发器文件夹不存在
            if (error?.response?.data?.code === "ContentAutomation.TaskSourceNotFound") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.trigger.notFound", "任务的执行目标已不存在。"),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 对触发器文件夹没有权限
            if (error?.response?.data?.code === "ContentAutomation.TaskSourceNotPerm") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.trigger.noPerm", "您对任务的执行目标没有显示权限。"),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 任务状态已停用
            if (error?.response?.data?.code === "ContentAutomation.Forbidden.DagStatusNotNormal") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.flow.disable", "工作流程已停用。", {
                        name: dagDataRef.current?.title || "",
                    }),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 不是手动任务
            if (error?.response?.data?.code === "ContentAutomation.Forbidden.ErrorIncorretTrigger") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.task.incorrectTrigger", "该任务不支持手动运行。"),
                    okText: t("ok", "确定"),
                    onOk: handleCancel,
                });
                return;
            }
            // 自动化被禁用
            if (error?.response?.data?.code === "ContentAutomation.Forbidden.ServiceDisabled") {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.flow.errTitle", "无法运行此流程"),
                    message: t("err.disable", "当前功能暂不可用，请联系管理员。"),
                    okText: t("ok"),
                    onOk: handleCancel,
                });
                return;
            }
            handleErr({ error: error?.response });
        } finally {
            isRequest.current = false;
        }
    };

    const initialValues = useMemo(() => {
        const values: any = {};
        if (fields?.length) {
            fields.forEach((field) => {
                if (field.type === FileTriggerFieldTypes.AsPerm) {
                    values[field.key] = {
                        allow: [],
                        deny: [],
                    };
                }
                if (field.type === FileTriggerFieldTypes.Datetime) {
                    values[field.key] = "";
                }
                if (field.type === FileTriggerFieldTypes.String || field.type === FileTriggerFieldTypes.Long_string) {
                    values[field.key] = "";
                }
                if (field.defaultValue) {
                    values[field.key] = field.defaultValue;
                }
            });
            form.setFieldsValue(values);
        }
        return values;
    }, [fields, form]);

    const [values, setValues] = useState<Record<string, any>>({});

    const deps = useMemo(() => {
        const deps: Record<string, [key: string, value: any][]> = {};
        if (!fields) return deps;

        for (const field of fields) {
            if (field.type === "radio" && field.data) {
                field.data.forEach((radioOption) => {
                    if (isRelatedRatio(radioOption) && radioOption.related?.length) {
                        for (const fieldKey of radioOption.related) {
                            if (!deps[fieldKey]) {
                                deps[fieldKey] = [];
                            }
                            deps[fieldKey].push([field.key, radioOption.value]);
                        }
                    }
                });
            }
        }
        return deps;
    }, [fields]);

    const handleCancel = () => {
        onBack();
    };

    useEffect(() => {
        const getFlows = async () => {
            // 设置为流程名称
            microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
                functionid: functionId,
                title: "",
            });
            try {
                const { data } = await API.automation.dagDagIdGet(taskId);
                dagDataRef.current = data;
                const param: Record<string, any> | undefined = data?.steps[0]?.parameters;
                microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
                    functionid: functionId,
                    title: data?.title || "",
                });
                const fields: Field[] = (param as Record<string, any>)?.fields || [];
                setFields(fields);
                // 表单为空直接提交
                if (!param?.fields || param.fields?.length === 0) {
                    onFinish({});
                } else {
                    const values: any = {};
                    if (fields?.length) {
                        fields.forEach((field) => {
                            if (field.type === FileTriggerFieldTypes.AsPerm) {
                                values[field.key] = {
                                    allow: [],
                                    deny: [],
                                };
                            }
                            if (field.type === FileTriggerFieldTypes.Datetime) {
                                values[field.key] = "";
                            }
                            if (field.type === FileTriggerFieldTypes.String || field.type === FileTriggerFieldTypes.Long_string) {
                                values[field.key] = "";
                            }
                            if (field.defaultValue) {
                                values[field.key] = field.defaultValue;
                            }
                        });
                        form.setFieldsValue(values);
                    }

                    setLoading(false);
                }
            } catch (error: any) {
                // 任务不存在
                if (error?.response?.data?.code === "ContentAutomation.TaskNotFound") {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t("err.flow.notFount", "工作流程已不存在。", {
                            name: dagDataRef.current?.title || "",
                        }),
                        okText: t("ok", "确定"),
                        onOk: handleCancel,
                    });
                    return;
                }
                // 自动化被禁用
                if (error?.response?.data?.code === "ContentAutomation.Forbidden.ServiceDisabled") {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t("err.disable", "当前功能暂不可用，请联系管理员。"),
                        okText: t("ok"),
                        onOk: handleCancel,
                    });
                    return;
                }
                handleErr({ error: error?.response });
            }
        };
        if (taskId) {
            getFlows();
        }
    }, [taskId]);

    const isAsComponent = (type: FileTriggerFieldTypes) =>
        [
            FileTriggerFieldTypes.AsTags,
            FileTriggerFieldTypes.AsMetadata,
            FileTriggerFieldTypes.AsLevel,
            // FileTriggerFieldTypes.AsAccessorPerms,
        ].includes(type);

    return isLoading ? (
        <div className={styles["loading-container"]}>
            <Spin></Spin>
        </div>
    ) : (
        <div className={styles["form-container"]}>
            <Form
                initialValues={initialValues}
                form={form}
                id="file-trigger-form"
                className={styles["form"]}
                labelAlign="left"
                onFinish={onFinish}
                autoComplete="off"
                colon={true}
                layout="vertical"
                onFieldsChange={() => {
                    setValues(form.getFieldsValue() || {});
                }}
                onFinishFailed={({ errorFields }) => {
                    // 获取第一个校验失败的字段
                    if (errorFields && errorFields.length > 0) {
                        try {
                            // 滚动到第一个错误字段
                            const element = document.querySelector(".CONTENT_AUTOMATION-ant-form-item-has-error");
                            if (element) {
                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } catch (error) {
                            console.warn(error)
                        }
                    }
                }}
            >
                {fields?.map((field, index) => {
                    if (deps[field.key] && !deps[field.key].some(([key, value]) => values[key] === value)) return null;
                    // 描述
                    let description = null;
                    if (field.description?.text) {
                        if (field.description?.type === DescriptionType.FileLink) {
                            description = (
                                <div>
                                    <Typography.Text
                                        ellipsis
                                        title={field.description.text}
                                        className={styles["link"]}
                                        onClick={() => {
                                            microWidgetProps?.contextMenu?.previewFn({
                                                functionid: functionId,
                                                item: {
                                                    docid: field.description?.docid,
                                                    size: 1,
                                                    name: field.description?.name || "",
                                                },
                                            });
                                        }}
                                    >
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        } else if (field.description?.type === DescriptionType.UrlLink) {
                            description = (
                                <div>
                                    <Typography.Text
                                        ellipsis
                                        title={field.description.text}
                                        className={styles["link"]}
                                        onClick={() => {
                                            microWidgetProps?.history?.openBrowser(concatProtocol(field.description?.link));
                                        }}
                                    >
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        } else {
                            description = (
                                <div>
                                    <Typography.Text ellipsis title={field.description.text} className={styles["description"]}>
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        }
                    }
                    return (
                        <Form.Item
                            key={field.key}
                            name={field.key}
                            label={
                                <>
                                    <Typography.Text>
                                        {t("fileTrigger.index", {
                                            index: index + 1,
                                        }) + field.name}
                                    </Typography.Text>
                                    {description}
                                </>
                            }
                            rules={
                                field.required
                                    ? [
                                        {
                                            required: true,
                                            message: isAsComponent(field.type as FileTriggerFieldTypes) ? "" : t(`emptyMessage`),
                                            validator: (rule, value) => {
                                                if (!value && value !== 0) {
                                                    return Promise.reject(false);
                                                }

                                                if (isArray(value) && value.length === 0) {
                                                    return Promise.reject(false);
                                                }
                                                if (field.type === "asPerm" && value?.allow.length === 0 && value?.deny.length === 0) {
                                                    return Promise.reject(false);
                                                }
                                                return Promise.resolve(true);
                                            },
                                        },
                                    ]
                                    : undefined
                            }
                        >
                            {(() => {
                                switch (field.type) {
                                    case FileTriggerFieldTypes.AsPerm:
                                        return <AsPermSelect key={field.key} />;
                                    case FileTriggerFieldTypes.String:
                                        return <Input className={styles["input"]} placeholder={t("form.placeholder", "请输入")} />;
                                    case FileTriggerFieldTypes.Long_string:
                                        return <Input.TextArea className={styles["textarea"]} placeholder={t("form.placeholder", "请输入")} />;
                                    case FileTriggerFieldTypes.Number:
                                        return (
                                            <InputNumber
                                                style={{
                                                    width: "100%",
                                                }}
                                                placeholder={t("form.placeholder", "请输入")}
                                                precision={0}
                                                min={1}
                                            />
                                        );
                                    case FileTriggerFieldTypes.Radio:
                                        return (
                                            <Radio.Group>
                                                <Space direction="vertical">
                                                    {field.data?.map((item) => {
                                                        const value = item && typeof item === "object" ? item.value : item;
                                                        return (
                                                            <Radio value={value}>
                                                                <Typography.Text ellipsis title={value}>
                                                                    {value}
                                                                </Typography.Text>
                                                            </Radio>
                                                        );
                                                    })}
                                                </Space>
                                            </Radio.Group>
                                        );
                                    case FileTriggerFieldTypes.AsFile:
                                        return <AsFileSelect selectType={1} multiple={false} title={t("selectFile", "选择文件")} placeholder={t("select.placeholder", "请选择")} allowClear />;
                                    case FileTriggerFieldTypes.MultipleFiles:
                                        return <AsFileSelect selectType={1} multiple={true} multipleMode="list" checkDownloadPerm={true} title={t("selectFile", "选择文件")} placeholder={t("select.placeholder", "请选择")} />;
                                    case FileTriggerFieldTypes.AsFolder:
                                        return <AsFileSelect selectType={2} multiple={false} title={t("selectFolder", "选择文件夹")} placeholder={t("select.placeholder", "请选择")} allowClear />;
                                    case FileTriggerFieldTypes.Datetime:
                                        return (
                                            <DatePickerISO
                                                showTime
                                                popupClassName="automate-oem-primary"
                                                style={{
                                                    width: "100%",
                                                }}
                                            />
                                        );

                                    case FileTriggerFieldTypes.AsTags:
                                        return <AsTags ref={refs[index]} items={selectItems} required={field.required} />;

                                    case FileTriggerFieldTypes.AsMetadata:
                                        return <AsMetaData ref={refs[index]} items={selectItems} required={field.required} />;
                                    case FileTriggerFieldTypes.AsUsers:
                                        return (
                                            <AsUserSelect
                                                selectPermission={2}
                                                groupOptions={{
                                                    select: 3,
                                                    drillDown: 1,
                                                }}
                                                isBlockContact
                                                children={AsUserSelectChildRender}
                                            />
                                        );
                                    case FileTriggerFieldTypes.AsDepartments:
                                        return <AsUserSelect selectPermission={1} isBlockGroup isBlockContact children={AsUserSelectChildRender} />;
                                    case FileTriggerFieldTypes.AsLevel:
                                        return <AsLevel ref={refs[index]} items={selectItems} required={field.required} />;
                                    // case FileTriggerFieldTypes.AsAccessorPerms:
                                    //     return (
                                    //         <AsShare
                                    //             ref={refs[index]}
                                    //             items={selectItems}
                                    //             required={field.required}
                                    //         />
                                    //     );

                                    default:
                                        return <Input placeholder={t("stringPlaceholder", "请输入内容")} />;
                                }
                            })()}
                        </Form.Item>
                    );
                })}
            </Form>
            <div className={styles["footer"]}>
                <Space>
                    <Button className={clsx(styles["footer-btn-ok"], "automate-oem-primary-btn")} onClick={onSubmit} type="primary">
                        {t("ok", "确定")}
                    </Button>
                    <Button className={styles["footer-btn-cancel"]} onClick={handleCancel} type="default">
                        {t("cancel", "取消")}
                    </Button>
                </Space>
            </div>
        </div>
    );
};
