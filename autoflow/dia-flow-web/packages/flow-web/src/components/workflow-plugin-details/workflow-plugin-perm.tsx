import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, Typography } from "antd";
import { API, useFormatPermText, useTranslate } from "@applet/common";
import { WorkflowContext } from "../workflow-provider";
import { CloseOutlined } from "@applet/icons";
import styles from "./styles/workflow-plugin-perm.module.less";
import moment from "moment";

interface WorkflowPluginPermProps {
    data: PermData;
}

type PermStr =
    | "cache"
    | "delete"
    | "modify"
    | "create"
    | "download"
    | "preview"
    | "display";

interface PermItem {
    id: string;
    name: string;
    type: string;
    from: string;
    inherit: string;
    endtime: string;
    perm: string;
}

interface PermData {
    perminfos: PermInfo[];
    inherit: boolean;
}

interface PermInfo {
    accessor: Accessor;
    perm: Perm;
    endtime: number | string;
}

interface Perm {
    allow: PermStr[];
    deny: PermStr[];
    endtime: number;
}

interface Accessor {
    id: string;
    name: string;
    type: string;
}

export const WorkflowPluginPerm: FC<WorkflowPluginPermProps> = ({ data }) => {
    const [loading, setLoading] = useState(true);
    const [permData, setPermData] = useState<PermItem[]>([]);
    const { process } = useContext(WorkflowContext);
    const [isShowModal, setShowModal] = useState(false);
    const formatPermText = useFormatPermText();
    const isUploadStrategy = useMemo(() => {
        return process?.audit_type === "security_policy_upload";
    }, [process?.audit_type]);
    const t = useTranslate();

    useEffect(() => {
        const initPerm = async () => {
            let parseData = data;
            try {
                if (typeof data === "string") {
                    parseData = JSON.parse(data);
                }
            } catch (error) {
                console.warn(error);
            }
            const permArr = parseData?.perminfos?.map((item: PermInfo) => {
                const type = item.accessor.type;
                return {
                    id: item.accessor.id,
                    name:
                        item.accessor.name +
                        (type !== "user" ? t(`perm.${type}`, "") : ""),
                    type: type,
                    inherit:
                        typeof parseData?.inherit === "boolean"
                            ? t(`inherit.${parseData.inherit}`, "")
                            : "",
                    endtime:
                        item.endtime === -1
                            ? t("neverExpires", "永久有效")
                            : moment(item.endtime).format("YYYY/MM/DD HH:mm"),
                    perm: formatPermText(item.perm),
                    from: "---",
                };
            });
            for (let i = 0; i < permArr?.length; i += 1) {
                try {
                    if (permArr[i].type === "user") {
                        const { data } =
                            await API.efast.eacpV1UserGetbasicinfoPost({
                                userid: permArr[i].id,
                            });
                        permArr[i].from = data?.directdepinfos[0]?.deppath;
                    } else {
                        permArr[i].from = t(`perm.${permArr[i].type}`, "---");
                    }
                } catch (error) {
                    console.error(error);
                }
            }
            setPermData(permArr);
            setLoading(false);
        };
        initPerm();
    }, []);

    return (
        <>
            <Button type="link" onClick={() => setShowModal(true)}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={700}
                title={t("perm", "权限")}
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
                            {t("upload.perm", { name: process?.user_name })}
                        </div>
                    )}
                    <div className={styles["container"]}>
                        <Table
                            dataSource={permData}
                            rowKey={(item) => item.id}
                            pagination={false}
                            className={styles["table"]}
                            bordered={false}
                            loading={loading}
                            showSorterTooltip={false}
                            scroll={{
                                y: 360,
                            }}
                            locale={{ emptyText: null }}
                        >
                            <Table.Column
                                title={t("asperm.name", "访问者")}
                                key="name"
                                dataIndex="name"
                                width="100px"
                                render={(name) => {
                                    return (
                                        <Typography.Text ellipsis title={name}>
                                            {name}
                                        </Typography.Text>
                                    );
                                }}
                            ></Table.Column>

                            <Table.Column
                                key="from"
                                title={t("asperm.from", "来自")}
                                dataIndex="from"
                                render={(from) => {
                                    return (
                                        <Typography.Text ellipsis title={from}>
                                            {from}
                                        </Typography.Text>
                                    );
                                }}
                            ></Table.Column>
                            <Table.Column
                                key="inherit"
                                title={t("asperm.type", "权限类型")}
                                dataIndex="inherit"
                                width="100px"
                                render={(inherit) => {
                                    return (
                                        <Typography.Text
                                            ellipsis
                                            title={inherit}
                                        >
                                            {inherit}
                                        </Typography.Text>
                                    );
                                }}
                            ></Table.Column>
                            <Table.Column
                                key="perm"
                                title={t("asperm.perm", "访问权限")}
                                dataIndex="perm"
                                width="120px"
                                render={(perm) => {
                                    return (
                                        <Typography.Text ellipsis title={perm}>
                                            {perm}
                                        </Typography.Text>
                                    );
                                }}
                            ></Table.Column>
                            <Table.Column
                                key="endtime"
                                title={t("asperm.endtime", "有效期")}
                                dataIndex="endtime"
                                width="120px"
                                render={(endtime) => {
                                    return (
                                        <Typography.Text
                                            ellipsis
                                            title={endtime}
                                        >
                                            {endtime}
                                        </Typography.Text>
                                    );
                                }}
                            ></Table.Column>
                        </Table>
                    </div>
                </div>
            </Modal>
        </>
    );
};
