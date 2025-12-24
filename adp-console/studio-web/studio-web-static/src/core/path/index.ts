import cookie from "js-cookie";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import { session } from "../mediator";

export enum PageTag {
    // 首页(超级助手)
    Home = "home",
}

const prefix = "studio";
// 增加前缀
let customPrefix =
    cookie.get("X-Forwarded-Prefix") || session.get("X-Forwarded-Prefix") || "";
customPrefix = URLPrefixFormatter(customPrefix, URL_PREFIX_MODE.tail);

/**
 * 格式化路径
 * @param str
 * @returns
 */
export function space2connector(str: string) {
    // 1. 清理特殊字符 2. 空格替换为连接符 3. 转小写
    return str.replace(/&/, "").replace(/\s+/g, "-").toLowerCase();
}

export let defaultPathList = [`/${prefix}`, `/${prefix}/`];

export const getPathnameByTag = (tag: string) => {
    return `${customPrefix}/${prefix}/${space2connector(tag)}`;
};

export const homePathname = `${customPrefix}/${prefix}/${space2connector(
    PageTag.Home
)}`;

export const homePathList = [homePathname];

export const setupDefaultPath = function (cb: (path: string) => any) {
    defaultPathList = defaultPathList.map(cb);
};
