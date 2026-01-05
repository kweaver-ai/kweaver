import blueimpMD5 from "blueimp-md5";

/**
 * 计算字符串md5
 * @param input 输入值
 */
export const md5 = (input: string): string => {
    return blueimpMD5(input);
};
