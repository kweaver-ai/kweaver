import clsx from "clsx";
import { useTranslate } from "@applet/common";
import empty from "../../assets/empty.png";
import searchEmpty from "../../assets/empty-search.png";
import error from "../../assets/error-load.png";
import OfflineTip from "./offline-tip";
import styles from "./table-empty.module.less";

export enum LoadStatus {
    Loading = "loading",
    Error = "error",
    Empty = "empty",
    SearchEmpty = "searchEmpty",
    FilterEmpty = "filterEmpty",
    Loaded = "loaded",
}
interface IEmptyProps {
    height: number;
    loadStatus: LoadStatus;
    emptyText?: string;
}

interface IGetLoadStatus {
    isLoading?: boolean;
    error?: object;
    data?: object[];
    keyword?: string;
    filter?: string[];
}

export const getLoadStatus = ({
    isLoading,
    error,
    data,
    keyword,
    filter,
}: IGetLoadStatus) => {
    switch (true) {
        case isLoading:
            return LoadStatus.Loading;
        case Boolean(error):
            return LoadStatus.Error;
        case Boolean(!data?.length && keyword):
            return LoadStatus.SearchEmpty;
        case Boolean(!data?.length && filter?.length && filter?.length > 0):
            return LoadStatus.FilterEmpty;
        case !data?.length:
            return LoadStatus.Empty;
        default:
            return LoadStatus.Loaded;
    }
};

export const Empty = ({ height, loadStatus, emptyText }: IEmptyProps) => {
    const t = useTranslate();
    const getEmptyRender = (status: LoadStatus) => {
        let content;
        switch (status) {
            case LoadStatus.Empty:
                content = {
                    img: empty,
                    message: emptyText || t("empty", "列表为空"),
                };
                break;
            case LoadStatus.SearchEmpty:
                content = {
                    img: searchEmpty,
                    message: t("search.empty", "抱歉，没有找到相关内容"),
                };
                break;
            case LoadStatus.FilterEmpty:
                content = {
                    img: empty,
                    message: t("filter.empty", "抱歉，没有与筛选匹配的结果"),
                };
                break;
            case LoadStatus.Error:
                content = {
                    img: error,
                    message: t("err.loadFail", "抱歉，无法完成加载"),
                };
                break;
            default:
                content = null;
        }
        return navigator.onLine ? (
            <div
                className={clsx(styles["empty-container"], {
                    [styles["invisible"]]: !content,
                })}
            >
                <div className={styles["img-wrapper"]}>
                    <img
                        className={styles["img"]}
                        src={content?.img}
                        alt="empty"
                    />
                </div>
                <span className={styles["tip"]}>{content?.message}</span>
            </div>
        ) : (
            <OfflineTip />
        );
    };

    return (
        <div style={{ padding: `${height / 2}px 0` }}>
            {getEmptyRender(loadStatus)}
        </div>
    );
};
