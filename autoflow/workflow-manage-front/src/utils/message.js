import { MessageBox } from 'element-ui'
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
  showCancelButton
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
    customClass: 'dialog_confirm',
    showClose: false,
    modal: false,
    showCancelButton: showCancelButton,
    type: 'warning'
  })
}
