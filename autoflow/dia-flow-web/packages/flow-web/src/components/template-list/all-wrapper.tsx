import React from "react";
import { map } from "lodash";
import { CategoryWrapper } from "./category-wrapper";
import { transformSubCategories } from "./template-list";
import { ITemplate, SubCategories } from "../../extensions/templates";
import { useTranslate } from "@applet/common";
import styles from "./styles/all-wrapper.module.less";
import clsx from "clsx";

interface IClassifiedWrapper {
    allInfo: Record<string, ITemplate[]>;
    showCategoryName: boolean;
}

export function AllWrapper({ allInfo, showCategoryName }: IClassifiedWrapper) {
    const t = useTranslate();

    return (
        <div className={styles["all-wrapper-container"]}>
            {map(allInfo, (categoryInfo: ITemplate[], type: string) =>
                categoryInfo.length > 0 ? (
                    <div
                        className={styles["all-page-category-wrapper"]}
                        key={type}
                    >
                        {showCategoryName && (
                            <div
                                className={clsx(
                                    styles["all-page-category-title"],
                                    { [styles["not-first-tab"]]: type !== "1" }
                                )}
                            >
                                {transformSubCategories(
                                    type as SubCategories,
                                    t
                                )}
                            </div>
                        )}
                        <CategoryWrapper categoryInfo={categoryInfo} />
                    </div>
                ) : null
            )}
        </div>
    );
}
