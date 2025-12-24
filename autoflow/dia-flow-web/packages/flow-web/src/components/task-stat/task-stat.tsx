import { FC, useContext, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate, useParams } from "react-router";
import useSWR, { useSWRConfig } from "swr";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { TaskResultResults } from "@applet/api/lib/content-automation";
import { useHandleErrReq } from "../../utils/hooks";
import { StatRecords } from "./stat-records";
import styles from "./styles/task-stat.module.less";
import clsx from "clsx";
import SearchInput from "../search-input";

export const getUnfinishedCount = (tasks?: TaskResultResults[]) => {
    return (
        tasks?.filter(
            (item: TaskResultResults) =>
                item.status === "running" || item.status === "scheduled"
        )?.length || 0
    );
};

interface TaskStatProps {
    handleDisable: () => void;
}

export const TaskStat: FC<TaskStatProps> = ({
    handleDisable
}: TaskStatProps) => {
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
     const { id: taskId = '' } = useParams<{ id: string }>();
    const [params, setSearchParams] = useSearchParams();

    const [showLoading, setShowLoading] = useState(true);
    const navigate = useNavigate();
    const t = useTranslate();
    const intervalRef = useRef(5000);
    const { cache } = useSWRConfig();
    const latestSWRKey = useRef<string>();
    const handleErr = useHandleErrReq();

    const searchInputRef = useRef<{
        cleanValue: () => void;
    }>(null);

    const {
        status: filteredStatus,
        page,
        limit,
        order,
        sortBy,
        name,
    } = useMemo(() => {
        setShowLoading(true);
        const status = params.get("status")?.split(",")?.filter(Boolean) || [];
        return {
            status,
            keyword: params.get("keyword") || undefined,
            page: parseInt(params.get("page") || "0"),
            limit: params.get("limit") || "20",
            sortBy: params.get("sortby") || "started_at",
            order: params.get("order") || "desc",
            name: params.get("name") || '',
        };
    }, [params]);

    const { data: count } = useSWR(
        [`${prefixUrl}/api/automation/v1/dag/${taskId}/count`],
        (): Promise<{ data: { count: number } }[]> => {
            return Promise.all([
                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                ),

                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                    {
                        params: {
                            type: 'success'
                        }
                    }
                ),

                API.axios.get(
                    `${prefixUrl}/api/automation/v1/dag/${taskId}/count`,
                    {
                        params: {
                            type: 'failed'
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

    const { data, isValidating, error, mutate } = useSWR(
        [`${prefixUrl}/api/automation/v2/dag/${taskId}/results`, filteredStatus, order, sortBy, page, limit, name],
        () => {
            return API.axios.get(
                `${prefixUrl}/api/automation/v2/dag/${taskId}/results`,
                {
                    params: {
                        page,
                        limit,
                        sortBy,
                        order,
                        name,
                        ...filteredStatus?.length > 0
                            ? { type: filteredStatus.join(",") }
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
                // 有正在运行中或等待中任务则轮询
                if (getUnfinishedCount(data?.data?.results) > 0) {
                    intervalRef.current = 5000;
                    setShowLoading(false);
                } else {
                    intervalRef.current = 0;
                }
                // 防止翻页后当前页数据为空
                if (
                    page > 0 &&
                    data?.data?.total &&
                    data?.data?.total <= Number(limit) * page
                ) {
                    const newParams = new URLSearchParams(params);
                    newParams.set("page", "0");
                    setSearchParams(newParams);
                }
                if (latestSWRKey.current && latestSWRKey.current !== key) {
                    cache.delete(latestSWRKey.current);
                }
                latestSWRKey.current = key;
            },
            onError(error) {
                intervalRef.current = 0;
                // 任务不存在
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t("err.task.notFound", "该任务已不存在。"),
                        okText: t("task.back", "返回任务列表"),
                        onOk: () => navigate("/nav/list"),
                    });
                    return;
                }
                // 自动化未启用
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    handleDisable();
                    return;
                }
                handleErr({ error: error?.response });
            },
        }
    );

    const handleSearch = (value: string) => {
        const newParams = new URLSearchParams(params);
        newParams.set("name", value);
        newParams.set("page", "0");
        setSearchParams(newParams);
    };

    return (
        <div className={styles["container"]}>
            <div className={styles["content"]}>
                <div className={styles["title"]}>
                    <div className={styles['left']}>
                        <span>{t("title.statistics", "运行统计")}</span>
                    </div>
                    <div className={styles['right']}>
                        <SearchInput
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
                        <div className={styles["count"]}>
                            {getProgress(count!).total || 0}
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
                        <div className={styles["count"]}>
                            {getProgress(count!).success || 0}
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

                        <div className={styles["count"]}>
                            {getProgress(count!).failed || 0}
                        </div>
                    </div>
                </div>
                <StatRecords
                    data={{ ...data?.data }}
                    isLoading={showLoading && isValidating}
                    error={error?.response?.data}
                    refresh={mutate}              
                />
            </div>
        </div>
    );
};

export function getProgress(count: { data: { count: number } }[]): { total: number, success: number, failed: number } {
    if (count) {
        const [{ data: { count: total } }, { data: { count: success } }, { data: { count: failed } }] = count

        return {
            total,
            success,
            failed
        }
    }

    return {
        total: 0,
        success: 0,
        failed: 0
    }
}
