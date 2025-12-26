import _ from 'lodash';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';

/**
 * 校验填入格式是否正确，返回错误信息
 * @param value 需要校验的值
 * @param typeArr 校验的类型 required-必填|max-最大值|normal-中英文、数字下划线
 * @param maxLength 最大长度-自定义
 */
export const onCheckInputFormat = (value: any, typeArr: any, maxLength = 50) => {
  if (_.includes(typeArr, 'required') && !value) {
    return intl.get('global.noNull');
  }
  if (_.includes(typeArr, 'max') && value?.length > maxLength) {
    return intl.get('global.lenErr', { len: maxLength });
  }
  if (_.includes(typeArr, 'normal') && !value?.match(ONLY_KEYBOARD)) {
    return intl.get('global.onlyKeyboard');
  }
  return '';
};
