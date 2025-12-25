import Vue from 'vue'
const TitleDirective = {}
export default TitleDirective.install = function (vue, options) {
  Vue.directive('title',{
    bind: function (el, binding) {
      const explorer = window.navigator.userAgent
      let len = 50
      if(explorer.indexOf('MSIE') >= 0 || explorer.indexOf('Firefox') >= 0) {
        len = 35
      }
      // 监听元素
      let title = el.getAttribute('title')
      el.mouseOverHandler = function () {
        title = el.getAttribute('title')
        el.setAttribute('title', subStr (title, len))
      }
      el.mouseOutHandler = function () {
        el.setAttribute('title', title)
      }
      el.addEventListener('mouseover', el.mouseOverHandler)
      el.addEventListener('mouseout', el.mouseOutHandler)
    },
    unbind: function (el) {
      el.removeEventListener('mouseover', el.mouseOverHandler)
      el.removeEventListener('mouseout', el.mouseOutHandler)
    }
  })
}

function subStr (str, len){
  // 设置变量存储返回值
  let newstr = ''
  // 如果长度超过30，就要截取插入字符
  if(str_length(str) > len) {
    // 第一次截取
    newstr = cutstr(str, len) + '\n'
    // 闭包再次调用，如果截取后的字段长度依然超过30，再次调用，如果没有直接返回当前值
    return newstr + subStr(str.slice(cutstr(str, len).length), len)
  } else {
    // 直接返回当前值
    return str
  }
}
function str_length (str) {
  let m = 0
  let a = str.split('')
  for (let i = 0; i < a.length; i++) {
    if (a[i].charCodeAt(0) < 299) {
      m++
    } else {
      m += 2
    }
  }
  return m
}

// eslint-disable-next-line consistent-return
function cutstr(str,len) {
  let str_length = 0
  let str_cut = new String()
  let str_len = str.length
  for(let i = 0; i < str_len; i++) {
    a = str.charAt(i)
    str_length++
    if(escape(a).length > 4) {
      // 中文字符的长度经编码之后大于4
      str_length++
    }
    str_cut = str_cut.concat(a)
    if(str_length >= len) {
      return str_cut
    }
  }
  // 如果给定字符串小于指定长度，则返回源字符串；
  if(str_length < len){
    return  str
  }
}
