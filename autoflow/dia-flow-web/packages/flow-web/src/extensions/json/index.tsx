import { Extension } from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import { JSONSetConfig } from "./json-set-config";
import { JSONGetConfig } from "./json-get-config";
import JSONSvg from "./assets/json.svg";
import { JSONTemplateConfig } from "./json-template-config";

const JSONExtension: Extension = {
  name: "JSON",
  executors: [
    {
      name: "JSON",
      description: "JSONDescription",
      icon: JSONSvg,
      actions: [
        {
          name: "JSONGet",
          description: "JSONGetDescription",
          icon: JSONSvg,
          outputs(step, { t }) {
            if (Array.isArray(step.parameters?.fields)) {
              return step.parameters.fields.map((field: any, index: number) => {
                return {
                  key: `.fields._${index}`,
                  name: t("field", "Key{index}", { index: index + 1 }),
                  type: "string",
                };
              });
            }
            return [];
          },
          operator: "@internal/json/get",
          components: {
            Config: JSONGetConfig,
          },
        },
        {
          name: "JSONSet",
          description: "JSONSetDescription",
          icon: JSONSvg,
          outputs: [
            {
              key: ".json",
              name: "JSONSetResult",
              type: "string",
            },
          ],
          operator: "@internal/json/set",
          components: {
            Config: JSONSetConfig,
          },
        },
        {
          name: "JSONTemplate",
          description: "JSONTemplateDescription",
          icon: JSONSvg,
          outputs: [
            {
              key: ".result",
              name: "JSONTemplateResult",
              type: "string",
            },
          ],
          operator: "@internal/json/template",
          components: {
            Config: JSONTemplateConfig,
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN
  },
};

export default JSONExtension;
