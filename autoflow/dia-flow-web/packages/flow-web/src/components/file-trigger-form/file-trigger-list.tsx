import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHandleErrReq } from "../../utils/hooks";
import useSWR from "swr";
import styles from "./styles/file-trigger-list.module.less";
import { throttle } from "lodash";
import { Button, Space, Table, Typography } from "antd";
import clsx from "clsx";
import { Empty, getLoadStatus } from "../table-empty";
import moment from "moment";
import { ManualTriggerColored } from "@applet/icons";

enum Order {
    ASC = "asc",
    DESC = "desc",
}
interface IDag {
    id: string;
    title: string;
    actions: string[];
    created_at: number;
    updated_at: number;
    status: string;
    creator: string;
}

interface FileTriggerListProps {
    onSelect: (id: string) => void;
}

const LIMIT = 50, // 每次请求渲染任务数
    THRESHOLD = 25, //距离底部多少开始加载
    DELAY = 100; //滚动事件触发间隔(s)

export const FileTriggerList = ({ onSelect }: FileTriggerListProps) => {
    const [tableData, setTableData] = useState<IDag[]>([]);
    const [select, setSelect] = useState<IDag>();
    const [order, setOrder] = useState<Order>(Order.DESC);
    const [sortBy, setSortBy] = useState("updated_at");

    // 滚动加载
    const [page, setPage] = useState(0);
    const isFetching = useRef(false);
    const tableContainer = useRef(null);
    const t = useTranslate();

    const { microWidgetProps, functionId, prefixUrl } =
        useContext(MicroAppContext);
    const handleErr = useHandleErrReq();

    const selectDocid: string = useMemo(() => {
        return microWidgetProps?.contextMenu?.getSelections
            ? microWidgetProps?.contextMenu?.getSelections[0]?.docid
            : "";
    }, [microWidgetProps?.contextMenu?.getSelections]);

    const closeDialog = () => {
        microWidgetProps?.dialog?.close({
            functionid: functionId,
        });
    };

    // 过滤已完成（已到截止时间）
    const filterNormal = (tasks: any[]) =>
        tasks.filter(({ status }) => status === "normal");

    const { data, isValidating, error } = useSWR(
        ["/document-dags", order, sortBy, page, selectDocid],
        () => {
            // 出错后从0页开始
            if (page > 0 && tableData.length === 0) {
                setPage(0);
            }
            if (selectDocid) {
                return API.axios.get(
                    `${prefixUrl}/api/automation/v1/document-dags`,
                    {
                        params: {
                            docid: selectDocid,
                            page,
                            limit: String(LIMIT),
                            sortby: sortBy,
                            order,
                        },
                    }
                );
            }
        },
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 0,
            onSuccess(data) {
                if (data?.data?.dags) {
                    if (page === 0) {
                        setTableData(filterNormal(data.data.dags));
                    } else {
                        // 滚动加载
                        setTableData((pre) => {
                            return [...pre, ...filterNormal(data.data.dags)];
                        });
                    }

                    isFetching.current = false;
                }
            },
            onError(error) {
                setTableData([]);
                isFetching.current = false;
                // 自动化被禁用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.disable",
                            "当前功能暂不可用，请联系管理员。"
                        ),
                        okText: t("ok"),
                        onOk: closeDialog,
                    });
                    return;
                }
                handleErr({
                    error: error?.response,
                });
            },
        }
    );

    // 监听滚动
    const handleScroll = () => {
        if (
            // 正在请求或者已经是最后一页时不再判断
            tableContainer.current &&
            !isFetching.current &&
            (page + 1) * LIMIT < (data?.data?.total ?? 0)
        ) {
            const tableBody = (
                tableContainer.current as Element
            )?.querySelector(`.${ANT_PREFIX}-table-body`);
            // 表格内容可视区高度
            const tableBodyHeight: number = tableBody?.clientHeight ?? 0;

            // 表格内容高度
            const contentHeight = tableBody?.scrollHeight ?? 0;

            // 距离顶部表头的高度
            const toTopHeight = tableBody?.scrollTop ?? 0;
            if (toTopHeight > contentHeight - tableBodyHeight - THRESHOLD) {
                setPage((page) => page + 1);
                isFetching.current = true;
            }
        }
    };

    const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
        if (!timestamp) {
            return "";
        }
        return moment(timestamp * 1000).format(format);
    };

    const handleOk = () => {
        // 跳转 加载表单组件
        if (select?.id) {
            onSelect(select.id);
        }
    };

    useEffect(() => {
        microWidgetProps?.config.setWindowSize({
            functionid: functionId,
            config: { width: 592, height: 510 },
        });
        // 设置dialog的标题
        microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
            functionid: functionId,
            title: t("fileTrigger.title", "选择工作流程"),
        });
    }, []);

    return (
        <div className={styles["container"]}>
            <header className={styles["header"]}>
                <span className={styles["header-sub-title"]}>
                    {t("fileTrigger.chooseTask", "请选择一个工作流程运行：")}
                </span>
            </header>
            <div
                className={styles["table-container"]}
                onScrollCapture={throttle(handleScroll, DELAY)}
            >
                <Table
                    dataSource={tableData}
                    bordered={false}
                    className={styles["table"]}
                    showSorterTooltip={false}
                    loading={isValidating}
                    rowKey={(task: IDag) => task.id}
                    pagination={false}
                    scroll={{
                        y: tableData?.length > 0 ? "266px" : undefined,
                    }}
                    ref={tableContainer}
                    locale={{
                        emptyText: (
                            <Empty
                                loadStatus={getLoadStatus({
                                    isLoading: isValidating,
                                    error,
                                    data: tableData,
                                })}
                                height={100}
                                emptyText={t(
                                    "err.flow.empty",
                                    "暂无可用的工作流程"
                                )}
                            />
                        ),
                    }}
                    rowSelection={{
                        selectedRowKeys: [select?.id || ""],
                        type: "checkbox",
                        onChange: (_: unknown, selectedRows: IDag[]) => {
                            setSelect(selectedRows[0]);
                        },
                    }}
                    onRow={(item: IDag) => {
                        return {
                            onClick: () => {
                                setSelect(item);
                            },
                        };
                    }}
                    onChange={(_: unknown, filter, sorter: any) => {
                        isFetching.current = false;
                        setTableData([]);
                        if (page !== 0) {
                            setPage(0);
                        }
                        if (sorter.columnKey && sorter.order) {
                            setOrder(
                                sorter.order === "ascend"
                                    ? Order.ASC
                                    : Order.DESC
                            );
                            setSortBy(sorter.columnKey as string);
                        } else {
                            setOrder(Order.ASC);
                        }
                    }}
                >
                    <Table.Column
                        key="title"
                        dataIndex="title"
                        className={styles["first-col"]}
                        title={t("column.taskName", "流程名称")}
                        width="40%"
                        render={(title: string) => (
                            <div className={styles["task-name-wrapper"]}>
                                <ManualTriggerColored
                                    className={styles["task-icon"]}
                                />
                                <Typography.Text
                                    ellipsis
                                    title={title}
                                    className={styles["task-name"]}
                                >
                                    {title}
                                </Typography.Text>
                            </div>
                        )}
                    />
                    <Table.Column
                        key="creator"
                        dataIndex="creator"
                        title={t("column.creator", "创建者")}
                        render={(creator: string = "") => (
                            <Typography.Text ellipsis title={creator}>
                                {creator}
                            </Typography.Text>
                        )}
                    />

                    <Table.Column
                        key="updated_at"
                        dataIndex="updated_at"
                        title={t("column.updateAt", "更新时间")}
                        width="30%"
                        sorter
                        sortDirections={["ascend", "descend", "ascend"]}
                        sortOrder={
                            sortBy === "updated_at"
                                ? order === "desc"
                                    ? "descend"
                                    : "ascend"
                                : null
                        }
                        render={(time: number) => (
                            <Typography.Text ellipsis title={formatTime(time)}>
                                {time ? formatTime(time) : "---"}
                            </Typography.Text>
                        )}
                    />
                </Table>
            </div>

            <footer className={styles["footer"]}>
                <Space size="small">
                    <Button
                        type="primary"
                        className={clsx(
                            styles["confirm-btn"],
                            "automate-oem-primary-btn"
                        )}
                        onClick={handleOk}
                        disabled={!select?.id}
                    >
                        {t("ok", "确定")}
                    </Button>
                    <Button
                        onClick={closeDialog}
                        className={styles["cancel-btn"]}
                    >
                        {t("cancel", "取消")}
                    </Button>
                </Space>
            </footer>
        </div>
    );
};
