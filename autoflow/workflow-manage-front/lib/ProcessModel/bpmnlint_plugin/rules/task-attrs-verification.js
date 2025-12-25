import { is } from 'bpmnlint-utils';

/**
 * task元素校验
 */
function check(node, reporter) {
  if (is(node, 'bpmn:Task')) {
    const name = (node["name"] || '').trim();
    if (name.length === 0) {
      reporter.report(node.id, 'Element is missing label/name');
    }
    const pattern = /^[^\\/:*?<>|]*$/g;
    if (!name.match(pattern)) {
      reporter.report(node.id, 'Cannot contain special characters [ \\ / : * ? " < > | ] please re-enter.');
    }
    let element = {};
    if (node.extensionElements && node.extensionElements.values) {
      const values = node.extensionElements.values;
      values.forEach(el => {
        if (el.id === 'dealType') {
          element = el;
          return;
        }
      });
      if (['', 'null', 'undefined'].includes(element.value + '')) {
        reporter.report(node.id, 'audit mode cannot be empty');
      }
    } else {
      reporter.report(node.id, 'audit mode cannot be empty');
    }
    const candidateUserStr = (node["$attrs"] ? node["$attrs"]["activiti:candidateUsers"] ? node["$attrs"]["activiti:candidateUsers"] : "" : "");
    const candidateUsers = candidateUserStr.length < 1 ? [] : candidateUserStr.split(",");
    if (['hqsh', 'zjsh'].includes(element.value + "") && candidateUsers.length < 2) {
      reporter.report(node.id, 'There must be more than two auditors');
    } else if (candidateUsers.length < 1) {
      reporter.report(node.id, 'auditor cannot be empty');
    }
  }
}
export default function () {
  return { check }
}
