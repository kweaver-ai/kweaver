/** 判断是否是对象的属性 */
const isInObject = (object: any, key: string) => Object.prototype.hasOwnProperty.call(object, key);

export default isInObject;
