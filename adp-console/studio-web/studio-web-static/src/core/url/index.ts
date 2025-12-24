/**
 * 模式
 */
export const URL_PREFIX_MODE = {
    // 去除头部的分隔符
    head: "head",
    // 去除尾部的分隔符
    tail: "tail",
    // 去除两端的分隔符
    edge: "edge",
};

/**
 * 对url前缀进行格式化
 * @param prefix url前缀
 * @returns /a/b => /a/b/
 */
export const URLPrefixFormatter = (
    prefix: string | undefined,
    mode?: string
) => {
    if (!prefix || prefix === "/") {
        return "";
    } else {
        const list = prefix.split("/");
        const paths = list.filter((p) => p);
        if (mode === URL_PREFIX_MODE.edge) {
            return `${paths.join("/")}`;
        } else if (mode === URL_PREFIX_MODE.head) {
            return `${paths.join("/")}/`;
        } else if (mode === URL_PREFIX_MODE.tail) {
            return `/${paths.join("/")}`;
        } else {
            return `/${paths.join("/")}/`;
        }
    }
};
