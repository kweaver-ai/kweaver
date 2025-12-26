import Cookie from 'js-cookie';
import { adCookie } from '@/utils/handleFunction';

const getValueBasedOnLanguage = (data: { [key: string]: any }, lang?: string) => {
  const language: any = lang || adCookie.get('anyDataLang') || 'zh-CN';
  return data[language];
};

export default getValueBasedOnLanguage;
