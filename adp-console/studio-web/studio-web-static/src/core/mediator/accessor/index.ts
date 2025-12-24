import { merge } from "lodash";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * 对象访问
 * @param obj 要访问的对象
 * @param ...args 传递单个参数key返回obj[key]的值
 * @param ...args 传递[key, value] 设置obj并返回obj
 * @param ...args 传递对象设置obj并返回obj
 * @return any 传递单个参数返回对应的值，传递两个参数或对象返回设置的对象
 */
export function access(obj: Record<string, any>, ...args: Array<any>): any {
    if (args.length === 1) {
        const arg = args[0];

        if (typeof arg === "string") {
            return obj[arg];
        } else if (typeof arg === "object") {
            return merge(obj, arg);
        }
    } else if (args.length === 2) {
        const [key, value] = args;
        obj[key] = value;
        return obj;
    }
}
