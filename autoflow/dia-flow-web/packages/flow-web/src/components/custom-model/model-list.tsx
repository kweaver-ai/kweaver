import { useContext, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Checkbox, Menu, Space, Table, Typography } from "antd";
import moment from "moment";
import clsx from "clsx";
import { DownOutlined } from "@ant-design/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { Empty, getLoadStatus } from "../table-empty";
import styles from "./styles/model-list.module.less";
import useSWR from "swr";
import { useHandleErrReq } from "../../utils/hooks";
import { max } from "lodash";
import useSize from "@react-hook/size";

const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
    if (!timestamp) {
        return "";
    }
    return moment(timestamp).format(format);
};

export const getType = (type: number) => {
    switch (type) {
        case 1:
            return "textExtract";
        case 2:
            return "tagExtract";
        default:
            return "";
    }
};

export const ModelList = () => {
    const [params, setSearchParams] = useSearchParams();
    const { prefixUrl, microWidgetProps } = useContext(MicroAppContext);
    const t = useTranslate();
    const navigate = useNavigate();
    const handleErr = useHandleErrReq();
    const containerRef = useRef<HTMLDivElement>(null);
    const [_, height] = useSize(containerRef);
    const location = useLocation();

    const {
        status: filteredStatus,
        order,
        sortBy,
    } = useMemo(() => {
        const status = params.get("status")?.split(",")?.filter(Boolean) || [];
        return {
            status,
            sortBy: params.get("sortby") || "updated_at",
            order: params.get("order") || "desc",
        };
    }, [params]);

    const { data, isValidating, error, mutate } = useSWR(
        [`model/list`, filteredStatus, order, sortBy],
        () => {
            return API.axios.get(`${prefixUrl}/api/automation/v1/models`, {
                params: {
                    // sortby: sortBy,
                    // order,
                    status:
                        filteredStatus?.length > 0
                            ? filteredStatus.join(",")
                            : undefined,
                },
            });
        },
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
            dedupingInterval: 0,
            onError(error) {
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    navigate("/disable");
                    return;
                }
                handleErr({ error: error?.response });
            },
        }
    );

    const handlePreview = (record: any) => {
        const path = location.pathname;
        navigate(`/model/details/${record.id}?back=${btoa(path)}`);
    };

    const handleEdit = (record: any) => {
        const path = location.pathname;
        const type = getType(record.type);
        if (type) {
            navigate(`/model/${type}/edit/${record.id}?back=${btoa(path)}`);
        }
    };

    const getStatus = (status: number) => {
        switch (status) {
            case 1:
                return (
                    <span title={t("model.status.published", "已发布")}>
                        {t("model.status.published", "已发布")}
                    </span>
                );
            default:
                return (
                    <span title={t("model.status.unPublished", "未发布")}>
                        {t("model.status.unPublished", "未发布")}
                    </span>
                );
        }
    };

    const handlePublish = async (record: any) => {
        try {
            await API.axios.put(
                `${prefixUrl}/api/automation/v1/models/${record?.id}`,
                {
                    name: record.name,
                    description: record?.description || "",
                    status: record.status === 0 ? 1 : 0,
                }
            );
            microWidgetProps?.components?.toast?.success(
                record.status === 1
                    ? t("model.unPublish.success", "取消发布成功")
                    : t("model.publish.success", "发布成功")
            );
            mutate();
        } catch (error: any) {
            handleErr({ error: error?.response });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await microWidgetProps?.components?.messageBox({
                type: "info",
                title: t("deleteTitle", "确认删除"),
                message: t("delete.tips", "删除后，自定义能力将无法恢复。"),
                buttons: [
                    { label: t("ok", "确定"), type: "primary" },
                    { label: t("cancel", "取消"), type: "normal" },
                ],
            });
            if (res?.button === 0) {
                await API.axios.delete(
                    `${prefixUrl}/api/automation/v1/models/${id}`
                );
                microWidgetProps?.components?.toast?.success(
                    t("delete.success", "删除成功")
                );
                mutate();
            }
        } catch (error: any) {
            handleErr({ error: error?.response });
        }
    };

    return (
        <div className={styles["records"]} ref={containerRef}>
            <Table
                dataSource={data?.data || []}
                bordered={false}
                className={styles["records-table"]}
                showSorterTooltip={false}
                loading={isValidating}
                rowKey="id"
                scroll={{
                    y: data?.data?.length ? max([height - 60, 250]) : undefined,
                }}
                locale={{
                    emptyText: (
                        <Empty
                            loadStatus={getLoadStatus({
                                isLoading: isValidating,
                                error,
                                data: [],
                                filter: filteredStatus,
                            })}
                            height={120}
                        />
                    ),
                }}
                onRow={(item: any) => {
                    return {
                        onDoubleClick: () => {
                            handlePreview(item);
                        },
                    };
                }}
                onChange={(_, filter, sorter: any) => {
                    const newParams = new URLSearchParams(params);

                    if (filter.status?.length) {
                        newParams.set("status", filter.status.join(","));
                    } else {
                        newParams.delete("status");
                    }

                    if (sorter.columnKey && sorter.order) {
                        newParams.set("sortby", sorter.columnKey! as string);
                        newParams.set(
                            "order",
                            sorter.order === "ascend" ? "asc" : "desc"
                        );
                    } else {
                        newParams.delete("sortby");
                        newParams.delete("order");
                    }

                    setSearchParams(newParams);
                }}
                pagination={false}
            >
                <Table.Column
                    key="name"
                    dataIndex="name"
                    title={t("model.column.name", "名称")}
                    render={(name: string) => (
                        <Typography.Text ellipsis title={name}>
                            {name || "---"}
                        </Typography.Text>
                    )}
                />
                <Table.Column
                    key="status"
                    dataIndex="status"
                    title={t("model.column.status", "状态")}
                    className={clsx({
                        [styles["filter-active"]]: filteredStatus.length > 0,
                    })}
                    width="160px"
                    filterIcon={<DownOutlined />}
                    filteredValue={filteredStatus}
                    filterDropdown={({
                        filters,
                        selectedKeys,
                        setSelectedKeys,
                        confirm,
                    }) => (
                        <Menu className={styles["filter-menu"]}>
                            <Menu.Item key="all">
                                <Checkbox
                                    checked={selectedKeys?.length === 0}
                                    onChange={() => {
                                        setSelectedKeys([]);
                                    }}
                                >
                                    {t("filter.all", "全部")}
                                </Checkbox>
                            </Menu.Item>
                            {filters!.map(({ text, value }) => {
                                const checked = selectedKeys?.includes(
                                    value as string
                                );
                                return (
                                    <Menu.Item key={String(value)}>
                                        <Checkbox
                                            checked={checked}
                                            onChange={() => {
                                                if (!checked) {
                                                    setSelectedKeys([
                                                        String(value),
                                                    ]);
                                                } else {
                                                    setSelectedKeys(
                                                        selectedKeys?.filter(
                                                            (key) =>
                                                                key !== value
                                                        )
                                                    );
                                                }
                                            }}
                                        >
                                            {text}
                                        </Checkbox>
                                    </Menu.Item>
                                );
                            })}
                            <Button
                                type="primary"
                                size="small"
                                className={clsx(
                                    styles["filter-confirm-btn"],
                                    "automate-oem-primary-btn"
                                )}
                                onClick={() => {
                                    confirm();
                                }}
                            >
                                {t("ok", "确定")}
                            </Button>
                        </Menu>
                    )}
                    filters={[
                        {
                            text: t("model.status.published", "已发布"),
                            value: "1",
                        },
                        {
                            text: t("model.status.unPublished", "未发布"),
                            value: "0",
                        },
                    ]}
                    render={(status, record) => getStatus(status)}
                />
                <Table.Column
                    key="created_at"
                    dataIndex="created_at"
                    title={t("model.column.createAt", "创建时间")}
                    // width="180px"
                    // sorter
                    // sortDirections={["descend", "ascend", "descend"]}
                    // sortOrder={
                    //     sortBy === "created_at"
                    //         ? order === "asc"
                    //             ? "ascend"
                    //             : "descend"
                    //         : null
                    // }
                    render={(time: number) => (
                        <Typography.Text ellipsis title={formatTime(time)}>
                            {formatTime(time) || "---"}
                        </Typography.Text>
                    )}
                />
                <Table.Column
                    key="updated_at"
                    dataIndex="updated_at"
                    title={t("model.column.updateAt", "更新时间")}
                    // width="180px"
                    // sorter
                    // sortDirections={["descend", "ascend", "descend"]}
                    // sortOrder={
                    //     sortBy === "updated_at"
                    //         ? order === "asc"
                    //             ? "ascend"
                    //             : "descend"
                    //         : null
                    // }
                    render={(time: number) => (
                        <Typography.Text ellipsis title={formatTime(time)}>
                            {formatTime(time) || "---"}
                        </Typography.Text>
                    )}
                />
                <Table.Column
                    key="option"
                    title={t("model.column.operation", "操作")}
                    width="200px"
                    render={(_, record: any) => (
                        <Space size={8}>
                            <Button
                                type="link"
                                size="small"
                                className={styles["ops-btn"]}
                                onClick={() => handlePreview(record)}
                            >
                                {t("model.operation.view", "查看")}
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                className={styles["ops-btn"]}
                                onClick={() => handleEdit(record)}
                            >
                                {t("model.operation.edit", "编辑")}
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                className={styles["ops-btn"]}
                                onClick={() => handlePublish(record)}
                            >
                                {record.status === 0
                                    ? t("model.operation.publish", "发布")
                                    : t(
                                          "model.operation.unPublish",
                                          "取消发布"
                                      )}
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                className={styles["ops-btn"]}
                                onClick={() => handleDelete(record.id)}
                            >
                                {t("model.operation.delete", "删除")}
                            </Button>
                        </Space>
                    )}
                />
            </Table>
        </div>
    );
};
