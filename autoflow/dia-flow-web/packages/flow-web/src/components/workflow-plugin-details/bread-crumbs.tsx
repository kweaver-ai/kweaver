import { Button, Dropdown, Menu } from "antd";
import { measureText } from "./measureText";
import styles from "./styles/bread-crumbs.module.less";
import { FolderColored } from "@applet/icons";
import { Fragment, useRef } from "react";
import { DoubleLeftOutlined, RightOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import useSize from "@react-hook/size";
import { DocItem } from "./batchFile-details";

export interface ICrumbItem {
    name: string;
    docid: string;
}

interface BreadCrumbsProps {
    value: ICrumbItem[];
    onChange: (item: DocItem) => void;
}

export function splitBreadcrumbs({
    crumbs,
    width,
    initial = 0,
    extra = 16,
    font = "13px 'Microsoft YaHei'",
}: {
    crumbs: ICrumbItem[];
    width: number;
    initial?: number;
    extra?: number;
    font?: string;
}): [any[], any[]] {
    const maxWidth = width - initial;
    let totalWidth = 0;

    for (let i = crumbs.length - 1; i >= 0; i -= 1) {
        let crumbWidth = measureText(crumbs[i].name, font);
        if (crumbWidth > maxWidth) {
            crumbWidth = maxWidth;
        }
        totalWidth = totalWidth + crumbWidth + extra;

        if (totalWidth > maxWidth) {
            if (i === crumbs.length - 1) {
                return [crumbs.slice(0, i), [crumbs[i]]];
            }
            return [crumbs.slice(0, i + 1), crumbs.slice(i + 1)];
        }
    }

    return [[], crumbs];
}

export const BreadCrumbs = ({ value, onChange }: BreadCrumbsProps) => {
    const crumbsRef = useRef<HTMLDivElement>(null);
    const [crumbsWidth] = useSize(crumbsRef);

    const [ellipsisArr, crumbsArr] = splitBreadcrumbs({
        crumbs: value,
        width: crumbsWidth,
        initial: 16,
        extra: 28,
        font: "13px 'Microsoft YaHei'",
    });

    const ellipsisList = () => (
        <Menu className={styles["breadcrumbs-ellipsis-list"]}>
            {[...ellipsisArr].reverse().map((item) => (
                <Menu.Item
                    onClick={() => onChange(item)}
                    key={item.path}
                    title={item.name}
                >
                    <FolderColored className={styles["menu-icon"]} />
                    <div className={styles["ellipsis-item-name"]}>
                        {item.name}
                    </div>
                </Menu.Item>
            ))}
        </Menu>
    );

    return (
        <div className={styles["breadcrumbs-wrapper"]} ref={crumbsRef}>
            {ellipsisArr.length > 0 && (
                <Dropdown
                    overlay={ellipsisList}
                    trigger={["click"]}
                    transitionName=""
                    getPopupContainer={() => crumbsRef.current || document.body}
                >
                    <Button
                        type="link"
                        key="ellipsis"
                        size="small"
                        className={styles["drop-btn"]}
                    >
                        <DoubleLeftOutlined />
                    </Button>
                </Dropdown>
            )}
            {value.length > 1 &&
                crumbsArr.map((item, index) =>
                    index < crumbsArr.length - 1 ? (
                        <Fragment key={item.docid}>
                            <Button
                                type="link"
                                key={item.docid}
                                className={styles["breadcrumbs-btn"]}
                                size="small"
                                title={item.name}
                                onClick={debounce(() => onChange(item))}
                            >
                                <span className={styles["breadcrumbs-title"]}>
                                    {item.name}
                                </span>
                            </Button>
                            <span
                                key="arrow"
                                className={styles["breadcrumbs-arrow"]}
                            >
                                <RightOutlined />
                            </span>
                        </Fragment>
                    ) : (
                        <Fragment key={item.docid}>
                            <FolderColored className={styles["folder-icon"]} />
                            <span
                                className={styles["breadcrumbs-current"]}
                                title={item.name}
                            >
                                {item.name}
                            </span>
                        </Fragment>
                    )
                )}
        </div>
    );
};
