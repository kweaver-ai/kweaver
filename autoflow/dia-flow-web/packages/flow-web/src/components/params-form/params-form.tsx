import { Button, Form, Input, Space, Spin, Typography } from "antd";
import styles from "./styles/params-form.module.less";
import {
    createRef,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    API,
    AsUserSelect,
    MicroAppContext,
    useTranslate,
} from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";
import { FormDatePicker } from "./date-picker";
import clsx from "clsx";
import { AsPerm, PermStr } from "./as-perm";
import { AsLevel } from "./as-level";
import { AsTags } from "./as-tags";
import { useSourceIsNotAllowed } from "./use-source-is-not-allowed";
import { find, isArray } from "lodash";
import { AsShare } from "./as-share";
import { AsMetaData } from "./as-metadata";
import moment from "moment";
import { AsSuffix } from "./as-suffix";
import { AsQuota } from "./as-quota";
import { AsUserSelectChildRender } from "../file-trigger-form/childrenRender";
import { DescriptionType } from "../form-item-description";
import { concatProtocol } from "../../utils/browser";
import { AsFileSelect } from "../as-file-select";

interface Field {
    key: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    description?: Record<string, any>;
}

export interface ItemCallback {
    submitCallback?(): Promise<any>;
}

// 预设执行参数组件类型
export enum ParamsFieldTypes {
    "AsPerm" = "asPerm",
    "Datetime" = "datetime",
    "String" = "string",
    "Long_string" = "long_string",
    "AsFile" = "asFile",
    "AsFolder" = "asFolder",
    "AsTags" = "asTags",
    "AsMetadata" = "asMetadata",
    "AsAccessorPerms" = "asAccessorPerms",
    "AsLevel" = "asLevel",
    "AsAllowSuffixDoc" = "asAllowSuffixDoc",
    "AsSpaceQuota" = "asSpaceQuota",
    "AsUsers" = "asUsers",
    "AsDepartments" = "asDepartments",
}

const VALID_PERM_VALUES: PermStr[] = [
    'cache',
    'delete',
    'modify',
    'create',
    'download',
    'preview',
    'display'
];

// 过滤权限值的通用函数
const filterValidPerms = (perms: any[] | undefined): PermStr[] => {
    return [...(perms || [])].filter((perm): perm is PermStr =>
        VALID_PERM_VALUES.includes(perm as PermStr)
    );
};

export const ParamsForm = () => {
    const { microWidgetProps, functionId, modal, prefixUrl, message } = useContext(MicroAppContext);

    const [form] = Form.useForm();
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const modalInfo = useSourceIsNotAllowed();
    // @ts-ignore
    const dialogParam = microWidgetProps?.dialog?.dialogParams[functionId] || {};
    const isWiki = dialogParam?.isWiki
    const safetyPolicy = microWidgetProps?.safetyPolicy;
    const selections = microWidgetProps?.contextMenu?.getSelections;
    // 设置选中权限
    const checkedPerm = filterValidPerms(dialogParam.checkedPerm)
    const availablePerm = filterValidPerms(dialogParam.availablePerm)
    const disabledPerm = filterValidPerms(dialogParam.disabledPerm)
    const hiddenPerm = dialogParam.hiddenPerm

    const isRequest = useRef(false);
    const [isLoading, setLoading] = useState(true);
    const [fields, setFields] = useState<Field[]>([]);

    const [selectItems, setSelectItems] = useState<any[]>(
        (() => {
            if (isWiki) {
                const { selections } = dialogParam

                return selections || []
            } else {
                if (selections) {
                    return [...selections].filter(Boolean).map((item) => ({
                        ...item,
                        object_id: item?.object_id || item?.docid.slice(-32),
                    }));
                }
            }
        })()
    );

    const strategyType = useMemo(() => {
        return (isWiki ? dialogParam?.operation : safetyPolicy?.operation) || "upload";
    }, [safetyPolicy, isWiki]);

    const isFile = useMemo(() => selectItems[0]?.size !== -1, [selectItems]);

    const refs = useMemo(
        () => (fields || [])?.map(() => createRef<ItemCallback>()),
        [fields]
    );

    useEffect(() => {
        if (!isWiki && selectItems.length && selectItems[0].size === undefined) {
            const updateSelections = async () => {
                try {
                    const promises = selectItems.map(async (item) => {
                        const { docid } = item

                        const { data: { size } } = await API.axios.post(
                            '/api/efast/v1/file/metadata',
                            { docid }
                        )

                        return { ...item, size }
                    })

                    setSelectItems(await Promise.all(promises))
                } catch (error) {
                    setSelectItems(selectItems)
                }
            }

            updateSelections()
        }
    }, [selectItems])

    const isInElectron =
        microWidgetProps?.config.systemInfo.platform === "electron";

    const closeDialog = () => {
        microWidgetProps?.dialog?.close({
            functionid: functionId,
        });
    };

    // 跳转审核
    const navigateToMicro = (command: string, path?: string) => {
        microWidgetProps?.history?.navigateToMicroWidget({
            command,
            path,
            isNewTab: true,
            isClose: false,
        });
        handleClose();
    };

    const handleClose = () => {
        if (!isWiki) {
            microWidgetProps?.message?.updateList({
                item: {
                    docid: selectItems[0]?.docid,
                },
            });
        }

        closeDialog();
    };
    const onSubmit = async () => {
        let isValid = true;
        await Promise.allSettled(
            refs.map(async (item) => {
                try {
                    if (item?.current?.submitCallback) {
                        const val = await item?.current?.submitCallback();
                        return Promise.resolve(val);
                    }
                    return Promise.resolve();
                } catch (error) {
                    console.warn(error);
                    isValid = false;
                    return Promise.reject();
                }
            })
        );
        if (isValid) {
            form.submit();
        } else {
            form.validateFields()
            setTimeout(() => {
                try {
                    // 滚动到第一个错误字段
                    const element = document.querySelector(".CONTENT_AUTOMATION-ant-form-item-has-error");
                    if (element) {
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch (error) {
                    console.warn(error)
                }
            }, 100)
        }
    };
    // 表单确认提交（无表单配置时直接提交）
    const onFinish = async (formValue: Record<string, any>) => {
        if (isRequest.current === true) {
            return;
        }
        isRequest.current = true;
        try {
            if (strategyType === "perm") {
                // 发起权限申请
                await API.axios.post(
                    `${prefixUrl}/api/doc-center/v1/security-policy/apply`,
                    {
                        operation: strategyType,
                        source: selectItems.map((i) => ({
                            object_id: i.object_id,
                            type: i.size === -1 ? "folder" : "file",
                        })),
                        form: formValue,
                    }
                );
                modal.success({
                    title: t("form.success.perm", "您的权限申请已提交给审核员"),
                    content: (
                        <div>
                            <div style={{ marginBottom: "8px" }}>
                                {t(
                                    "perm.link.details",
                                    "一旦通过审批，您就可以获取申请的文件权限。"
                                )}
                            </div>
                            <div>
                                <span>
                                    {t("perm.link.go", "还可前往")}
                                    <span
                                        className={styles["link"]}
                                        onClick={() => {
                                            navigateToMicro(
                                                "docAuditClient",
                                                "?target=apply"
                                            );
                                        }}
                                    >
                                        {t("link.apply", "【我的申请】")}
                                    </span>
                                    {t("perm.link.viewProcess", "查看进度>>")}
                                </span>
                            </div>
                        </div>
                    ),
                    className: styles["info-modal"],
                    wrapClassName: clsx({
                        "adapt-to-electron": isInElectron,
                    }),
                    width: 420,
                    okText: t("ok") + " ",
                    onOk: handleClose,
                    okButtonProps: {
                        className: "automate-oem-primary-btn",
                    },
                    centered: true,
                    maskStyle: isInElectron ? { top: "52px" } : undefined,
                });
            }
            if (strategyType === "upload") {
                // 发起上传申请
                await API.axios.post(
                    `${prefixUrl}/api/document/v1/upload-approval-request`,
                    {
                        objects: selectItems.map((i) => ({
                            object_id: i.object_id,
                            type: i.size === -1 ? "folder" : "file",
                            form: formValue,
                        })),
                    }
                );
                message.success(
                    <div style={{ lineHeight: "15px" }}>
                        {t("upload.apply", "您的上传申请已提交审核，")}
                        <span
                            style={{
                                color: "rgba(52, 97, 236, 0.75)",
                                cursor: "pointer",
                            }}
                            onClick={() =>
                                navigateToMicro(
                                    "docAuditClient",
                                    "?target=apply"
                                )
                            }
                        >
                            {t("upload.goto", "前往查看>>")}
                        </span>
                        <span>{t("upload.toView", " ")}</span>
                    </div>,
                    3
                );
                handleClose();
            }
        } catch (error: any) {
            // 上传审核报错
            if (strategyType === "upload") {
                if (error.response.data.code === 404002006) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.404002006",
                            "当前文档已不存在或其路径发生变更。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                if (error.response.data.code === 403002056) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t("err.log.403001002", "没有权限执行此操作。"),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                // 文件状态正常/审核中
                if (
                    error.response.data.code === 404002302 ||
                    error.response.data.code === 409002303
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "uploadReview.nofile.handle",
                            "当前只能操作待处理状态的文档，请检查选中文档的状态。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            closeDialog();
                        },
                    });
                    return;
                }
                if (
                    error.response.data.code ===
                    "ContentAutomation.InvalidParameter"
                ) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.upload.change",
                            "管理员已变更申请流程，请重新提交申请。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            closeDialog();
                        },
                    });
                    return;
                }
                if (error.response.data.code === 404000000) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.upload.noStrategy",
                            "此文档库未配置申请流程。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
            }

            // 权限申请报错
            if (strategyType === "perm") {
                if (error?.response?.data?.detail) {
                    const failedItem =
                        error.response.data.detail?.map((item: any) => {
                            const docItem = find(
                                selectItems,
                                (i) => i?.object_id === item.id
                            );
                            return {
                                ...docItem,
                                code: item?.code,
                                cause: item?.cause,
                            };
                        }) || [];

                    // 部分成功，部分失败
                    if (
                        error.response.data.code === 400055000 ||
                        error.response.data.code === 400055025 ||
                        error.response.data.code === 400055026
                    ) {
                        modalInfo(failedItem, handleClose);
                        return;
                    }
                }
                if (error.response.data.code === 404000000) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.perm.noPerm",
                            "管理员暂未给此文档开通权限申请。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
            }

            handleErr({ error: error?.response });
        } finally {
            isRequest.current = false;
        }
    };

    const initialValues = useMemo(() => {
        const values: any = {};
        if (fields?.length) {
            fields.forEach((field) => {
                if (field.type === ParamsFieldTypes.AsPerm) {
                    values[field.key] = {
                        allow: checkedPerm.length ? checkedPerm : ["preview", "download"],
                        deny: [],
                    };
                }
                if (field.type === ParamsFieldTypes.Datetime) {
                    values[field.key] = "";
                }
                if (
                    field.type === ParamsFieldTypes.String ||
                    field.type === ParamsFieldTypes.Long_string
                ) {
                    values[field.key] = "";
                }
                if (field.defaultValue) {
                    values[field.key] = field.defaultValue;
                }
                if (isFile && field.type === ParamsFieldTypes.AsSpaceQuota) {
                    values[field.key] = 0;
                }
                if (
                    isFile &&
                    field.type === ParamsFieldTypes.AsAllowSuffixDoc
                ) {
                    values[field.key] = [];
                }
            });
            form.setFieldsValue(values);
            if (isFile) {
                const filterFields = fields.filter(
                    (i: Field) =>
                        i.type !== ParamsFieldTypes.AsAllowSuffixDoc &&
                        i.type !== ParamsFieldTypes.AsSpaceQuota
                );
                if (filterFields.length === 0) {
                    onFinish(values);
                }
            }
        }
        return values;
    }, [fields, form]);

    useLayoutEffect(() => {
        // 根据类型修改标题
        if (strategyType === "perm") {
            microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
                functionid: functionId,
                title: t("mode.perm", "权限申请"),
            });
        } else if (strategyType === "folder_properties") {
            microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
                functionid: functionId,
                title: t("mode.properties", "修改文件夹属性"),
            });
        } else if (strategyType === "upload") {
            microWidgetProps?.dialog?.setMicroWidgetDialogTitle({
                functionid: functionId,
                title: t("mode.upload", "上传审核"),
            });
        }
    }, [functionId, strategyType]);

    useLayoutEffect(() => {
        const getPermFormInfo = async () => {
            try {
                // 根据文件id获取表单配置
                const { data } = await API.axios.post(
                    `${prefixUrl}/api/doc-center/v1/security-policy/form`,
                    {
                        object_id: selectItems.map((i) => i?.object_id),
                        operation: strategyType,
                    }
                );
                setFields(data?.fileds);
                // 表单为空直接提交
                if (data?.fileds?.length === 0) {
                    onFinish({});
                } else {
                    setLoading(false);
                }
            } catch (error: any) {
                if (error.response.data.code === 404000000) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.perm.noPerm",
                            "管理员暂未给此文档开通权限申请。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                if (error.response.data.code === 400055026) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.perm.upload",
                            "此文档正在上传处理中..."
                        ),
                        okText: t("ok", "确定"),
                    });
                    return;
                }
                if (error.response.data.code === 400055025) {
                    const failedItem =
                        error.response.data.detail?.map((item: any) => {
                            const docItem = find(
                                selectItems,
                                (i) => i?.object_id === item.id
                            );
                            return { ...docItem, code: item?.code };
                        }) || [];

                    // 若failedItem === [],执行报错
                    // 解决办法： 将description弹窗提示, wiki
                    if (failedItem.length === 0) {
                        modal.info({
                            title: t("err.operation.title", "无法执行此操作"),
                            content: (
                                <div>
                                    <span>
                                        {t(
                                            "perm.link.exist",
                                            "您已提交此文档的权限申请，"
                                        )}
                                        <span
                                            className={styles["link"]}
                                            onClick={() => {
                                                navigateToMicro(
                                                    "docAuditClient",
                                                    "?target=apply"
                                                );
                                            }}
                                        >
                                            {t("link.apply", "【我的申请】")}
                                        </span>
                                        {t("perm.link.view", "查看进度")}
                                    </span>
                                </div>
                            ),
                            className: styles["info-modal"],
                            wrapClassName: clsx({
                                "adapt-to-electron": isInElectron,
                            }),
                            width: 420,
                            okText: t("ok") + " ",
                            onOk: handleClose,
                            okButtonProps: {
                                className: "automate-oem-primary-btn",
                            },
                            centered: true,
                            maskStyle: isInElectron ? { top: "52px" } : undefined,
                        });

                        return
                    }

                    modalInfo(failedItem, handleClose);
                    return;
                }
                handleErr({ error: error?.response });
            }
        };
        const getUploadInfo = async () => {
            try {
                // 根据文件id获取表单配置
                const { data } = await API.axios.get(
                    `${prefixUrl}/api/doc-share/v1/security-policy-form`,
                    {
                        params: {
                            object_id: selectItems[0]?.docid.slice(-32),
                            operation: strategyType,
                        },
                    }
                );
                setFields(data?.form?.fields);
                // 表单为空直接提交
                if (data?.form?.fields?.length === 0) {
                    onFinish({});
                } else {
                    setLoading(false);
                }
            } catch (error: any) {
                if (error.response.data.code === 404000000) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.upload.noStrategy",
                            "此文档库未配置申请流程。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                if (error.response.data.code === 404002006) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.404002006",
                            "当前文档已不存在或其路径发生变更。"
                        ),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                if (error.response.data.code === 403002056) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t("err.log.403001002", "没有权限执行此操作。"),
                        okText: t("ok", "确定"),
                        onOk: () => {
                            handleClose();
                        },
                    });
                    return;
                }
                handleErr({ error: error?.response });
            }
        };
        if (strategyType === "perm") {
            getPermFormInfo();
        }
        if (strategyType === "upload") {
            getUploadInfo();
        }
        // 套壳开发
        const dev = sessionStorage.getItem("work-center-form.devTool.config");
        if (dev) {
            try {
                const config = JSON.parse(dev);
                setFields(config.fields);
            } catch (error) {
                console.warn("dev", error);
            }
        }
    }, []);

    const isAsComponent = (type: ParamsFieldTypes) =>
        [
            ParamsFieldTypes.AsTags,
            ParamsFieldTypes.AsLevel,
            ParamsFieldTypes.AsMetadata,
            ParamsFieldTypes.AsAccessorPerms,
            ParamsFieldTypes.AsSpaceQuota,
            ParamsFieldTypes.AsAllowSuffixDoc,
        ].includes(type);

    return isLoading ? (
        <div className={styles["loading-container"]}>
            <Spin></Spin>
        </div>
    ) : (
        <div className={styles["form-container"]}>
            <Form
                initialValues={initialValues}
                form={form}
                id="params-form"
                className={styles["form"]}
                labelAlign="left"
                onFinish={onFinish}
                onFinishFailed={({ errorFields }) => {
                    // 获取第一个校验失败的字段
                    if (errorFields && errorFields.length > 0) {
                        try {
                            // 滚动到第一个错误字段
                            const element = document.querySelector(".CONTENT_AUTOMATION-ant-form-item-has-error");
                            if (element) {
                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } catch (error) {
                            console.warn(error)
                        }
                    }
                }}
                autoComplete="off"
                colon={true}
                layout="vertical"
            >
                {fields?.map((field, index) => {
                    // 描述
                    let description = null;
                    if (field.description?.text) {
                        if (
                            field.description?.type === DescriptionType.FileLink
                        ) {
                            description = (
                                <div>
                                    <Typography.Text
                                        ellipsis
                                        title={field.description.text}
                                        className={styles["link"]}
                                        onClick={() => {
                                            microWidgetProps?.contextMenu?.previewFn(
                                                {
                                                    functionid: functionId,
                                                    item: {
                                                        docid: field.description
                                                            ?.docid,
                                                        size: 1,
                                                        name:
                                                            field.description
                                                                ?.name || "",
                                                    },
                                                }
                                            );
                                        }}
                                    >
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        } else if (
                            field.description?.type === DescriptionType.UrlLink
                        ) {
                            description = (
                                <div>
                                    <Typography.Text
                                        ellipsis
                                        title={field.description.text}
                                        className={styles["link"]}
                                        onClick={() => {
                                            microWidgetProps?.history?.openBrowser(
                                                concatProtocol(
                                                    field.description?.link
                                                )
                                            );
                                        }}
                                    >
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        } else {
                            description = (
                                <div>
                                    <Typography.Text
                                        ellipsis
                                        title={field.description.text}
                                        className={styles["description"]}
                                    >
                                        {field.description.text}
                                    </Typography.Text>
                                </div>
                            );
                        }
                    }

                    return (
                        <Form.Item
                            key={field.key}
                            name={field.key}
                            label={
                                <>
                                    <Typography.Text>
                                        {field.name + t("color", "：")}
                                    </Typography.Text>
                                    {description}
                                </>
                            }
                            className={clsx({
                                [styles["formItem-hidden"]]:
                                    isFile &&
                                    (field.type ===
                                        ParamsFieldTypes.AsAllowSuffixDoc ||
                                        field.type ===
                                        ParamsFieldTypes.AsSpaceQuota),
                            })}
                            rules={[
                                {
                                    required: Boolean(field.required),
                                    message: isAsComponent(
                                        field.type as ParamsFieldTypes
                                    )
                                        ? ""
                                        : t(`emptyMessage`),
                                    validator: (_: unknown, value: any) => {
                                        if (!field.required) {
                                            return Promise.resolve(true);
                                        }
                                        // 文件不展示文件格式和配额空间组件
                                        if (
                                            isFile &&
                                            (field.type ===
                                                ParamsFieldTypes.AsAllowSuffixDoc ||
                                                field.type ===
                                                ParamsFieldTypes.AsSpaceQuota)
                                        ) {
                                            return Promise.resolve(true);
                                        }
                                        if (
                                            !value &&
                                            field.type !== "datetime"
                                        ) {
                                            return Promise.reject(false);
                                        }

                                        if (
                                            isArray(value) &&
                                            value.length === 0
                                        ) {
                                            return Promise.reject(false);
                                        }
                                        if (
                                            field.type === "asPerm" &&
                                            value.allow.length === 0
                                        ) {
                                            return Promise.reject(false);
                                        }
                                        return Promise.resolve(true);
                                    },
                                },
                                {
                                    message: t(`date.overtime`),
                                    validator: (_: unknown, value: any) => {
                                        if (
                                            value &&
                                            field.type === "datetime" &&
                                            moment(value) < moment()
                                        ) {
                                            return Promise.reject(false);
                                        }
                                        return Promise.resolve(true);
                                    },
                                },
                            ]}
                        >
                            {(() => {
                                switch (field.type) {
                                    case ParamsFieldTypes.AsPerm:
                                        return (
                                            <AsPerm
                                                asPermOptions={availablePerm.length ? availablePerm : ["preview", "download"]}
                                                disabledPerm={disabledPerm}
                                                hiddenPerm={hiddenPerm}
                                            />
                                        );
                                    case ParamsFieldTypes.String:
                                        return (
                                            <Input
                                                className={styles["input"]}
                                                placeholder={t(
                                                    "form.placeholder",
                                                    "请输入"
                                                )}
                                            />
                                        );
                                    case ParamsFieldTypes.Long_string:
                                        return (
                                            <Input.TextArea
                                                className={styles["textarea"]}
                                                placeholder={t(
                                                    "form.placeholder",
                                                    "请输入"
                                                )}
                                            />
                                        );
                                    case ParamsFieldTypes.AsFile:
                                        return (
                                            <AsFileSelect
                                                selectType={1}
                                                multiple={false}
                                                title={t(
                                                    "selectFile",
                                                    "选择文件"
                                                )}
                                                placeholder={t(
                                                    "select.placeholder",
                                                    "请选择"
                                                )}
                                                allowClear
                                            />
                                        );
                                    case ParamsFieldTypes.AsFolder:
                                        return (
                                            <AsFileSelect
                                                selectType={2}
                                                multiple={false}
                                                title={t(
                                                    "selectFolder",
                                                    "选择文件夹"
                                                )}
                                                placeholder={t(
                                                    "select.placeholder",
                                                    "请选择"
                                                )}
                                                allowClear
                                            />
                                        );
                                    case ParamsFieldTypes.Datetime:
                                        return (
                                            <FormDatePicker
                                                showTime
                                                showNow={false}
                                                popupClassName="automate-oem-primary"
                                            />
                                        );
                                    case ParamsFieldTypes.AsTags:
                                        return (
                                            <AsTags
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsLevel:
                                        return (
                                            <AsLevel
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsAccessorPerms:
                                        return (
                                            <AsShare
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsMetadata:
                                        return (
                                            <AsMetaData
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsSpaceQuota:
                                        return (
                                            <AsQuota
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsAllowSuffixDoc:
                                        return (
                                            <AsSuffix
                                                ref={refs[index]}
                                                items={selectItems}
                                                required={field.required}
                                            />
                                        );
                                    case ParamsFieldTypes.AsUsers:
                                        return (
                                            <AsUserSelect
                                                selectPermission={2}
                                                groupOptions={{
                                                    select: 3,
                                                    drillDown: 1,
                                                }}
                                                isBlockContact
                                                children={
                                                    AsUserSelectChildRender
                                                }
                                            />
                                        );
                                    case ParamsFieldTypes.AsDepartments:
                                        return (
                                            <AsUserSelect
                                                selectPermission={1}
                                                isBlockGroup
                                                isBlockContact
                                                children={
                                                    AsUserSelectChildRender
                                                }
                                            />
                                        );
                                    default:
                                        return (
                                            <Input
                                                placeholder={t(
                                                    "stringPlaceholder",
                                                    "请输入内容"
                                                )}
                                            />
                                        );
                                }
                            })()}
                        </Form.Item>
                    );
                })}
            </Form>
            <div className={styles["footer"]}>
                <Space>
                    <Button
                        className={clsx(
                            styles["footer-btn-ok"],
                            "automate-oem-primary-btn"
                        )}
                        onClick={onSubmit}
                        type="primary"
                    >
                        {t("ok", "确定")}
                    </Button>
                    <Button
                        className={styles["footer-btn-cancel"]}
                        onClick={closeDialog}
                        type="default"
                    >
                        {t("cancel", "取消")}
                    </Button>
                </Space>
            </div>
        </div>
    );
};
