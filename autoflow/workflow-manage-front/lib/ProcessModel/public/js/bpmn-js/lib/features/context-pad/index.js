import ConnectModule from "diagram-js/lib/features/connect";
import ContextPadModule from "diagram-js/lib/features/context-pad";
import CreateModule from "diagram-js/lib/features/create";
import SelectionModule from "diagram-js/lib/features/selection";
import DirectEditingModule from "ebpm-process-modeler-front/diagram-js-direct-editing";
import PopupMenuModule from "../popup-menu";
import ContextPadProvider from "./ContextPadProvider";

export default {
  __depends__: [
    DirectEditingModule,
    ContextPadModule,
    SelectionModule,
    ConnectModule,
    CreateModule,
    PopupMenuModule
  ],
  __init__: ["contextPadProvider"],
  contextPadProvider: ["type", ContextPadProvider]
};
