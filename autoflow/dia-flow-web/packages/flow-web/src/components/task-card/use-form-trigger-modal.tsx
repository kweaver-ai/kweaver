import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Form, FormInstance, Input, InputNumber, Modal, Radio, Space, Typography } from "antd";
import { AsPermSelect, DatePickerISO, MicroAppContext, useTranslate } from "@applet/common";
import styles from "./task-card.module.less";
import { AsFileSelect } from "../as-file-select";
import { AsUserSelectChildRender } from "../file-trigger-form/childrenRender";
import { DescriptionType } from "../form-item-description";
import { concatProtocol } from "../../utils/browser";
import { DipUserSelect } from "./dip-user-select";

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
    allowOverride?: boolean;
    data?: (RelatedRatioItem | string)[];
    description?: Record<string, any>;
    default?: any;
}

export function isRelatedRatio(value?: RelatedRatioItem | string): value is RelatedRatioItem {
    return Boolean(value && typeof value === "object");
}

export function useFormTriggerModal() {
    const t = useTranslate();
    const [title, setTitle] = useState(t("formTriggerModal.title", "运行"));
    const [form] = Form.useForm();
    const { microWidgetProps, functionId } = useContext(MicroAppContext);
    const [fields, setFields] = useState<Field[]>();
    const [defer, setDefer] = useState<{
        onFinish(): void;
        onCancel(): void;
    }>();

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

    return [
        useCallback((fields: Field[], title?: string) => {
            if (title) {
                setTitle(title);
            }
            return new Promise((resolve, reject) => {
                const values: Record<string, any> = {};
                if (fields?.length) {
                    fields.forEach((field) => {
                        // 统一使用 field.default 作为默认值
                        values[field.key] = field.default;
                    });
                }

                setFields(fields);
                setValues(values);
                form.setFieldsValue(values);
                setDefer({
                    onFinish: (values?: any) => {
                        setFields(undefined);
                        resolve(values);
                    },
                    onCancel: () => {
                        setFields(undefined);
                        reject();
                    },
                });
            });
        }, []),
        useMemo(() => {
            return (
                <Modal
                    title={
                        <Typography.Text title={title} ellipsis>
                            {title}
                        </Typography.Text>
                    }
                    open={!!fields}
                    onOk={() => form.submit()}
                    onCancel={() => defer?.onCancel()}
                    className={styles["modal"]}
                    maskClosable={false}
                    destroyOnClose
                >
                    {fields ? (
                        <Form
                            form={form}
                            onFinish={defer?.onFinish}
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
                            {fields?.map((field) => {
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
                                        initialValue={field.default}
                                        label={
                                            <>
                                                <Typography.Text>{field.name + t("color", "：")}</Typography.Text>
                                                {description}
                                            </>
                                        }
                                        rules={
                                            field.required
                                                ? [
                                                    {
                                                        required: true,
                                                        message: t(`emptyMessage`),
                                                    },
                                                ]
                                                : []
                                        }
                                    >
                                        {(() => {
                                            switch (field.type) {
                                                case "number":
                                                    return (
                                                        <InputNumber
                                                            autoComplete="off"
                                                            placeholder={t("form.placeholder", "请输入")}
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            precision={0}
                                                            min={1}
                                                        />
                                                    );
                                                case "asFile":
                                                    return <AsFileSelect selectType={1} multiple={false} title={t("selectFile", "选择文件")} placeholder={t("select.placeholder", "请选择")} />;
                                                case "multipleFiles":
                                                    return <AsFileSelect selectType={1} multiple={true} multipleMode="list" checkDownloadPerm={true} title={t("selectFile", "选择文件")} placeholder={t("select.placeholder", "请选择")} />;
                                                case "asFolder":
                                                    return <AsFileSelect selectType={2} multiple={false} title={t("selectFolder", "选择文件夹")} placeholder={t("select.placeholder", "请选择")} />;
                                                case "datetime":
                                                    return (
                                                        <DatePickerISO
                                                            showTime
                                                            popupClassName="automate-oem-primary"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                        />
                                                    );
                                                case "asPerm":
                                                    return <AsPermSelect />;
                                                case "asUsers":
                                                    return (
                                                        <DipUserSelect
                                                            selectPermission={2}
                                                            groupOptions={{
                                                                select: 3,
                                                                drillDown: 1,
                                                            }}
                                                            isBlockContact
                                                            children={AsUserSelectChildRender}
                                                        />
                                                    );
                                                case "asDepartments":
                                                    return <DipUserSelect selectPermission={1} isBlockGroup isBlockContact children={AsUserSelectChildRender} />;
                                                case "radio":
                                                    return (
                                                        <Radio.Group>
                                                            <Space direction="vertical">
                                                                {field.data?.map((item: any) => {
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
                                                case "long_string":
                                                    return <Input.TextArea className={styles["textarea"]} placeholder={t("stringPlaceholder", "请输入内容")} />;
                                                default:
                                                    return <Input autoComplete="off" placeholder={t("stringPlaceholder", "请输入内容")} />;
                                            }
                                        })()}
                                    </Form.Item>
                                );
                            })}
                        </Form>
                    ) : null}
                </Modal>
            );
        }, [fields, defer, values]),
    ] as const;
}
