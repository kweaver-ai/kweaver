import React from "react";
import { ITemplate } from "../../extensions/templates";
import { List } from "antd";
import { Empty, getLoadStatus } from "../table-empty";
import { useTranslate } from "@applet/common";
import { CategoryCard } from "./category-card";
import styles from "./styles/category-wrapper.module.less";

export interface ICategoryInfo {
    categoryInfo: ITemplate[];
}

export function CategoryWrapper({ categoryInfo }: ICategoryInfo) {
    const t = useTranslate();

    return (
        <div className={styles["category-wrapper"]}>
            <List
                grid={{
                    gutter: 24,
                    xs: 2,
                    sm: 2,
                    md: 2,
                    lg: 3,
                    xl: 3,
                    xxl: 4,
                }}
                dataSource={categoryInfo}
                locale={{
                    emptyText: (
                        <Empty
                            loadStatus={getLoadStatus({
                                data: [],
                            })}
                            height={300}
                            emptyText={t(
                                "notFountTemplate",
                                "抱歉，没有找到相关模板"
                            )}
                        />
                    ),
                }}
                renderItem={(item) => (
                    <List.Item>
                        <CategoryCard template={item}></CategoryCard>
                    </List.Item>
                )}
            />
        </div>
    );
}
