'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;


function PopupMenuProvider(popupMenu, modeling) {
  this._popupMenu = popupMenu;
  this._modeling = modeling;

  this._popupMenu.registerProvider('color-picker', this);
}


PopupMenuProvider.$inject = [
  'popupMenu',
  'modeling'
];
module.exports = PopupMenuProvider;


PopupMenuProvider.prototype.getEntries = function(element) {
  var _this = this;

  var colors = [
    {
      label: '红色',
      hex: 'ff0000'
    }, {
      label: '橙色',
      hex: 'ff7f00'
    }, {
      label: '黄色',
      hex: 'ffff00'
    }, {
      label: '绿色',
      hex: '00ff00'
    }, {
      label: '蓝色',
      hex: '0000ff'
    }, {
      label: '青色',
      hex: '4b0082'
    }, {
      label: '紫色',
      hex: '9400d3'
    }
  ];

  var entries = colors.map(function(color) {
    return {
      label: color.label,
      id: color.label.toLowerCase() + '-color',
      className: 'color-icon-' + color.hex,
      action: createAction(_this._modeling, element, '#' + color.hex)
    };
  });
  return entries;
};


PopupMenuProvider.prototype.getHeaderEntries = function(element) {
  return [
    {
      label: '还原',
      id: 'clear-color',
      className: 'color-icon-clear',
      action: createAction(this._modeling, element)
    }
  ];
};


function createAction(modeling, element, newColor) {
  // set hex value to an element
  return function() {
    var bo = getBusinessObject(element);
    var di = bo.di;

    var currentColor = di.get('color:background-color');

    console.log('Replacing colors from/to: ', currentColor, newColor);

    var ns = (
      newColor ?
        'http://www.omg.org/spec/BPMN/non-normative/color/1.0' :
        undefined
    );

    modeling.updateProperties(element, {
      di: {
        'xmlns:color': ns,
        'color:background-color': newColor
      }
    });

  };
}
