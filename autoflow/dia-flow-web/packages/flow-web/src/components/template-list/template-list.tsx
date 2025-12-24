import {
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    SubCategories,
    taskTemplates,
    ITemplate,
    ITaskTemplate,
} from "../../extensions/templates";
import { Input, Tabs } from "antd";
import { MicroAppContext, TranslateFn, useTranslate } from "@applet/common";
import { AllWrapper } from "./all-wrapper";
import { CategoryWrapper } from "./category-wrapper";
import styles from "./styles/template-list.module.less";
import clsx from "clsx";
import { SearchOutlined } from "@applet/icons";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Empty, getLoadStatus } from "../table-empty";
import { debounce, map } from "lodash";
import useSize from "@react-hook/size";
import { ExtensionContext } from "../extension-provider";

const { TabPane } = Tabs;

export interface ITabPane {
    tab: SubCategories;
    content?: React.ReactElement;
}

export interface IChangeTabContent {
    tabPanes: ITabPane[];
    allInfo?: Record<string, ITemplate[]>;
    categoryInfo?: ITemplate[];
}

export const transformSubCategories = (key: SubCategories, t: TranslateFn) => {
    switch (key) {
        case SubCategories.All:
            return t("category.all", "全部");
        case SubCategories.Collaboration:
            return t("category.collaboration", "协同办公");
        case SubCategories.ContentExtraction:
            return t("category.contentExtraction", "内容提取");
        case SubCategories.DataCollection:
            return t("category.dataCollection", "数据收集");
        case SubCategories.DataSync:
            return t("category.dataSync", "数据同步");
        case SubCategories.MessageReminder:
            return t("category.messageReminder", "消息提醒");
        default:
            return t("category.all", "全部");
    }
};

interface TemplateListProps {
    showCategoryName?: boolean;
}

export const TemplateList = ({
    showCategoryName = true,
}: TemplateListProps) => {
    const [tabPanes, setTabPanes] = useState<ITabPane[]>([]);
    const [templates, setTemplates] = useState<Record<string, ITemplate[]>>({});
    const [activeKey, setActiveKey] = useState<SubCategories>(
        SubCategories.All
    );
    const [params, setSearchParams] = useSearchParams();
    const location = useLocation();
    const keyword = params.get("keyword") || undefined;
    const t = useTranslate();
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width] = useSize(containerRef);
    const { microWidgetProps } = useContext(MicroAppContext);
    const { globalConfig } = useContext(ExtensionContext);

    const refreshRef = useRef<any>(() => {
        handleTabsChange(activeKey, tabPanes, templates);
    });
    refreshRef.current = () => {
        handleTabsChange(activeKey, tabPanes, templates);
    };

    const isTemplateRoute = useMemo(() => {
        return location.pathname === "/nav/template";
    }, [location.pathname]);

    const changeTabContent = ({
        tabPanes,
        allInfo,
        categoryInfo,
    }: IChangeTabContent) =>
        tabPanes.map((pane: ITabPane) => {
            // 切换到all表示是全部类型
            if (pane.tab === SubCategories.All && allInfo) {
                let filterInfo = { ...allInfo };
                let emptyNum = 0;
                if (keyword && isTemplateRoute) {
                    Object.keys(filterInfo).forEach((type) => {
                        const templates = filterInfo[type].filter(
                            (temp) =>
                                temp.title.indexOf(
                                    decodeURIComponent(keyword)
                                ) > -1
                        );
                        filterInfo[type] = templates;
                        if (templates.length === 0) {
                            emptyNum += 1;
                        }
                    });
                }
                if (emptyNum === tabPanes.length - 1) {
                    return {
                        ...pane,
                        content: (
                            <Empty
                                loadStatus={getLoadStatus({
                                    data: [],
                                })}
                                height={window.innerHeight - 400}
                                emptyText={t(
                                    "notFountTemplate",
                                    "抱歉，没有找到相关模板"
                                )}
                            />
                        ),
                    };
                }

                if (location.pathname !== "/nav/template") {
                    let allArr: ITemplate[] = [];
                    map(allInfo, (categoryInfo: ITemplate[]) => {
                        if (categoryInfo.length > 0) {
                            allArr = [...allArr, ...categoryInfo];
                        }
                    });
                    return {
                        ...pane,
                        content: (
                            <CategoryWrapper
                                categoryInfo={allArr.slice(0, 12)}
                            />
                        ),
                    };
                }

                return {
                    ...pane,
                    content: (
                        <AllWrapper
                            allInfo={filterInfo}
                            showCategoryName={showCategoryName}
                        />
                    ),
                };
            }
            if (categoryInfo) {
                let filterInfo = [...categoryInfo];
                if (keyword && isTemplateRoute) {
                    filterInfo = categoryInfo.filter(
                        (temp) =>
                            temp.title.indexOf(decodeURIComponent(keyword)) > -1
                    );
                }

                if (filterInfo.length === 0) {
                    return {
                        ...pane,
                        content: (
                            <Empty
                                loadStatus={getLoadStatus({
                                    data: [],
                                })}
                                height={window.innerHeight - 400}
                                emptyText={t(
                                    "notFountTemplate",
                                    "抱歉，没有找到相关模板"
                                )}
                            />
                        ),
                    };
                }
                if (location.pathname !== "/nav/template") {
                    filterInfo = filterInfo.slice(0, 12);
                }

                return {
                    ...pane,
                    content: <CategoryWrapper categoryInfo={filterInfo} />,
                };
            }
            return pane;
        });

    const handleTabsChange = (
        key: SubCategories,
        tabPanesInfo: ITabPane[],
        appsInfo: Record<string, ITemplate[]>
    ) => {
        const newParams = new URLSearchParams(params);
        newParams.set("type", key);
        setSearchParams(newParams);
        setActiveKey(key);

        switch (key) {
            case SubCategories.All:
                setTabPanes(
                    changeTabContent({
                        tabPanes: tabPanesInfo,
                        allInfo: appsInfo,
                    })
                );
                break;
            case SubCategories.Collaboration:
                setTabPanes(
                    changeTabContent({
                        tabPanes: tabPanesInfo,
                        categoryInfo: appsInfo[SubCategories.Collaboration],
                    })
                );
                break;
            case SubCategories.ContentExtraction:
                setTabPanes(
                    changeTabContent({
                        tabPanes: tabPanesInfo,
                        categoryInfo: appsInfo[SubCategories.ContentExtraction],
                    })
                );
                break;
            case SubCategories.DataSync:
                setTabPanes(
                    changeTabContent({
                        tabPanes: tabPanesInfo,
                        categoryInfo: appsInfo[SubCategories.DataSync],
                    })
                );
                break;
            case SubCategories.DataCollection:
                setTabPanes(
                    changeTabContent({
                        tabPanes: tabPanesInfo,
                        categoryInfo: appsInfo[SubCategories.DataCollection],
                    })
                );
                break;
            default:
                break;
        }
    };

    const handleSearch = useCallback(
        (params: URLSearchParams) => {
            setSearchParams(params);
            refreshRef.current();
        },
        [setSearchParams]
    );

    const setSearchParamsDebounced = useMemo(
        () => debounce(handleSearch, 500),
        [handleSearch]
    );

    useLayoutEffect(() => {
        let newTabPanes: ITabPane[] = [{ tab: SubCategories.All }];
        let allTemplates: Record<string, ITemplate[]> = {};

        let collaborationTemplates: ITemplate[] = [];
        let contentExtractionTemplates: ITemplate[] = [];
        let dataCollectionTemplates: ITemplate[] = [];
        let dataSyncTemplates: ITemplate[] = [];
        let messageReminderTemplates: ITemplate[] = [];

        const localTemplates: ITaskTemplate[] = JSON.parse(
            JSON.stringify(taskTemplates)
        );

        localTemplates.forEach((item) => {
            // 根据依赖项屏蔽
            if (item?.dependency) {
                let enable = true;
                for (const dependency of item?.dependency) {
                    if (!globalConfig?.[dependency]) {
                        enable = false;
                        break;
                    }
                }
                if (!enable) {
                    return;
                }
            }

            // 国际化转换
            item.template.title = t(item.template.title);
            item.template.description = item.template.description
                ? t(item.template.description)
                : "";
            if (item.type === SubCategories.Collaboration) {
                collaborationTemplates = [
                    ...collaborationTemplates,
                    item.template,
                ];
            }
            if (item.type === SubCategories.ContentExtraction) {
                contentExtractionTemplates = [
                    ...contentExtractionTemplates,
                    item.template,
                ];
            }
            if (item.type === SubCategories.DataCollection) {
                dataCollectionTemplates = [
                    ...dataCollectionTemplates,
                    item.template,
                ];
            }
            if (item.type === SubCategories.DataSync) {
                dataSyncTemplates = [...dataSyncTemplates, item.template];
            }
            if (item.type === SubCategories.MessageReminder) {
                messageReminderTemplates = [
                    ...messageReminderTemplates,
                    item.template,
                ];
            }
        });
        if (collaborationTemplates.length > 0) {
            newTabPanes = [
                ...newTabPanes,
                { tab: SubCategories.Collaboration },
            ];
            allTemplates = {
                ...allTemplates,
                [SubCategories.Collaboration]: collaborationTemplates,
            };
        }
        if (contentExtractionTemplates.length > 0) {
            newTabPanes = [
                ...newTabPanes,
                { tab: SubCategories.ContentExtraction },
            ];
            allTemplates = {
                ...allTemplates,
                [SubCategories.ContentExtraction]: contentExtractionTemplates,
            };
        }
        if (dataCollectionTemplates.length > 0) {
            newTabPanes = [
                ...newTabPanes,
                { tab: SubCategories.DataCollection },
            ];
            allTemplates = {
                ...allTemplates,
                [SubCategories.DataCollection]: dataCollectionTemplates,
            };
        }
        if (dataSyncTemplates.length > 0) {
            newTabPanes = [...newTabPanes, { tab: SubCategories.DataSync }];
            allTemplates = {
                ...allTemplates,
                [SubCategories.DataSync]: dataSyncTemplates,
            };
        }
        if (messageReminderTemplates.length > 0) {
            newTabPanes = [
                ...newTabPanes,
                { tab: SubCategories.MessageReminder },
            ];
            allTemplates = {
                ...allTemplates,
                [SubCategories.MessageReminder]: messageReminderTemplates,
            };
        }
        let defaultSubCategory =
            (params.get("type") as SubCategories) || SubCategories.All;
        const sortTemplates: Record<string, ITemplate[]> = {};
        Object.keys(allTemplates)
            .sort()
            .forEach((item) => {
                sortTemplates[item] = allTemplates[item];
            });
        setTemplates(sortTemplates);
        setTabPanes(newTabPanes);
        handleTabsChange(defaultSubCategory, newTabPanes, sortTemplates);
    }, [microWidgetProps?.language?.getLanguage, globalConfig]);

    return (
        <div
            className={clsx(
                styles["template-list"],
                {
                    [styles["max-1960"]]: width > 1960,
                },
                { [styles["template-page"]]: isTemplateRoute }
            )}
            ref={containerRef}
        >
            <Tabs
                className="automate-oem-tabs"
                activeKey={activeKey}
                onChange={(key) =>
                    handleTabsChange(key as SubCategories, tabPanes, templates)
                }
                getPopupContainer={(triggerNode) =>
                    triggerNode?.parentElement || document.body
                }
                tabBarExtraContent={
                    <div>
                        <Input
                            className={styles["searchInput"]}
                            placeholder={t("template.search", "搜索模板名称")}
                            prefix={
                                <SearchOutlined
                                    className={styles["search-icon"]}
                                />
                            }
                            defaultValue={keyword}
                            allowClear
                            onChange={(e) => {
                                const newParams = new URLSearchParams(params);
                                if (e.target.value) {
                                    newParams.set("keyword", e.target.value);
                                } else {
                                    newParams.delete("keyword");
                                }
                                if (!isTemplateRoute) {
                                    setSearchParams(newParams);
                                } else {
                                    setSearchParamsDebounced(newParams);
                                }
                            }}
                            onKeyUp={(e) => {
                                if (e.keyCode === 13 && !isTemplateRoute) {
                                    navigate(
                                        `/nav/template?keyword=${keyword}&type=${
                                            params.get("type") || "0"
                                        }`
                                    );
                                }
                            }}
                        />
                    </div>
                }
            >
                {tabPanes.map((tabPane, index) => (
                    <TabPane
                        tab={
                            <span
                                className={clsx(styles["tab-name"], {
                                    [styles["last-tab"]]:
                                        index === tabPanes.length - 1,
                                })}
                            >
                                {transformSubCategories(tabPane.tab, t)}
                            </span>
                        }
                        key={tabPane.tab}
                    >
                        <div
                            key={activeKey}
                            className={styles["tab-content-wrapper"]}
                        >
                            {tabPane.content}
                        </div>
                    </TabPane>
                ))}
            </Tabs>
        </div>
    );
};
