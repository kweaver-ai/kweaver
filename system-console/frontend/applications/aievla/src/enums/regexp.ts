/** 中英文数字及键盘上的特殊字符 */
const ONLY_KEYBOARD = /^[\s\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—·]+$/;
/** 排除\ /：*？"＜＞|的特殊字符 */
const EXCLUDE_CHARACTERS = /^[^\\\/:*?"<>|]+$/;
/** 中英文数字及下划线 */
const ONLY_NORMAL_NAME = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/g;
/** 英文数字及下划线 */
const ONLY_NORMAL_NAME_NOT_CHINA = /^[a-zA-Z0-9_]+$/g;
/** 是否数字开头 */
const START_WITH_NUMBER = /^[0-9]/;
/** 中英文数字及下划线空格 */
const ONLY_NORMAL_SPACE_NAME = /^[\u4e00-\u9fa5a-zA-Z0-9_ ]+$/g;
/** 变量命名规则 */
const VAR_NAME_REG = /^[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$/;

/** 正整数 */
const POS_INT = /\b[1-9]\d*\b/;

export { ONLY_KEYBOARD, ONLY_NORMAL_NAME, EXCLUDE_CHARACTERS, POS_INT, START_WITH_NUMBER, ONLY_NORMAL_SPACE_NAME, ONLY_NORMAL_NAME_NOT_CHINA, VAR_NAME_REG };
