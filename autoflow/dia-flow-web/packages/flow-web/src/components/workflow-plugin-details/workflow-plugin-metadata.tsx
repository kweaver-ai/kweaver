import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, Divider, Form, Modal, Typography } from "antd";
import { API, useTranslate } from "@applet/common";
import { WorkflowContext } from "../workflow-provider";
import { CloseOutlined } from "@applet/icons";
import { TemplateResInfo } from "@applet/api/lib/metadata";
import styles from "./styles/workflow-plugin-metadata.module.less";
import { AttrValue } from "../metadata-template/render-item";
import { AttrType } from "../metadata-template";

interface WorkflowPluginMetadataProps {
    data: Record<string, Record<string, any>>;
}

export const getDicts = (entries: any[] = []) => {
    const dicts: Record<string, any> = {};
    entries.forEach((item) => {
        const supportDictItems = item.fields.filter(
            (i: any) =>
                (i.type === AttrType.MULTISELECT || i.type === AttrType.ENUM) &&
                i?.options_dict?.status === "open" &&
                i?.options_dict_items?.length
        );
        if (supportDictItems.length) {
            const dict = {};
            supportDictItems.forEach((i: any) => {
                generateDict(dict, i.options_dict_items);
            });
            dicts[item.key] = dict;
        }
    });
    return dicts;
};

export const generateDict = (dict: Record<string, any>, options: any[]) => {
    options.forEach((element) => {
        dict[element.id] = { id: element.id, text: element.text };
        if (element.children.length > 0) {
            generateDict(dict, element.children);
        }
    });
};

export const WorkflowPluginMetadata: FC<WorkflowPluginMetadataProps> = ({
    data: metaData,
}) => {
    const { process } = useContext(WorkflowContext);
    const [templates, setTemplates] = useState<TemplateResInfo[]>([]);
    // 数据字典
    const [dictItems, setDicItems] = useState<Record<string, any>>({});
    const [isShowModal, setShowModal] = useState(false);
    const isUploadStrategy = useMemo(() => {
        return process?.audit_type === "security_policy_upload";
    }, [process?.audit_type]);
    const t = useTranslate();

    const parseData = useMemo(() => {
        if (typeof metaData === "string") {
            try {
                return JSON.parse(metaData);
            } catch (error) {
                return metaData;
            }
        }
        return metaData;
    }, [metaData]);

    useEffect(() => {
        const getTemplates = async () => {
            let parseData = metaData;
            if (typeof metaData === "string") {
                try {
                    parseData = JSON.parse(metaData);
                } catch (error) {
                    console.error(error);
                }
            }
            try {
                const {
                    data: { entries },
                } = await API.metadata.metadataV1TemplatesGet(1000, 0, "aishu");
                setTemplates(
                    entries.filter((item) => {
                        if (parseData[item.key]) {
                            return true;
                        }
                        return false;
                    })
                );

                setDicItems(getDicts(entries));
            } catch (error) {
                console.error(error);
            }
        };
        getTemplates();
    }, []);

    return (
        <>
            <Button type="link" onClick={() => setShowModal(true)}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={420}
                title={t("metadata", "编目")}
                open={isShowModal}
                className={styles["modal"]}
                mask
                centered
                transitionName=""
                onCancel={() => {
                    setShowModal(false);
                }}
                destroyOnClose
                footer={null}
                closeIcon={<CloseOutlined style={{ fontSize: "13px" }} />}
            >
                <div className={styles["content"]}>
                    {isUploadStrategy && (
                        <div className={styles["description"]}>
                            {t("upload.metadata", { name: process?.user_name })}
                        </div>
                    )}
                    <div>
                        {templates.map((template) => (
                            <>
                                <div className={styles["template-name"]}>
                                    <Typography.Text
                                        ellipsis
                                        title={template.display_name || ""}
                                    >
                                        {template.display_name || "---"}
                                    </Typography.Text>
                                </div>
                                <Divider style={{ margin: "8px 0" }}></Divider>
                                <Form
                                    className={styles["form"]}
                                    labelAlign="left"
                                    colon={false}
                                    labelCol={{
                                        style: {
                                            width: "108px",
                                        },
                                    }}
                                >
                                    {template.fields.map((field) => (
                                        <div>
                                            <Form.Item
                                                className={styles["form-item"]}
                                                label={
                                                    <div
                                                        className={
                                                            styles[
                                                                "label-wrapper"
                                                            ]
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles["label"]
                                                            }
                                                            title={
                                                                field.display_name
                                                            }
                                                        >
                                                            {field.display_name}
                                                        </div>
                                                        <span>
                                                            {t("colon")}
                                                        </span>
                                                    </div>
                                                }
                                            >
                                                <div>
                                                    <AttrValue
                                                        type={field.type}
                                                        value={
                                                            parseData[
                                                                template.key
                                                            ][field.key]
                                                        }
                                                        dicts={
                                                            dictItems[
                                                                template.key
                                                            ]
                                                        }
                                                        useDict={Boolean(
                                                            (field as any)
                                                                ?.options_dict
                                                                ?.id
                                                        )}
                                                    />
                                                </div>
                                            </Form.Item>
                                        </div>
                                    ))}
                                </Form>
                            </>
                        ))}
                    </div>
                </div>
            </Modal>
        </>
    );
};
