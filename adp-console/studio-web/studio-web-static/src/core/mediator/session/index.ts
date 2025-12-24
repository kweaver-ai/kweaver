import { toPairs } from "lodash";
import Storage from "../storage";

/**
 * sessionStorage的扩展
 * 数据通过JSON.stringify()，以字符串形式保存到sessionStorage中，以JSON.parse()形式还原
 * 注意！sessionStorage保存引用类型的值时，会切断与原值的引用关系！因此，因此get()返回的引用类型数据不会再等于set()的值
 */

// 用来防止打开新窗口，session丢失
const sessionStorage = window.sessionStorage;
const opener = window.opener;

if (opener) {
    // 跨源时无权限获取opener的sessionStorage
    try {
        if (!sessionStorage.getItem("__inherited")) {
            for (const [key, value] of toPairs(opener.sessionStorage)) {
                sessionStorage.setItem(key, value as string);
            }

            sessionStorage.setItem("__inherited", "1");
        }
    } catch (ex) {}
}

export default Storage(sessionStorage);
