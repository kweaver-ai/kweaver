import MessageBox from '@/components/message-box'
import Message from '@/components/message'
import Vue from 'vue'
let vm = new Vue()

/**
 * 确认框
 * @param {*} title 标题
 * @param {*} msg 消息
 * @param {*} confirmButtonText 确认文本按钮
 * @param {*} cancelButtonText 取消文本按钮
 * @returns
 */
export function dialog_confirm (title, msg, confirmButtonText, cancelButtonText, showCancelButton) {
  const newDatas = []
  const h = vm.$createElement
  newDatas.push(h('P', { class: 'title' }, title))
  newDatas.push(h('p', { class: 'text' }, msg))
  return MessageBox.confirm(title, {
    message: h('div', null, newDatas),
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    iconClass: 'el-icon-warning-outline',
    cancelButtonClass: 'btn-custom-cancel',
    showClose: false,
    modal: false,
    showCancelButton: showCancelButton,
    type: 'warning'
  })
}

/**
 * 提示弹出框
 * @param {*} title 标题
 * @param {*} msg 消息
 * @param {*} confirmButtonText 确认文本按钮
 * @returns
 */
export function dialog_alert (title, msg, confirmButtonText, callback) {
  const newDatas = []
  const h = vm.$createElement
  if (title !== '') {
    newDatas.push(h('P', { class: 'title' }, title))
  }
  newDatas.push(h('p', { class: 'text' }, msg))
  return MessageBox.alert(title, {
    message: h('div', null, newDatas),
    confirmButtonText: confirmButtonText,
    iconClass: 'el-icon-warning-outline',
    cancelButtonClass: 'btn-custom-cancel',
    showClose: false,
    modal: false,
    callback: callback
  })
}

/**
 * 提示弹出框
 * @param {*} title 标题
 * @param {*} msg 消息
 * @param {*} confirmButtonText 确认文本按钮
 * @returns
 */
export function dialog_error (title, msg, confirmButtonText, callback) {
  const newDatas = []
  const h = vm.$createElement
  if (title !== '') {
    newDatas.push(h('P', { class: 'title' }, title))
  }
  newDatas.push(h('p', { class: 'text' }, msg))
  return MessageBox.alert(title, {
    message: h('div', null, newDatas),
    confirmButtonText: confirmButtonText,
    iconClass: 'el-icon-circle-close',
    cancelButtonClass: 'btn-custom-cancel',
    showClose: false,
    modal: false,
    callback: callback
  })
}

/**
 * toast提示
 * @param {*} type 类型
 * @param {*} msg 消息
 * @returns
 */
export function toast (type, msg) {
  return Message({ message: msg, type: type, duration: 3000 })
}

/**
 * 确认框(用户不存在专用)
 * @param {*} title 标题
 * @param {*} msg 消息
 * @param {*} confirmButtonText 确认文本按钮
 * @param {*} cancelButtonText 取消文本按钮
 * @returns
 */
export function dialog_confirm_user_not_exist (title, msg, confirmButtonText, cancelButtonText, showCancelButton,type = 'user') {
  const h = vm.$createElement
  return MessageBox.confirm(title, {
    message: h('div', null, [
      h('p', { style: 'font-weight:bolder' }, this.$i18n.tc('field.tip')),
      h('p', { style: 'word-break:break-all;' }, this.$i18n.tc(`sync.userHasTip1${type}`) + msg + this.$i18n.tc('sync.userHasTip2'))
    ]),
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    iconClass: 'el-icon-warning-outline',
    cancelButtonClass: 'btn-custom-cancel',
    showClose: false,
    modal: false,
    showCancelButton: showCancelButton,
    type: 'warning'
  })
}
