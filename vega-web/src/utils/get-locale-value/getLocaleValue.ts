import UTILS from '@/utils';

const getLocaleValue = (chinese: any, englinsh: any, key: any, value: any = {}): any => {
  const lang = UTILS.SessionStorage.get('language') || 'zh-cn';

  const locale = lang === 'zh-cn' ? chinese : englinsh;

  let content = locale[key] || key;

  if (!/\{[^]+\}+/.test(content)) {
    return content;
  }

  const chart = ['{', '}'];
  const arr: any = [];

  while (/\{[^]+\}+/.test(content)) {
    const start = content.indexOf(chart[0]);

    arr.push(content.slice(0, start));
    const end = content.indexOf(chart[1]);

    arr.push(value[content.slice(start + 1, end)]);

    content = content.slice(end + 1);
  }

  arr.push(content);

  return arr.map((value: any) => value);
};

export default getLocaleValue;
