/** 判断是否是对象的属性 */
const isInObject = (object: any, key: string) => (Object as any).hasOwn(object, key);

export default isInObject;
