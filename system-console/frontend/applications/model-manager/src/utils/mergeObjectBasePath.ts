import _ from 'lodash';
import isInObject from './isInObject';

/** 通过路径更新对象 */
const mergeObjectBasePath = (object: any, path: string[], data: any) => {
  let temp = object;
  const length = path.length - 1;

  _.forEach(path, (key, index) => {
    if (!isInObject(temp, key)) return;

    if (index !== length) {
      temp = temp[key];
    } else {
      temp[key] = data;
    }
  });
};

export default mergeObjectBasePath;
