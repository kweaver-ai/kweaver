import React, { FC, useContext, useLayoutEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "antd";
import { assign, find, keys, omit } from "lodash";
import { API, MicroAppContext, TranslateFn } from "@applet/common";
import { PlusOutlined } from "@applet/icons";
import { useHandleErrReq } from "../../utils/hooks";
import { NewTemplate } from "./new-template";
import { TemplateCard } from "./template-card";
import styles from "./styles/metadata-template.module.less";
import { getDicts } from "../workflow-plugin-details";

export interface TemplateItem {
    key: string;
    [field: string]: any;
}

export const transformFrom = (values: any) => {
    const data = keys(values)?.map((key: string) => {
        return { key, ...values[key] };
    });
    return data;
};

export const transformTo = (values: any[]) => {
    if (values.length === 0) {
        return undefined;
    }
    const results = {};
    values.forEach((item: any) => {
        assign(results, { [item.key]: omit(item, "key") });
    });
    return results;
};

interface MetaDataType {
    dicts: Record<string, any>;
}

export const MetaDataContext = React.createContext<MetaDataType>({ dicts: {} });

export const MetaDataTemplate: FC<{
    docType: "file" | "folder";
    t: TranslateFn;
    value?: any[];
    onChange?(fields: any): void;
}> = (props) => {
    const { value, docType, t, onChange } = props;
    const isControlled = "value" in props;

    const [editingKey, setEditingKey] = useState<string>("");
    const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
    // 数据字典
    const [dictItems, setDicItems] = useState<Record<string, any>>({});
    const { microWidgetProps, message, modal, platform } =
        useContext(MicroAppContext);

    const handleErr = useHandleErrReq();

    useLayoutEffect(() => {
        if (isControlled) {
            setTemplatesList(value ? transformFrom(value) : []);
        }
    }, [value, isControlled]);

    // 编目模板
    const { data, isValidating } = useSWR(
        ["getMetaTemplates"],
        () => {
            return API.metadata.metadataV1TemplatesGet(1000, 0, "aishu");
        },
        {
            dedupingInterval: 0,
            revalidateOnFocus: false,
            onSuccess(data) {
                if (data?.data.entries) {
                    // 过滤无效编目
                    let flag = false;
                    const filterList = templatesList.filter((item) => {
                        if (find(data.data.entries, ["key", item.key])) {
                            return true;
                        } else {
                            flag = true;
                            return false;
                        }
                    });
                    if (flag) {
                        if (isControlled) {
                            onChange && onChange(transformTo(filterList));
                        } else {
                            setTemplatesList(filterList);
                        }
                    }
                    // 生成字典
                    setDicItems(getDicts(data?.data.entries));
                }
            },
            onError(error: any) {
                handleErr({ error: error?.response });
            },
        }
    );

    // 添加编目
    const handleAdd = async () => {
        if (data?.data.count === 0) {
            message.info(
                t(
                    "metadata.noCatalogue",
                    "暂无法添加编目，管理员未设置编目模板"
                )
            );
            return;
        }
        try {
            const { data: sysConfig } =
                await API.metadata.metadataV1SysconfigGet();
            const maxSize =
                sysConfig?.catalogue?.file_template_upper_limit || 1;
            if (templatesList.length === data?.data.count) {
                message.warning(
                    t("metadata.addAllTemplate", "您已添加全部编目模板")
                );
            } else if (templatesList.length < maxSize) {
                // 新建
                setEditingKey("new");
            } else {
                message.warning(
                    t(`metadata.overLimit.${docType}`, {
                        limit: maxSize,
                    })
                );
            }
        } catch (error: any) {
            handleErr({ error: error?.response });
        }
    };

    const handleAddItem = (data?: any) => {
        if (isControlled) {
            onChange && onChange(transformTo([data, ...templatesList]));
        } else {
            setTemplatesList((pre) => {
                const newList = [data, ...pre];
                return newList;
            });
        }
        setEditingKey("");
    };

    const handleEditItem = (key: string, data?: any) => {
        const newList = templatesList.map((item: any) => {
            if (item.key === key) {
                return { key, ...data };
            }
            return item;
        });
        if (isControlled) {
            onChange && onChange(transformTo(newList));
        } else {
            setTemplatesList(newList);
        }
        setEditingKey("");
    };

    const handleDelete = async (key: string, name: string) => {
        let res;
        if (platform === "console") {
            res = await modal.confirm({
                title: t("warning.title", "提示"),
                content: t("metadata.confirmDelete", { name }),
                okText: t("ok", "确定"),
                cancelText: t("cancel", "取消"),
                className: styles["confirm"],
                onOk() {
                    if (isControlled) {
                        onChange &&
                            onChange(
                                transformTo(
                                    templatesList.filter(
                                        (item: any) => item.key !== key
                                    )
                                )
                            );
                    } else {
                        setTemplatesList((data) => {
                            return data.filter((item: any) => item.key !== key);
                        });
                    }
                },
            });
        } else {
            res = await microWidgetProps?.components?.messageBox({
                type: "warning",
                title: t("warning.title", "提示"),
                message: t("metadata.confirmDelete", { name }),
                buttons: [
                    { label: t("ok", "确定"), type: "primary" },
                    { label: t("cancel", "取消"), type: "normal" },
                ],
            });
            if (res?.button === 0) {
                if (isControlled) {
                    onChange &&
                        onChange(
                            transformTo(
                                templatesList.filter(
                                    (item: any) => item.key !== key
                                )
                            )
                        );
                } else {
                    setTemplatesList((data) => {
                        return data.filter((item: any) => item.key !== key);
                    });
                }
            }
        }
    };

    const handleSwitchEdit = (key: string) => {
        setEditingKey(key);
    };

    const handleCancel = () => {
        setEditingKey("");
    };

    return (
        <MetaDataContext.Provider value={{ dicts: dictItems }}>
            {editingKey !== "new" ? (
                <Button
                    type="link"
                    className={styles["link-btn"]}
                    icon={<PlusOutlined className={styles["add-icon"]} />}
                    disabled={Boolean(editingKey)}
                    onClick={handleAdd}
                >
                    {t("metadata.templates.new", "添加编目")}
                </Button>
            ) : (
                <NewTemplate
                    templatesList={templatesList}
                    templates={data?.data?.entries || []}
                    isLoading={isValidating}
                    onAdd={handleAddItem}
                    onCancel={handleCancel}
                    t={t}
                />
            )}
            {templatesList.length > 0 &&
                templatesList.map((item: any) => (
                    <TemplateCard
                        key={item.key}
                        value={item}
                        templates={data?.data.entries || []}
                        editingKey={editingKey}
                        switchEdit={handleSwitchEdit}
                        onEdit={handleEditItem}
                        onDelete={handleDelete}
                        t={t}
                    />
                ))}
        </MetaDataContext.Provider>
    );
};
