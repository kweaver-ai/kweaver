import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';
import inherits from 'inherits';
//import layer from 'vue-layer';
//import Vue from 'vue';
//require("layui-layer");
import {
  assign, bind
} from 'min-dash';


//import { appendFile } from 'fs';

/**上下文的什么鬼,actions代表每个事件,可以在这更改事件的属性,例如给title添加转换方法 */
export default function CustomContextPadProvider(injector, connect, translate) {

  injector.invoke(ContextPadProvider, this);

  var cached = bind(this.getContextPadEntries, this);
  //console.log(this);
  //console.log(elementFactory);
  this.getContextPadEntries = function (element) {
    //console.log(this);
    var actions = cached(element);
    var businessObject = element.businessObject;

    if (actions['append.intermediate-event']) {
      delete actions['append.intermediate-event']
    }

    if (!(/bpmn:.*Task/.test(businessObject.$type))) {
      delete actions['replace']
    }
    if (actions['append.gateway']) {
      delete actions['append.gateway'];
    }
    if (actions['replace']) {
      delete actions['replace'];
    }
    if (actions['append.append-task']) {
      delete actions['append.append-task']
      actions['append.append-user-task'] = appendAction(this, 'bpmn:UserTask', 'bpmn-icon-user-task');
    }
    /* if (actions['append.append-task']) {
      delete actions['append.append-task']
    } */
    /*
    actions['aaDialog'] = {
      group: 'edit',
      className: "el-icon-plus",
      title: "弹框",
      action: {
        //dragstart: function (){alert(111)},
        click: function (){
          /*layer.open({
            type:1,
            content:'十几块了广阔的拉升',
          });
          //layer();
          //let $layer = layer(Vue);
          //console.log();
          layer.open({
            type:1,
            title: '在线调试'
            ,content: '可以填写任意的layer代码'
          });
        },
      }
    };*/

    for (let key in actions) {
      actions[key].title = translate(actions[key].title);
      if (key == 'delete') {
        actions[key].group = 'f';
        actions["4"] = actions[key];
        delete actions[key];
      }
      if (key == 'append.text-annotation') {
        actions[key].group = 'd';
        actions["2"] = actions[key];
        delete actions[key];
      }
      if (key == 'connect') {
        actions[key].group = 'a';
        actions["1"] = actions[key];
        delete actions[key];
      }
    }
    /*
    'append.append-task': appendAction(
          'bpmn:Task',
          'bpmn-icon-task'
        ),

    if(actions['replace']){
      delete actions['replace']
    }

    if(isAny(businessObject, [ 'bpmn:StartEvent'])){

        delete actions['append.intermediate-event']
    }*/
    //console.log(actions['replace'].action.click);
    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  'injector',
  'connect',
  'translate'
];


function appendAction(ContextPadProvider, type, className, title, options) {

  if (typeof title !== 'string') {
    options = title;
    title = ContextPadProvider._translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
  }

  function appendStart(event, element) {

    var shape = this._elementFactory.createShape(assign({ type: type }, options));
    ContextPadProvider._create.start(event, shape, element);
  }


  var append = ContextPadProvider._autoPlace ? function (event, element) {
    var shape = ContextPadProvider._elementFactory.createShape(assign({ type: type }, options));

    ContextPadProvider._autoPlace.append(element, shape);
  } : appendStart;


  return {
    group: 'model',
    className: className,
    title: title,
    action: {
      dragstart: appendStart,
      click: append
    }
  };
}

