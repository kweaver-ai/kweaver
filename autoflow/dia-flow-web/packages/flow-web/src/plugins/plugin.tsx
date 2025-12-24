import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "../public-path";
import "../element-scroll-polyfill";
import { enableES5 } from "immer";
import "@applet/common/es/style";
import ReactDOM from "react-dom";
import {
    MicroAppContext,
    MicroAppProvider,
    useFormatPermText,
    useTranslate,
} from "@applet/common";
import zhCN from "../locales/zh-cn.json";
import zhTW from "../locales/zh-tw.json";
import enUS from "../locales/en-us.json";
import viVN from "../locales/vi-vn.json";
import { Button, Form, Input, Modal, Typography } from "antd";
import moment from "moment";
import useSWR from "swr";
import { FC, useContext, useState } from "react";
import styles from "./styles/plugin.module.less";
import {
    WorkflowContext,
    WorkflowProvider,
} from "../components/workflow-provider";
import {
    WorkflowPluginPerm,
    WorkflowPluginTags,
    WorkflowPluginMetadata,
    WorkflowPluginLevel,
    WorkflowPluginSuffix,
    BatchFileDetails,
    WorkflowPluginAccessors,
} from "../components/workflow-plugin-details";
import { OemConfigProvider } from "../components/oem-provider";
import clsx from "clsx";
import TextArea from "antd/lib/input/TextArea";
import { API } from "@applet/common";
import { formatDataToQuota } from "../components/params-form/as-quota";
// @ts-ignore
import { apis }  from '@dip/components';

enableES5();

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

interface ApprovalItemType {
    title: string;
    type: string;
    value: any;
    allowModifyByAuditor?: boolean;
    name?: string;
}

interface ISource {
    id: string;
    name: string;
    path: string;
    size: number;
    type: "folder" | "file";
}

interface EditApprovalItemType extends ApprovalItemType {
    index: number;
    key: string;
}

const ApprovalItem: FC<{ item: ApprovalItemType }> = ({ item }) => {
    const { microWidgetProps } = useContext(MicroAppContext);
    const { data: workflowData, process } = useContext(WorkflowContext);
    const formatPermText = useFormatPermText();
    const t = useTranslate();
    const { data } = useSWR([item.type, item.value], async () => {
        switch (item.type) {
            case "datetime":
                let datetimeStr;
                if (!item.value || String(item.value) === "-1") {
                    datetimeStr = t("neverExpires", "永久有效");
                } else {
                    let datetime = moment(item.value);
                    if (datetime.year() > 9999) {
                        datetime = moment(datetime.valueOf() / 1000);
                    }
                    datetimeStr = datetime.format("YYYY/MM/DD HH:mm");
                }
                return (
                    <Typography.Text
                        ellipsis
                        title={datetimeStr}
                        className={styles["value"]}
                    >
                        {datetimeStr}
                    </Typography.Text>
                );

            // 发起时间
            case "date":
                if (!item.value) {
                    return <span>---</span>;
                }
                const apply_date = moment(item.value).format(
                    "YYYY/MM/DD HH:mm"
                );
                return (
                    <Typography.Text
                        ellipsis
                        title={apply_date}
                        className={styles["value"]}
                    >
                        {apply_date}
                    </Typography.Text>
                );
            case "asTags":
                if (
                    !item.value ||
                    item.value?.length === 0 ||
                    item?.value === "null" ||
                    item?.value === "[]"
                ) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return <WorkflowPluginTags tags={item.value} />;
            case "asLevel":
                if (!item.value || item?.value === "null") {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return (
                    <WorkflowPluginLevel
                        data={item.value}
                        isDirectory={workflowData?.source?.type === "folder"}
                    />
                );
            case "asMetadata":
                if (!item.value) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return <WorkflowPluginMetadata data={item.value} />;
            case "asUsers":
            case "asDepartments":
                if (!item.value) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return (
                    <WorkflowPluginAccessors
                        type={
                            item.type === "asDepartments"
                                ? "department"
                                : "user"
                        }
                        accessors={item.value}
                    />
                );
            case "asAccessorPerms":
                if (
                    !item.value ||
                    item.value?.perminfos?.length === 0 ||
                    item?.value === "null"
                ) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return <WorkflowPluginPerm data={item.value} />;
            case "asDoc":
            case "asFile":
            case "asFolder":
            case "multipleFiles":
                if (!item.value) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                if (item.type === "asDoc") {
                    return (
                        <BatchFileDetails
                            docids={workflowData?.source?.id}
                            isDirectory={
                                workflowData?.source?.type === "folder"
                            }
                        />
                    );
                }
                if (item.type === "multipleFiles") {
                    let transferVal = item.value;
                    if (typeof transferVal === "string") {
                        try {
                            transferVal = JSON.parse(transferVal);
                        } catch (error) {
                            console.error(error);
                        }
                    }

                    return (
                        <BatchFileDetails
                            docids={transferVal}
                            isDirectory={false}
                        />
                    );
                }
                return (
                    <BatchFileDetails
                        docids={item.value}
                        isDirectory={item?.type === "asFolder"}
                    />
                );
            case "asPerm": {
                /**
                 * @Fix 临时方案，来自变量中的权限后端序列化有bug
                 * */
                if (typeof item.value === "string") {
                    try {
                        const value = JSON.parse(item.value);
                        const perm = formatPermText(value);
                        return (
                            <Typography.Text
                                ellipsis
                                title={perm || ""}
                                className={styles["value"]}
                            >
                                {perm || "---"}
                            </Typography.Text>
                        );
                    } catch (e) {
                        return (
                            <Typography.Text
                                ellipsis
                                title={""}
                                className={styles["value"]}
                            >
                                ---
                            </Typography.Text>
                        );
                    }
                }
                const perm = item.value ? formatPermText(item.value) : "";
                return (
                    <Typography.Text
                        ellipsis
                        title={perm || ""}
                        className={styles["value"]}
                    >
                        {perm || "---"}
                    </Typography.Text>
                );
            }
            case "long_string":
                return (
                    <Typography.Paragraph
                        ellipsis={{ rows: 3, expandable: false }}
                        title={item.value || ""}
                        className={styles["paragraph"]}
                    >
                        {item.value || "---"}
                    </Typography.Paragraph>
                );
            case "asSpaceQuota":
                let space = item.value;
                if (space === "" || space === null) {
                    <Typography.Text
                        ellipsis
                        title={""}
                        className={styles["value"]}
                    >
                        ---
                    </Typography.Text>;
                }
                if (typeof space === "string") {
                    space = Number(space);
                }
                return (
                    <Typography.Text
                        ellipsis
                        title={String(formatDataToQuota(item.value)) || ""}
                        className={styles["value"]}
                    >
                        {formatDataToQuota(space) + " GB"}
                    </Typography.Text>
                );
            case "asAllowSuffixDoc":
                let suffix = item.value;
                if (typeof suffix === "string") {
                    try {
                        suffix = JSON.parse(suffix);
                    } catch (error) {
                        console.error(error);
                    }
                }
                if (!suffix || suffix?.length === 0) {
                    return (
                        <Typography.Text className={styles["value"]}>
                            ---
                        </Typography.Text>
                    );
                }
                return <WorkflowPluginSuffix types={suffix} />;

            case 'article':
                return (
                    <Typography.Text
                        ellipsis
                        title={item.name}
                        className={styles["value"]}
                    >
                        <Button
                            type="link"
                            onClick={() => {
                                microWidgetProps?.history?.navigateToMicroWidget({
                                    command: 'knowledge-center',
                                    path: `/wikidoc/space?status=detail&article_id=${item.value}`,
                                    isNewTab: true,
                                    isClose: false,
                                    isForceNewTab: true,
                                })
                            }}>
                            {item.name}
                        </Button>
                    </Typography.Text>
                )

            default:
                const apply_type = process.audit_type;
                let stringText: string = item.value || "---";
                if (
                    apply_type === "security_policy_copy" ||
                    apply_type === "security_policy_move"
                ) {
                    stringText = stringText.replace("gns://", "");
                }
                return (
                    <Typography.Text
                        ellipsis
                        title={stringText}
                        className={styles["value"]}
                    >
                        {stringText}
                    </Typography.Text>
                );
        }
    });

    return data || null;
};

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

const Plugin: FC<{
    data: {
        contents?: ApprovalItemType[];
        content?: ApprovalItemType[];
        source?: ISource;
    };
}> = ({ data }) => {
    const { message, prefixUrl } = useContext(MicroAppContext);
    const { apply_id, target, process, apply_time } =
        useContext(WorkflowContext);
    const t = useTranslate();
    const [fieldsData, setFieldsData] = useState(() => {
        let fields = data?.contents || data?.content;
        if ((process?.audit_type as string).startsWith("security_policy_")) {
            fields?.unshift({
                type: "date",
                title: t("applyTime", "发起时间"),
                value: apply_time,
            });
        }
        if (data?.source?.type === "file") {
            fields = fields?.filter(
                (i) =>
                    i.type !== "asSpaceQuota" && i.type !== "asAllowSuffixDoc"
            );
        }
        return fields;
    });

    const [loading, setLoading] = useState(false);
    const [editItem, setEditItem] = useState<EditApprovalItemType>();

    if (Array.isArray(fieldsData)) {
        return (
            <>
                <div className={styles["container"]}>
                    <Form
                        name="doc-audit"
                        labelAlign="left"
                        colon={false}
                        {...layout}
                    >
                        {fieldsData.map((item, index) => (
                            <Form.Item
                                key={index}
                                label={
                                    <span className={styles["label-wrapper"]}>
                                        <Typography.Paragraph
                                            ellipsis={{ rows: 3 }}
                                            title={item.title || ""}
                                            className={styles["label"]}
                                        >
                                            {item.title || "---"}
                                        </Typography.Paragraph>
                                        <span style={{ lineHeight: "16px" }}>
                                            {t("colon")}
                                        </span>
                                    </span>
                                }
                                className={clsx(
                                    item.allowModifyByAuditor &&
                                    styles.allowModifyByAuditor
                                )}
                                extra={
                                    item.allowModifyByAuditor &&
                                        target === "auditPage" ? (
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                setEditItem({
                                                    ...item,
                                                    index,
                                                    key: `contents_${index}`,
                                                });
                                            }}
                                            size="small"
                                        >
                                            {t("edit", "编辑")}
                                        </Button>
                                    ) : undefined
                                }
                            >
                                {<ApprovalItem item={item} />}
                            </Form.Item>
                        ))}
                    </Form>
                </div>

                <Modal
                    open={!!editItem}
                    title={t("edit", "编辑")}
                    confirmLoading={loading}
                    transitionName=""
                    className={styles["modal"]}
                    onCancel={() => {
                        setEditItem(undefined);
                    }}
                    onOk={async () => {
                        if (editItem) {
                            try {
                                setLoading(true);
                                await API.axios.put(
                                    `${prefixUrl}/api/automation/v1/task/${apply_id}/results`,
                                    { [editItem.key]: editItem.value }
                                );
                                setFieldsData((fieldsData = []) => {
                                    const newFieldsData = [...fieldsData];
                                    if (newFieldsData[editItem.index]) {
                                        newFieldsData[editItem.index] = {
                                            ...newFieldsData[editItem.index],
                                            value: editItem.value,
                                        };
                                    }
                                    return newFieldsData;
                                });
                                message.success(t("save.success"));
                                setEditItem(undefined);
                            } catch (e) {
                                message.info(t("save.fail"));
                            } finally {
                                setLoading(false);
                            }
                        }
                    }}
                    destroyOnClose
                >
                    {editItem && (
                        <Form layout="vertical">
                            <Form.Item label={editItem.title} colon>
                                <ItemEditor
                                    type={editItem.type}
                                    value={editItem.value}
                                    onChange={(value) =>
                                        setEditItem(
                                            (item) => item && { ...item, value }
                                        )
                                    }
                                />
                            </Form.Item>
                        </Form>
                    )}
                </Modal>
            </>
        );
    }
    return null;
};

function ItemEditor({
    type,
    value,
    onChange,
}: {
    type: string;
    value: any;
    onChange(value: any): void;
}) {
    switch (type) {
        case "long_string":
        case "string":
            return (
                <TextArea
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ minHeight: 96, maxHeight: 280 }}
                />
            );
        default:
            return (
                <Input
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
    }
}

function render(props?: any) {
  const {
    container = props?.container || document.body,
    microWidgetProps = {},
    data = { contents: [] },
    process = undefined,
    apply_id = undefined,
    target = undefined,
    audit_status = undefined,
    apply_time = undefined,
  } = props;

  const getToken = () => microWidgetProps?.token?.getToken?.access_token;

  apis.setup({
    protocol: microWidgetProps?.config?.systemInfo?.location?.protocol,
    host: microWidgetProps?.config?.systemInfo?.location?.hostname,
    port: microWidgetProps?.config?.systemInfo?.location?.port || 443,
    lang: microWidgetProps?.lang,
    getToken,
    prefix: microWidgetProps?.prefix,
    theme: microWidgetProps?.theme || "#126ee3",
    popupContainer: microWidgetProps?.container,
    refreshToken: microWidgetProps?.token?.refreshOauth2Token,
    onTokenExpired: microWidgetProps?.token?.onTokenExpired,
  });

  ReactDOM.render(
    <MicroAppProvider
      microWidgetProps={microWidgetProps}
      container={container}
      translations={translations}
      prefixCls={ANT_PREFIX}
      iconPrefixCls={ANT_ICON_PREFIX}
      supportCustomNavigation={false}
    >
      <OemConfigProvider>
        <WorkflowProvider
          process={process}
          data={data}
          apply_id={apply_id}
          target={target}
          audit_status={audit_status}
          apply_time={apply_time}
        >
          <Plugin data={data} />
        </WorkflowProvider>
      </OemConfigProvider>
    </MicroAppProvider>,
    container.querySelector("#content-automation-root")
  );
}

if (!(window as any).__POWERED_BY_QIANKUN__) {
    render();
}

export async function bootstrap() { }

export async function mount(props = {}) {
    render(props);
}

export async function unmount({ container = document } = {}) {
    ReactDOM.unmountComponentAtNode(
        container.querySelector("#content-automation-root")!
    );
}

export const lifecycle = {
    bootstrap,
    mount,
    unmount,
};
