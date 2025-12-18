import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Form, FormInstance, Select } from "antd";
import clsx from "clsx";
import { find, omit, trim } from "lodash";
import {
    TemplateEntriesFieldBaseInfo,
    TemplateEntriesFieldBaseInfoString,
    TemplateResInfo,
} from "@applet/api/lib/metadata";
import { TranslateFn } from "@applet/common";
import { FormItem } from "../editor/form-item";
import { RenderItem } from "./render-item";
import { TemplateItem } from "./metadata-template";
import { AttrType, StringTypeEnum, fieldsType } from "./metadata.type";
import styles from "./styles/render-form.module.less";

interface RenderFormProps {
    mode: "new" | "edit" | "view";
    templates: TemplateResInfo[];
    templatesToSelect?: TemplateResInfo[];
    isLoading: boolean;
    isEditing: boolean; //编辑中则显示属性说明
    fields: TemplateEntriesFieldBaseInfo[];
    templateKey: string;
    value?: TemplateItem;
    onFinish: (value: any) => void;
    onSelectTemplate?: (value: TemplateResInfo) => void;
    t: TranslateFn;
}

export interface RefProps {
    form: FormInstance;
}

// 判断是否支持选择变量
export const judgeAllowVariable = (type: string) => {
    switch (type) {
        case AttrType.INT:
        case AttrType.STRING:
        case AttrType.FLOAT:
        case AttrType.LONG_STRING:
            return true;
        default:
            return false;
    }
};

export const RenderForm = forwardRef<RefProps, RenderFormProps>(
    (
        {
            mode,
            templates,
            templatesToSelect,
            fields,
            templateKey,
            value,
            isLoading,
            isEditing,
            onFinish,
            onSelectTemplate,
            t,
        },
        ref
    ) => {
        const [form] = Form.useForm();
        useImperativeHandle(ref, () => ({ form }));

        useEffect(() => {
            if (mode !== "new") {
                form.setFieldsValue(omit(value, ["key"]));
            }
        }, [mode]);

        const getValidator = (el: TemplateEntriesFieldBaseInfo) => {
            return {
                validator: (_: unknown, value: any) => {
                    if (el.required) {
                        //  为空校验，需单独判断时长和数组
                        if (
                            (value === null && fieldsType.includes(el.type)) ||
                            (typeof value === "string" &&
                                trim(value).length === 0) ||
                            (el.type === AttrType.DURATION && value === 0) ||
                            (el.type === AttrType.MULTISELECT &&
                                value?.length === 0)
                        ) {
                            return Promise.reject(new Error(t("emptyMessage")));
                        }
                    }

                    // 如果是变量，则check类型不校验
                    if (/^\{\{(__(\d+).*)\}\}$/.test(value)) {
                        return Promise.resolve();
                    }

                    // 根据check类型校验
                    if (el.type === AttrType.STRING) {
                        // 非必填项时可为空
                        if (!el.required && (value === "" || value === null)) {
                            return Promise.resolve();
                        }
                        if (
                            (el as TemplateEntriesFieldBaseInfoString).check ===
                                StringTypeEnum.PhoneNum &&
                            !/^((\d{3,4}-)?\d{7,8})$|^1[3456789]\d{9}$/.test(
                                value
                            )
                        ) {
                            return Promise.reject(
                                new Error(
                                    t("metadata.phoneNum.error", "电话格式错误")
                                )
                            );
                        }
                        if (
                            (el as TemplateEntriesFieldBaseInfoString).check ===
                                StringTypeEnum.IdCard &&
                            !/^[1-9]\d{5}\d{4}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(
                                value
                            )
                        ) {
                            return Promise.reject(
                                new Error(
                                    t(
                                        "metadata.idCard.error",
                                        "身份证号输入有误"
                                    )
                                )
                            );
                        }
                        if (
                            (el as TemplateEntriesFieldBaseInfoString).check ===
                                StringTypeEnum.Email &&
                            !/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(
                                value
                            )
                        ) {
                            return Promise.reject(
                                new Error(
                                    t(
                                        "metadata.email.error",
                                        "邮箱地址只能包含英文、数字及@-_.字符，长度范围5~100个字符，请重新输入"
                                    )
                                )
                            );
                        }
                    }

                    return Promise.resolve();
                },
            };
        };

        return (
            <Form
                name="metaForm"
                form={form}
                className={clsx(styles["form"], {
                    [styles["isView"]]: !isEditing,
                })}
                labelAlign="left"
                onFinish={onFinish}
                autoComplete="off"
                colon={false}
                requiredMark={isEditing ? true : false}
                labelCol={{
                    style: {
                        width: isEditing ? "300px" : "108px",
                        marginLeft: isEditing ? "16px" : "8px",
                    },
                }}
                wrapperCol={
                    isEditing
                        ? {
                              style: { paddingLeft: "16px" },
                          }
                        : undefined
                }
            >
                {mode === "new" && (
                    <Form.Item
                        className={clsx(styles["template-select"])}
                        name={"key"}
                        label={t("metadata.selectTemplate", "选择编目模板")}
                        labelCol={{
                            style: { width: "116px" },
                        }}
                        wrapperCol={{
                            style: { paddingLeft: 0 },
                        }}
                    >
                        <Select
                            onChange={(value: string) => {
                                const selectItem = find(templates, [
                                    "key",
                                    value,
                                ]) as TemplateResInfo;
                                onSelectTemplate &&
                                    onSelectTemplate(selectItem);
                            }}
                            loading={isLoading}
                            listHeight={230}
                            placeholder={t(
                                "metadata.template.placeholder",
                                "请选择编目模板"
                            )}
                        >
                            {templatesToSelect?.map((template) => (
                                <Select.Option
                                    key={template.key}
                                    value={template.key}
                                    title={template.display_name}
                                >
                                    {template.display_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                {fields?.map((el: TemplateEntriesFieldBaseInfo) => {
                    return (
                        <>
                            <FormItem
                                required={Boolean(el?.required)}
                                allowVariable={
                                    isEditing
                                        ? judgeAllowVariable(el.type)
                                        : false
                                }
                                type={
                                    el.type === AttrType.INT
                                        ? "number"
                                        : "string"
                                }
                                name={el.key}
                                key={el.key}
                                label={
                                    <div className={styles["label-wrapper"]}>
                                        <div
                                            className={styles["label"]}
                                            title={el.display_name}
                                        >
                                            {el.display_name}
                                        </div>
                                        {!isEditing && t("colon", "：")}
                                        {(el as any)?.search_supported ===
                                            false &&
                                            isEditing && (
                                                <div
                                                    className={
                                                        styles["notSupport-tip"]
                                                    }
                                                >
                                                    {t(
                                                        "metadata.search.notSupport",
                                                        "不支持搜索"
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                }
                                className={clsx(styles["form-item"], {
                                    [styles["hidden"]]: !fieldsType.includes(
                                        el.type
                                    ),
                                })}
                                validateTrigger={"onBlur"}
                                rules={[getValidator(el)]}
                            >
                                <RenderItem
                                    key={el.key}
                                    t={t}
                                    el={el}
                                    mode={mode}
                                    isEditing={isEditing}
                                    templateKey={templateKey}
                                />
                            </FormItem>
                        </>
                    );
                })}
            </Form>
        );
    }
);
