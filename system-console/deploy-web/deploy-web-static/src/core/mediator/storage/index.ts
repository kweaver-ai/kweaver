/**
 * WebStorage封装
 * 使用JSON进行数据的存取
 */

import { assign } from "lodash";

/**
 * WebStorage封装
 * @param storage 存储对象，支持localStorage和sessionStorage
 * @return 返回封装的存储接口
 */
export default function Storage(storage: Storage) {
    /**
     * 检测session是否存在
     * @param key
     * @return 返回是否存在key
     */
    function has(key: string): boolean {
        return key in storage;
    }

    /**
     * 获取session
     * @param key
     * @return 返回JSON解析后的值
     */
    function get(key: string) {
        const item = storage.getItem(key);

        if (!item) {
            return null;
        } else {
            return JSON.parse(item);
        }
    }

    /**
     * 移除session
     * @param key
     */
    function remove(key: string) {
        return storage.removeItem(key);
    }

    /**
     * 提取出session并从存储删除
     * @param key
     * @return 返回JSON解析后的值
     */
    function take(key: string) {
        let ret = get(key);

        remove(key);

        return ret;
    }

    /**
     * 设置session
     * @param key
     * @param value
     */
    function set(key: string, value: any) {
        if (value === undefined) {
            return remove(key);
        } else {
            return storage.setItem(key, JSON.stringify(value));
        }
    }

    /**
     * 更新数据
     * @param key
     * @param value
     */
    function update(key: string, value: Record<string, any> | Array<any>) {
        let oldVal = get(key);
        let newVal;

        if (!has(key)) {
            newVal = value;
        } else {
            if (oldVal.constructor !== value.constructor) {
                throw new Error("update() 数据类型不匹配");
            }

            switch (value.constructor) {
                case Array:
                    newVal = oldVal.concat(value);
                    break;

                case Object:
                    newVal = assign(oldVal, value);
                    break;

                default:
                    newVal = value;
                    break;
            }
        }

        set(key, newVal);

        return newVal;
    }

    /**
     * 清空session
     */
    function clear() {
        return storage.clear();
    }

    return {
        has,
        get,
        take,
        set,
        update,
        remove,
        clear,
    };
}
