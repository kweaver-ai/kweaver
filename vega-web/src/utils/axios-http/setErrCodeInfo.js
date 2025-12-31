import UTILS from '@/utils';
import enErrCode from './locale/en-US';
import zhErrCode from './locale/zh-CN';

const errCodeList = {
  'en-us': enErrCode,
  'zh-cn': zhErrCode,
};

/**
 * 设置错误码界面显示
 * @param {string} code 错误码
 */
const setErrCodeInfo = (code, message = '') => {
  const curLang = UTILS.SessionStorage.get('language') || 'zh-cn'; // 获取语言环境
  const otherMessage = message || errCodeList[curLang]['0'];
  // 错误码对应中文提示, 没有集成错误码，统一提示服务异常 0
  const errInfo = errCodeList[curLang][code] || otherMessage;

  return errInfo;
};

export default setErrCodeInfo;
