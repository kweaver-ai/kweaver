/**
 * 将 string 转为 unicode
 * @param code 十六进制编码
 * @returns unicode
 */
export const string2unicode = (code: string) => {
    const str = '{"unicode": "' + "\\u" + code + '"}';
    return JSON.parse(str).unicode;
};
