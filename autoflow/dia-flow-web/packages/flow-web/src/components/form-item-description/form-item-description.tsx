import { InfoCircleFilled, InfoCircleOutlined } from "@ant-design/icons";
import styles from "./styles.module.less";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { Button, Input, Menu, Popover, Space, Typography } from "antd";
import { CustomTextArea } from "../custom-textarea";
import { useContext, useEffect, useState } from "react";
import clsx from "clsx";
import { trim } from "lodash";
import { DeleteOutlined } from "@applet/icons";
import { MenuItemType } from "antd/lib/menu/hooks/useItems";

interface FormItemDescriptionProps {
    disable?: boolean;
    value?: any;
    onChange?: any;
    allowFileLink?: boolean;
}

export enum DescriptionType {
    Text = "text",
    FileLink = "FileLink",
    UrlLink = "urlLink",
}

export const FormItemDescription = ({
    disable = false,
    allowFileLink = true,
    value,
    onChange,
}: FormItemDescriptionProps) => {
    const [tab, setTab] = useState("text");
    const [description, setDescription] = useState("");
    const [text, setText] = useState("");
    const [fileId, setFileId] = useState("");
    const [fileName, setFileName] = useState("---");
    const [urlLink, setUrlLink] = useState("");
    const t = useTranslate();
    const { microWidgetProps, functionId } = useContext(MicroAppContext);
    const [errorStatus, setErrorStatus] = useState<string>();
    const [isSelecting, setIsSelecting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSelect = async () => {
        try {
            setIsSelecting(true);
            let selected: any = await microWidgetProps?.contextMenu?.selectFn({
                functionid: functionId,
                multiple: false,
                selectType: 1,
                title: t("selectFile", "选择文件"),
            });
            if (Array.isArray(selected)) {
                selected = selected[0];
            }
            setFileId(selected.docid);
            setFileName(selected.name);
            setErrorStatus(undefined);
        } catch (error) {
            if (error) {
                console.error(error);
            }
        } finally {
            setIsSelecting(false);
        }
    };

    const handleConfirm = () => {
        if (errorStatus) {
            return;
        }
        let val: any;
        if (tab === DescriptionType.Text) {
            val = {
                type: DescriptionType.Text,
                text: trim(description),
            };
        } else if (tab === DescriptionType.UrlLink) {
            const trimText = trim(text);
            if (trimText.length > 0 && !urlLink) {
                setErrorStatus("empty");
                return;
            }
            val = {
                type: DescriptionType.UrlLink,
                text: trimText,
                link: trimText ? urlLink : undefined,
            };
        } else {
            const trimText = trim(text);
            if (trimText.length > 0 && !fileId) {
                setErrorStatus("empty");
                return;
            }
            val = {
                type: DescriptionType.FileLink,
                text: trimText,
                docid: trimText ? fileId : undefined,
                name: trimText ? fileName : undefined,
            };
        }

        onChange(val);
        setOpen(false);
    };

    const reset = () => {
        setDescription("");
        setText("");
        setFileId("");
        setUrlLink("");
        setErrorStatus(undefined);
    };

    const handleCancel = () => {
        setOpen(false);
        setTab(DescriptionType.Text);
        reset();
    };

    useEffect(() => {
        async function getFileName() {
            try {
                const { data } = await API.efast.efastV1FileAttributePost({
                    docid: fileId,
                });
                setFileName(data.name);
            } catch (error: any) {
                if (
                    error?.response?.data?.code === 404002006 ||
                    error?.response?.data?.code === 404002005
                ) {
                    setErrorStatus("noFound");
                    return;
                }
                setFileName(value?.name || "---");
                console.error(error);
            }
        }
        if (fileId && open) {
            getFileName();
        }
    }, [fileId, open, value?.name]);

    useEffect(() => {
        if (open) {
            if (value?.type === DescriptionType.FileLink) {
                setTab(DescriptionType.FileLink);
                setText(value?.text);
                setFileId(value?.docid);
            } else if (value?.type === DescriptionType.UrlLink) {
                setTab(DescriptionType.UrlLink);
                setText(value?.text);
                setUrlLink(value?.link);
            } else {
                setTab(DescriptionType.Text);
                setDescription(value?.text);
            }
        }
    }, [
        open,
        value?.type,
        value?.docid,
        value?.text,
        value?.name,
        value?.link,
    ]);

    const getMenu = () => {
        let menuItems = [
            {
                label: (
                    <Typography.Text
                        ellipsis
                        title={t("description.tab.text", "文字描述")}
                    >
                        {t("description.tab.text", "文字描述")}
                    </Typography.Text>
                ),
                key: DescriptionType.Text,
            },
            // allowFileLink
            //     ? {
            //           label: (
            //               <Typography.Text
            //                   ellipsis
            //                   title={t("description.tab.link", "云端文档链接")}
            //               >
            //                   {t("description.tab.link", "云端文档链接")}
            //               </Typography.Text>
            //           ),
            //           key: DescriptionType.FileLink,
            //       }
            //     : undefined,
            // {
            //     label: (
            //         <Typography.Text
            //             ellipsis
            //             title={t("description.tab.urlLink", "链接")}
            //         >
            //             {t("description.tab.urlLink", "链接")}
            //         </Typography.Text>
            //     ),
            //     key: DescriptionType.UrlLink,
            // },
        ];
        return menuItems.filter(Boolean) as MenuItemType[];
    };

    const content = (
        <div className={styles["popover-content"]}>
            <div className={styles["tip"]}>
                {allowFileLink
                    ? t(
                          "description.title",
                          "请添加组件说明，可添加文字描述"
                      )
                    : t(
                          "description.title.text",
                          "请添加组件说明，可添加文字描述"
                      )}
            </div>
            <div className={styles["container"]}>
                <div className={styles["menu"]}>
                    <Menu
                        items={getMenu()}
                        selectedKeys={[tab]}
                        onClick={(info) => {
                            setTab(info.key);
                            if (info.key !== tab) {
                                reset();
                            }
                        }}
                    ></Menu>
                </div>
                <div className={styles["content"]}>
                    {tab === DescriptionType.Text ? (
                        <div className={styles["wrapper"]}>
                            <div className={styles["label"]}>
                                {t("description.text1", "描述文字：")}
                            </div>
                            <CustomTextArea
                                value={description}
                                onChange={(val) => {
                                    setDescription(val);
                                }}
                                placeholder={t(
                                    "description.text1.placeholder",
                                    "请输入描述"
                                )}
                                maxLength={300}
                            />
                        </div>
                    ) : tab === DescriptionType.UrlLink ? (
                        <div className={styles["wrapper"]}>
                            <div className={styles["label"]}>
                                {t("description.text2", "显示文字：")}
                            </div>
                            <Input
                                placeholder={t("form.placeholder")}
                                value={text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setText(val);
                                    if (!val && errorStatus) {
                                        setErrorStatus(undefined);
                                    }
                                }}
                                className={styles["input"]}
                            />
                            <div className={styles["label"]}>
                                {t("description.link", "链接：")}
                            </div>
                            <Input
                                placeholder={t(
                                    "description.link.placeholder",
                                    "请输入链接地址"
                                )}
                                value={urlLink}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setUrlLink(val);
                                    if (errorStatus === "empty") {
                                        setErrorStatus(undefined);
                                    }
                                }}
                            ></Input>
                            {errorStatus && (
                                <div className={styles["error-tip"]}>
                                    {errorStatus === "empty"
                                        ? t("emptyMessage", "此项不允许为空")
                                        : t(
                                              "err.404002006",
                                              "当前文档已不存在或其路径发生变更。"
                                          )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles["wrapper"]}>
                            <div className={styles["label"]}>
                                {t("description.text2", "显示文字：")}
                            </div>
                            <Input
                                placeholder={t("form.placeholder")}
                                value={text}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setText(val);
                                    if (!val && errorStatus) {
                                        setErrorStatus(undefined);
                                    }
                                }}
                                className={styles["input"]}
                            />
                            <div className={styles["label"]}>
                                {t("description.doc", "云端文档：")}
                            </div>
                            {fileId ? (
                                <div>
                                    <Button
                                        type="link"
                                        title={fileName}
                                        onClick={handleSelect}
                                    >
                                        <span className={styles["ellipsis"]}>
                                            {fileName}
                                        </span>
                                    </Button>
                                    <Button
                                        icon={<DeleteOutlined />}
                                        type="text"
                                        onClick={() => {
                                            setFileId("");
                                            setErrorStatus(undefined);
                                        }}
                                    />
                                </div>
                            ) : (
                                <Button
                                    onClick={handleSelect}
                                    className={styles["button"]}
                                >
                                    {t("select")}
                                </Button>
                            )}
                            {errorStatus && (
                                <div className={styles["error-tip"]}>
                                    {errorStatus === "empty"
                                        ? t("emptyMessage", "此项不允许为空")
                                        : t(
                                              "err.404002006",
                                              "当前文档已不存在或其路径发生变更。"
                                          )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className={styles["footer"]}>
                        <Space size={8}>
                            <Button
                                type="primary"
                                className={clsx(
                                    "automate-oem-primary-btn",
                                    styles["button"]
                                )}
                                onClick={handleConfirm}
                            >
                                {t("ok")}
                            </Button>
                            <Button
                                className={styles["button"]}
                                onClick={handleCancel}
                            >
                                {t("cancel")}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger={"click"}
            placement="bottomRight"
            showArrow={false}
            overlayClassName={styles["popover"]}
            overlayStyle={{ paddingTop: 0 }}
            open={open}
            onOpenChange={(next) => {
                if (isSelecting || disable) {
                    return;
                }
                setOpen(next);
            }}
        >
            <div
                className={clsx(
                    styles["icon-wrapper"],
                    {
                        [styles["active"]]: open,
                    },
                    {
                        [styles["disable"]]: disable === true,
                    }
                )}
            >
                {value?.text ? (
                    <InfoCircleFilled
                        className={styles["icon"]}
                        style={{ color: "#B3B3B3" }}
                    />
                ) : (
                    <InfoCircleOutlined className={styles["icon"]} />
                )}
            </div>
        </Popover>
    );
};
