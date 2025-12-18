import React, {
    CSSProperties,
    FC,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Button, Drawer } from "antd";
import { useEvent, useTranslate } from "../../hooks";
import { MicroAppContext } from "../micro-app";
import styles from "./audit-flow-config.module.less";
import { DeleteOutlined } from "@applet/icons";
import { QiankunApp } from "../qiankun-app";
import API from "../../api";
import clsx from "clsx";
import { AxiosError } from "axios";
import useSWR, { useSWRConfig } from "swr";
import { pick } from "lodash";

export interface Workflow {
    id: string;
    key: string;
    name: string;
    [key: string]: any;
}

export interface AuditFlowConfigProps {
    className?: string;
    style?: CSSProperties;
    value?: Workflow;
    processType?: string;
    allowOwnerAuditor?: boolean;
    onlyOwnerAuditor?: boolean;
    drawerClassName?: string;
    drawerStyle?: CSSProperties;
    platform?: string;
    onChange?(value?: Workflow): void;
    getPopupContainer?(): HTMLElement;
}

export const AuditFlowConfig: FC<AuditFlowConfigProps> = ({
    value,
    processType = "doc_flow",
    allowOwnerAuditor = false,
    onlyOwnerAuditor = false,
    className,
    onChange,
    drawerClassName,
    drawerStyle,
    getPopupContainer,
    platform,
}) => {
    const { prefixUrl, container, microWidgetProps, message } =
        useContext(MicroAppContext);
    const [visible, setVisible] = useState(false);
    const t = useTranslate();

    const handleClick = async () => {
        setVisible(true);
    };

    const docflowTemplate = {
        process_def_id: value?.id,
        process_def_key: value?.key || "",
        visit: value?.key ? "edit" : "new",
        close: () => {
            setVisible(false);
        },
        save: async (data: any) => {
            try {
                const {
                    data: { id },
                } = (await API.workflow.workflowRestV1ProcessModelPost(
                    data.process_data.type,
                    data.process_data.configData,
                    {
                        headers: {
                            "content-type": "application/json;charset=UTF-8",
                        },
                    }
                )) as any;
                onChange &&
                    onChange({
                        id,
                        key: data.process_def_key,
                        name: data.process_def_name,
                    });
                setVisible(false);
            } catch (e) {
                if ((e as AxiosError)?.response.status === 503) {
                    message.warning(
                        t(
                            "common.serviceUnavailable",
                            "{name} 服务无法连接，请联系管理员",
                            { name: "Workflow" }
                        )
                    );
                }
                throw e;
            }
        },
    };

    return (
        <>
            <div
                className={clsx(styles.container, className)}
                onSubmit={(e) => {
                    e.stopPropagation();
                }}
            >
                {value?.name ? (
                    <>
                        <Button
                            type="link"
                            className={styles.flowNameButton}
                            title={value.name}
                            onClick={handleClick}
                        >
                            {value.name}
                        </Button>
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            onClick={() => onChange(undefined)}
                        />
                    </>
                ) : (
                    <Button onClick={handleClick}>
                        {platform === "console"
                            ? t("common.flow.btnText", "设置流程")
                            : t("common.auditFlowConfig.btnText", "设置")}
                    </Button>
                )}
                {visible && (
                    <Drawer
                        open={true}
                        onClose={() => setVisible(false)}
                        width="100%"
                        getContainer={() => {
                            if (typeof getPopupContainer === "function") {
                                return getPopupContainer() || container;
                            }
                            return container;
                        }}
                        className={clsx(styles.drawer, drawerClassName)}
                        style={drawerStyle}
                        mask={false}
                        closable={false}
                        destroyOnClose
                    >
                        {platform === "console" ? (
                            <QiankunApp
                                name="workflow-manage-front"
                                entry={`${prefixUrl}/workflow-manage-front/`}
                                style={{ height: "100%" }}
                                platform="console"
                                appProps={{
                                    ...microWidgetProps,
                                    getRouter: () => "",
                                    arbitrailyAudit: {
                                        process_type: processType,
                                        process_def_id: value?.id || "",
                                        process_def_key: value?.key || "",
                                        visit: value?.key ? "edit" : "new",
                                        allowOwnerAuditor,
                                        onlyOwnerAuditor,
                                        onSaveAuditFlow: (params: {
                                            process_def_id?: string;
                                            process_def_key: string;
                                            process_def_name: string;
                                        }) => {
                                            onChange &&
                                                onChange({
                                                    id: params.process_def_id,
                                                    key: params.process_def_key,
                                                    name: params.process_def_name,
                                                });
                                            setVisible(false);
                                        },
                                        onCloseAuditFlow: () => {
                                            setVisible(false);
                                        },
                                    },
                                }}
                            ></QiankunApp>
                        ) : (
                            <QiankunApp
                                name="workflow-manage-client"
                                entry={`${prefixUrl}/workflow-manage-client/`}
                                style={{ height: "100%" }}
                                appProps={{
                                    // 兼容旧版 workflow 服务
                                    docflowTemplate,
                                    arbitrailyAuditTemplate: {
                                        process_type: processType,
                                        ...docflowTemplate,
                                    },
                                }}
                            ></QiankunApp>
                        )}
                    </Drawer>
                )}
            </div>
        </>
    );
};

export type AuditFlowKeyConfigProps = Omit<
    AuditFlowConfigProps,
    "value" | "onChange"
> & {
    value?: string;
    onChange?(value?: string): void;
};

export const AuditFlowKeyConfig: FC<AuditFlowKeyConfigProps> = ({
    value,
    onChange,
    ...props
}) => {
    const { mutate } = useSWRConfig();

    const [rand] = useState(() => Math.random());

    const { data: workflow } = useSWR(
        ["AuditFlowKeyConfig", rand, value],
        async () => {
            if (value) {
                const { data: workflow } =
                    await API.workflow.workflowRestV1ProcessDefinitionKeyGet(
                        value
                    );

                return pick(workflow, ["id", "key", "name"]) as Workflow;
            }
        }
    );

    return (
        <AuditFlowConfig
            {...props}
            value={workflow}
            onChange={(value) => {
                mutate(["AuditFlowKeyConfig", value?.key], value);
                onChange(value?.key);
            }}
        />
    );
};
