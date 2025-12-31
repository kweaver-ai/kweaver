import Cookie from './common/cookie';
import getTargetElement from './common/getTargetElement';
import SessionStorage from './common/sessionStorage';
import { formatType, formatIconByType } from './fields/formatType';

interface UTILS {
  Cookie: typeof Cookie;
  formatType: typeof formatType;
  formatIconByType: typeof formatIconByType;
  getTargetElement: typeof getTargetElement;
  /** session storage封装 */
  SessionStorage: typeof SessionStorage;
}

const UTILS: UTILS = {
  Cookie,
  formatType,
  formatIconByType,
  getTargetElement,
  SessionStorage,
};

export default UTILS;
