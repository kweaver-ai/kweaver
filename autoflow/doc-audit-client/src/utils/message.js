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
export function dialog_confirm(
  title,
  msg,
  confirmButtonText,
  cancelButtonText,
  showModal = false
) {
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
    modal: showModal,
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
export function dialog_alert(title, msg, confirmButtonText, callback) {
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
export function dialog_error(title, msg, confirmButtonText, callback) {
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
    callback: callback
  })
}

/**
 * toast提示
 * @param {*} type 类型
 * @param {*} msg 消息
 * @returns
 */
let messageInstance = null
export function toast(type, msg, closePreviousToast = true, microWidgetProps) {
  if (microWidgetProps && microWidgetProps.components) {
    switch (type) {
    case 'info':
      microWidgetProps.components.toast.info(msg)
      break
    case 'success':
      microWidgetProps.components.toast.success(msg)
      break
    case 'warning':
      microWidgetProps.components.toast.warning(msg)
      break
    case 'error':
      microWidgetProps.components.toast.error(msg)
      break
    default:
      microWidgetProps.components.toast.info(msg)
    }
  } else {
    if (messageInstance && closePreviousToast) {
      messageInstance.close()
    }
    messageInstance = Message({ message: msg, type: type, duration: 3000 })
  }
}
