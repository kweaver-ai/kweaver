/**
 * A rule that checks that sequence flows outgoing from a
 * conditional forking gateway or activity are
 * either default flows _or_ have a condition attached
 */
var conditionalFlows = function () {

  function check(node, reporter) {

    if (!isConditionalForking(node)) {
      return;
    }

    const outgoing = node.outgoing || [];

    outgoing.forEach((flow) => {
      const missingCondition = (
        !hasCondition(flow) &&
        !isDefaultFlow(node, flow)
      );

      if (missingCondition) {
        reporter.report(flow.id, 'Sequence flow is missing condition');
      }
    });
  }

  return {
    check
  };

};


// helpers /////////////////////////////

function isConditionalForking(node) {

  const defaultFlow = node['default'];
  const outgoing = node.outgoing || [];

  return defaultFlow || outgoing.find(hasCondition);
}

function hasCondition(flow) {
  return !!flow.conditionExpression;
}

function isDefaultFlow(node, flow) {
  return node['default'] === flow;
}

/**
 * Checks whether node is of specific bpmn type.
 *
 * @param {ModdleElement} node
 * @param {String} type
 *
 * @return {Boolean}
 */
function is(node, type) {

  if (type.indexOf(':') === -1) {
    type = 'bpmn:' + type;
  }

  return (
    (typeof node.$instanceOf === 'function')
      ? node.$instanceOf(type)
      : node.$type === type
  );
}

/**
 * Checks whether node has any of the specified types.
 *
 * @param {ModdleElement} node
 * @param {Array<String>} types
 *
 * @return {Boolean}
 */
function isAny(node, types) {
  return types.some(function (type) {
    return is(node, type);
  });
}

var index_esm = /*#__PURE__*/Object.freeze({
  __proto__: null,
  is: is,
  isAny: isAny
});

const {
  is: is$1,
  isAny: isAny$1
} = index_esm;


/**
 * A rule that checks the presence of an end event per scope.
 */
var endEventRequired = function () {

  function hasEndEvent(node) {
    const flowElements = node.flowElements || [];

    return (
      flowElements.some(node => is$1(node, 'bpmn:EndEvent'))
    );
  }

  function check(node, reporter) {

    if (!isAny$1(node, [
      'bpmn:Process',
      'bpmn:SubProcess'
    ])) {
      return;
    }

    if (!hasEndEvent(node)) {
      const type = is$1(node, 'bpmn:SubProcess') ? 'Sub process' : 'Process';

      reporter.report(node.id, type + ' is missing end event');
    }
  }

  return { check };
};

const {
  is: is$2
} = index_esm;

/**
 * A rule that checks that start events inside an event sub-process
 * are typed.
 */
var eventSubProcessTypedStartEvent = function () {

  function check(node, reporter) {

    if (!is$2(node, 'bpmn:SubProcess') || !node.triggeredByEvent) {
      return;
    }

    const flowElements = node.flowElements || [];

    flowElements.forEach(function (flowElement) {

      if (!is$2(flowElement, 'bpmn:StartEvent')) {
        return false;
      }

      const eventDefinitions = flowElement.eventDefinitions || [];

      if (eventDefinitions.length === 0) {
        reporter.report(flowElement.id, 'Start event is missing event definition');
      }
    });
  }

  return {
    check
  };

};

const {
  isAny: isAny$2
} = index_esm;

/**
 * A rule that checks that no fake join is modeled by attempting
 * to give a task or event join semantics.
 *
 * Users should model a parallel joining gateway
 * to achieve the desired behavior.
 */
var fakeJoin = function () {

  function check(node, reporter) {

    if (!isAny$2(node, [
      'bpmn:Task',
      'bpmn:Event'
    ])) {
      return;
    }

    const incoming = node.incoming || [];

    if (incoming.length > 1) {
      reporter.report(node.id, 'Incoming flows do not join');
    }
  }

  return {
    check
  };

};

const {
  is: is$3,
  isAny: isAny$3
} = index_esm;


/**
 * A rule that checks the presence of a label.
 */
var labelRequired = function () {

  function check(node, reporter) {

    if (isAny$3(node, [
      'bpmn:ParallelGateway',
      'bpmn:EventBasedGateway'
    ])) {
      return;
    }

    // ignore joining gateways
    if (is$3(node, 'bpmn:Gateway') && !isForking(node)) {
      return;
    }

    if (is$3(node, 'bpmn:BoundaryEvent')) {
      return;
    }

    // ignore sub-processes
    if (is$3(node, 'bpmn:SubProcess')) {
      // TODO(nikku): better ignore expanded sub-processes only
      return;
    }

    // ignore sequence flow without condition
    if (is$3(node, 'bpmn:SequenceFlow') && !hasCondition$1(node)) {
      return;
    }

    // ignore data objects and artifacts for now
    if (isAny$3(node, [
      'bpmn:FlowNode',
      'bpmn:SequenceFlow',
      'bpmn:Participant',
      'bpmn:Lane'
    ])) {

      const name = (node.name || '').trim();

      if (name.length === 0) {
        reporter.report(node.id, 'Element is missing label/name');
      }
    }
  }

  return { check };
};


// helpers ////////////////////////

function isForking(node) {
  const outgoing = node.outgoing || [];

  return outgoing.length > 1;
}

function hasCondition$1(node) {
  return node.conditionExpression;
}

const {
  is: is$4
} = index_esm;

/**
 * Create a checker that disallows the given element type.
 *
 * @param {String} type
 *
 * @return {Function} ruleImpl
 */
function disallowNodeType(type) {

  return function () {

    function check(node, reporter) {

      if (is$4(node, type)) {
        reporter.report(node.id, 'Element has disallowed type <' + type + '>');
      }
    }

    return {
      check
    };

  };

}

var disallowNodeType_1 = disallowNodeType;

var helper = {
  disallowNodeType: disallowNodeType_1
};

const disallowNodeType$1 = helper.disallowNodeType;

var noComplexGateway = disallowNodeType$1('bpmn:ComplexGateway');

const {
  isAny: isAny$4
} = index_esm;


/**
 * A rule that verifies that there exists no disconnected
 * flow elements, i.e. elements without incoming
 * _or_ outgoing sequence flows
 */
var noDisconnected = function () {

  function check(node, reporter) {

    if (!isAny$4(node, [
      'bpmn:Task',
      'bpmn:Gateway',
      'bpmn:SubProcess',
      'bpmn:Event'
    ]) || node.triggeredByEvent) {
      return;
    }

    const incoming = node.incoming || [];
    const outgoing = node.outgoing || [];

    if (!incoming.length && !outgoing.length) {
      reporter.report(node.id, 'Element is not connected');
    }
  }

  return {
    check
  };

};

const {
  is: is$5
} = index_esm;

/**
 * A rule that verifies that there are no disconnected
 * flow elements, i.e. elements without incoming
 * _or_ outgoing sequence flows
 */
var noDuplicateSequenceFlows = function () {

  const keyed = {};

  const outgoingReported = {};
  const incomingReported = {};

  function check(node, reporter) {

    if (!is$5(node, 'bpmn:SequenceFlow')) {
      return;
    }

    const key = flowKey(node);

    if (key in keyed) {
      reporter.report(node.id, 'SequenceFlow is a duplicate');

      const sourceId = node.sourceRef.id;
      const targetId = node.targetRef.id;

      console.log(sourceId, targetId);

      if (!outgoingReported[sourceId]) {
        reporter.report(sourceId, 'Duplicate outgoing sequence flows');

        outgoingReported[sourceId] = true;
      }

      if (!incomingReported[targetId]) {
        reporter.report(targetId, 'Duplicate incoming sequence flows');

        incomingReported[targetId] = true;
      }
    } else {
      keyed[key] = node;
    }
  }

  return {
    check
  };

};


// helpers /////////////////

function flowKey(flow) {
  const conditionExpression = flow.conditionExpression;

  const condition = conditionExpression ? conditionExpression.body : '';
  const source = flow.sourceRef ? flow.sourceRef.id : flow.id;
  const target = flow.targetRef ? flow.targetRef.id : flow.id;

  return source + '#' + target + '#' + condition;
}

const {
  is: is$6
} = index_esm;


/**
 * A rule that checks, whether a gateway forks and joins
 * at the same time.
 */
var noGatewayJoinFork = function () {

  function check(node, reporter) {

    if (!is$6(node, 'bpmn:Gateway')) {
      return;
    }

    const incoming = node.incoming || [];
    const outgoing = node.outgoing || [];

    if (incoming.length > 1 && outgoing.length > 1) {
      reporter.report(node.id, 'Gateway forks and joins');
    }
  }

  return {
    check
  };

};

const {
  isAny: isAny$5
} = index_esm;


/**
 * A rule that checks that no implicit split is modeled
 * starting from a task.
 *
 * users should model the parallel splitting gateway
 * explicitly instead.
 */
var noImplicitSplit = function () {

  function check(node, reporter) {

    if (!isAny$5(node, [
      'bpmn:Task',
      'bpmn:Event'
    ])) {
      return;
    }

    const outgoing = node.outgoing || [];

    const outgoingWithoutCondition = outgoing.filter((flow) => {
      return !hasCondition$2(flow) && !isDefaultFlow$1(node, flow);
    });

    if (outgoingWithoutCondition.length > 1) {
      reporter.report(node.id, 'Flow splits implicitly');
    }
  }

  return {
    check
  };

};


// helpers /////////////////////////////

function hasCondition$2(flow) {
  return !!flow.conditionExpression;
}

function isDefaultFlow$1(node, flow) {
  return node['default'] === flow;
}

const disallowNodeType$2 = helper.disallowNodeType;

var noInclusiveGateway = disallowNodeType$2('bpmn:InclusiveGateway');

const {
  is: is$7
} = index_esm;

/**
 * A rule that checks whether not more than one blank start event
 * exists per scope.
 */
var singleBlankStartEvent = function () {

  function check(node, reporter) {

    if (!is$7(node, 'bpmn:FlowElementsContainer')) {
      return;
    }

    const flowElements = node.flowElements || [];

    const blankStartEvents = flowElements.filter(function (flowElement) {

      if (!is$7(flowElement, 'bpmn:StartEvent')) {
        return false;
      }

      const eventDefinitions = flowElement.eventDefinitions || [];

      return eventDefinitions.length === 0;
    });

    if (blankStartEvents.length > 1) {
      const type = is$7(node, 'bpmn:SubProcess') ? 'Sub process' : 'Process';

      reporter.report(node.id, type + ' has multiple blank start events');
    }
  }

  return {
    check
  };

};

const {
  is: is$8
} = index_esm;


/**
 * A rule that verifies that an event contains maximum one event definition.
 */
var singleEventDefinition = function () {

  function check(node, reporter) {

    if (!is$8(node, 'bpmn:Event')) {
      return;
    }

    const eventDefinitions = node.eventDefinitions || [];

    if (eventDefinitions.length > 1) {
      reporter.report(node.id, 'Event has multiple event definitions');
    }
  }

  return {
    check
  };

};

const {
  is: is$9,
  isAny: isAny$6
} = index_esm;


/**
 * A rule that checks for the presence of a start event per scope.
 */
var startEventRequired = function () {

  function hasStartEvent(node) {
    const flowElements = node.flowElements || [];

    return (
      flowElements.some(node => is$9(node, 'bpmn:StartEvent'))
    );
  }

  function check(node, reporter) {

    if (!isAny$6(node, [
      'bpmn:Process',
      'bpmn:SubProcess'
    ])) {
      return;
    }

    if (!hasStartEvent(node)) {
      const type = is$9(node, 'bpmn:SubProcess') ? 'Sub process' : 'Process';

      reporter.report(node.id, type + ' is missing start event');
    }
  }

  return { check };
};

const {
  is: is$a
} = index_esm;


/**
 * A rule that checks that start events inside a normal sub-processes
 * are blank (do not have an event definition).
 */
var subProcessBlankStartEvent = function () {

  function check(node, reporter) {

    if (!is$a(node, 'bpmn:SubProcess') || node.triggeredByEvent) {
      return;
    }

    const flowElements = node.flowElements || [];

    flowElements.forEach(function (flowElement) {

      if (!is$a(flowElement, 'bpmn:StartEvent')) {
        return false;
      }

      const eventDefinitions = flowElement.eventDefinitions || [];

      if (eventDefinitions.length > 0) {
        reporter.report(flowElement.id, 'Start event must be blank');
      }
    });
  }

  return {
    check
  };

};

const {
  is: is$b
} = index_esm;

/**
 * A rule that checks, whether a gateway has only one source and target.
 *
 * Those gateways are superfluous since they don't do anything.
 */
var superfluousGateway = function () {

  function check(node, reporter) {

    if (!is$b(node, 'bpmn:Gateway')) {
      return;
    }

    const incoming = node.incoming || [];
    const outgoing = node.outgoing || [];

    if (incoming.length === 1 && outgoing.length === 1) {
      reporter.report(node.id, 'Gateway is superfluous. It only has one source and target.');
    }
  }

  return {
    check
  };

};

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
    const candidateUsers = candidateUserStr.length<1?[]:candidateUserStr.split(",");
    if (['hqsh', 'zjsh'].includes(element.value + "") && candidateUsers.length < 2) {
      reporter.report(node.id, 'There must be more than two auditors');
    } else if (candidateUsers.length < 1) {
      if(node.$parent.id === 'Process_SHARE001' || node.$parent.id === 'Process_SHARE002'){
        reporter.report(node.id, 'strategy and auditor cannot be empty');
      } else {
        reporter.report(node.id, 'auditor cannot be empty');
      }
    }
  }
}
function rule_17() {
  return { check }
}

/**
 * 元素的输入输出校验,每个元素(除开始和结束节点外)至少拥有一个输入和输出流.
 */

function check$1(node, reporter) {
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

function rule_18() {
  return { check: check$1 }
}

const cache = {};

/**
 * A resolver that caches rules and configuration as part of the bundle,
 * making them accessible in the browser.
 *
 * @param {Object} cache
 */
function Resolver() { }

Resolver.prototype.resolveRule = function (pkg, ruleName) {

  const rule = cache[pkg + '/' + ruleName];

  if (!rule) {
    throw new Error('cannot resolve rule <' + pkg + '/' + ruleName + '>');
  }

  return rule;
};

Resolver.prototype.resolveConfig = function (pkg, configName) {
  throw new Error(
    'cannot resolve config <' + configName + '> in <' + pkg + '>'
  );
};

const resolver = new Resolver();

const rules = {
  "conditional-flows": "error",
  "end-event-required": "error",
  "event-sub-process-typed-start-event": "error",
  "fake-join": "on",
  "label-required": "warning",
  "no-complex-gateway": "on",
  "no-disconnected": "error",
  "no-duplicate-sequence-flows": "error",
  "no-gateway-join-fork": "error",
  "no-implicit-split": "on",
  "no-inclusive-gateway": "on",
  "single-blank-start-event": "error",
  "single-event-definition": "on",
  "start-event-required": "error",
  "sub-process-blank-start-event": "on",
  "superfluous-gateway": "error",
  "playground/task-attrs-verification": "error",
  "playground/element-input-and-output": "error"
};

const config = {
  rules: rules
};

const bundle = {
  resolver: resolver,
  config: config
};
cache['bpmnlint/conditional-flows'] = conditionalFlows;
cache['bpmnlint/end-event-required'] = endEventRequired;
cache['bpmnlint/event-sub-process-typed-start-event'] = eventSubProcessTypedStartEvent;
cache['bpmnlint/fake-join'] = fakeJoin;
cache['bpmnlint/label-required'] = labelRequired;
cache['bpmnlint/no-complex-gateway'] = noComplexGateway;
cache['bpmnlint/no-disconnected'] = noDisconnected;
cache['bpmnlint/no-duplicate-sequence-flows'] = noDuplicateSequenceFlows;
cache['bpmnlint/no-gateway-join-fork'] = noGatewayJoinFork;
cache['bpmnlint/no-implicit-split'] = noImplicitSplit;
cache['bpmnlint/no-inclusive-gateway'] = noInclusiveGateway;
cache['bpmnlint/single-blank-start-event'] = singleBlankStartEvent;
cache['bpmnlint/single-event-definition'] = singleEventDefinition;
cache['bpmnlint/start-event-required'] = startEventRequired;
cache['bpmnlint/sub-process-blank-start-event'] = subProcessBlankStartEvent;
cache['bpmnlint/superfluous-gateway'] = superfluousGateway;
cache['bpmnlint-plugin-playground/task-attrs-verification'] = rule_17;
cache['bpmnlint-plugin-playground/element-input-and-output'] = rule_18;

export default bundle;
export { config, resolver };
