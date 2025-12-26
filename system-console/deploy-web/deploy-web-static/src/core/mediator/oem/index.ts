/**
 * 多种语言状态属性当前展示
 * data 数据
 * language 当前语言
 */
export const getDisplay = (
    data: { [key: string]: string },
    language: string
) => {
    switch (true) {
        case Boolean(data[language]):
            return data[language];
        case Boolean(data["zh-cn"]):
            return data["zh-cn"];
        default:
            return Object.values(data).filter((item) => item)[0];
    }
};
