import { FC, useContext, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { TaskResultResults } from "@applet/api/lib/content-automation";
import { useHandleErrReq } from "../../utils/hooks";
import styles from "./task-statistics.module.less";
import clsx from "clsx";
import { ConsoleStatRecords, ITableParams } from "./console-stat-records";
import { DatePicker, Modal } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import moment from 'moment';
import { getProgress } from "../task-stat";
import SearchInput from "../search-input";
import { useDataStudio } from "./data-studio-provider";

const { RangePicker } = DatePicker;
export const getUnfinishedCount = (tasks?: TaskResultResults[]) => {
    return (
        tasks?.filter(
            (item: TaskResultResults) =>
                item.status === "running" || item.status === "scheduled"
        )?.length || 0
    );
};

interface TaskStatisticsProps {
    taskId: string;
    handleDisable?: () => void;
    onShowLog?: (record: any) => void;
    onBack: (needRefresh?: boolean) => void;
}

interface FetchTaskDetailParams {
    page: number;
    limit: string;
    sortBy: string;
    order: string;
    type: string[];
    start_time?: number;
    end_time?: number;
    name: string;
}

export const TaskStatistics: FC<TaskStatisticsProps> = ({
    taskId,
    onShowLog,
    handleDisable,
    onBack,
}: TaskStatisticsProps) => {
    const { prefixUrl } = useContext(MicroAppContext);
    const [showLoading, setShowLoading] = useState(true);
    const t = useTranslate();
    const intervalRef = useRef(5000);
    const { cache } = useSWRConfig();
    const handleErr = useHandleErrReq();
    const latestSWRKey = useRef<string>();

    const { taskDetailState, setTaskDetailState } = useDataStudio();

    const searchInputRef = useRef<{
        cleanValue: () => void;
        setValue: (value: string) => void;
    }>(null);

    const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>(taskDetailState.dateRange);

    const formatTime = (seconds: number) => {
        if (seconds >= 3600) return t('flow.averageTime.hour', `${(seconds / 3600).toFixed(1).replace('.0', '')}小时`, { time: (seconds / 3600).toFixed(1).replace('.0', '') });
        if (seconds >= 60) return t('flow.averageTime.minute', `${(seconds / 60).toFixed(1).replace('.0', '')}分钟`, { time: (seconds / 60).toFixed(1).replace('.0', '') });
        return t('flow.averageTime.second', `${seconds.toFixed(1).replace('.0', '')}秒`, { time: seconds.toFixed(1).replace('.0', '') });
    }

    useEffect(() => {
        // 设置搜索框的初始值
        if (searchInputRef.current && taskDetailState.searchValue) {
            searchInputRef.current.setValue(taskDetailState.searchValue);
        }
    }, []);

    const initialQueryParams: FetchTaskDetailParams = {
        type: [],
        page: 0,
        limit: "20",
        sortBy: "started_at",
        order: "desc",
        start_time: Math.floor(dateRange[0].valueOf() / 1000),
        end_time: Math.floor(dateRange[1].valueOf() / 1000),
        name: taskDetailState.searchValue,
    };

    const [queryParams, setQueryParams] = useState({
        ...initialQueryParams,
    });

    const setTableParamsRef = useRef<((params: ITableParams) => void) | null>(null);

    const { type: filterType, page, limit, order, sortBy } = queryParams;

    const [averageTime, setAverageTime] = useState<string>("--");

    const calculateAverageTime = (results?: TaskResultResults[]) => {
        if (!results || results.length === 0) {
            return "--";
        }

        const validTasks = results.filter(
            task =>
                (task.status === "success" || task.status === "failed") &&
                task.started_at &&
                task.ended_at
        );

        if (validTasks.length === 0) {
            return "--";
        }

        const totalSeconds = validTasks.reduce((sum, task) => {
            const durationSeconds = (task.ended_at! - task.started_at!);
            return sum + durationSeconds;
        }, 0);

        const averageSeconds = totalSeconds / validTasks.length;

        return formatTime(averageSeconds);
    };

    const { data: count } = useSWR(
        [`${prefixUrl}/api/automation/v1/dag/${taskId}/count`, queryParams.start_time, queryParams.end_time],
        (): Promise<{ data: { count: number } }[]> => {
            return Promise.all([
                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                    {
                        params: {
                            start_time: queryParams.start_time,
                            end_time: queryParams.end_time,
                        }
                    }
                ),

                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                    {
                        params: {
                            type: 'success',
                            start_time: queryParams.start_time,
                            end_time: queryParams.end_time,
                        }
                    }
                ),

                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                    {
                        params: {
                            type: 'failed',
                            start_time: queryParams.start_time,
                            end_time: queryParams.end_time,
                        }
                    }
                )
            ])
        },
        {
            fallbackData: [
                { data: { count: 0 } },
                { data: { count: 0 } },
                { data: { count: 0 } }
            ]
        }
    )

    const { data: results, isValidating, error, mutate } = useSWR(
        [`${prefixUrl}/api/automation/v2/dag/${taskId}/results`, filterType, order, sortBy, page, limit, queryParams.start_time, queryParams.end_time, queryParams.name],
        () => {
            return API.axios.get(
                `${prefixUrl}/api/automation/v2/dag/${taskId}/results`,
                {
                    params: {
                        page,
                        limit,
                        sortBy,
                        order,
                        start_time: queryParams.start_time,
                        end_time: queryParams.end_time,
                        name: queryParams.name,
                        ...filterType?.length > 0
                            ? { type: filterType.join(",") }
                            : {}
                    }
                }
            )
        },
        {
            shouldRetryOnError: false,
            revalidateOnFocus: true,
            dedupingInterval: 0,
            refreshInterval: intervalRef.current,
            onSuccess: (data, key, _config) => {
                const avgTime = calculateAverageTime(data?.data?.results);
                setAverageTime(avgTime);

                if (getUnfinishedCount(data?.data?.results) > 0) {
                    intervalRef.current = 5000;
                    setShowLoading(false);
                } else {
                    intervalRef.current = 0;
                }
                if (
                    page > 0 &&
                    data?.data?.total &&
                    data?.data?.total <= Number(limit) * page
                ) {
                    setQueryParams(prev => ({
                        ...prev,
                        page: 0,
                    }));
                }
                if (latestSWRKey.current && latestSWRKey.current !== key) {
                    cache.delete(latestSWRKey.current);
                }
                latestSWRKey.current = key;
            },
            onError(error) {
                intervalRef.current = 0;
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    Modal.info({
                        title: t("err.title", "无法完成操作"),
                        content: t("err.task.notFound", "该任务已不存在。"),
                        okText: t("task.back", "返回任务列表"),
                        onOk: () => onBack(true),
                    });
                    return;
                }
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    handleDisable?.();
                    return;
                }
                handleErr({ error: error?.response });
            },
        }
    );

    const data = useMemo(() => {
        return {
            ...results,
            data: {
                ...results?.data,
                progress: getProgress(count!!)
            }
        }
    }, [results, count])

    const handleRefresh = (value?: ITableParams) => {
        setShowLoading(true);
        if (value) {
            setQueryParams(prev => ({
                ...prev,
                ...value,
            }));
        } else {
            setQueryParams(initialQueryParams);
        }
        mutate();
    }

    const handlePreview = (record: any) => {
        onShowLog?.(record);
    };

    const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
        if (!dates || !dates[0] || !dates[1]) return;

        const newDateRange: [moment.Moment, moment.Moment] = [dates[0], dates[1]];
        setDateRange(newDateRange);
        setTaskDetailState({
            ...taskDetailState,
            dateRange: newDateRange,
        });

        setQueryParams(prev => ({
            ...prev,
            start_time: Math.floor(dates[0]!.startOf('day').valueOf() / 1000),
            end_time: Math.floor(dates[1]!.endOf('day').valueOf() / 1000),
        }));
    };

    const handleSearch = (value: string) => {
        setTaskDetailState({
            ...taskDetailState,
            searchValue: value,
        });

        setQueryParams(prev => ({
            ...prev,
            name: value,
            page: 0,
        }));

        setTableParamsRef.current?.({
            type: [],
            sortBy: "started_at",
            order: "desc",
            limit: queryParams.limit,
            page: 0,
        });
    };

    const handleTableParamsChange = (setTableParams: (params: ITableParams) => void) => {
        setTableParamsRef.current = setTableParams;
    };

    const doneTask = (data?.data.progress?.success || 0) + (data?.data.progress?.failed || 0)

    return (
        <div className={styles["container"]}>
            <div className={styles["content"]}>
                <div className={styles["title"]}>
                    <div className={styles["left"]}>
                        <span>{t("title.statistics", "运行统计")}</span>
                    </div>
                    <div className={styles["right"]}>
                        <RangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            allowClear={false}
                            format="YYYY-MM-DD"
                            ranges={{
                                [t("taskStat.recent7Days", "最近7天")]: [moment().subtract(7, 'days'), moment()],
                            }}
                        />
                        <SearchInput
                            className={styles['console-task-statistics']}
                            ref={searchInputRef}
                            placeholder={t("searchLogDetail", "搜索日志详情")}
                            onSearch={handleSearch}
                        />
                    </div>
                </div>
                <div className={styles["stat"]}>
                    <div className={clsx(styles["statItem"], styles["total"])}>
                        <div className={styles["stat-label"]}>
                            {t("taskStat.total", "任务运行总次数")}
                        </div>
                        <div className={styles["count"]} title={`${data?.data.progress?.total?.toLocaleString() || 0}`}>
                            {data?.data.progress?.total?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div
                        className={clsx(
                            styles["statItem"],
                            styles["committed"]
                        )}
                    >
                        <div className={styles["stat-label"]}>
                            {t("taskStat.success", "任务运行成功次数")}
                        </div>
                        <div className={styles["count"]} title={`${data?.data.progress?.success?.toLocaleString() || 0}`}>
                            {data?.data.progress?.success?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div
                        className={clsx(
                            styles["statItem"],
                            styles["committed"]
                        )}
                    >
                        <div className={styles["stat-label"]}>
                            {t("taskStat.successRate", "成功率")}
                        </div>
                        <div className={styles["count"]} title={`${doneTask ? Math.floor(
                            (data?.data.progress?.success || 0) / doneTask * 100) : 0}%`}>
                            {doneTask ? Math.floor((data?.data.progress?.success || 0) / doneTask * 100) : 0}%
                        </div>
                    </div>
                    <div
                        className={clsx(
                            styles["statItem"],
                            styles["average-time"]
                        )}
                    >
                        <div className={styles["stat-label"]}>
                            {t("taskStat.averageTime", "平均耗时")}
                        </div>
                        <div className={styles["count"]} title={`${averageTime}`}>
                            {averageTime}
                        </div>
                    </div>
                    <div
                        className={clsx(
                            styles["statItem"],
                            styles["uncommitted"]
                        )}
                    >
                        <div className={styles["stat-label"]}>
                            {t("taskStat.failed", "任务运行失败次数")}
                        </div>

                        <div className={styles["count"]} title={`${data?.data.progress?.failed?.toLocaleString() || 0}`}>
                            {data?.data.progress?.failed?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>
                <ConsoleStatRecords
                    data={data?.data}
                    isLoading={showLoading && isValidating}
                    error={error?.response?.data}
                    refresh={handleRefresh}
                    onPreview={handlePreview}
                    onTableParamsChange={handleTableParamsChange}
                />
            </div>
        </div>
    );
};
