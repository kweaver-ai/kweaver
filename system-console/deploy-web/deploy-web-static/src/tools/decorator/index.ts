/**
 * url 装饰器
 * @param url 原始 url
 * @returns 带有 deployweb 的 url
 */
export function urlDecorator(url: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        const urls: Array<string> = url.split("/");
        urls.splice(2, 0, "deployweb");
        return class extends constructor {
            url: string = urls.join("/").toString();
        };
    };
}
