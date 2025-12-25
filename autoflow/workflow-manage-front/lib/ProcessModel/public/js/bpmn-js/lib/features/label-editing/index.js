import ChangeSupportModule from "diagram-js/lib/features/change-support";
import ResizeModule from "diagram-js/lib/features/resize";
import DirectEditingModule from "ebpm-process-modeler-front/diagram-js-direct-editing";
import LabelEditingPreview from "./LabelEditingPreview";
import LabelEditingProvider from "./LabelEditingProvider";

export default {
  __depends__: [ChangeSupportModule, ResizeModule, DirectEditingModule],
  __init__: ["labelEditingProvider", "labelEditingPreview"],
  labelEditingProvider: ["type", LabelEditingProvider],
  labelEditingPreview: ["type", LabelEditingPreview]
};
