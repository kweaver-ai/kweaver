import Storage from "../storage";

/**
 * localStorage的扩展
 * 数据通过JSON.stringify()，以字符串形式保存到localStorage中，以JSON.parse()形式还原
 * 注意！localStorage保存引用类型的值时，会切断与原值的引用关系！因此，因此get()返回的引用类型数据不会再等于set()的值
 */

export default Storage(window.localStorage);
