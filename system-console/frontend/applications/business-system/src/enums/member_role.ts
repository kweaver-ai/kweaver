import intl from 'react-intl-universal';

import UTILS from '@/utils';
import locales from '@/locales';

// 初始化语言
const language = UTILS.SessionStorage.get('language') || 'zh-cn';
intl.init({ currentLocale: language, locales });

const ADMINISTRATOR = 'administrator';
const DEVELOPER = 'developer';
const VIEWER = 'viewer';

const MEMBER_ROLE_OBJECT = {
  [ADMINISTRATOR]: intl.get('enums.administrator'),
  [DEVELOPER]: intl.get('enums.developer'),
  [VIEWER]: intl.get('enums.visitor'),
};

const MEMBER_ROLE_LIST = [
  { value: ADMINISTRATOR, label: MEMBER_ROLE_OBJECT[ADMINISTRATOR] },
  { value: DEVELOPER, label: MEMBER_ROLE_OBJECT[DEVELOPER] },
  { value: VIEWER, label: MEMBER_ROLE_OBJECT[VIEWER] },
];

const MEMBER_ROLE = { ADMINISTRATOR, DEVELOPER, VIEWER, MEMBER_ROLE_OBJECT, MEMBER_ROLE_LIST };

export default MEMBER_ROLE;
