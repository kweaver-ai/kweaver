/** 中英文数字及键盘上的特殊字符 */
const ONLY_KEYBOARD = /^[\s\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—·]+$/;
/** 排除#\ /：*？"＜＞|的特殊字符 */
const EXCLUDE_CHARACTERS = /^[^#\\/:*?"<>|]+$/;
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
/** 包含小写英文字母、数字、下划线（_）、连字符（-），且不能以下划线和连字符开头  */
const LOWER_NUMBER = /^[a-z0-9][a-z0-9_-]*$/;

/** 不能包含下列字符#\ /：*？"＜＞|，且长度不能超过255个字符 */
const EXCLUDING_TYPE_AND_NOT_EXCEED_255 = /^[^#\\/:*?"<>|]{1,255}$/;

/** 正整数 */
const POS_INT = /\b[1-9]\d*\b/;

const REGEXP = {
  ONLY_KEYBOARD,
  EXCLUDE_CHARACTERS,
  ONLY_NORMAL_NAME,
  ONLY_NORMAL_NAME_NOT_CHINA,
  START_WITH_NUMBER,
  ONLY_NORMAL_SPACE_NAME,
  VAR_NAME_REG,
  LOWER_NUMBER,
  EXCLUDING_TYPE_AND_NOT_EXCEED_255,
  POS_INT,
};

export default REGEXP;
