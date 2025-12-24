import GlobalVariableSVG from "../assets/global-variable.svg";

export const globalVariable = [
  {
    type: "globalVariable",
    path: [-1],
    index: -1,
    parent: '',
    step: {
      id: '',
      operator: "@global/variable",
    },
    action: {
      name: "全局变量",
      icon: GlobalVariableSVG,
    },
    outputs: [
      {
        key: "g_authorization",
        name: "Authorization",
        type: "string",
      },
    ],
  },
];
