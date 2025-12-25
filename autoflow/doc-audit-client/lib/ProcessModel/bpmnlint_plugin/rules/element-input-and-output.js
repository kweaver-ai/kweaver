import { isAny } from 'bpmnlint-utils';

/**
 * 元素的输入输出校验,每个元素(除开始和结束节点外)至少拥有一个输入和输出流.
 */

function check(node, reporter) {
  if (!isAny(node, [
    'bpmn:Task',
    'bpmn:Gateway',
    'bpmn:SubProcess']) || node.triggeredByEvent) {
    return;
  }
  const incoming = node.incoming || [];
  const outgoing = node.outgoing || [];
  if (!incoming.length || !outgoing.length) {
    reporter.report(node.id, 'Element has at least one input and output stream');
  }
}

export default function () {
  return { check }
}

