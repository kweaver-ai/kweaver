import { Form, Input } from "antd";
import styles from "./styles/ability-details.module.less";
import moment from "moment";
import React, { useEffect, useImperativeHandle, useState } from "react";
import { useTranslate } from "@applet/common";

interface AbilityDetailsProps {
    data: Record<string, any>;
    onChange: (val: Record<string, any>) => void;
}

export interface DetailsValidate {
    validate: () => boolean | Promise<boolean>;
    duplicateName: (valid: boolean) => void;
}

const formatDate = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
    if (!timestamp) {
        return "";
    }
    return moment(timestamp).format(format);
};

export const AbilityDetails = React.forwardRef<
    DetailsValidate,
    AbilityDetailsProps
>(({ data, onChange }, ref) => {
    const [form] = Form.useForm();
    const [duplicateName, setDuplicateName] = useState(false);
    const t = useTranslate();

    useImperativeHandle(
        ref,
        () => {
            return {
                validate() {
                    return form.validateFields().then(
                        () => true,
                        () => false
                    );
                },
                duplicateName(valid) {
                    setDuplicateName(valid);
                    setTimeout(() => {
                        form.validateFields();
                    }, 10);
                },
            };
        },
        [form]
    );

    useEffect(() => {
        form.setFieldsValue(data);
    }, [data, form]);

    return (
        <div className={styles["details"]}>
            <div className={styles["title"]}>
                {t("ability.details", "能力详细信息")}
            </div>

            <Form
                name="ability-details"
                form={form}
                labelAlign="left"
                className={styles["form"]}
                autoComplete="off"
                colon={false}
                requiredMark={false}
                initialValues={data}
                onFieldsChange={() => onChange(form.getFieldsValue())}
                layout="horizontal"
                labelCol={{
                    style: {
                        width: "108px",
                    },
                }}
            >
                <Form.Item
                    name="name"
                    label={t("label.abilityName", "能力名称：")}
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                        {
                            pattern: /^[^#\\/:*?"<>|]{0,255}$/,
                            message: t("invalidFileName"),
                        },
                        {
                            validator: () => {
                                if (duplicateName) {
                                    return Promise.reject(
                                        new Error(
                                            t(
                                                "rename.duplicatedName",
                                                "该名称已被占用，请重新命名。"
                                            )
                                        )
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input
                        style={{ width: "320px" }}
                        placeholder={t("form.placeholder", "请输入")}
                        onChange={() => {
                            setDuplicateName(false);
                        }}
                    ></Input>
                </Form.Item>
                <Form.Item
                    name="description"
                    label={t("label.abilityDescription", "能力描述：")}
                >
                    <Input
                        style={{ width: "320px" }}
                        placeholder={t("form.placeholder", "请输入")}
                    ></Input>
                </Form.Item>
                <Form.Item
                    name="status"
                    label={t("label.abilityStatus", "能力状态：")}
                >
                    <FormStatusItem />
                </Form.Item>
                <Form.Item
                    name="created_at"
                    label={t("taskInfo.created_at", "创建时间：")}
                >
                    <FormDateItem />
                </Form.Item>
                <Form.Item
                    name="updated_at"
                    label={t("taskInfo.updated_at", "更新时间：")}
                >
                    <FormDateItem />
                </Form.Item>
            </Form>
        </div>
    );
});

const FormStatusItem = ({ value }: any) => {
    const t = useTranslate();

    return (
        <div>
            {value === 1 ? (
                <span>{t("model.status.published", "已发布")}</span>
            ) : (
                <div>
                    <span>{t("model.status.unPublished", "未发布")}</span>
                    <span className={styles["tip"]}>
                        {t("model.flowTip", "发布后可在工作流中运用")}
                    </span>
                </div>
            )}
        </div>
    );
};

const FormDateItem = ({ value }: any) => {
    return <div>{formatDate(value) || "---"}</div>;
};
