
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import {
  attr as svgAttr
} from 'tiny-svg';

const HIGH_PRIORITY = 1400;
export default class ColorRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
    var self = bpmnRenderer
    eventBus.on(['render.shape'], HIGH_PRIORITY, function (evt, context) {
      var element = context.element,
        visuals = context.gfx;

      // call default implementation
      var shape = self.drawShape(visuals, element);
      // 2D shape with default white color
      var businessObject = getBusinessObject(element);
      if (businessObject.$type == "bpmn:SequenceFlow") {
        svgAttr(shape, {
          fill: getBackgroundColor(element) || '#000000'
        });
      } else {
        svgAttr(shape, {
          fill: getBackgroundColor(element) || '#ffffff'
        });
      }
      // make sure default renderer is not called anymore
      return shape;
    });

    eventBus.on(['render.connection'], HIGH_PRIORITY, function (evt, context) {
      var element = context.element,
        visuals = context.gfx;

      // call default implementation
      var shape = self.drawConnection(visuals, element);

      // line shape with default black color
      svgAttr(shape, {
        stroke: getBackgroundColor(element) || '#000000'
      });

      // make sure default renderer is not called anymore
      return shape;
    });
  }

}

ColorRenderer.$inject = ['eventBus', 'bpmnRenderer'];

// helpers //////////
function getBackgroundColor(element) {
  var bo = getBusinessObject(element);
  return bo.di.get('color:background-color');
}