import { Extension } from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import VariableSvg from "./assets/variable.svg";
import { InternalDefine } from "./internal-define";
import { InternalAssign } from "./internal-assign";

const VariableExtension: Extension = {
  name: "variable",
  executors: [
    {
      name: "variable",
      description: "variableDes",
      icon: VariableSvg,
      actions: [
        {
          name: "variableAdd",
          description: "variableAddDes",
          icon: VariableSvg,
          outputs(step: any) {
            return [
              {
                key: ".value",
                name: "value",
                type: step.parameters?.type,
              },
            ];
          },
          operator: "@internal/define",
          components: {
            Config: InternalDefine,
          },
        },
        {
          name: "variableEdit",
          description: "variableEditDes",
          icon: VariableSvg,
          operator: "@internal/assign",
          components: {
            Config: InternalAssign,
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default VariableExtension;
