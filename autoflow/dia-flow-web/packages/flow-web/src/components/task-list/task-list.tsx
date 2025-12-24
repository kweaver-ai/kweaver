import {
    FunctionComponent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    Button,
    Dropdown,
    Input,
    List,
    Menu,
    Modal,
    Space,
    Spin,
    Tooltip,
} from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import useSWR from "swr";
import { debounce, differenceBy, reject } from "lodash";
import clsx from "clsx";
import useSize from "@react-hook/size";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    FileSortDescOutlined,
    FileSortAscOutlined,
    SearchOutlined,
    TriggerEventColored,
    TriggerManualColored,
    TriggerClockColored,
} from "@applet/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { TemplateSelectModal } from "../template-select-modal";
import { Empty, getLoadStatus } from "../table-empty";
import { Card } from "../task-card";
import { useHandleErrReq } from "../../utils/hooks/use-handleErrReq";
import { CreateTile } from "./create-tile";
import styles from "./task-list.module.less";

interface TaskListProps {
    tabKey?: string;
}

export const TaskList: FunctionComponent<TaskListProps> = () => {
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [shouldShowLoading, setShouldShowLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [listData, setListData] = useState<any[]>([]);
    const headerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [width, headHeight] = useSize(headerRef);
    const [params, setSearchParams] = useSearchParams();
    const location = useLocation();
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const currentTab = params.get("tab");

    const { keyword, order, sortBy } = useMemo(
        () => ({
            keyword: params.get("keyword") || undefined,
            sortBy: params.get("sortby") || "updated_at",
            order: params.get("order") || "desc",
        }),
        [params]
    );

    const isChecked = (key: string) => {
        if (key === "myFlow" && !currentTab) {
            return true;
        }
        return key === currentTab;
    };

    const modalInfo = (title?: string, content?: any) => {
      Modal.info({
        title,
        content,
        getContainer: microWidgetProps?.container,
        onOk() {},
      });
    };

    const { error, mutate } = useSWR(
        ["/dagsGet", keyword, order, sortBy, page],
        () => {
            if (shouldShowLoading) {
                setIsLoading(true);
            }
            if (currentTab === "shareFlow") {
                const params = {
                    keyword: keyword || undefined,
                    page,
                    limit: "50",
                    sortBy,
                    order,
                };
                return API.axios.get(
                    `${prefixUrl}/api/automation/v1/shared-dags`,
                    { params }
                );
            }
            return API.automation.dagsGet(
                keyword || undefined,
                page,
                "50",
                sortBy,
                order
            );
        },
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
            dedupingInterval: 0,
            onSuccess(data) {
                setIsLoading(false);
                if (
                    data?.data.total !== undefined &&
                    data?.data.limit !== undefined &&
                    data?.data.page !== undefined
                ) {
                    if (data?.data.limit === -1) {
                        setHasMore(false);
                    } else {
                        setHasMore(
                            data?.data.limit * (data?.data.page + 1) <
                                data?.data.total
                        );
                    }
                }
                if (data?.data.dags) {
                    if (page === 0) {
                        setListData(data?.data.dags);
                    } else {
                        // 过滤重复id的数据
                        const newData = differenceBy(
                            data?.data.dags,
                            listData,
                            "id"
                        );
                        setListData((listData) => [...listData, ...newData]);
                    }
                }
            },
            onError(error) {
                setIsLoading(false);
                setHasMore(false);
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    navigate("/disable");
                    return;
                }
                // 内部服务错误提示
                handleErr({ error: error?.response });
            },
        }
    );

    // 刷新页面数据
    const handleReset = () => {
        setListData([]);
        setPage(0);
        if (page === 0) {
            mutate();
        }
    };

    // 处理删除和切换任务状态
    const handleChange = async (id: string, type: string, value?: string) => {
        switch (type) {
            case "delete":
                setListData((listData) => reject(listData, ["id", id]));
                if (hasMore) {
                    mutate();
                }
                break;
            default: {
                setListData((listData) =>
                    listData.map((item: any) => {
                        if (item.id !== id) {
                            return item;
                        }
                        return {
                            ...item,
                            status: value,
                        };
                    })
                );
            }
        }
    };

    const handleClickTabs = (tab: string) => {
        if (tab !== currentTab) {
            const newParams = new URLSearchParams(params);
            newParams.set("tab", tab);
            setSearchParams(newParams);
            // 待search参数更新后再重新请求
            setTimeout(() => handleReset(), 0);
        }
    };

     useEffect(() => {
        handleReset()
    }, []);

    const handleSearch = useCallback(
        (params: URLSearchParams) => {
            setPage(0);
            setShouldShowLoading(true);
            setSearchParams(params);
        },
        [setSearchParams]
    );

    const setSearchParamsDebounced = useMemo(
        () => debounce(handleSearch, 500),
        [handleSearch]
    );

    const overlay = () => {
        let orderByGroup = ["name", "created_at", "updated_at"];

        return (
            <Menu
                selectedKeys={[sortBy]}
                selectable
                onClick={({ key }) => {
                    const newParams = new URLSearchParams(params);
                    newParams.set("sortby", key);
                    setPage(0);
                    if (key === sortBy) {
                        newParams.set(
                            "order",
                            order === "asc" ? "desc" : "asc"
                        );
                    } else {
                        newParams.set("order", "asc");
                    }
                    setShouldShowLoading(true);
                    setSearchParams(newParams);
                }}
            >
                {orderByGroup.map((orderBy) => (
                    <Menu.Item
                        key={orderBy}
                        icon={
                            orderBy === sortBy ? (
                                order === "asc" ? (
                                    <ArrowUpOutlined />
                                ) : (
                                    <ArrowDownOutlined />
                                )
                            ) : (
                                <span></span>
                            )
                        }
                    >
                        {t(`sort.${orderBy}`, "按更新时间排序")}
                    </Menu.Item>
                ))}
            </Menu>
        );
    };

    const handleCreateTask = async (type: string) => {
        try {
            const data = await API.automation.dagsGet();
            if (data?.data?.total && data?.data?.total >= 50) {
                 modalInfo(
                   t("err.title.create", "无法新建自动任务"),
                   t(
                     "err.tasksExceeds",
                     "您新建的自动任务数已达上限。（最多允许新建50个）"
                   )
                 );
                return;
            }
            navigate(`/new?type=${type}&back=${btoa(location.pathname)}`);
        } catch (error: any) {
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                navigate("/disable");
                return;
            }
            handleErr({ error: error?.response });
        }
    };

    const quickCreateList = [
        {
            name: t("create.event", "事件触发"),
            description: t("create.eventDescription", "由指定的事件触发流程"),
            icon: <TriggerEventColored className={styles["icon"]} />,
            onClick: () => {
                handleCreateTask("event");
            },
        },
        {
            name: t("create.clock", "定时触发"),
            description: t(
                "create.clockDescription",
                "由设定的时间周期循环触发流程"
            ),
            icon: <TriggerClockColored className={styles["icon"]} />,
            onClick: () => {
                handleCreateTask("cron");
            },
        },
        {
            name: t("create.manual", "手动触发"),
            description: t(
                "create.manualDescription",
                "根据需要手动点击触发流程"
            ),
            icon: <TriggerManualColored className={styles["icon"]} />,
            onClick: () => {
                handleCreateTask("manual");
            },
        },
    ];

    return (
        <div className={styles["home"]} id="scrollableDiv">
            <header className={styles["header"]} ref={headerRef}>
                <div className={styles["quick-create"]}>
                    <div className={styles["title"]}>
                        {t("create.label", "请选择触发类型新建")}
                    </div>
                    <div className={styles["tile-wrapper"]}>
                        <List
                            grid={{
                                gutter: 24,
                            }}
                            dataSource={quickCreateList}
                            renderItem={(item) => (
                                <List.Item>
                                    <CreateTile
                                        name={item.name}
                                        description={item.description}
                                        icon={item.icon}
                                        onClick={item.onClick}
                                    ></CreateTile>
                                </List.Item>
                            )}
                        />
                    </div>
                </div>

                <div className={styles["top-bar"]}>
                    <div>
                        <span
                            className={clsx(styles["list-nav"], {
                                checked: isChecked("myFlow"),
                            })}
                            data-oem="automate-oem-tab"
                            onClick={() => handleClickTabs("myFlow")}
                        >
                            {t("nav.myFlow", "我的流程")}
                        </span>
                        <span
                            className={clsx(styles["list-nav"], {
                                checked: isChecked("shareFlow"),
                            })}
                            data-oem="automate-oem-tab"
                            onClick={() => handleClickTabs("shareFlow")}
                        >
                            {t("nav.shareFlow", "分配给我的流程")}
                        </span>
                    </div>
                    <div id="applet-automation-sort">
                        <Space>
                            <Input
                                className={styles["searchInput"]}
                                placeholder={t(
                                    "placeholder.search",
                                    "搜索任务名称"
                                )}
                                prefix={
                                    <SearchOutlined
                                        className={styles["search-icon"]}
                                    />
                                }
                                defaultValue={keyword}
                                allowClear
                                onChange={(e) => {
                                    if (e.target.value) {
                                        params.set("keyword", e.target.value);
                                    } else {
                                        params.delete("keyword");
                                    }

                                    setSearchParamsDebounced(params);
                                }}
                            />
                            <Dropdown
                                trigger={["click"]}
                                overlay={overlay}
                                transitionName=""
                                placement="bottomLeft"
                                overlayClassName={styles["sort-drop-menu"]}
                            >
                                <Tooltip
                                    title={t("sort", "排序")}
                                    placement="top"
                                    showArrow
                                    getPopupContainer={() =>
                                        document.getElementById(
                                            "applet-automation-sort"
                                        ) || document.body
                                    }
                                >
                                    <Button
                                        className={styles["sort-btn"]}
                                        type="link"
                                        data-testid="sorter"
                                        icon={
                                            order === "asc" ? (
                                                <FileSortAscOutlined
                                                    className={
                                                        styles["sort-btn-icon"]
                                                    }
                                                />
                                            ) : (
                                                <FileSortDescOutlined
                                                    className={
                                                        styles["sort-btn-icon"]
                                                    }
                                                />
                                            )
                                        }
                                        size="small"
                                    />
                                </Tooltip>
                            </Dropdown>
                        </Space>
                    </div>
                </div>
            </header>
            {showTemplateModal && (
                <TemplateSelectModal
                    onClose={() => setShowTemplateModal(false)}
                />
            )}
            <div
                className={clsx(styles["scrollable-container"], {
                    [styles["spin-blur"]]: isLoading,
                    [styles["max-1960"]]: width > 1960,
                })}
                style={{
                    paddingRight: "20px",
                }}
            >
                {isLoading && (
                    <Spin
                        spinning={isLoading}
                        className={clsx({ [styles["list-spin"]]: isLoading })}
                        style={{
                            height: `calc(100% - ${headHeight}px - 24px)`,
                        }}
                    />
                )}

                <InfiniteScroll
                    dataLength={listData.length}
                    next={() => {
                        setShouldShowLoading(false);
                        setPage((page) => page + 1);
                    }}
                    hasMore={hasMore}
                    loader={
                        isLoading ? null : (
                            <div className={styles["spin-container"]}>
                                <Spin />
                            </div>
                        )
                    }
                    scrollableTarget="scrollableDiv"
                >
                    <List
                        grid={{
                            gutter: 24,
                            xs: 2,
                            sm: 2,
                            md: 2,
                            lg: 3,
                            xl: 3,
                            xxl: 4,
                        }}
                        dataSource={listData}
                        locale={{
                            emptyText: (
                                <Empty
                                    loadStatus={getLoadStatus({
                                        isLoading: isLoading,
                                        error,
                                        data: listData,
                                        keyword,
                                    })}
                                    height={window.innerHeight - 600}
                                    emptyText={
                                        currentTab === "shareFlow"
                                            ? t("empty", "列表为空")
                                            : t(
                                                  "noTask",
                                                  "您还没有新建自动任务"
                                              )
                                    }
                                />
                            ),
                        }}
                        renderItem={(item) => (
                            <List.Item>
                                <Card
                                    key={item.id}
                                    task={item}
                                    refresh={handleReset}
                                    onChange={handleChange}
                                    isShare={currentTab === "shareFlow"}
                                ></Card>
                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        </div>
    );
};
