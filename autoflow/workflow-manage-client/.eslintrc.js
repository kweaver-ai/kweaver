module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  // 'parser': 'vue-eslint-parser',
  // add your custom rules here
  //it is base on https://github.com/vuejs/eslint-config-vue
  rules: {
    'indent': ['error', 2,],// 强制使用一致的缩进
    'linebreak-style': ['error', 'unix',],// 强制使用一致的换行风格
    'quotes': ['error', 'single',],// 强制使用一致的单引号
    'semi': ['error', 'never',],// 强制末尾不要分号
    'comma-dangle': ['error', 'never',],// 禁止末尾逗号
    'no-cond-assign': ['error', 'always',],// 禁止条件表达式中出现赋值操作符
    'no-console': ['error', { allow: ['warn', 'error',], },],// 只允许使用的console 对象的warn和error方法

    'for-direction': 'error',// 强制 “for” 循环中更新子句的计数器朝着正确的方向移动
    'no-debugger': 'error',// 禁用 debugger
    'no-dupe-args': 'error',// 禁止 function 定义中出现重名参数
    'no-dupe-keys': 'error',// 禁止在对象字面量中出现重复的键
    'no-duplicate-case': 'error',// 禁止在 switch 语句中的 case 子句中出现重复的测试表达式
    'no-empty': 'error',// 禁止空语句块出现
    'no-func-assign': 'error',// 禁止对 function 声明重新赋值
    'no-obj-calls': 'error',// 禁止把全局对象作为函数调用
    'no-prototype-builtins': 'error',// 禁止直接调用 Object.prototypes 的内置属性
    'no-unreachable': 'error',// 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
    'use-isnan': 'error',// 要求使用 isNaN() 检查 NaN
    'accessor-pairs': 'error',// 强制 getter 和 setter 在对象中成对出现
    'consistent-return': 'error',// 要求 return 语句要么总是指定返回的值，要么不指定
    'eqeqeq': 'error',// 要求使用 === 和 !==
    'space-infix-ops':'error',// 要求操作符周围有空格
    'spaced-comment':['error', 'always',],// 强制在注释中 // 或 /* 使用一致的空格
    'linebreak-style':0,
    // 这些规则只与 ES6 有关
    'no-const-assign':'error',// 禁止修改 const 声明的变量
    'no-var':'error',// 阻止 var 的使用，推荐使用 const 或 let
  }
}
