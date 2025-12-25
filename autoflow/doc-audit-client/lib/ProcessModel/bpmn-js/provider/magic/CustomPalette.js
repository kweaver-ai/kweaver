import {
  assign,

  forEach, isArray
} from 'min-dash';
import {
  attr as domAttr,

  classes as domClasses, clear as domClear, domify,
  query as domQuery
} from 'min-dom';


function addClasses(element, classNames) {

  var classes = domClasses(element);

  var actualClassNames = isArray(classNames) ? classNames : classNames.split(/\s+/g);
  actualClassNames.forEach(function (cls) {
    classes.add(cls);
  });
}

function removeClasses(element, classNames) {

  var classes = domClasses(element);

  var actualClassNames = isArray(classNames) ? classNames : classNames.split(/\s+/g);
  actualClassNames.forEach(function (cls) {
    if (classes.list.contains(cls)) {
      classes.remove(cls);
    }
  });
}

/**
 * 定制调色板/感觉就是左边的菜单
 * A palette that allows you to create BPMN _and_ custom elements.
 * 允许您创建bpmn和定制元素的调色板。
 */
export default function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool, handTool,
  globalConnect, translate) {

  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._translate = translate;
  palette._update = function () {

    var entriesContainer = domQuery('.djs-palette-entries', this._container),
      entries = this._entries = this.getEntries();
    addClasses(this._container, "no-border-bottom");
    if (palette.disable) {
      addClasses(this._container, "disable");
    } else {
      removeClasses(this._container, "disable");
    }
    domClear(entriesContainer);

    forEach(entries, function (entry, id) {

      var grouping = entry.group || 'default';

      var container = domQuery('[data-group=' + grouping + ']', entriesContainer);
      if (!container) {
        container = domify('<div class="group" data-group="' + grouping + '"></div>');
        entriesContainer.appendChild(container);
      }

      var html = entry.html || (
        entry.separator ?
          '<hr class="separator" />' :
          `<div class="entry ${!palette.disable ? '' : 'disable'}" draggable="${!palette.disable}"></div>`);


      var control = domify(html);
      container.appendChild(control);
      if (!entry.separator) {
        if (!palette.disable) {
          domAttr(control, 'data-action', id);
        }

        if (entry.title) {
          domAttr(control, 'title', entry.title);
        }

        if (entry.className) {
          addClasses(control, entry.className);
        }
        if (entry.explain) {
          control.appendChild(domify(`<span>${entry.explain}</span> `));
        }
        if (entry.imageUrl) {
          control.appendChild(domify('<img src="' + entry.imageUrl + '">'));
        }
      }
    });
    // open after update
    this.open();
  };
  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate'
];


PaletteProvider.prototype.getPaletteEntries = function (element) {

  var actions = {},
    create = this._create,
    elementFactory = this._elementFactory,
    spaceTool = this._spaceTool,
    lassoTool = this._lassoTool,
    handTool = this._handTool,
    globalConnect = this._globalConnect,
    translate = this._translate;

  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }
      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn:/, '');

    return {
      group: group,
      className: className,
      title: translate(title || 'Create ' + shortType),
      explain: translate(title || shortType),
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  function createParticipant(event, collapsed) {
    create.start(event, elementFactory.createParticipantShape(collapsed));
  }

  assign(actions, {
    /*'hand-tool': createAction(
      'custom:triangle', 'custom', 'icon-custom-triangle'
    ),
    'custom-circle': createAction(
      'custom:circle', 'custom', 'icon-custom-circle'
    ),
    'custom-separator': {
      group: 'custom',
      separator: true
    },
    */
    /*
     'hand-tool': {
       group: 'tools',
       className: 'bpmn-icon-hand-tool',
       title: translate('Activate the hand tool'),
       action: {
         click: function(event) {
           handTool.activateHand(event);
         }
       }
     },
 
 
     'space-tool': {
       group: 'tools',
       className: 'bpmn-icon-space-tool',
       title: translate('Activate the create/remove space tool'),
       action: {
         click: function(event) {
           spaceTool.activateSelection(event);
         }
       }
     },
     'tool-separator': {
       group: 'tools',
       separator: true
     },*/
    //事件
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none'
    ),
    /*
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent', 'event', 'bpmn-icon-intermediate-event-none'
    ),*/
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none'
    ),
    /* 'event-separator': {
      group: 'event',
      separator: true
    }, */
    //task 任务
    'create.user-task': createAction(
      'bpmn:UserTask', 'task', 'bpmn-icon-user-task'
    ),
    /*  'create.service-task': createAction(
       'bpmn:ServiceTask', 'task', 'bpmn-icon-service-task'
     ),
     'create.script-task': createAction(
       'bpmn:ScriptTask', 'task', 'bpmn-icon-script-task'
     ), */
    /* 'create.receive-task': createAction(
      'bpmn:ReceiveTask', 'task', 'bpmn-icon-receive-task'
    ),
    'create.manual-task': createAction(
      'bpmn:ManualTask', 'task', 'bpmn-icon-manual-task'
    ), */
    /* 'task-separator':{
      group: 'task',
      separator: true
    }, */
    //subprocess 流程
    /* 'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'subprocess', 'bpmn-icon-subprocess-expanded', 'Create expanded SubProcess',
      { isExpanded: true }
    ), */
    //collapsed-subprocess
    /* 'create.subprocess-collapsed': createAction(
      'bpmn:SubProcess', 'subprocess', 'bpmn-icon-subprocess-collapsed', 'Create collapsed SubProcess'
    ), */
    /* 'create.callactivity':createAction(
      'bpmn:CallActivity', 'subprocess','bpmn-icon-call-activity','Call Activity'
    ),
    'subprocess-separator': {
      group: 'subprocess',
      separator: true
    },

    //Gateway 网关

    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor'
    ),
    'create.inclusive-gateway': createAction(
      'bpmn:InclusiveGateway', 'gateway', 'bpmn-icon-gateway-or'
    ), */

    /* 'gateway-separator': {
      group: 'gateway',
      separator: true
    }, */
    //工具
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the global connect tool'),
      explain: translate('global connect tool'),
      action: {
        click: function (event) {
          globalConnect.toggle(event);
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      explain: translate('lasso tool'),
      action: {
        click: function (event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    /*
    'create.data-object': createAction(
      'bpmn:DataObjectReference', 'data-object', 'bpmn-icon-data-object'
    ),

    'create.participant-expanded': {
      group: 'collaboration',
      className: 'bpmn-icon-participant',
      title: 'Create Pool/Participant',
      action: {
        dragstart: createParticipant,
        click: createParticipant
      }
    }*/
  });
  return actions;
};
