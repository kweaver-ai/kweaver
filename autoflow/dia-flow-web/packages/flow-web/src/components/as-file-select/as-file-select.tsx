import { efast } from "@applet/api";
import { Perm1CheckReqPermEnum } from "@applet/api/lib/efast";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { Button, Input, Modal, Select } from "antd";
import clsx from "clsx";
import { clamp, toLower } from "lodash";
import {
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import useSWR from "swr";
import styles from "./as-file-select.module.less";
import { DocList } from "./doc-list";
// @ts-ignore
import { apis } from "@dip/components";
import { uniqBy } from "lodash";

export interface DocItem {
    id: string;
    name: string;
    path: string;
    [key: string]: any;
}

export interface AsFileSelectProps<M extends boolean> {
    className?: string;
    title?: string;
    placeholder?: string;
    selectButtonText?: string;
    selectType?: 1 | 2 | 3;
    supportExtensions?: string[];
    notSupportTip?: string;
    disabled?: boolean;
    readOnly?: boolean;
    multiple?: M;
    disableSelect?: boolean;
    defaultValue?: M extends true ? string[] : string;
    value?: M extends true ? string[] : string;
    omitUnavailableItem?: boolean;
    omittedMessage?: string;
    allowClear?: boolean;
    multipleMode?: "tags" | "list";
    tip?: string;
    onChange?(value?: M extends true ? string[] : string): void;
    onOmitUnavailableItem?(ids: string[]): void;
    checkDownloadPerm?: boolean;
}

export function AsFileSelect<M extends boolean>(props: AsFileSelectProps<M>) {
    const t = useTranslate();
    const {
        className,
        multiple,
        defaultValue,
        value,
        selectType = 2,
        supportExtensions,
        notSupportTip,
        title,
        placeholder,
        selectButtonText = t("select", "选择"),
        disabled,
        readOnly,
        omittedMessage = t(
            "unavailableDocOmitted",
            "已为您过滤不存在和无访问权限的文档"
        ),
        allowClear = false,
        omitUnavailableItem = false,
        multipleMode = "tags",
        tip,
        onOmitUnavailableItem,
        onChange,
        checkDownloadPerm,
    } = props;

    const { microWidgetProps, functionId, platform } = useContext(MicroAppContext);
    const namepathsCache = useRef<Record<string, Promise<DocItem>>>({});
    const docLibsCache = useRef<Promise<efast.ClassifiedEntryDoc[]>>();
    const isSecretCache = useRef<boolean | undefined>(undefined);
    const isControlled = "value" in props;
    const [ids, setIds] = useState<string[]>(() => {
        return (
            Array.isArray(defaultValue) ? defaultValue : [defaultValue]
        ).filter(Boolean);
    });
    const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
    // 优化弱网请求过程中列表展示异常
    const [availableData, setAvailableData] = useState<DocItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useLayoutEffect(() => {
        if (isControlled) {
            setIds((Array.isArray(value) ? value : [value]).filter(Boolean));
        }
    }, [isControlled, value]);

    const { data } = useSWR(
        ["asFileSelect", ids],
        async () => {

            // if (platform !== "client") {
            //     return [];
            // }

            if (!docLibsCache.current) {
                docLibsCache.current = API.efast
                    .efastV1ClassifiedEntryDocLibsGet()
                    .then(({ data }) => data);
            }

            const docLibs = await docLibsCache.current;

            if (ids.length > 0) {
                setIsLoading(true);
            }

            const results = await Promise.allSettled(
                ids.map(async (id, index) => {
                    if (!namepathsCache.current[id]) {
                        const promise = new Promise<DocItem>(
                            async (resolve, reject) => {
                                // 大量数据分批请求
                                if (index > 100) {
                                    await new Promise((resolve) => {
                                        setTimeout(() => {
                                            resolve(true);
                                        }, 50 * Math.floor(index / 100));
                                    });
                                }

                                try {
                                    // 检查显示权限
                                    const {
                                        data: { result },
                                    } = await API.efast.eacpV1Perm1CheckPost({
                                        docid: id,
                                        perm: Perm1CheckReqPermEnum.Display,
                                    });

                                    if (result !== 0) {
                                        reject();
                                    }

                                    let size = selectType === 1 ? 1 : -1;

                                    if (selectType === 3) {
                                        try {
                                            const { data } =
                                                await API.efast.efastV1FileMetadataPost(
                                                    { docid: id }
                                                );
                                            size = data?.size;
                                        } catch (error: any) {
                                            if (error?.response?.data?.code) {
                                                if (
                                                    error.response.data.code ===
                                                    403002015
                                                ) {
                                                    size = -1;
                                                } else {
                                                    reject();
                                                    if (
                                                        namepathsCache.current[
                                                        id
                                                        ] === promise
                                                    ) {
                                                        delete namepathsCache
                                                            .current[id];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    const { data } =
                                        await API.efast.efastV1FileConvertpathPost(
                                            {
                                                docid: id,
                                            }
                                        );

                                    let path = data.namepath;

                                    for (const lib of docLibs) {
                                        if (
                                            lib.doc_libs &&
                                            lib.doc_libs.some((item) =>
                                                id.startsWith(item.id)
                                            )
                                        ) {
                                            // 涉密 共享文档库名称变更
                                            if (
                                                lib.id ===
                                                "shared_user_doc_lib" &&
                                                typeof isSecretCache.current ===
                                                "undefined"
                                            ) {
                                                try {
                                                    const { data } =
                                                        await API.appStore.apiAppstoreV1SecretConfigGet();
                                                    isSecretCache.current =
                                                        data?.is_security_level;
                                                } catch (error) {
                                                    isSecretCache.current =
                                                        true;
                                                }
                                            }
                                            if (
                                                lib.id ===
                                                "shared_user_doc_lib" &&
                                                isSecretCache.current === true
                                            ) {
                                                path = `${t(
                                                    "shared_user_doc_lib.secret",
                                                    lib.name
                                                )}/${data.namepath}`;
                                            } else {
                                                // 顶级文档库国际化处理（我的/共享/部门/知识库）
                                                path = `${t(
                                                    lib.id,
                                                    lib.name
                                                )}/${data.namepath}`;
                                            }
                                        }

                                        if (lib.subtypes) {
                                            for (const subtype of lib.subtypes) {
                                                if (
                                                    (
                                                        subtype.doc_libs as unknown as efast.EntryDoc[]
                                                    ).some((item) =>
                                                        id.startsWith(item.id)
                                                    )
                                                ) {
                                                    // 自定义文档库
                                                    path = `${subtype.name}/${data.namepath}`;
                                                }
                                            }
                                        }
                                    }

                                    resolve({
                                        id,
                                        name: data.namepath.slice(
                                            data.namepath.lastIndexOf("/") + 1
                                        ),
                                        path,
                                        size,
                                    });
                                } catch (e) {
                                    reject();
                                    if (
                                        namepathsCache.current[id] === promise
                                    ) {
                                        delete namepathsCache.current[id];
                                    }
                                }
                            }
                        );
                        namepathsCache.current[id] = promise;
                    }

                    return namepathsCache.current[id];
                })
            );
            setIsLoading(false);

            const unavailableIds = results
                .map(({ status }, i) => status === "rejected" && ids[i])
                .filter(Boolean) as string[];

            if (omitUnavailableItem && unavailableIds.length) {
                setUnavailableIds(unavailableIds);
                if (typeof onOmitUnavailableItem === "function") {
                    onOmitUnavailableItem(unavailableIds);
                }
                const availableIds = results
                    .filter((result) => result.status === "fulfilled")
                    .map(
                        (result) =>
                            (result as PromiseFulfilledResult<DocItem>).value.id
                    );
                if (isControlled) {
                    // 多选时全部失效则显示校验提示
                    (onChange as (v: string | string[] | undefined) => void)(
                        multiple
                            ? availableIds.length > 0
                                ? availableIds
                                : undefined
                            : availableIds[0]
                    );
                } else {
                    setIds(multiple ? availableIds : availableIds.slice(0, 1));
                }
            }

            const res = results
                .map((result) => {
                    if (result.status === "fulfilled") {
                        return result.value;
                    }
                    return "";
                })
                .filter(Boolean) as DocItem[];
            setAvailableData(res);
            return res;
        },
        // 此时间段内具有相同密钥的重复数据消除请求
        { dedupingInterval: 0, revalidateOnFocus: false }
    );

    const availableIds = useMemo(() => {
        if (availableData) {
            return availableData.map((item) => item.id);
        }
        return [];
    }, [availableData]);

    const handleSelectResult = async (result: any) => {
        try {
            if (multiple) {
                if (!Array.isArray(result)) {
                    result = [result].filter(Boolean);
                }

                if (result.length) {
                    let filterArr = result;
                    if (checkDownloadPerm === true) {
                        filterArr = [];
                        // 检查下载权限
                        const noPermList = [];
                        for (let i = 0; i < result.length; i++) {
                            try {
                                const {
                                    data: { result: res },
                                } = await API.efast.eacpV1Perm1CheckPost({
                                    docid: result[i].docid || result[i].id,
                                    perm: "download" as any,
                                });

                                if (res !== 0) {
                                    noPermList.push(result[i].name);
                                } else {
                                    filterArr.push(result[i]);
                                }
                            } catch (error) {
                                console.error(error);
                            }
                        }
                        if (noPermList.length) {
                            microWidgetProps?.components?.messageBox({
                                type: "info",
                                title: t(
                                    "err.operation.title",
                                    "无法执行此操作"
                                ),
                                message: t("err.403001002.download.multiple", {
                                    name: noPermList.join("、"),
                                }),
                                okText: t("ok", "确定"),
                            });
                        }
                    }

                    const newValue = [...ids];

                    filterArr.forEach((item: any) => {
                        const id = (item.id || item.docid) as string;

                        if (!newValue.includes(id)) {
                            newValue.push(id);
                        }
                    });
                    if (isControlled) {
                        (onChange as (value?: string[]) => void)(
                            newValue.length ? newValue : undefined
                        );
                    } else {
                        setIds(newValue);
                    }
                    setUnavailableIds([]);
                }
            } else {
                if (Array.isArray(result)) {
                    result = result[0];
                }
                let isSupportType = true;
                if (supportExtensions && supportExtensions?.length > 0) {
                    const fileName = result.name;
                    const index = fileName.lastIndexOf(".");
                    const type = index < 1 ? "" : fileName.slice(index);

                    if (!type || !supportExtensions.includes(toLower(type))) {
                        isSupportType = false;
                    }
                }
                if (isSupportType) {
                    if (result) {
                        if (isControlled) {
                            (onChange as (value: string) => void)(
                                result.id || result.docid
                            );
                        } else {
                            setIds([result.id || result.docid]);
                        }
                    } else {
                        if (isControlled) {
                            (onChange as (value?: string) => void)(undefined);
                        } else {
                            setIds([]);
                        }
                    }
                    setUnavailableIds([]);
                } else {
                    let path = "user";
                    if (result) {
                        path = result?.docid?.replace("gns://", "").slice(0, -33);
                    }
                    const tip = notSupportTip
                        ? notSupportTip
                        : t("notSupport.type", "不支持该类型文件，请重新选择");

                     Modal.info({
                        title: t("err.operation.title", "无法执行此操作"),
                        content: tip,
                        getContainer: microWidgetProps?.container,
                        onOk: () => handleSelectDoc(path),
                    });
                    // microWidgetProps?.components?.messageBox({
                    //     type: "info",
                    //     title: t("err.operation.title", "无法执行此操作"),
                    //     message: tip,
                    //     okText: t("ok", "确定"),
                    //     onOk: () => handleSelectDoc(path),
                    // });
                }
            }
        } catch (e) {
            if (e) {
                console.error(e);
            }
        }
    }

    const handleSelectDoc = async (path?: string) => {
        try {
            apis.selectFn({
                title: "从文档中心选择文件",
                multiple: true,
                selectType,
                onConfirm: (selections: any[]) => {
                handleSelectResult(selections);
                // if (multiple) {
                //   const result = [...availableData, ...selections];
                //   setAvailableData(uniqBy(result, "id"));
                // } else {
                //   setAvailableData(selections);
                // }
                },
            });
            // let result: any = await microWidgetProps?.contextMenu?.selectFn({
            //     functionid: functionId,
            //     multiple,
            //     selectType,
            //     title,
            //     path: path ? path : "user",
            //     containerOptions: {
            //         height: clamp(window.innerHeight, 400, 600),
            //     },
            // });

            // handleSelectResult(result);
        } catch (e) {
            if (e) {
                console.error(e);
            }
        }
    };

    return (
        <>
            <div
                className={clsx(
                    styles.container,
                    className,
                    multiple && "multiple"
                )}
            >
                {!multiple ? (
                    <Input
                        className={clsx(
                            styles.input,
                            "input",
                            {
                                [styles["readOnly"]]: !allowClear,
                            },
                            {
                                [styles["allowClear"]]: allowClear,
                            }
                        )}
                        placeholder={placeholder}
                        readOnly={!allowClear}
                        allowClear
                        title={
                            data && data.length
                                ? data[0].path || data[0].name
                                : placeholder
                        }
                        value={
                            data && data.length
                                ? data[0].path || data[0].name
                                : ""
                        }
                        onChange={(e) => {
                            if (!e.target.value) {
                                onChange && onChange(undefined);
                                setUnavailableIds([]);
                            }
                        }}
                    />
                ) : multipleMode === "list" && availableData?.length ? (
                    // 列表展示
                    <DocList
                        data={availableData}
                        selectType={selectType}
                        onAdd={handleSelectDoc}
                        onChange={(ids) => {
                            (onChange as (value?: string[]) => void)(
                                ids?.length ? ids : undefined
                            );
                            setUnavailableIds([]);
                        }}
                    />
                ) : (
                    <Select
                        mode="tags"
                        className={clsx(styles.input, styles.multiple, "input")}
                        open={false}
                        value={availableIds}
                        showSearch={false}
                        searchValue=""
                        placeholder={placeholder}
                        disabled={disabled}
                        onChange={(ids) => {
                            (onChange as (value?: string[]) => void)(
                                ids.length ? ids : undefined
                            );
                            setUnavailableIds([]);
                        }}
                    >
                        {ids.length
                            ? availableData?.map((item) => (
                                <Select.Option key={item.id}>
                                    <span title={item.path || item.name}>
                                        {item.name}
                                    </span>
                                </Select.Option>
                            ))
                            : []}
                    </Select>
                )}
                {/* 只读和列表展示多选文档时隐藏 */}
                {!readOnly &&
                    !(multipleMode === "list" && availableData?.length) && (
                        <Button
                            disabled={disabled}
                            loading={isLoading}
                            onClick={() => {
                                if (ids.length === 1) {
                                    const path = ids[0].replace("gns://", "").slice(0, -33);
                                    handleSelectDoc(path);
                                } else {
                                    handleSelectDoc();
                                }
                            }}
                        >
                            {selectButtonText}
                        </Button>
                    )}
            </div>
            {unavailableIds.length && omittedMessage ? (
                <div className={styles.omittedMessage}>{omittedMessage}</div>
            ) : null}
            {tip && typeof tip === "string" && (
                <div className={styles.omittedMessage}>{tip}</div>
            )}
        </>
    );
}
