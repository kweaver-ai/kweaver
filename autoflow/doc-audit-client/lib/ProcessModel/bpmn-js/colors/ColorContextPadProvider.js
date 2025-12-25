'use strict';


function ColorContextPadProvider(contextPad, popupMenu, canvas) {

  this._contextPad = contextPad;
  this._popupMenu = popupMenu;
  this._canvas = canvas;
  contextPad.registerProvider(this);
}


ColorContextPadProvider.$inject = [
  'contextPad',
  'popupMenu',
  'canvas'
];
module.exports = ColorContextPadProvider;


ColorContextPadProvider.prototype.getContextPadEntries = function (element) {
  var _this = this;
  var actions = {
    '3': {
      group: 'e',
      className: 'bpmn-icon-screw-wrench',
      title: '设置颜色',
      action: {
        click: function (event, element) {
          // close any existing popup
          _this._popupMenu.close();

          // create new color-picker popup
          var colorPicker = _popupMenuCreate(_this._popupMenu, 'color-picker', element);

          // get start popup draw start position
          var opts = getStartPosition(_this._canvas, _this._contextPad, element);

          // or fallback to current cursor position
          opts.cursor = {
            x: event.x,
            y: event.y
          };

          // open color picker submenu popup
          colorPicker.open(element, 'color-picker', opts);
        }
      }
    }
  };
  return actions;
};


function _popupMenuCreate(_this, id, element) {
  var provider = _this._providers[id];

  if (!provider) {
    throw new Error('Provider is not registered: ' + id);
  }

  if (!element) {
    throw new Error('Element is missing');
  }

  var current = _this._current = {
    provider: provider,
    className: id,
    element: element
  };

  if (provider.getHeaderEntries) {
    current.headerEntries = provider.getHeaderEntries(element);
  }

  current.entries = provider.getEntries(element);

  return _this;
}

// helpers //////////////////////

function getStartPosition(canvas, contextPad, element) {

  var Y_OFFSET = 5;

  var diagramContainer = canvas.getContainer(),
    pad = contextPad.getPad(element).html;

  var diagramRect = diagramContainer.getBoundingClientRect(),
    padRect = pad.getBoundingClientRect();

  var top = padRect.top - diagramRect.top;
  var left = padRect.left - diagramRect.left;

  var pos = {
    x: left,
    y: top + padRect.height + Y_OFFSET
  };

  return pos;
}
