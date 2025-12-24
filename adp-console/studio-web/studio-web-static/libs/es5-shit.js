(function () {
    // es5-shim在IE10-实现了不完全的Object.setPrototypeOf，会导致tslib编译对象时无法从父类继承子类的静态属性，从而导致static defaultProps无法被子类继承。
    Object.setPrototypeOf &&
        Object.setPrototypeOf.toString().indexOf('[native code]') === -1 &&
        (delete Object.setPrototypeOf)

    // 修复 XP IE8 下不打开调试工具console.log报错
    if (typeof console === 'undefined') {
        window.console = {
            log: () => void (0),
            info: () => void (0),
            warn: () => void (0),
            error: () => void (0),
        }
    }
})()