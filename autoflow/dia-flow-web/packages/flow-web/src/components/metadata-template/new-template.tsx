import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "antd";
import { MicroAppContext, TranslateFn } from "@applet/common";
import { TemplateResInfo } from "@applet/api/lib/metadata";
import { differenceBy } from "lodash";
import clsx from "clsx";
import { TemplateItem } from "./metadata-template";
import { RefProps, RenderForm } from "./render-form";
import { AttrType, fieldsType } from "./metadata.type";
import styles from "./styles/new-template.module.less";

interface NewTemplateProps {
    onAdd: (data?: any) => void;
    onCancel: () => void;
    templatesList: TemplateItem[];
    templates: TemplateResInfo[];
    t: TranslateFn;
    isLoading: boolean;
}

export const NewTemplate = ({
    onAdd,
    onCancel,
    templatesList,
    templates,
    t,
    isLoading,
}: NewTemplateProps) => {
    const [selectTemplate, setSelectTemplate] = useState<TemplateResInfo>();
    const formRef = useRef<RefProps>(null);

    const templatesToSelect = useMemo(() => {
        // 过滤已使用的编目模板
        return differenceBy(templates, templatesList, "key");
    }, [templatesList, templates]);

    const handleFinish = (values: any) => {
        // 数据格式处理
        const data = { ...values };
        selectTemplate?.fields?.forEach((field) => {
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
        onAdd(data);
    };

    return (
        <div>
            <div className={styles["new-template"]}>
                <RenderForm
                    mode="new"
                    templatesToSelect={templatesToSelect}
                    templates={templates}
                    fields={selectTemplate?.fields || []}
                    templateKey={selectTemplate?.key || ""}
                    onFinish={handleFinish}
                    onSelectTemplate={(data) => setSelectTemplate(data)}
                    isLoading={isLoading}
                    isEditing={true}
                    ref={formRef}
                    t={t}
                />
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
                        disabled={selectTemplate ? false : true}
                    >
                        {t("ok", "确定")}
                    </Button>
                    <Button className={styles["cancel-btn"]} onClick={onCancel}>
                        {t("cancel", "取消")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
