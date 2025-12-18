import React, {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import styles from "./file-suffixType.module.less";
import { MicroAppContext, useTranslate } from "@applet/common";
import { Checkbox, Collapse, Input, Typography } from "antd";
import { FileCategory, defaultSuffix } from "./defaultSuffix";
import { isFunction, trim, uniq } from "lodash";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import clsx from "clsx";
import { Validatable } from "../extension";

const { Panel } = Collapse;

interface FileSuffixTypeProps {
    value?: SuffixType[];
    onChange?: (val: SuffixType[]) => void;
    allowSuffix?: SuffixType[];
    allowAllOthers?: boolean;
    othersForbiddenTypes?: string[];
}

enum ValidStatus {
    Normal = "normal",
    Error = "error",
    EmptyError = "emptyError",
    TypeError = "typeError",
}

export interface SuffixType {
    id: number;
    name: string;
    suffix: string[];
    enabled?: boolean;
}

/**
 * 验证文件后缀是否正确
 * @param {string} input 输入值（不允许包含.\|/*?"<>:）
 * @returns {boolean}
 */
export function isSuffix(input: string): boolean {
    return /^\.([^.\\/:*?"<>|])+$/.test(input);
}

export const FileSuffixType = forwardRef<Validatable, FileSuffixTypeProps>(
    (
        {
            value,
            onChange,
            allowSuffix,
            allowAllOthers = true,
            othersForbiddenTypes = [],
        },
        ref
    ) => {
        const [suffixType, setSuffixType] =
            useState<SuffixType[]>(defaultSuffix);
        const [suffixCheckedList, setSuffixCheckedList] = useState<
            Record<string, any>
        >({});
        const { prefixUrl } = useContext(MicroAppContext);
        const t = useTranslate();
        const defaultSuffixObjectCache = useRef<Record<number, string[]>>({});
        const [customInputValue, setCustomInputValue] = useState("");
        const [validInfo, setValidInfo] = useState({
            status: ValidStatus.Normal,
            message: "",
        });
        const infoRef = useRef<HTMLDivElement>(null)

        useImperativeHandle(
            ref,
            () => {
                return {
                    validate() {
                        if(validInfo.status !== ValidStatus.Normal && infoRef.current) {
                            infoRef.current.scrollIntoView()
                        }
                        return validInfo.status === ValidStatus.Normal
                            ? true
                            : false;
                    },
                };
            },
            [validInfo]
        );

        useEffect(() => {
            async function getSuffixType() {
                let defaultSuffixType = defaultSuffix;
                // 所有可选项  固定排序
                setSuffixType(defaultSuffixType.sort((a, b) => a.id - b.id));
                defaultSuffix?.forEach((item: SuffixType) => {
                    defaultSuffixObjectCache.current[item.id] = item.suffix;
                });

                if (allowSuffix?.length) {
                    defaultSuffixType = allowSuffix;
                }
                let forbiddenTypes: string[] = [];
                let allAllowTypes: string[] = [];

                const checkType: Record<string, any> = {};
                let suffixCheck = value;
                if (!value?.length) {
                    suffixCheck = defaultSuffixType;
                    onChange && onChange(defaultSuffixType);
                    return;
                }
                let currentCustomInputVal = "";
                suffixCheck?.forEach((item) => {
                    // 初始化选中项
                    checkType[item.id] = item.suffix;
                    if (item.id === FileCategory.Others) {
                        const val = item.suffix.join(" ");
                        setCustomInputValue(val);
                        validateCustomSuffix(val);
                        currentCustomInputVal = val;
                    }
                    if (allowSuffix?.length) {
                        // 校验非法项
                        const allowItems =
                            allowSuffix.filter((p) => p.id === item.id)[0]
                                ?.suffix || [];
                        allAllowTypes = allAllowTypes.concat(allowItems);

                        if (item.id === FileCategory.Others) {
                            if (!allowAllOthers) {
                                const forbiddenItems = item.suffix.filter(
                                    (i) => !allAllowTypes?.includes(i)
                                );
                                forbiddenTypes =
                                    forbiddenTypes.concat(forbiddenItems);
                            }
                            if (allowAllOthers && othersForbiddenTypes.length) {
                                const forbiddenItems = item.suffix.filter((i) =>
                                    othersForbiddenTypes?.includes(i)
                                );
                                forbiddenTypes =
                                    forbiddenTypes.concat(forbiddenItems);
                            }
                        } else {
                            const forbiddenItems = item.suffix.filter(
                                (i) => !allowItems?.includes(i)
                            );
                            forbiddenTypes =
                                forbiddenTypes.concat(forbiddenItems);
                        }
                    }
                });
                setSuffixCheckedList(checkType);
                // 为空校验
                const validateEmpty = () => {
                    if (
                        value &&
                        value.every(
                            (i) => i.suffix.filter(Boolean).length === 0
                        )
                    ) {
                        setValidInfo({
                            status: ValidStatus.EmptyError,
                            message: t(`emptyMessage`),
                        });
                    } else if (validInfo.status === ValidStatus.EmptyError) {
                        setValidInfo({
                            status: ValidStatus.Normal,
                            message: "",
                        });
                        validateCustomSuffix(currentCustomInputVal);
                    }
                };
                validateEmpty();
                // 文件类型校验
                if (allowSuffix) {
                    if (forbiddenTypes.length) {
                        const types = uniq(forbiddenTypes).join("、");
                        setValidInfo({
                            status: ValidStatus.TypeError,
                            message: allowAllOthers
                                ? t(
                                      "suffix.forbidden.document",
                                      `文档库已禁止${types}格式上传。`,
                                      { types }
                                  )
                                : t(
                                      "suffix.forbidden",
                                      `上级文件夹已禁止${types}格式上传。`,
                                      { types }
                                  ),
                        });
                    } else if (validInfo.status === ValidStatus.TypeError) {
                        setValidInfo({
                            status: ValidStatus.Normal,
                            message: "",
                        });
                        validateCustomSuffix(currentCustomInputVal);
                        validateEmpty();
                    }
                }
            }
            getSuffixType();
        }, [prefixUrl, value, allowSuffix]);

        const getIndeterminate = (id: number, optionLength: number) => {
            return (
                !!suffixCheckedList[id]?.length &&
                suffixCheckedList[id].length < optionLength
            );
        };

        const getCheckedStatus = (id: number, optionLength: number) => {
            return suffixCheckedList[id]?.length === optionLength;
        };

        // 全选某一类
        const handleCheckAllChange = (checked: boolean, item: SuffixType) => {
            if (isFunction(onChange) && value) {
                const result = [...value];

                onChange(
                    result.map((suffixItem) => {
                        if (suffixItem.id === item.id) {
                            return {
                                ...suffixItem,
                                suffix: checked ? item.suffix : [],
                            };
                        }
                        return suffixItem;
                    })
                );
            }
        };

        // 选中单个类型
        const handleCheckChange = (list: CheckboxValueType[], id: number) => {
            if (isFunction(onChange) && value) {
                const result = [...value];

                onChange(
                    result.map((suffixItem) => {
                        if (suffixItem.id === id) {
                            return { ...suffixItem, suffix: list as any };
                        }
                        return suffixItem;
                    })
                );
            }
        };

        const validateCustomSuffix = (inputVal: string) => {
            // 检查长度是否超过300或单个类型长度是否超过20
            if (
                inputVal.length > 300 ||
                inputVal.split(" ")?.some((i: string) => i.length >= 20)
            ) {
                setValidInfo({
                    status: ValidStatus.Error,
                    message: t(
                        "folderProperties.lengthValidate",
                        "输入的扩展名字符过长或输入框内的扩展名个数不能超过300个，请重新输入"
                    ),
                });
            } else if (
                inputVal &&
                !inputVal.split(" ").every((i: string) => isSuffix(i))
            ) {
                setValidInfo({
                    status: ValidStatus.Error,
                    message: t(
                        "folderProperties.typeValidate",
                        '扩展名不能包含 \\ / : * ? " < > | 特殊字符或输入扩展名的格式不符，请重新输入'
                    ),
                });
            } else if (validInfo.status === ValidStatus.Error)
                setValidInfo({
                    status: ValidStatus.Normal,
                    message: "",
                });
        };

        const handleTrimCustomSuffix = (item: SuffixType) => {
            const inputVal = trim(customInputValue.replaceAll(/(\s+)/g, " "));
            if (isFunction(onChange) && value) {
                const result = [...value].map((suffixItem) => {
                    if (suffixItem.id === item.id) {
                        return {
                            ...suffixItem,
                            suffix: inputVal.split(" ").filter(Boolean),
                        };
                    }
                    return suffixItem;
                });
                onChange(result);
                // validateCustomSuffix(inputVal);
            }
        };

        return (
            <div className={styles["suffixType"]}>
                <Collapse
                    defaultActiveKey={[
                        FileCategory.Document,
                        FileCategory.Others,
                    ]}
                    expandIconPosition="end"
                    bordered={false}
                    className={styles["collapse"]}
                >
                    {suffixType.map((item) => (
                        <Panel
                            key={item.id}
                            header={
                                <span onClick={(e) => e.stopPropagation()}>
                                    {item.id === 7 ? (
                                        <Typography.Text>
                                            {t("suffixType.7") || item.name}
                                        </Typography.Text>
                                    ) : (
                                        <Checkbox
                                            className={styles["check-all"]}
                                            indeterminate={getIndeterminate(
                                                item.id,
                                                item.suffix.length
                                            )}
                                            checked={getCheckedStatus(
                                                item.id,
                                                item.suffix.length
                                            )}
                                            onChange={(e) =>
                                                handleCheckAllChange(
                                                    e.target.checked,
                                                    item
                                                )
                                            }
                                        >
                                            <Typography.Text ellipsis>
                                                {t(`suffixType.${item.id}`) ||
                                                    item.name}
                                            </Typography.Text>
                                            <span
                                                style={{ marginLeft: "8px" }}
                                            >{`(${
                                                suffixCheckedList[item.id]
                                                    ?.length || 0
                                            }/${item.suffix.length})`}</span>
                                        </Checkbox>
                                    )}
                                </span>
                            }
                            className={clsx({
                                [styles["custom-panel"]]:
                                    item.id === FileCategory.Others,
                            })}
                        >
                            <div className={styles["panel-content"]}>
                                {item.id === FileCategory.Others ? (
                                    <>
                                        <Input.TextArea
                                            key={item.id}
                                            value={customInputValue}
                                            onChange={(e) => {
                                                setCustomInputValue(
                                                    e.target.value
                                                );
                                                if (
                                                    validInfo.status ===
                                                    ValidStatus.Error
                                                ) {
                                                    validateCustomSuffix(
                                                        trim(
                                                            (
                                                                e.target
                                                                    .value || ""
                                                            ).replaceAll(
                                                                /(\s+)/g,
                                                                " "
                                                            )
                                                        )
                                                    );
                                                }
                                            }}
                                            placeholder={t(
                                                "suffix.placeholder",
                                                "请输入文件拓展名（如.mov），多个请用空格隔开"
                                            )}
                                            rows={4}
                                            className={styles["textarea"]}
                                            onBlur={() => {
                                                handleTrimCustomSuffix(item);
                                            }}
                                            status={
                                                validInfo.status ===
                                                ValidStatus.Error
                                                    ? "error"
                                                    : undefined
                                            }
                                        ></Input.TextArea>
                                    </>
                                ) : (
                                    <Checkbox.Group
                                        key={item.id}
                                        options={item.suffix.map((item) => ({
                                            label: (
                                                <span title={item}>{item}</span>
                                            ),
                                            value: item,
                                        }))}
                                        value={suffixCheckedList[item.id]}
                                        onChange={(list) =>
                                            handleCheckChange(list, item.id)
                                        }
                                    ></Checkbox.Group>
                                )}
                            </div>
                        </Panel>
                    ))}
                </Collapse>
                {validInfo.status !== ValidStatus.Normal && (
                    <div className={styles["explain-error"]} ref={infoRef}>
                        {validInfo.message}
                    </div>
                )}
            </div>
        );
    }
);

export const FormatSuffixType = ({ types }: { types: SuffixType[] }) => {
    const t = useTranslate();
    return (
        <>
            {types?.map((item) => (
                <div className={styles["suffix-item"]}>
                    <label className={styles["label"]}>
                        {item.name}
                        {t("colon")}
                    </label>
                    <Typography.Text>
                        {item.suffix?.length ? item.suffix.join(" ") : "---"}
                    </Typography.Text>
                </div>
            ))}
        </>
    );
};
