import intl from 'react-intl-universal';
import type { MenuProps } from 'antd';

import UTILS from '@/utils';
import locales from '@/locales';

// 初始化语言
const language = UTILS.SessionStorage.get('language') || 'zh-cn';
intl.init({ currentLocale: language, locales });

export const MENU_SORT_ITEMS: MenuProps['items'] = [
  { key: 'model_name', label: intl.get('ModelManagement.sortByModelName') },
  { key: 'create_time', label: intl.get('ModelManagement.sortByCreation') },
];

export const MODAL_TITLE = {
  create: intl.get('ModelManagement.modal.name_accessModel'),
  edit: intl.get('ModelManagement.modal.name_edit'),
  view: intl.get('ModelManagement.modal.name_view'),
};

export const MODEL_TYPE_OPTIONS = [
  { value: 'embedding', label: 'embedding' },
  { value: 'reranker', label: 'reranker' },
];

export const AUTH_OPTIONS = [
  { value: 'empty', label: intl.get('global.empty') },
  { value: 'auth', label: 'API Key' },
];
