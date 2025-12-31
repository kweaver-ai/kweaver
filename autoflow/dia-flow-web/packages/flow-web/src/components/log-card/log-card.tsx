import { useContext, useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Divider, Tabs } from "antd";
import clsx from "clsx";
import { isFunction, isObject } from "lodash";
import moment from "moment";
import ReactJsonView from "react-json-view";
import { MicroAppContext, NavigationContext, useTranslate } from "@applet/common";
import { SyncfaildColored, SyncuccessColored } from "@applet/icons";
import { MinusCircleFilled } from "@ant-design/icons";
import { LogResult } from "@applet/api/lib/content-automation";
import { ExpandStatus } from "../../pages/log-panel";
import { BoxImg } from "../task-card";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import {
    Executor,
    ExecutorAction,
    Extension,
    Trigger,
    TriggerAction,
} from "../extension";
import { ErrorOutput } from "./error-output";
import { DefaultFormattedOutput } from "./default-output";
import { detectIE } from "../../utils/browser";
import styles from "./log-card.module.less";
import { IntelliinfoTransfer } from "../../extensions/datastudio/graph-database";
import { formatElapsedTime } from "../../utils/format-number";

interface LogCardProps {
    log?: LogResult;
    expandStatus: ExpandStatus;
    onExpandStatusChange: () => void;
}

type ILogData =
    | [TriggerAction, Trigger, Extension]
    | [ExecutorAction, Executor, Extension]
    | [];

const BeautyJsonView: any = ReactJsonView;
const JsonView = ({ data }: { data: object }) => {
    return (
        <BeautyJsonView
            src={data}
            name={false}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
        />
    );
};

const transferLog = (log?: LogResult): LogResult | undefined => {
    if (log?.operator === IntelliinfoTransfer) {
        let tag = ''

        if (log.inputs?.rule_id) {
            tag = `-${log.inputs?.rule_id?.slice(0, log.inputs.rule_id.indexOf('_'))}`
        }

        return {
            ...log,
            operator: `${IntelliinfoTransfer}${tag}`
        }
    }

    return log
}

export const LogCard = ({
    log: oldLog,
    expandStatus,
    onExpandStatusChange,
}: LogCardProps) => {
    const log = transferLog(oldLog)

    const [activeKey, setActiveKey] = useState("input");
    const [dataType, setDataType] = useState("beauty");
    const [isExpand, setIsExpand] = useState(true);
    const { getLocale } = useContext(NavigationContext);
    const { platform } = useContext(MicroAppContext);
    const t = useTranslate();
    const __a = useTranslateExtension("anyshare");
    const { triggers, executors, dataSources, globalConfig } =
        useContext(ExtensionContext);
    const { Meta } = Card;
    // 解决ie11显示超出高度
    const [showTabsContent, setShowContent] = useState(true);

    const logData: ILogData = useMemo(() => {
        if (log?.operator) {
            const operator = log.operator;
            // 触发器节点
            if (operator.indexOf("trigger") > -1) {
                return triggers[operator] || [];
            }
            //  AnyShare文档操作节点/工具方法节点
            else {
                return executors[operator] || [];
            }
        }
        // 空节点
        return [];
    }, [log?.operator, triggers, executors]);

    const extensionName =
        (logData?.length && logData[logData?.length - 1]?.name) || "anyshare";
    const __t = useTranslateExtension(extensionName);

    const isIE = useMemo(() => {
        return detectIE();
    }, []);

    useEffect(() => {
        if (expandStatus === ExpandStatus.ExpandAll) {
            setIsExpand(true);
            if (isIE) {
                setShowContent(false);
                setTimeout(() => {
                    setShowContent(() => true);
                }, 10);
            }
        }
        if (expandStatus === ExpandStatus.CollapseAll) {
            setIsExpand(false);
        }
    }, [expandStatus]);

    const formatTime = (timestamp?: number, format = "YYYY/MM/DD HH:mm") => {
        if (!timestamp) {
            return "";
        }
        return moment(timestamp).format(format);
    };

    const getAvatar = (operator: string) => {
        return (
            <div className={styles["avatar-icon"]}>
                <BoxImg item={operator} />
            </div>
        );
    };

    // 适配导航栏OEM
    const documents = useMemo(() => {
        return getLocale && getLocale("documents");
    }, [getLocale]);

    const getTitle = (logData: ILogData, log?: LogResult) => {
        if (log?.name) {
            return log?.name
        }

        // 分支节点
        if (log?.operator === "@control/flow/branches") {
            return t("log.branches", "分支执行");
        }
        // 循环节点
        if (log?.operator === "@control/flow/loop") {
            return t("log.loop", "循环执行") + ` - ${log?.outputs?.index + 1}`;
        }
        if (!logData) {
            return "---";
        }
        let title = logData[0]?.name;
        if (isFunction(title)) {
            title = title(globalConfig);
        }
        const operator = logData[0]?.operator;
        if (title && operator) {
            switch (true) {
                case /^@anyshare-trigger/.test(operator):
                    return (
                        __t("TDocumentCustom", "在文档中心触发", {
                            name: documents,
                        }) +
                        __t("colon", "：") +
                        __t(title)
                    );
                case /^@anyshare\/(file|folder)/.test(operator):
                    return (
                        __t("EDocumentCustom", "在文档中心执行", {
                            name: documents,
                        }) +
                        __t("colon", "：") +
                        __t(title)
                    );
                case /^@internal\/text/.test(operator):
                    return (
                        __t("EText", "文本处理") +
                        __t("colon", "：") +
                        __t(title)
                    );
                default:
                    return __t(title);
            }
        }
        return "";
    };

    const getStatusIcon = (log?: LogResult) => {
        switch (log?.status) {
            case "success":
                return <SyncuccessColored className={styles["status-icon"]} />;
            case "blocked":
            case "undo":
            case "skipped":
                return (
                    <MinusCircleFilled
                        className={clsx(
                            styles["status-icon"],
                            styles["icon-gray"]
                        )}
                    />
                );
            default:
                return <SyncfaildColored className={styles["status-icon"]} />;
        }
    };

    // 原始数据
    const getRawInputs = (data: object | string) => {
        return isObject(data) ? <JsonView data={data} /> : String(data);
    };

    const getRawOutputs = (data: object | string) => {
        return isObject(data) ? <JsonView data={data} /> : String(data);
    };

    // 文字描述
    const transferInputs = (data: object | string, logData: ILogData) => {
        if (
            logData &&
            logData[0]?.components?.FormattedInput &&
            isObject(data)
        ) {
            const FormattedInput: any = logData[0].components.FormattedInput;

            return <FormattedInput t={__t} input={data} />;
        }
        if (isObject(data)) {
            return <JsonView data={data} />;
        }
        // 错误信息描述
        return t("log.error", "错误信息：") + String(data);
    };

    const transferOutputs = (log: LogResult, logData: ILogData) => {
        if (isObject(log?.outputs)) {
            if (log?.status === "failed") {
                return (
                    <ErrorOutput
                        error={log?.outputs}
                        operator={log?.operator}
                    />
                );
            }
            const FormattedOutput: any =
                logData[0]?.components?.FormattedOutput ||
                DefaultFormattedOutput;
            // 数据源输出
            if (
                log?.operator === "@trigger/manual" ||
                log?.operator.indexOf("@trigger/cron") > -1
            ) {
                const outputData: Record<string, any> = log?.outputs;
                const dataSourceOperator =
                    // log?.inputs?.operator ||
                    outputData?.size && outputData.size !== -1
                        ? "@anyshare-data/list-files"
                        : "@anyshare-data/list-folders";
                const outputs = dataSources[dataSourceOperator][0]?.outputs;
                return (
                    <FormattedOutput
                        t={__a}
                        outputData={outputData}
                        outputs={outputs}
                    />
                );
            }
            // 添加标签节点无输出变量
            if (log?.operator.indexOf("addtag") > -1) {
                return (
                    <FormattedOutput
                        t={__a}
                        outputData={log?.outputs}
                        outputs={logData[0]?.outputs}
                    />
                );
            }
            return logData[0]?.outputs ? (
                <FormattedOutput
                    t={__t}
                    outputData={log?.outputs}
                    outputs={logData[0].outputs}
                />
            ) : (
                <JsonView data={log?.outputs} />
            );
        }

        // 错误信息描述
        return "---";
    };

    const title = getTitle(logData, log) || "---"

    return (
        <div
            className={styles["card-wrapper"]}
            onContextMenu={(e) => {
                e.stopPropagation();
            }}
            style={
                log?.operator === "@control/flow/loop" && (log?.outputs?.index == null) ? { height: '1px', marginTop: 0, overflow: "hidden" } : undefined
            }
        >
            {getStatusIcon(log)}
            <Card className={styles["log-card"]} bordered={false}>
                <Meta
                    avatar={
                        <Avatar
                            shape="square"
                            icon={getAvatar(log?.operator || "")}
                        />
                    }
                    title={
                        <div className={styles["card-name"]} title={title}>
                            {title}
                        </div>
                    }
                    description={
                        <>
                            {platform === "operator" ? (
                            <div className={styles["card-time"]}>
                                {formatTime((log as any)?.updated_at*1000 || (log as any)?.started_at*1000) ||
                                "---"}
                            </div>
                            ) : (
                            <div className={styles["card-description"]}>
                                <ul>
                                <li>
                                    {t("runtime.duration")}
                                    {formatElapsedTime(log?.metadata?.elapsed_time)}
                                </li>
                                <li>
                                    {t("start.time")}
                                    {formatTime(log?.metadata?.started_at) || "--"}
                                </li>
                                <li>
                                    {t("number.of.runs")}
                                    {log?.metadata?.attempts ||
                                    log?.metadata?.attempts === 0
                                    ? log?.metadata?.attempts + 1
                                    : "--"}
                                </li>
                                </ul>
                            </div>
                            )}
                        </>
                    }
                />
                <Button
                    type="link"
                    className={styles["expand-btn"]}
                    onClick={() => {
                        setIsExpand((isExpand) => {
                            onExpandStatusChange();
                            return !isExpand;
                        });
                        if (isIE && !isExpand) {
                            setShowContent(false);
                            setTimeout(() => {
                                setShowContent(() => true);
                            }, 10);
                        }
                    }}
                >
                    {isExpand
                        ? t("card.collapse", "收起")
                        : t("card.expand", "展开")}
                </Button>
                {isExpand ? (
                    <>
                        <Divider />
                        <Tabs
                            className={clsx(
                                styles["tabs"],
                                "automate-oem-tabs"
                            )}
                            activeKey={activeKey}
                            onTabClick={(key) => {
                                setActiveKey(key);
                            }}
                        >
                            <Tabs.TabPane
                                className={styles["tab"]}
                                tab={t("tabs.input", "输入数据")}
                                key="input"
                            >
                                {log?.inputs && activeKey === "input" ? (
                                    <div
                                        className={styles["data-tabs-wrapper"]}
                                    >
                                        <Tabs
                                            activeKey={dataType}
                                            onTabClick={(key) => {
                                                setDataType(key);
                                            }}
                                            className="automate-oem-tabs"
                                            destroyInactiveTabPane
                                        >
                                            <Tabs.TabPane
                                                tab={
                                                    <span
                                                        className={clsx(
                                                            styles["tab-name"],
                                                            styles["tab-divider"]
                                                        )}
                                                    >
                                                        {t(
                                                            "tabs.beauty",
                                                            "文字描述"
                                                        )}
                                                    </span>
                                                }
                                                key="beauty"
                                            >
                                                {showTabsContent && (
                                                    <div
                                                        className={
                                                            styles["data-container"]
                                                        }
                                                    >
                                                        {dataType ===
                                                            "beauty" &&
                                                            transferInputs(
                                                                log?.inputs,
                                                                logData
                                                            )}
                                                    </div>
                                                )}
                                            </Tabs.TabPane>
                                            <Tabs.TabPane
                                                tab={
                                                    <span
                                                        className={
                                                            styles["tab-name"]
                                                        }
                                                    >
                                                        {t(
                                                            "tabs.raw",
                                                            "原始数据"
                                                        )}
                                                    </span>
                                                }
                                                key="raw"
                                            >
                                                <div
                                                    className={
                                                        styles["data-container"]
                                                    }
                                                >
                                                    {showTabsContent &&
                                                        getRawInputs(
                                                            log?.inputs
                                                        )}
                                                </div>
                                            </Tabs.TabPane>
                                        </Tabs>
                                    </div>
                                ) : (
                                    <div className={styles["card-empty"]}>
                                        {t("input.empty", "无输入数据")}
                                    </div>
                                )}
                            </Tabs.TabPane>
                            <Tabs.TabPane
                                className={styles["tab"]}
                                tab={t("tabs.output", "输出数据")}
                                key="output"
                            >
                                {log?.outputs && activeKey === "output" ? (
                                    <div
                                        className={styles["data-tabs-wrapper"]}
                                    >
                                        <Tabs
                                            activeKey={dataType}
                                            onTabClick={(key) => {
                                                setDataType(key);
                                            }}
                                            className="automate-oem-tabs"
                                            destroyInactiveTabPane
                                        >
                                            <Tabs.TabPane
                                                tab={
                                                    <span
                                                        className={clsx(
                                                            styles["tab-name"],
                                                            styles["tab-divider"]
                                                        )}
                                                    >
                                                        {t(
                                                            "tabs.beauty",
                                                            "文字描述"
                                                        )}
                                                    </span>
                                                }
                                                key="beauty"
                                            >
                                                {showTabsContent && (
                                                    <div
                                                        className={
                                                            styles["data-container"]
                                                        }
                                                    >
                                                        {dataType ===
                                                            "beauty" &&
                                                            transferOutputs(
                                                                log,
                                                                logData
                                                            )
                                                        }
                                                    </div>
                                                )}
                                            </Tabs.TabPane>
                                            <Tabs.TabPane
                                                tab={
                                                    <span
                                                        className={
                                                            styles["tab-name"]
                                                        }
                                                    >
                                                        {t(
                                                            "tabs.raw",
                                                            "原始数据"
                                                        )}
                                                    </span>
                                                }
                                                key="raw"
                                            >
                                                {showTabsContent && (
                                                    <div
                                                        className={
                                                            styles["data-container"]
                                                        }
                                                    >
                                                        {getRawOutputs(
                                                            log?.outputs
                                                        )}
                                                    </div>
                                                )}
                                            </Tabs.TabPane>
                                        </Tabs>
                                    </div>
                                ) : (
                                    <div className={styles["card-empty"]}>
                                        {t("output.empty", "无输出数据")}
                                    </div>
                                )}
                            </Tabs.TabPane>
                        </Tabs>
                    </>
                ) : null}
            </Card>
        </div>
    );
};
