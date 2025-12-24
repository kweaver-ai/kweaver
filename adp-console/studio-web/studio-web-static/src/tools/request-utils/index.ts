import { CommonEnum } from "./common.type";
import { local } from "../../core/mediator";

/**
 * @function
 * @description: 序列化，目前只处理了数组
 * @param {any} params 请求参数
 * @return {string} 处理后的序列化字符串 例子：{name: 'why', ids: [1, 2, undefined, 3, null]} => name=why&ids=1&ids=2&ids=3&ids=null
 */
export const paramsSerializer = (params: any): string => {
    const newParams = {
        ...params,
        noUid: undefined,
        uid: params.noUid ? undefined : local.get("studio.userInfo")?.id,
    }; // 专为侧边栏配置，自动带上uid
    return Object.entries(newParams)
        .map(([key, value]) =>
            Array.isArray(value)
                ? value
                      .filter((v) => v !== undefined)
                      .map((v) => `${key}${CommonEnum.EQUAL}${v}`)
                      .join(CommonEnum.AND)
                : value !== undefined
                ? `${key}${CommonEnum.EQUAL}${value}`
                : null
        )
        .filter((v) => v)
        .join(CommonEnum.AND);
};
