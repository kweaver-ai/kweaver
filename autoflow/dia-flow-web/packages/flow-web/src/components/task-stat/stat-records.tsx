import { useContext, useMemo, useRef } from "react";
import { useParams } from "react-router";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Checkbox, Menu, message, Popover, Select, Space, Table, Tooltip, Typography } from "antd";
import moment from "moment";
import clsx from "clsx";
import {
    ClockCircleFilled,
    DownOutlined,
    MinusCircleFilled,
    ReloadOutlined,
} from "@ant-design/icons";
import { TaskResult } from "@applet/api/lib/content-automation";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import {
    EyeOutlined,
    SyncfaildColored,
    SyncSyncingColored,
    SyncuccessColored,
} from "@applet/icons";
import { Empty, getLoadStatus } from "../table-empty";
import styles from "./styles/stat-records.module.less";
import { Thumbnail } from "../thumbnail";
import { PopoverErrorReason } from "../data-studio/popover-error-reason";
import { useTranslateExtension } from "../extension-provider";

interface StatRecordsProps {
    data?: TaskResult;
    isLoading?: boolean;
    error?: any;
    refresh: () => void
}

// 每页展示条数
const limitRanges = ["5", "10", "20", "50"];

export const StatRecords = ({
    data,
    isLoading,
    error,
    refresh
}: StatRecordsProps) => {
    const [params, setSearchParams] = useSearchParams();
    const t = useTranslate();
    const tDataStudio = useTranslateExtension("dataStudio");
    const tInternal = useTranslateExtension("internal");
    const navigate = useNavigate();
    const enable = useRef(true);
    const { id: taskId = '' } = useParams<{ id: string }>();

    const {
        status: filteredStatus,
        order,
        sortBy,
        limit,
    } = useMemo(() => {
        const status = params.get("status")?.split(",")?.filter(Boolean) || [];
        return {
            status,
            sortBy: params.get("sortby") || "started_at",
            order: params.get("order") || "desc",
            limit: params.get("limit") || "20",
        };
    }, [params]);

    const { prefixUrl } = useContext(MicroAppContext);

    const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
        if (!timestamp) {
            return "";
        }
        return moment(timestamp * 1000).format(format);
    };

    const handlePreview = (record: any) => {
        navigate(`/details/${taskId}/log/${record.id}?back=${params.get("back")}`);
    };

    const handleCancel = async (recordId: string) => {
        try {
            if (!enable.current) {
                return;
            }
            enable.current = false;
            // 取消操作 刷新列表
            await API.automation.runInstanceInstanceIdPut(recordId, {
                status: "canceled",
            });
            refresh && refresh();
        } catch (error: any) {
            // 任务不在运行中
            refresh && refresh();
        } finally {
            enable.current = true;
        }
    };

    const handleLimitChange = (value: string) => {
        const newParams = new URLSearchParams(params);
        newParams.set("limit", value);
        newParams.set("page", "0");
        setSearchParams(newParams);
    };

    const handleRetry = async (recordId: string) => {
        try {
            await API.axios.put(`${prefixUrl}/api/automation/v1/dag-instance/${recordId}/retry`);
            const newParams = new URLSearchParams(params);
            newParams.set("page", "0");
            setSearchParams(newParams);
            refresh && refresh();
        } catch (error) {
            message.error(t("datastudio.retry.error", "运行失败"));
        }
    };

    const getStatus = (status: string, record: any) => {
        switch (status) {
            case "success":
                return (
                    <div className={styles["status-wrapper"]}>
                        <SyncuccessColored className={styles["status-icon"]} />
                        <span title={t("status.success", "运行成功")}>
                            {t("status.success", "运行成功")}
                        </span>
                    </div>
                );
            case "failed":
                return (
                  <div className={styles["status-wrapper"]}>
                    <SyncfaildColored className={styles["status-icon"]} />
                    <span title={t("status.failed", "运行失败")}>
                      {t("status.failed", "运行失败")}
                    </span>
                    <Popover
                      content={<PopoverErrorReason record={record} />}
                      placement="right"
                    >
                      <EyeOutlined
                        style={{
                          fontSize: "15px",
                          margin: "0 10px",
                          cursor: "pointer",
                        }}
                      />
                    </Popover>

                    <Button
                      type="text"
                      onClick={() => handleRetry(record.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                      }}
                      title={t("record.retry", "重试")}
                    >
                      <Tooltip
                        placement="top"
                        title={t("record.retry", "重试")}
                      >
                        <ReloadOutlined />
                      </Tooltip>
                    </Button>
                  </div>
                );
            case "scheduled":
                return (
                    <div className={styles["status-wrapper"]}>
                        <ClockCircleFilled
                            className={clsx(
                                styles["status-icon"],
                                styles["icon-gray"]
                            )}
                        />
                        <span title={t("status.scheduled", "等待中")}>
                            {t("status.scheduled", "等待中")}
                        </span>
                        <Button
                            type="link"
                            className={styles["cancel-btn"]}
                            onClick={() => handleCancel(record.id)}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {t("record.cancel", "取消运行")}
                        </Button>
                    </div>
                );
            case "canceled":
                return (
                    <div className={styles["status-wrapper"]}>
                        <MinusCircleFilled
                            className={clsx(
                                styles["status-icon"],
                                styles["icon-gray"]
                            )}
                        />
                        <span title={t("status.canceled", "运行取消")}>
                            {t("status.canceled", "运行取消")}
                        </span>
                    </div>
                );
            default:
                return (
                    <div className={styles["status-wrapper"]}>
                        <SyncSyncingColored
                            className={styles["status-icon"]}
                            spin
                        />
                        <span title={t("status.running", "运行中")}>
                            {t("status.running", "运行中")}
                        </span>

                        <Button
                            type="link"
                            className={styles["cancel-btn"]}
                            onClick={() => handleCancel(record.id)}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {t("record.cancel", "取消运行")}
                        </Button>
                    </div>
                );
        }
    };
    
    const getName = (source: any) => {
        switch (source?._type) {
            case "dataview":
                return tDataStudio('MdlDataDataview');
            case "form":
                return tInternal("TAForm");
            default:
                return source?.name
        }
    };

    return (
        <div className={styles["records"]}>
            <Table
                dataSource={data?.results}
                bordered={false}
                className={styles["records-table"]}
                showSorterTooltip={false}
                loading={isLoading}
                rowKey="id"
                scroll={{
                    y:
                        data?.results?.length && data?.results?.length > 0
                            ? 300
                            : undefined,
                }}
                locale={{
                    emptyText: (
                        <Empty
                            loadStatus={getLoadStatus({
                                isLoading,
                                error,
                                data: data?.results,
                                filter: filteredStatus,
                            })}
                            height={80}
                        />
                    ),
                }}
                pagination={{
                    size: "small",
                    current: (data?.page || 0) + 1,
                    pageSize: data?.limit,
                    total: data?.total,
                    showSizeChanger: false,
                    showTotal: (total) => (
                        <Space>
                            <span>
                                {t("pagination.count", `共${total}条`, {
                                    count: total,
                                })}
                            </span>
                            <Select
                                className={styles["limit-select"]}
                                popupClassName={styles["limit-popup"]}
                                value={limit}
                                style={{ width: 100, height: 24 }}
                                onChange={handleLimitChange}
                                options={limitRanges.map((item: string) => ({
                                    value: item,
                                    label: t(`limit.${item}`, `${item}条/页`),
                                }))}
                            />
                        </Space>
                    ),
                }}
                onRow={(item: any) => {
                    return {
                        onDoubleClick: () => {
                            handlePreview(item);
                        },
                    };
                }}
                onChange={(page, filter, sorter: any) => {
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

                    if (page.current) {
                        newParams.set("page", String(page.current - 1));
                    } else {
                        newParams.set("page", "0");
                    }

                    setSearchParams(newParams);
                }}
            >
                <Table.Column
                    key="status"
                    dataIndex="status"
                    title={t("column.record.status", "单次运行状态")}
                    className={clsx({
                        [styles["filter-active"]]: filteredStatus.length > 0,
                    })}
                    width="23%"
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
                                                        ...selectedKeys,
                                                        value as string,
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
                            text: t("status.running", "运行中"),
                            value: "running",
                        },
                        {
                            text: t("status.success", "运行成功"),
                            value: "success",
                        },
                        {
                            text: t("status.failed", "运行失败"),
                            value: "failed",
                        },
                        {
                            text: t("status.canceled", "运行取消"),
                            value: "canceled",
                        },
                        {
                            text: t("status.scheduled", "等待中"),
                            value: "scheduled",
                        },
                    ]}
                    render={(status, record) => getStatus(status, record)}
                />
                <Table.Column
                    title={t("operational.objective", "运行目标")}
                    key="name"
                    dataIndex="name"
                    render={(name, item: any) => {
                    return item?.source?.name && item?.source?.docid ? (
                        <div className={styles["name-wrapper"]}>
                        <span>
                            <Thumbnail
                                doc={{
                                    ...item?.source,
                                    size: item.source?.size,
                                }}
                                className={styles["doc-icon"]}
                            />
                        </span>

                        <Typography.Text
                            ellipsis
                            title={item?.source?.name}
                        >
                            {item?.source?.name}
                        </Typography.Text>
                        </div>
                    ) : <>{getName(item?.source)}</> ;
                    }}
                />
                <Table.Column
                    key="started_at"
                    dataIndex="started_at"
                    title={t("time.start", "开始时间")}
                    width="20%"
                    sorter
                    sortDirections={["descend", "ascend", "descend"]}
                    sortOrder={
                        sortBy === "started_at"
                            ? order === "asc"
                                ? "ascend"
                                : "descend"
                            : null
                    }
                    render={(time: number) => (
                        <Typography.Text ellipsis title={formatTime(time)}>
                            {formatTime(time) || "---"}
                        </Typography.Text>
                    )}
                />
                <Table.Column
                    key="ended_at"
                    dataIndex="ended_at"
                    title={t("time.end", "结束时间")}
                    width="20%"
                    sorter
                    sortDirections={["descend", "ascend", "descend"]}
                    sortOrder={
                        sortBy === "ended_at"
                            ? order === "asc"
                                ? "ascend"
                                : "descend"
                            : null
                    }
                    render={(time: number) => (
                        <Typography.Text ellipsis title={formatTime(time)}>
                            {formatTime(time) || "---"}
                        </Typography.Text>
                    )}
                />
                <Table.Column
                    key="option"
                    width={100}
                    title={t("column.details", "操作")}
                    render={(_, record: any) => (
                        <Button
                            type="link"
                            size="small"
                            className={styles["ops-btn"]}
                            onClick={() => handlePreview(record)}
                        >
                            {t("records.view", "查看日志")}
                        </Button>
                    )}
                />
            </Table>
        </div>
    );
};
