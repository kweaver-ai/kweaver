import { isArray, range } from 'lodash';

type StubList = {
    moduleObj: Object; // import * as 方式导出的模块对象
    moduleProp: string | Array<string>; // module下的属性名或属性名数组
};
/**
 * 在沙箱环境下stub外部模块导出的方法或属性
 * @export
 * @param {sinon.SinonSandbox} sandbox sinon.createSandbox()生成的SinonSandbox实例
 * @param {Array<StubList>} StubList stub的模块对象数组
 * @example sandboxStub(sandbox,[{moduleObj:doc,moduleProp:'get'}]) stub doc模块导出的get方法
 * @example sandboxStub(sandbox,[{moduleObj:doc,moduleProp:['get','set']}]) stub doc模块导出的get和set方法
 */
export function sandboxStub(
    sandbox: sinon.SinonSandbox,
    StubList: Array<StubList>
) {
    StubList.forEach(({ moduleObj, moduleProp }) => {
        if (!isArray(moduleProp)) {
            moduleObj[moduleProp] && sandbox.stub(moduleObj, moduleProp);
        } else {
            moduleProp.forEach(modulePropItem => {
                moduleObj[modulePropItem] &&
                    sandbox.stub(moduleObj, modulePropItem);
            });
        }
    });
}

// 生成0-9的数字
export const generateNumber = () => Math.floor(Math.random() * 9 + 1);

// 生成A-F的大写字母
export const generateLetter = () =>
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(Math.random() * 6)];

/* 生成32位类GNS码如：E3C9E8C5B9C6C7D4F8E7D9E5E7F6A8E1 */
export const generateGNS = () =>
    range(32)
        .map(item => (item % 2 ? generateNumber() : generateLetter()))
        .join('');

/* 随机生成路径深度为1-10的docid：如gns://E8D6E4F1D5A3F3D1D8E1A3E1B8A2E8B8/C2D1C2E6F7A4D1A7C3B4C1E6E3D1D7F3 */
export const generateDocid = () =>
    `gns://${range(generateNumber() + 1)
        .map(generateGNS)
        .join('/')}`;
