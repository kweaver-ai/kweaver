import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useLocation, useNavigate, useParams } from "react-router";
import styles from "./styles.module.less";
import { LeftOutlined } from "@ant-design/icons";
import {
    Button,
    Dropdown,
    Form,
    Layout,
    List,
    Menu,
    PageHeader,
    Spin,
    Typography,
} from "antd";
import { useContext, useEffect, useRef, useState } from "react";
import moment from "moment";
import docSummarySVG from "../../extensions/ai/assets/doc-summarize.svg";
import { DeleteOutlined, OperationOutlined } from "@applet/icons";
import emptyImg from "../../assets/empty.png";
import clsx from "clsx";
import { Card } from "../task-card";
import useSize from "@react-hook/size";
import { differenceBy, reject } from "lodash";
import useSWR from "swr";
import { useHandleErrReq } from "../../utils/hooks";
import { Empty, getLoadStatus } from "../table-empty";
import { getType } from "../custom-model/model-list";

const formatDate = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
    if (!timestamp) {
        return "";
    }
    return moment(timestamp).format(format);
};

const getHeaderIcon = (type?: string) => {
    switch (type) {
        default:
            return docSummarySVG;
    }
};

export const CustomModelDetails = () => {
    const navigate = useNavigate();
    const [details, setDetails] = useState<Record<string, any>>();
    const [listData, setListData] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const headerRef = useRef<HTMLDivElement>(null);
    const [width] = useSize(headerRef);
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const lang = microWidgetProps?.language?.getLanguage;
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const { id: taskId = "" } = useParams<{ id: string }>();
    const location = useLocation();

    const back = () => {
        navigate("/nav/model/custom");
    };

    const { error, mutate } = useSWR(
        ["/models/dagsGet", page],
        () => {
            setIsLoading(true);
            return API.axios.get(
                `${prefixUrl}/api/automation/v1/models/${taskId}/dags`
            );
        },
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
            dedupingInterval: 0,
            onSuccess(data) {
                setIsLoading(false);
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
                mutate();
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

    const handlePublish = async (status: number) => {
        try {
            await API.axios.put(
                `${prefixUrl}/api/automation/v1/models/${details!.id}`,
                {
                    name: details!.name,
                    description: details?.description || "",
                    status,
                }
            );
            microWidgetProps?.components?.toast?.success(
                status === 1
                    ? t("model.publish.success", "发布成功")
                    : t("model.unPublish.success", "取消发布成功")
            );
            setDetails((pre) => ({ ...pre, status }));
        } catch (error: any) {
            handleErr({ error: error?.response });
        }
    };

    const handleCreate = async () => {
        try {
            const { data } = await API.automation.dagsGet();
            if (data?.total && data?.total >= 50) {
                microWidgetProps?.components?.messageBox({
                    type: "info",
                    title: t("err.title.create", "无法新建自动任务"),
                    message: t(
                        "err.tasksExceeds",
                        "您新建的自动任务数已达上限。（最多允许新建50个）"
                    ),
                    okText: t("ok", "确定"),
                });
                return;
            }
            navigate(`/new?back=${btoa(location.pathname)}`);
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

    useEffect(() => {
        async function getDetails() {
            try {
                const { data } = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/models/${taskId}`
                );
                setDetails(data);
            } catch (error: any) {
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.TaskNotFound"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.title", "无法完成操作"),
                        message: t(
                            "err.ability.notFound",
                            "该自定义能力已不存在。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => back(),
                    });
                    return;
                }
                handleErr({ error: error?.response });
            }
        }
        getDetails();
    }, []);

    const getMenu = () => (
        <Menu>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined style={{ fontSize: "16px" }} />}
                onClick={async () => {
                    try {
                        const res =
                            await microWidgetProps?.components?.messageBox({
                                type: "info",
                                title: t("deleteTitle", "确认删除"),
                                message: t(
                                    "delete.tips",
                                    "删除后，自定义能力将无法恢复。"
                                ),
                                buttons: [
                                    { label: t("ok", "确定"), type: "primary" },
                                    {
                                        label: t("cancel", "取消"),
                                        type: "normal",
                                    },
                                ],
                            });
                        if (res?.button === 0) {
                            await API.axios.delete(
                                `${prefixUrl}/api/automation/v1/models/${details?.id}`
                            );
                            microWidgetProps?.components?.toast?.success(
                                t("model.delete.success", "删除成功")
                            );

                            back();
                        }
                    } catch (error: any) {
                        handleErr({ error: error?.response });
                    }
                }}
            >
                {t("delete", "删除")}
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout className={styles["container"]}>
            <PageHeader
                title={
                    <div title={details?.name} className={styles["title"]}>
                        <img
                            src={getHeaderIcon()}
                            alt=""
                            className={styles["header-icon"]}
                        ></img>
                        <span>{details?.name || " "}</span>
                    </div>
                }
                className={styles["header"]}
                backIcon={<LeftOutlined className={styles["back-icon"]} />}
                onBack={back}
                extra={[
                    <Button
                        key="3"
                        style={{ marginRight: "8px", minWidth: "60px" }}
                        onClick={() => {
                            const path = location.pathname;
                            const type = getType(details?.type);
                            if (type) {
                                navigate(
                                    `/model/${type}/edit/${
                                        details?.id
                                    }?back=${btoa(path)}`
                                );
                            }
                        }}
                    >
                        {t("edit", "编辑")}
                    </Button>,
                    <Dropdown
                        overlay={getMenu()}
                        trigger={["click"]}
                        transitionName=""
                        overlayClassName={styles["operation-pop"]}
                        getPopupContainer={() =>
                            document.querySelector("." + styles["container"]) ||
                            document.body
                        }
                    >
                        <Button
                            size="small"
                            className={styles["ops-btn"]}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <OperationOutlined
                                style={{
                                    fontSize: "16px",
                                    height: "16px",
                                }}
                            />
                        </Button>
                    </Dropdown>,
                ]}
            />

            <Layout.Content className={styles["content"]}>
                <div className={styles["details-container"]}>
                    <div className={styles["table-wrapper"]}>
                        <header className={styles["title"]}>
                            {t("title.detail", "详细信息")}
                        </header>
                        <Form
                            name="model-details"
                            labelAlign="left"
                            className={styles["form"]}
                            colon={false}
                            requiredMark={false}
                            initialValues={details}
                            layout="horizontal"
                            labelCol={{
                                style: {
                                    width: lang === "en-us" ? "120px" : "80px",
                                },
                            }}
                        >
                            <Form.Item
                                name="name"
                                label={t("label.abilityName", "能力名称：")}
                            >
                                <Typography.Text
                                    ellipsis
                                    title={details?.name || ""}
                                >
                                    {details?.name || "---"}
                                </Typography.Text>
                            </Form.Item>
                            <Form.Item
                                name="description"
                                label={t(
                                    "label.abilityDescription",
                                    "能力描述："
                                )}
                            >
                                <Typography.Text
                                    ellipsis
                                    title={details?.description || ""}
                                >
                                    {details?.description || "---"}
                                </Typography.Text>
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label={t("label.abilityStatus", "能力状态：")}
                            >
                                <div>
                                    {details?.status === 1 ? (
                                        <span>
                                            {t(
                                                "model.status.published",
                                                "已发布"
                                            )}
                                        </span>
                                    ) : (
                                        <div>
                                            <span>
                                                {t(
                                                    "model.status.unPublished",
                                                    "未发布"
                                                )}
                                            </span>
                                            <Button
                                                type="link"
                                                className={styles["tip"]}
                                                onClick={() => handlePublish(1)}
                                            >
                                                {t("publish", "立即发布")}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Form.Item>
                            <Form.Item
                                name="create_time"
                                label={t("taskInfo.created_at", "创建时间：")}
                            >
                                <div>
                                    {formatDate(details?.created_at) || "---"}
                                </div>
                            </Form.Item>
                            <Form.Item
                                name="update_time"
                                label={t("taskInfo.updated_at", "更新时间：")}
                            >
                                <div>
                                    {formatDate(details?.updated_at) || "---"}
                                </div>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
                <div className={styles["details-container"]}>
                    <div className={styles["list-wrapper"]}>
                        <header ref={headerRef}>
                            <span className={styles["title"]}>
                                {t("model.related", "相关流程")}
                            </span>
                            <span className={styles["tip"]}>
                                {t("model.flowTip", "发布后可在工作流中运用")}
                            </span>
                        </header>
                        {isLoading && (
                            <Spin
                                spinning={isLoading}
                                className={clsx({
                                    [styles["list-spin"]]: isLoading,
                                })}
                                style={{
                                    height: `calc(100% - 28px - 24px)`,
                                }}
                            />
                        )}
                        {
                            <div
                                className={styles["list-container"]}
                                id="scrollableDiv"
                            >
                                <div
                                    className={clsx(
                                        styles["scrollable-container"],
                                        {
                                            [styles["spin-blur"]]: isLoading,
                                            [styles["max-1960"]]: width > 1960,
                                        }
                                    )}
                                    style={{
                                        paddingRight: "20px",
                                    }}
                                >
                                    {/* <InfiniteScroll
                                        dataLength={listData.length}
                                        next={() => {
                                            setShouldShowLoading(false);
                                            setPage((page) => page + 1);
                                        }}
                                        hasMore={hasMore}
                                        loader={
                                            isLoading ? null : (
                                                <div
                                                    className={
                                                        styles["spin-container"]
                                                    }
                                                >
                                                    <Spin />
                                                </div>
                                            )
                                        }
                                        scrollableTarget="scrollableDiv"
                                    > */}
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
                                            emptyText: !!error ? (
                                                <Empty
                                                    loadStatus={getLoadStatus({
                                                        isLoading: isLoading,
                                                        error,
                                                        data: listData,
                                                    })}
                                                    height={
                                                        window.innerHeight - 600
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    className={
                                                        styles[
                                                            "empty-container"
                                                        ]
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles[
                                                                "empty-wrapper"
                                                            ]
                                                        }
                                                    >
                                                        <img
                                                            src={emptyImg}
                                                            alt=""
                                                        />
                                                        <div
                                                            className={
                                                                styles["text"]
                                                            }
                                                        >
                                                            {t(
                                                                "model.noRelevantFlow",
                                                                "您还没有使用该自定义能力的工作流，"
                                                            )}
                                                            <Button
                                                                type="link"
                                                                onClick={
                                                                    handleCreate
                                                                }
                                                            >
                                                                {t(
                                                                    "model.toFlow",
                                                                    "去流程中使用"
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        }}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <Card
                                                    key={item.id}
                                                    task={item}
                                                    refresh={handleReset}
                                                    onChange={handleChange}
                                                ></Card>
                                            </List.Item>
                                        )}
                                    />
                                    {/* </InfiniteScroll> */}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
};
