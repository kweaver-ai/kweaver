import { Button, Drawer, Form, Input, Space, Table, Typography } from "antd";
import clsx from "clsx";
import styles from "./styles/rule-list.module.less";
import {
    AddOutlined,
    DeleteOutlined,
    FormOutlined,
    OfficialColored,
    SearchOutlined,
} from "@applet/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useSearchParams } from "react-router-dom";
import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { debounce, flattenDeep, max } from "lodash";
import { Empty, getLoadStatus } from "../table-empty";
import { OfficialTags, reconstruct } from "../official-tags";
import { RuleItem } from "./tag-extract";
import React from "react";
import { TreeOptionType } from "../official-tags/tags.type";
import { useHandleErrReq } from "../../utils/hooks";
import { KeyPhrase } from "./keyphrase-select";
import useSize from "@react-hook/size";

interface FormValue {
    tag: string[];
    phrases: string[];
}

interface RuleListProps {
    tagRule: RuleItem[];
    onChange: (val: RuleItem[]) => void;
}

interface ITag {
    name: string;
    id: string;
    path: string;
}

interface IListItem {
    name: string;
    id: string;
    path: string;
    rule: string[];
}

const transferTagToArray = (val: any) => {
    let tags: any[] = [];
    if (val.length) {
        val.forEach((item: any) => {
            tags = tags.concat([
                { name: item.name, id: item.id, path: item.path },
            ]);
            if (item.child_tags?.length) {
                tags = tags.concat(transferTagToArray(item.child_tags));
            }
        });
    }
    return tags;
};

const transferListToRule = (data: IListItem[]) => {
    return data.map((item) => ({
        tag_id: item.id,
        tag_path: item.path,
        rule: {
            or: item.rule.map((i) => [i]),
        },
    }));
};

export const RuleList = React.forwardRef(
    ({ tagRule, onChange }: RuleListProps, ref) => {
        const t = useTranslate();
        const [params, setSearchParams] = useSearchParams();
        const [isDrawerOpen, setDrawerOpen] = useState(false);
        const [form] = Form.useForm<FormValue>();
        const popupContainer = useRef<HTMLDivElement>(null);
        const [listData, setListData] = useState<IListItem[]>([]);
        const { prefixUrl } = useContext(MicroAppContext);
        const [officialTags, setOfficialTags] = useState<ITag[]>([]);

        const [defaultTreeData, setDefaultTreeData] =
            useState<TreeOptionType[]>();
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState();
        const handleErr = useHandleErrReq();
        const shouldContinue = useRef(false);
        const [editRecord, setEditRecord] = useState<IListItem>();
        const containerRef = useRef<HTMLDivElement>(null);
        const [, height] = useSize(containerRef);
        const allTagsRecord = useRef<Record<string, any>>({});

        const { keyword } = useMemo(
            () => ({
                keyword: params.get("keyword") || "",
            }),
            [params]
        );

        const ruleListData = useMemo(() => {
            if (!keyword) {
                return listData;
            }
            return listData.filter((i) => i.name.includes(keyword));
        }, [listData, keyword]);

        const transferRuleToList = async (rules: RuleItem[]) => {
            setIsLoading(true);
            try {
                if (!defaultTreeData) {
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/ecotag/v1/tag-tree`
                    );
                    if (data && data[0] && data[0]?.child_tags) {
                        let allTags: ITag[] = [];
                        // 生成标签树
                        let child_tags: TreeOptionType[] = [];
                        data?.forEach((item: any) => {
                            allTags = allTags.concat(
                                transferTagToArray(item.child_tags)
                            );

                            if (item?.child_tags) {
                                child_tags = child_tags.concat(
                                    reconstruct(item.child_tags)
                                );
                            }
                        });
                        setOfficialTags(allTags);
                        setDefaultTreeData(child_tags);

                        const allTagsObject: Record<string, ITag> = {};
                        allTags.forEach((ele) => {
                            allTagsObject[ele.id] = ele;
                        });
                        allTagsRecord.current = allTagsObject;
                    }

                    // 编辑时初始化数据
                    if (rules.length) {
                        const list = rules.map((ele: RuleItem) => {
                            const tag = allTagsRecord.current[ele.tag_id];
                            const rule = ele.rule.or;
                            return {
                                ...tag,
                                rule: flattenDeep(rule),
                            };
                        });
                        setListData(list);
                        onChange(transferListToRule(list));
                    }
                }
            } catch (error: any) {
                setError(error?.response);
                handleErr({ error: error?.response });
            } finally {
                setIsLoading(false);
            }
        };

        const handleSearch = useCallback(
            (params: URLSearchParams) => {
                setSearchParams(params);
            },
            [setSearchParams]
        );

        const setSearchParamsDebounced = useMemo(
            () => debounce(handleSearch, 500),
            [handleSearch]
        );

        const handleEdit = (record: IListItem) => {
            setEditRecord(record);
            form.setFieldsValue({
                tag: [record.path],
                phrases: record.rule,
            });
            setDrawerOpen(true);
        };

        const handleDelete = (record: IListItem) => {
            setListData((pre) => {
                const data = pre.filter((i) => i.id !== record.id);
                onChange(transferListToRule(data));
                return data;
            });
        };

        const onClose = () => {
            setDrawerOpen(false);
            form.resetFields();
        };

        const onSubmit = (val: FormValue) => {
            const path = val.tag[0];
            const rule = val.phrases;
            const tag = officialTags.filter((i) => i.path === path)[0];
            setListData((pre) => {
                if (editRecord) {
                    const data = pre.map((ele) => {
                        if (ele.path === path) {
                            return {
                                name: tag.name,
                                id: tag.id,
                                path: tag.path,
                                rule,
                            };
                        }
                        return ele;
                    });
                    onChange(transferListToRule(data));
                    return data;
                } else {
                    const data = pre.concat([
                        {
                            name: tag.name,
                            id: tag.id,
                            path: tag.path,
                            rule,
                        },
                    ]);
                    onChange(transferListToRule(data));
                    return data;
                }
            });
            if (shouldContinue.current === false) {
                setDrawerOpen(false);
            }
            form.resetFields();
        };

        useEffect(() => {
            transferRuleToList([]);
        }, []);

        useEffect(() => {
            if (tagRule.length !== listData.length) {
                transferRuleToList(tagRule);
            }
        }, [tagRule.length]);

        return (
            <>
                <div className={styles["container"]} ref={containerRef}>
                    <div className={styles["title"]}>
                        {t("model.tagRule", "标签规则")}
                    </div>
                    <div className={styles["description"]}>
                        {t(
                            "model.tagRule.description",
                            "您可以通过标签规则，为每个标签指定关键词组，能力将通过匹配关键词组为文本添加对应的标签"
                        )}
                    </div>
                    <div className={styles["operation-bar"]}>
                        <Button
                            type="primary"
                            className={clsx(
                                "automate-oem-primary-btn",
                                styles["newButton"]
                            )}
                            icon={
                                <AddOutlined
                                    className={styles["newButtonIcon"]}
                                />
                            }
                            onClick={() => {
                                setEditRecord(undefined);
                                setDrawerOpen(true);
                            }}
                        >
                            {t("model.createRule", "新建标签规则")}
                        </Button>
                        <Input
                            className={styles["searchInput"]}
                            placeholder={t("model.ruleSearch", "搜索标签名称")}
                            prefix={
                                <SearchOutlined
                                    className={styles["search-icon"]}
                                />
                            }
                            defaultValue={keyword}
                            allowClear
                            onChange={(e) => {
                                if (e.target.value) {
                                    params.set("keyword", e.target.value);
                                } else {
                                    params.delete("keyword");
                                }
                                setSearchParamsDebounced(params);
                            }}
                        />
                    </div>
                    <div className={styles["content"]}>
                        <Table
                            dataSource={ruleListData}
                            bordered={false}
                            className={styles["rule-table"]}
                            showSorterTooltip={false}
                            rowKey="id"
                            scroll={{
                                y:
                                    ruleListData.length > 0
                                        ? max([height - 200, 250])
                                        : undefined,
                            }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        loadStatus={getLoadStatus({
                                            isLoading,
                                            error,
                                            data: ruleListData,
                                            keyword,
                                        })}
                                        height={height - 360}
                                        emptyText={t(
                                            "model.tagRule.empty",
                                            "列表为空，请您为标签新建规则"
                                        )}
                                    />
                                ),
                            }}
                            pagination={false}
                        >
                            <Table.Column
                                key="name"
                                dataIndex="name"
                                title={t("model.column.tagName", "标签名称")}
                                width="25%"
                                render={(name: string, record: IListItem) => (
                                    <div className={styles["name-wrapper"]}>
                                        <OfficialColored
                                            className={styles["icon"]}
                                        />
                                        <Typography.Text
                                            ellipsis
                                            title={record.path?.substring(
                                                record.path?.indexOf("/", 0) + 1
                                            )}
                                        >
                                            {name}
                                        </Typography.Text>
                                    </div>
                                )}
                            />
                            <Table.Column
                                key="rule"
                                dataIndex="rule"
                                title={t("model.column.keyword", "关键词组")}
                                render={(rule: string[]) => (
                                    <Typography.Text
                                        ellipsis
                                        title={rule.join("、")}
                                    >
                                        {rule.join("、")}
                                    </Typography.Text>
                                )}
                            />
                            {/* <Table.Column
                                key="create_at"
                                dataIndex="create_at"
                                title={t("model.column.createAt", "新建时间")}
                                width="25%"
                                sorter
                                sortDirections={[
                                    "descend",
                                    "ascend",
                                    "descend",
                                ]}
                                sortOrder={
                                    sortBy === "create_at"
                                        ? order === "asc"
                                            ? "ascend"
                                            : "descend"
                                        : null
                                }
                                render={(time: number) => (
                                    <Typography.Text
                                        ellipsis
                                        title={formatTime(time)}
                                    >
                                        {formatTime(time) || "---"}
                                    </Typography.Text>
                                )}
                            /> */}
                            <Table.Column
                                key="option"
                                title={t("model.column.operation", "操作")}
                                width="25%"
                                render={(_, record: any) => (
                                    <Space>
                                        <Button
                                            type="text"
                                            size="small"
                                            className={styles["ops-btn"]}
                                            onClick={() => handleEdit(record)}
                                            title="编辑"
                                            icon={
                                                <FormOutlined
                                                    className={styles["icon"]}
                                                />
                                            }
                                        ></Button>

                                        <Button
                                            type="text"
                                            size="small"
                                            className={styles["ops-btn"]}
                                            onClick={() => handleDelete(record)}
                                            title="删除"
                                            icon={
                                                <DeleteOutlined
                                                    className={styles["icon"]}
                                                />
                                            }
                                        ></Button>
                                    </Space>
                                )}
                            />
                        </Table>
                    </div>
                </div>
                <div ref={popupContainer}></div>
                <Drawer
                    open={isDrawerOpen}
                    title={
                        <div className={styles["drawer-title"]}>
                            {t("model.createRule", "新建标签规则")}
                        </div>
                    }
                    className={styles["drawer"]}
                    width={560}
                    placement="right"
                    maskClosable
                    style={{ position: "absolute" }}
                    getContainer={popupContainer.current!}
                    footer={
                        <div className={styles["drawer-footer"]}>
                            <Space size={8}>
                                <Button
                                    className={clsx("automate-oem-primary-btn")}
                                    onClick={() => {
                                        shouldContinue.current = false;
                                        form.submit();
                                    }}
                                    type="primary"
                                >
                                    {t("ok", "确定")}
                                </Button>
                                {editRecord ? (
                                    <Button
                                        onClick={() => {
                                            shouldContinue.current = true;
                                            form.submit();
                                        }}
                                        type="default"
                                    >
                                        {t("cancel", "取消")}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            shouldContinue.current = true;
                                            form.submit();
                                        }}
                                        type="default"
                                    >
                                        {t("ok.next", "确定再新建下一个")}
                                    </Button>
                                )}
                            </Space>
                        </div>
                    }
                    onClose={onClose}
                >
                    <Form
                        name="newTask"
                        form={form}
                        className={styles["form"]}
                        labelAlign="left"
                        onFinish={onSubmit}
                        autoComplete="off"
                        colon={false}
                        layout="vertical"
                        requiredMark
                    >
                        <Form.Item
                            label={t("tagRule.name", "标签名称")}
                            name="tag"
                            required
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                    type: "array",
                                },
                                {
                                    async validator(_, value) {
                                        if (
                                            value &&
                                            value.length &&
                                            editRecord?.path !== value[0]
                                        ) {
                                            const repeatTag = listData.filter(
                                                (item) => item.path === value[0]
                                            );

                                            if (repeatTag.length > 0) {
                                                throw new Error("repeat");
                                            }
                                        }
                                    },
                                    message: t(
                                        "tagRule.repeat",
                                        "不允许添加重复标签"
                                    ),
                                },
                            ]}
                        >
                            <OfficialTags
                                defaultTreeData={defaultTreeData}
                                customClass={styles["tagRule-tags"]}
                            />
                        </Form.Item>
                        <Form.Item
                            label={t("keyPhrase", "关键词组")}
                            name="phrases"
                            required
                            className={styles["phrases"]}
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                    type: "array",
                                },
                            ]}
                        >
                            <KeyPhrase />
                        </Form.Item>
                        <div className={styles["description"]}>
                            {t(
                                "keyPhrase.description",
                                "您可通过一组近义词来描述所选标签，若文本命中关键词组中的任意一个，则自动提取所选标签"
                            )}
                        </div>
                    </Form>
                </Drawer>
            </>
        );
    }
);
