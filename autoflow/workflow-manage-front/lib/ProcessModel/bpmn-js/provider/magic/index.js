import MagicPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/bpmn/BpmnPropertiesProvider';
import ColorRenderer from '../../../bpmn-js/colors/ColorRenderer';
import CustomContextPadProvider from "./CustomContextPad";
import CustomPalette from './CustomPalette';
import ReplaceMenuProvider from "./popup-menu/ReplaceMenuProvider";

export default {
  __init__: ['propertiesProvider', 'paletteProvider', 'contextPadProvider', 'replaceMenuProvider', 'colorRenderer'],
  propertiesProvider: ['type', MagicPropertiesProvider],
  contextPadProvider: ['type', CustomContextPadProvider],
  paletteProvider: ['type', CustomPalette],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  colorRenderer: ['type', ColorRenderer]
};
