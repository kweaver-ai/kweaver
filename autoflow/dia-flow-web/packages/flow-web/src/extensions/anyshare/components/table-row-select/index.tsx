import { TranslateFn } from "@applet/common";
import { Cascader, InputNumber } from "antd";
import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import styles from "./index.module.less";
import { Validatable } from "../../../../components/extension";
import clsx from "clsx";

interface TableRowSelectProps {
    value?: any;
    onChange?: any;
    t: TranslateFn;
}

interface Option {
    value: string;
    label: string | React.ReactNode;
    renderLabel?: string;
    children?: Option[];
}

export const TableRowSelect = forwardRef<Validatable, TableRowSelectProps>(
    (props: TableRowSelectProps, ref) => {
        const { value, onChange, t } = props;

        const [isNumValid, setNumValid] = useState(true);

        const selectType = useMemo(() => {
            if (value?.new_type && value?.insert_type) {
                return [value.new_type, value.insert_type];
            }
            return undefined;
        }, [value?.insert_type, value?.new_type]);

        const insert_pos = useMemo(() => {
            return value?.insert_pos;
        }, [value?.insert_pos]);

        const options: Option[] = [
            {
                value: "new_row",
                label: t("fileEditExcel.new_row", "新增行"),
                children: [
                    {
                        value: "append",
                        renderLabel: t(
                            "fileEditExcel.new_row.append",
                            "追加一行"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_row.append",
                                        "追加一行"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_row.append.description",
                                        "在最后一个非空行的下一行新增"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "append_before",
                        renderLabel: t(
                            "fileEditExcel.new_row.append_before",
                            "此前插入一行"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_row.append_before",
                                        "此前插入一行"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_row.append_before.description",
                                        "在目标行之前插入一行内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "append_after",
                        renderLabel: t(
                            "fileEditExcel.new_row.append_after",
                            "此后插入一行"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_row.append_after",
                                        "此后插入一行"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_row.append_after.description",
                                        "在目标行之后插入一行内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "cover",
                        renderLabel: t(
                            "fileEditExcel.new_row.cover",
                            "覆盖一行"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_row.cover",
                                        "覆盖一行"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_row.cover.description",
                                        "在指定行覆盖写入一行内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                ],
            },
            {
                value: "new_col",
                label: t("fileEditExcel.new_col", "新增列"),
                children: [
                    {
                        value: "append",
                        renderLabel: t(
                            "fileEditExcel.new_col.append",
                            "追加一列"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_col.append",
                                        "追加一列"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_col.append.description",
                                        "在最后一个非空列的下一列新增"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "append_before",
                        renderLabel: t(
                            "fileEditExcel.new_col.append_before",
                            "此前插入一列"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_col.append_before",
                                        "此前插入一列"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_col.append_before.description",
                                        "在目标列之前插入一列内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "append_after",
                        renderLabel: t(
                            "fileEditExcel.new_col.append_after",
                            "此后插入一列"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_col.append_after",
                                        "此后插入一列"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_col.append_after.description",
                                        "在目标列之后插入一列内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                    {
                        value: "cover",
                        renderLabel: t(
                            "fileEditExcel.new_col.cover",
                            "覆盖一列"
                        ),
                        label: (
                            <section>
                                <div className={styles["label"]}>
                                    {t(
                                        "fileEditExcel.new_col.cover",
                                        "覆盖一列"
                                    )}
                                </div>
                                <div className={styles["description"]}>
                                    {t(
                                        "fileEditExcel.new_col.cover.description",
                                        "在指定列覆盖写入一列内容"
                                    )}
                                </div>
                            </section>
                        ),
                    },
                ],
            },
        ];

        const onSelectChange = (val?: any[]) => {
            if (!val) {
                onChange(undefined);
            } else if (val[0] !== value?.new_type) {
                if (!isNumValid) {
                    setNumValid(true);
                }
                onChange({
                    new_type: val[0],
                    insert_type: val[1],
                    insert_pos: val[1] === "append" ? 1 : undefined,
                });
            } else {
                if (!isNumValid) {
                    setNumValid(true);
                }
                let insert_pos_val = value?.insert_pos;
                if (value?.insert_type === "append") {
                    insert_pos_val = undefined;
                }
                if (val[1] === "append") {
                    insert_pos_val = 1;
                }
                onChange({
                    new_type: val[0],
                    insert_type: val[1],
                    insert_pos: insert_pos_val,
                });
            }
        };

        const handleDisplay = (_: unknown, selectedOptions?: any[]) => {
            if (!selectedOptions) {
                return "";
            }
            return (
                <div>
                    {
                        ((selectedOptions[0].label as string) +
                            "/" +
                            selectedOptions[1]?.renderLabel) as string
                    }
                </div>
            );
        };

        const handleChange = (val: number | null) => {
            if (!val) {
                setNumValid(false);
                onChange({ ...value, insert_pos: undefined });
            } else {
                if (!isNumValid) {
                    setNumValid(true);
                }
                onChange({ ...value, insert_pos: val });
            }
        };

        useImperativeHandle(
            ref,
            () => {
                return {
                    async validate() {
                        if (
                            selectType &&
                            (insert_pos || value?.insert_type === "append")
                        ) {
                            return Promise.resolve(true);
                        } else {
                            setNumValid(false);
                            return Promise.reject(false);
                        }
                    },
                };
            },
            [insert_pos, selectType, value?.insert_type]
        );

        return (
            <>
                <Cascader
                    value={selectType}
                    options={options}
                    onChange={onSelectChange}
                    className={clsx({
                        [styles["margin-bottom-8"]]: selectType,
                    })}
                    dropdownClassName={styles["dropdown"]}
                    dropdownMatchSelectWidth
                    placeholder={t("fileEditExcel.sourcePlaceholder", "请选择")}
                    displayRender={handleDisplay}
                />
                {selectType && value?.insert_type !== "append" && (
                    <>
                        <InputNumber
                            value={insert_pos}
                            onChange={handleChange}
                            min={1}
                            precision={0}
                            style={{ width: "100%" }}
                            status={!isNumValid ? "error" : undefined}
                            placeholder={
                                selectType[0] === "new_row"
                                    ? t(
                                          "fileEditExcel.rowPlaceholder",
                                          "请输入行号"
                                      )
                                    : t(
                                          "fileEditExcel.columnPlaceholder",
                                          "请输入列号"
                                      )
                            }
                        />
                        {!isNumValid && (
                            <div className={styles["emptyTip"]}>
                                {t("emptyMessage", "此项不允许为空")}
                            </div>
                        )}
                    </>
                )}
            </>
        );
    }
);
