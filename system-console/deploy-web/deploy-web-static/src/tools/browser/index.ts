/**
 * 加载新文档-可以回退
 * @param url 路径
 */
export const assignTo = (url: string): void => {
    window.location.assign(url);
};

/**
 * 加载新文档-无法回退
 * @param url 路径
 */
export const replaceTo = (url: string): void => {
    window.location.replace(url);
};

/**
 * 刷新文档
 * @param url 路径
 */
export const refresh = (): void => {
    window.location.reload();
};
