import { useMemo, useRef, useState } from "react";
import { find } from "lodash";
import { Button } from "antd";
import clsx from "clsx";
import {
    DeleteOutlined,
    FormOutlined,
    SelectOutlined,
    SelectPackUpOutlined,
} from "@applet/icons";
import { TemplateResInfo } from "@applet/api/lib/metadata";
import { TranslateFn } from "@applet/common";
import { AttrType } from "./metadata.type";
import { RefProps, RenderForm } from "./render-form";
import styles from "./styles/template-card.module.less";

interface TemplateCardProps {
    value: any;
    templates: TemplateResInfo[];
    editingKey?: string;
    switchEdit: (key: string) => void;
    onEdit: (key: string, data: any) => void;
    onDelete: (key: string, name: string) => void;
    t: TranslateFn;
}

export const TemplateCard = ({
    value,
    templates,
    editingKey,
    switchEdit,
    onEdit,
    onDelete,
    t,
}: TemplateCardProps) => {
    const [isOpen, setIsOpen] = useState(true);
    const formRef = useRef<RefProps>(null);

    const isEditing = useMemo(
        () => Boolean(editingKey && editingKey === value.key),
        [editingKey, value.key]
    );
    const currentTemplate = useMemo(() => {
        const item = find(templates, ["key", value.key]);
        return item as TemplateResInfo;
    }, [templates]);

    const handleFinish = (values: any) => {
        // 数据格式处理
        const data = { ...values };
        currentTemplate?.fields?.forEach((field) => {
            const fieldValue = data[field.key];
            if (
                field.type === AttrType.INT &&
                !/^\{\{(__(\d+).*)\}\}$/.test(fieldValue)
            ) {
                data[field.key] = fieldValue ? Number(fieldValue) : null;
            }
            if (field.type === AttrType.DURATION) {
                data[field.key] = fieldValue ? Number(fieldValue) : 0;
            }
        });
        onEdit(value.key, data);
    };

    return (
        <div className={styles["card"]}>
            <div className={styles["header"]}>
                <div
                    title={currentTemplate?.display_name}
                    className={styles["template-title"]}
                >
                    {currentTemplate?.display_name}
                </div>
                {isEditing ? null : (
                    <div
                        style={{
                            opacity: editingKey ? 0.35 : 1,
                        }}
                        className={clsx(styles["operation"], {
                            [styles["disable"]]: editingKey,
                        })}
                    >
                        <div
                            className={styles["operation-icon"]}
                            onClick={() => !editingKey && switchEdit(value.key)}
                            title={t("edit", "编辑")}
                        >
                            <FormOutlined />
                        </div>
                        <div
                            className={styles["operation-icon"]}
                            onClick={() =>
                                !editingKey &&
                                onDelete(
                                    value.key,
                                    currentTemplate.display_name
                                )
                            }
                            title={t("delete", "删除")}
                        >
                            <DeleteOutlined />
                        </div>
                        <div
                            className={styles["operation-icon"]}
                            onClick={() => setIsOpen((pre) => !pre)}
                            title={
                                isOpen
                                    ? t("collapse", "收起")
                                    : t("expand", "展开")
                            }
                        >
                            {isOpen ? (
                                <SelectOutlined style={{ fontSize: 10 }} />
                            ) : (
                                <SelectPackUpOutlined
                                    style={{ fontSize: 10 }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            {isOpen && (
                <RenderForm
                    mode={isEditing ? "edit" : "view"}
                    t={t}
                    templates={templates}
                    fields={currentTemplate?.fields || []}
                    templateKey={currentTemplate?.key || ""}
                    value={value}
                    onFinish={handleFinish}
                    isLoading={false}
                    isEditing={isEditing}
                    ref={formRef}
                />
            )}
            {isEditing && (
                <div className={styles["footer"]}>
                    <Button
                        type="primary"
                        className={clsx(
                            styles["ok-btn"],
                            "automate-oem-primary-btn"
                        )}
                        onClick={() => {
                            formRef.current && formRef.current.form.submit();
                        }}
                    >
                        {t("ok", "确定")}
                    </Button>
                    <Button
                        className={styles["cancel-btn"]}
                        onClick={() => {
                            switchEdit("");
                            formRef.current &&
                                formRef.current.form.setFieldsValue(value);
                        }}
                    >
                        {t("cancel", "取消")}
                    </Button>
                </div>
            )}
        </div>
    );
};
