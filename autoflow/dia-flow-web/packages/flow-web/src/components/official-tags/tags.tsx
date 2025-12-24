import { Button, Checkbox, Select, Tag } from "antd";
import styles from "./tags.module.less";
import { Node, TagOptionColumn, TreeOptionType } from "./tags.type";
import { useContext, useEffect, useState } from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { OfficialColored } from "@applet/icons";
import { RightOutlined } from "@ant-design/icons";
import clsx from "clsx";

interface OfficialTagsProps {
    defaultTreeData?: TreeOptionType[];
    value?: string[];
    onChange?: (val: string[]) => void;
    multiple?: boolean;
    customClass?: string;
}

// 标签树转换
export const reconstruct = (data: Node[]) => {
    if (data?.length) {
        let newTreeData: TreeOptionType[] = [];
        newTreeData = data.map((item) => {
            const obj: TreeOptionType = {
                label: item.name,
                value: item.path,
                children: item.child_tags?.length
                    ? reconstruct(item?.child_tags)
                    : [],
            };
            return obj;
        });
        return newTreeData;
    }
    return [];
};

export const OfficialTags = ({
    value,
    onChange,
    customClass,
    defaultTreeData,
    multiple = false,
}: OfficialTagsProps) => {
    const [treeData, setTreeData] = useState<TreeOptionType[]>([]);
    const [paths, setPaths] = useState<string[]>([]);
    const [show, setShow] = useState(false);
    const t = useTranslate();
    const { prefixUrl } = useContext(MicroAppContext);

    const changeBoxHandle = (selected: boolean, optionValue: string) => {
        if (selected) {
            if (!multiple) {
                onChange && onChange([]);
                setShow(false);
            } else {
                onChange &&
                    onChange((value || []).filter((i) => i !== optionValue));
            }
        } else {
            if (!multiple) {
                onChange && onChange([optionValue]);
                setShow(false);
            } else {
                onChange && onChange([...(value || []), optionValue]);
            }
        }
    };

    const getTreeData = async () => {
        if (defaultTreeData) {
            setTreeData(defaultTreeData);
        } else {
            try {
                const { data } = await API.axios.get(
                    `${prefixUrl}/api/ecotag/v1/tag-tree`
                );
                if (data && data[0] && data[0]?.child_tags) {
                    let child_tags: TreeOptionType[] = [];
                    data?.forEach((item: any) => {
                        if (item?.child_tags) {
                            child_tags = child_tags.concat(
                                reconstruct(item.child_tags)
                            );
                        }
                    });
                    setTreeData(child_tags);
                }
            } catch (err) {
                console.error(err);
                setTreeData([]);
            }
        }
    };

    useEffect(() => {
        getTreeData();
    }, []);

    return (
        <div className={styles["official-tag"]}>
            <Select
                mode="tags"
                value={value}
                open={show}
                onDropdownVisibleChange={(open) => {
                    if (open === false) {
                        setShow(open);
                    }
                }}
                showSearch={false}
                className={clsx(styles["select"], customClass)}
                searchValue=""
                placeholder={t(
                    "model.addTagPlaceholder",
                    "添加标签，一次仅能添加一个"
                )}
                tagRender={(props) => {
                    const { value, onClose } = props as any;
                    let currentTag = value;
                    let currentTitle = value;
                    if (value?.includes("/")) {
                        currentTag = value?.substring(
                            value?.lastIndexOf("/") + 1
                        );
                        currentTitle = value?.substring(
                            value?.indexOf("/", 0) + 1
                        );
                    }
                    return (
                        <Tag
                            key={value}
                            closable={false}
                            onClose={onClose}
                            className={styles["tag"]}
                            icon={
                                value?.includes("/") ? (
                                    <OfficialColored style={{ fontSize: 14 }} />
                                ) : null
                            }
                        >
                            <span key={value} title={currentTitle}>
                                {currentTag}
                            </span>
                        </Tag>
                    );
                }}
                dropdownRender={(menu) => {
                    if (!treeData?.length) return <div></div>;
                    return (
                        <div className={styles["tag-dropdownContainer"]}>
                            <div className={styles["tag-columns"]}>
                                {paths
                                    .reduce<TagOptionColumn[]>(
                                        (columns, path) => {
                                            const parentColumn =
                                                columns[columns.length - 1];

                                            parentColumn.active = path;
                                            const { options } = parentColumn;

                                            return [
                                                ...columns,
                                                {
                                                    options:
                                                        options.find(
                                                            (item) =>
                                                                item.value ===
                                                                path
                                                        )?.children || [],
                                                    path: [
                                                        ...parentColumn.path,
                                                        path,
                                                    ],
                                                } as TagOptionColumn,
                                            ];
                                        },
                                        [
                                            {
                                                options: treeData,
                                                active: undefined,
                                                path: [],
                                            },
                                        ]
                                    )
                                    .map(({ options, active, path }) => (
                                        <ul
                                            className={styles["tag-column"]}
                                            key={path.join("-")}
                                        >
                                            {options.map((option) => {
                                                const selected =
                                                    value?.includes(
                                                        option.value as string
                                                    );
                                                return (
                                                    <li
                                                        className={clsx(
                                                            [styles["tag-row"]],
                                                            {
                                                                [styles[
                                                                    "active"
                                                                ]]:
                                                                    active ===
                                                                    option?.value,
                                                            }
                                                        )}
                                                        key={[
                                                            ...path,
                                                            option.value,
                                                        ].join("-")}
                                                    >
                                                        <Checkbox
                                                            checked={selected}
                                                            style={{
                                                                margin: "0 10px",
                                                            }}
                                                            onChange={() =>
                                                                changeBoxHandle(
                                                                    selected as boolean,
                                                                    option?.value
                                                                )
                                                            }
                                                        />
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                            onClick={() => {
                                                                if (
                                                                    option
                                                                        .children
                                                                        ?.length
                                                                ) {
                                                                    setPaths([
                                                                        ...path,
                                                                        option.value as string,
                                                                    ]);
                                                                } else {
                                                                    setPaths(
                                                                        path
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <span
                                                                className={
                                                                    styles[
                                                                        "tag-label"
                                                                    ]
                                                                }
                                                                title={
                                                                    option.label
                                                                }
                                                            >
                                                                {option.label}
                                                            </span>
                                                            {option.children
                                                                ?.length ? (
                                                                <RightOutlined
                                                                    style={{
                                                                        fontSize:
                                                                            "14px",
                                                                        margin: "0 10px",
                                                                        opacity: 0.45,
                                                                        color: "#000000",
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ))}
                            </div>
                        </div>
                    );
                }}
            ></Select>
            <Button className={styles["add-btn"]} onClick={() => setShow(true)}>
                {t("add", "添加")}
            </Button>
        </div>
    );
};
