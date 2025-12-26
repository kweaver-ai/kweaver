import Cookie from './cookie';
import copyToBoard from './copyToBoard';
import copyToBoardArea from './copyToBoardArea';
import formatFileSize from './formatFileSize';
import getTargetElement from './getTargetElement';

import isInObject from './isInObject';
import mergeObjectBasePath from './mergeObjectBasePath';
import { initMessage, message } from './message';
import SessionStorage from './sessionStorage';

interface UTILS {
  Cookie: typeof Cookie;
  copyToBoard: typeof copyToBoard;
  copyToBoardArea: typeof copyToBoardArea;
  formatFileSize: typeof formatFileSize;
  getTargetElement: typeof getTargetElement;
  isInObject: typeof isInObject;
  /** 通过路径更新对象 */
  mergeObjectBasePath: typeof mergeObjectBasePath;
  initMessage: typeof initMessage;
  /**
   * Antd的useMessage创建的实例
   * const [messageApi, messageContextHolder] = message.useMessage()
   * messageApi
   */
  message: typeof message;
  /** session storage封装 */
  SessionStorage: typeof SessionStorage;
}
const UTILS: UTILS = {
  Cookie,
  copyToBoard,
  copyToBoardArea,
  formatFileSize,
  getTargetElement,
  isInObject,
  mergeObjectBasePath,
  initMessage,
  message,
  SessionStorage,
};

export default UTILS;
