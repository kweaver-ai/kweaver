import { FC, useContext, useEffect, useMemo, useState } from "react";
import { IntlProvider, useIntl } from "react-intl";
import { find } from "lodash";
import { ExtensionContext } from "./extension-context";
import AnyShare from "../../extensions/anyshare";
import Internal from "../../extensions/internal";
import Workflow from "../../extensions/workflow";
import Cron from "../../extensions/cron";
import AI, { AIExtensionForDataStudio } from "../../extensions/ai";
import Admin from "../../extensions/admin";
import Console from "../../extensions/console";
import Operator from "../../extensions/operator";
import DataStudio from "../../extensions/datastudio";
import JSONExtension from "../../extensions/json";
import OpenSearchExtension from "../../extensions/internal/opensearch-extension";
import ContentExtension from "../../extensions/content";
import {
  Executor,
  ExecutorAction,
  Extension,
  Comparator,
  Trigger,
  TriggerAction,
  ValueType,
  DataSource,
} from "../extension/types";
import { API, MicroAppContext, Translations } from "@applet/common";
import useSWR from "swr";
import { ExecutorDto } from "../../models/executor-dto";
import CustomExecutorSVG from "../../assets/custom-executor.svg";
import CustomActionSVG from "../../assets/custom-action.svg";
import { customExecutorConfig } from "../custom-executor/custom-executor-config";
import { customExecutorInput } from "../custom-executor/custom-executor-input";
import { JsonSchemaForm } from "../editor/operator-editor/json-schema-form";
import {
  convertSchemaToFields,
  dereference,
} from "../../utils/analyze-jsonschema";
import { OperatorDataSource } from "../editor/operator-editor/operator-data-source";
import SqlWriteExtension from "../../extensions/sqlwriter";
import VariableExtension from "../../extensions/variable";
// 工作流
const Extensions = [AnyShare, Internal, Cron, JSONExtension, ContentExtension, VariableExtension];
// 数据处理流
const DataStudioExtensions = [
  DataStudio,
  OpenSearchExtension,
  SqlWriteExtension,
  Internal,
  JSONExtension,
  AIExtensionForDataStudio,
  ContentExtension,
  VariableExtension,
];
// 控制台
const ConsoleExtensions = [Console, Internal];
// 组合算子
const OperatorExtensions = [
  Operator,
  Internal,
  JSONExtension,
  AIExtensionForDataStudio,
  ContentExtension,
  VariableExtension,
];

export const findConfig = (config: any[], name: string) => {
  return find(config, (item) => item?.name === name);
};
/**
 * @param operatorName "@anyshare/ocr/general"
 */
export const getOperatorEnable = (operatorName: string) => {
  try {
    const config = JSON.parse(localStorage.getItem("automateConfig") || "");
    const ocrConfig = findConfig(config, operatorName);
    if (ocrConfig?.config?.enable === true) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const ExtensionTranslatePrefix = "@@EXTENSION";

interface ExtensionProviderProps {
  children?: React.ReactNode;
  isDataStudio?: boolean; // 添加 isDataStudio 属性
  isOperator?: boolean; //是否显示算子信息
}

export const ExtensionProvider: FC<ExtensionProviderProps> = ({
  children,
  isDataStudio = false,
  isOperator = false,
}) => {
  const { platform, microWidgetProps, prefixUrl, isSecretMode } =
    useContext(MicroAppContext);
  const defaultExtension = useMemo(() => {
    if (isDataStudio) {
      return DataStudioExtensions;
    }
    if (platform === "console") {
      return ConsoleExtensions;
    }
    if (platform === "operator") {
      return OperatorExtensions;
    }
    return Extensions;
  }, [platform]);
  const [extensions, setExtensions] = useState(defaultExtension);
  const [globalConfig, setConfig] = useState<Record<string, any>>({});

  const { data: customExecutors, mutate: reloadAccessableExecutors } = useSWR(
    isOperator
      ? `/api/agent-operator-integration/v1/operator/market?page_size=-1&status=published`
      : `/api/automation/v1/accessable-executors`,
    async (url: string) => {
      if (isOperator) {
        const { data } = await API.axios.get(url);
        const resultArray: any = transferOperator(data?.data);
        // console.log(6565, resultArray)
        return resultArray;
      }
      if (platform === "client" || isDataStudio) {
        const { data } = await API.axios.get<ExecutorDto[]>(url);
        return data;
      }
    },
    {
      revalidateOnFocus: false,
    }
  );

  //算子数据源
  const { data: operatorDataSource, mutate: reloadOperatorDataSource } = useSWR(
    `/api/agent-operator-integration/v1/operator/market?page_size=-1&status=published&is_data_source=true`,
    async (url: string) => {
      const { data } = await API.axios.get(url);
      return platform === "console" && data?.data;
    },
    {
      revalidateOnFocus: false,
    }
  );

  const transferOperator = (data?: any) => {
    const groupedData: any = {};
    data.forEach((item: any) => {
      const { category } = item.operator_info;
      const id = item.operator_info.category;
      const description = item.operator_info.category_name;
      const name = item.operator_info.category_name;
      if (!groupedData[category]) {
        groupedData[category] = {
          category,
          name,
          description,
          id,
          actions: [],
        };
      }

      groupedData[category].actions.push({
        id: item?.operator_id,
        name: item.name,
        config: item.metadata,
        description: item.name,
        operator: "@operator/" + item?.operator_id,
      });
    });
    const result = Object.values(groupedData);
    return result;
  };

  useEffect(() => {
    const fetchConfig = async () => {
      let newExtensions = defaultExtension;
      // 控制台安全策略屏蔽文本处理，只显示python代码执行
      if (platform === "console") {
        let newExecutors = Internal.executors?.filter((item) => {
          if (item?.name === "ETool" || item?.name === "EText") {
            return true;
          }
          return false;
        });
        Internal.executors = newExecutors;
        Internal.triggers = [];

        let showProperty = false;
        try {
          const { data } = await API.axios.get(
            `${prefixUrl}/api/document/v1/configs/folder_properties_enabled`
          );
          if (data?.folder_properties_enabled === true) {
            showProperty = true;
          }
        } catch (error: any) {
          console.error(error);
        }
        // 非涉密时或未开启文件夹属性开关时屏蔽配额空间、文件格式节点
        if (isSecretMode === false || showProperty === false) {
          const newExecutors = Console.executors?.map((item) => {
            if (item.name === "EDocument") {
              return {
                ...item,
                actions: item.actions.filter((i) => !(i?.group === "security")),
              };
            }
            return item;
          });
          Console.executors = newExecutors;
        } else {
          setConfig((pre) => ({
            ...pre,
            "@anyshare/doc/setallowsuffixdoc": true,
          }));
        }
      }
      if (platform === "operator") {
        let newExecutors = Internal.executors?.filter((item) => {
          if (
            item?.name === "ETool" ||
            item?.name === "结束算子" ||
            item?.name === "EText"
          ) {
            return true;
          }
          return false;
        });
        Internal.executors = newExecutors;
        Internal.triggers = [];

        let showProperty = false;
        try {
          const { data } = await API.axios.get(
            `${prefixUrl}/api/document/v1/configs/folder_properties_enabled`
          );
          if (data?.folder_properties_enabled === true) {
            showProperty = true;
          }
        } catch (error: any) {
          console.error(error);
        }
      }
      // 工作流不显示结束算子
      if (platform === "client") {
        let newExecutors = Internal.executors?.filter((item) => {
          if (item?.name === "结束算子") {
            return false;
          }
          return true;
        });
        Internal.executors = newExecutors;

        try {
          //检测workFLow是否存在
          await API.axios.get(`${prefixUrl}/api/doc-audit-rest/v1/ping`);
          newExtensions = [...newExtensions, Workflow];
          setConfig((pre) => ({
            ...pre,
            "@workflow/approval": true,
          }));
          setExtensions(newExtensions);
        } catch (error) {
          console.warn("未安装workflow");
        }

      }

      // 客户端适配共享配置
      if (
        platform === "client" &&
        microWidgetProps?.config?.shareConfig?.isShowRealnameShare === false
      ) {
        const newExecutors = AnyShare.executors?.map((item) => {
          if (item.name === "EDocument") {
            return {
              ...item,
              actions: item.actions.filter(
                (i) => i.operator !== "@anyshare/file/perm"
              ),
            };
          }
          return item;
        });
        AnyShare.executors = newExecutors;
      }

      try {
        // 获取OCR配置
        const data = await API.axios.get(
          `${prefixUrl}/api/automation/v1/actions`
        );
        setConfig((pre) => ({
          ...pre,
          automateConfig: data?.data,
        }));
        localStorage.setItem("automateConfig", JSON.stringify(data?.data));

        const pyConfig = findConfig(data?.data, "@internal/tool/py3");
        if (!pyConfig?.config || pyConfig?.config?.enable !== true) {
          const newExecutors = Internal.executors?.filter((item) => {
            if (item?.name === "ETool") {
              return false;
            }
            return true;
          });
          Internal.executors = newExecutors;
        } else {
          setConfig((pre) => ({
            ...pre,
            "@internal/tool/py3": true,
          }));
        }

        if (platform === "client") {
          const quotaConfig = findConfig(
            data?.data,
            "@anyshare/doclib/quota-scale"
          );
          if (quotaConfig?.config?.enable === true) {
            newExtensions = [...newExtensions];
            setConfig((pre) => ({
              ...pre,
              "@anyshare/doclib/quota-scale": true,
            }));
          }

          const ocrConfig = findConfig(data?.data, "@anyshare/ocr/general");
          const cognitiveAssistantConfig = findConfig(
            data?.data,
            "@cognitive-assistant/doc-summarize"
          );
          const audio = findConfig(data?.data, "@audio/transfer");

          newExtensions = [...newExtensions, AI];

          if (ocrConfig?.config?.enable === true) {
            setConfig((pre) => ({
              ...pre,
              // 内置OCR只支持图片,fileReader支持pdf
              "@anyshare/ocr/general":
                ocrConfig?.config?.type === "fileReader" ? "fileReader" : "ocr",
            }));
          } else {
            // 未安装第四范式服务则屏蔽所有OCR节点
            const newExecutors = AI.executors?.map((item) => {
              if (item.name === "EAI") {
                return {
                  ...item,
                  actions: item.actions.filter(
                    (i) => i.operator.indexOf("@anyshare/ocr") === -1
                  ),
                };
              }
              return item;
            });
            AI.executors = newExecutors;
          }

          if (cognitiveAssistantConfig?.config?.enable === true) {
            setConfig((pre) => ({
              ...pre,
              "@cognitive-assistant/doc-summarize": true,
            }));
          } else {
            // 从ai模型中屏蔽大模型相关
            const newExecutors = AI.executors?.map((item) => {
              if (item.name === "EAI") {
                return {
                  ...item,
                  actions: item.actions.filter(
                    (i) => i.operator.indexOf("@cognitive-assistant") === -1
                  ),
                };
              }
              return item;
            });
            AI.executors = newExecutors;
          }

          if (audio && audio?.config?.enable !== false) {
            setConfig((pre) => ({
              ...pre,
              "@audio/transfer": true,
            }));
          } else {
            // 从ai模型中屏蔽音频相关
            const newExecutors = AI.executors?.map((item) => {
              if (item.name === "EAI") {
                return {
                  ...item,
                  actions: item.actions.filter(
                    (i) => i.operator.indexOf("@audio/") === -1
                  ),
                };
              }
              return item;
            });
            AI.executors = newExecutors;
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setExtensions(newExtensions);
      }
    };
    // if (typeof isSecretMode === "boolean") {
      fetchConfig();
    // }
  }, [isSecretMode]);

  const outputsFn = (action?: any) => {
    if (isOperator) {
      const responses = action?.config?.api_spec?.responses || [];
      const successRes = responses?.find(
        (item: any) => item.status_code === "200"
      );
      const successResJson =
        successRes?.content["application/json"]?.schema ||
        successRes?.content["application/json"] ||
        {};

      const newSchemas = {
        parameters: successResJson,
        components: action?.config?.api_spec?.components,
      };
      const resolvedParameters = dereference(newSchemas.parameters, newSchemas);
      // console.log(44444, resolvedParameters)
      const fields = convertSchemaToFields(resolvedParameters);
      // console.log(5555555, fields)
      return fields;
      // Object.entries(successResJson?.properties || {}).map(([key, value]:any) => {
      //   return {
      //     key: `.data.${key}`,
      //     name: value?.description,
      //     type: value?.type
      //   };
      // });
    }
    return action.outputs?.map(({ key, name, type }: any) => ({
      key: `.${key}`,
      name,
      type,
    }));
  };

  const configFn = (action?: any) => {
    if (isOperator && action?.config) {
      return JsonSchemaForm(action);
    } else if (action.inputs?.length) {
      return customExecutorConfig(action);
    }
    return undefined;
  };

  const value = useMemo(() => {
    const types: Record<string, [ValueType, Extension]> = {};
    const triggers: Record<string, [TriggerAction, Trigger, Extension]> = {};
    const executors: Record<string, [ExecutorAction, Executor, Extension]> = {};
    const comparators: Record<string, [Comparator, Extension]> = {};
    const dataSources: Record<string, [DataSource, Extension]> = {};

    for (const extension of extensions) {
      extension.types?.forEach((t) => {
        types[t.type] = [t, extension];
      });
      extension.comparators?.forEach((comparator) => {
        comparators[comparator.operator] = [comparator, extension];
      });
      extension.dataSources?.forEach((dataSource) => {
        dataSources[dataSource.operator] = [dataSource, extension];
      });
      extension.executors?.forEach((executor) =>
        executor.actions.forEach((action) => {
          executors[action.operator] = [action, executor, extension];
        })
      );
      extension.triggers?.forEach((trigger) =>
        trigger.actions.forEach((action) => {
          triggers[action.operator] = [action, trigger, extension];
        })
      );
    }

    let operatorExtension: any;

    if (operatorDataSource?.length) {
      operatorExtension = {
        name: "算子数据源",
        triggers: [
          {
            name: "算子数据源",
            extensionName: "dataStudio",
            description: "算子数据源",
            icon: CustomActionSVG,
            actions: [],
          },
        ],
      };

      if (operatorDataSource.length) {
        const trigger: Trigger = {
          name: "算子数据源",
          description: "算子数据源",
          icon: CustomExecutorSVG,
          actions: [],
        };
        for (const action of operatorDataSource) {
          const executorAction: any = {
            name: action.name,
            id: action.operator_id,
            description: action?.metadata?.description,
            icon: CustomActionSVG,
            operator: `@trigger/operator/${action.operator_id}`,
            config: action?.metadata,
          };
          executorAction.outputs = outputsFn(executorAction);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          (executorAction.components = {
            Config: OperatorDataSource(executorAction),
            FormattedInput: customExecutorInput(executorAction),
          }),
            operatorExtension?.triggers[0].actions.push(executorAction);

          // executor.actions.push(executorAction);
          // executors[executorAction.operator] = [executorAction, executor, operatorExtension];
          triggers[executorAction.operator] = [
            executorAction,
            trigger,
            operatorExtension,
          ];
        }
      }
    }
    let customExtension: Extension | undefined;
    if (customExecutors?.length) {
      customExtension = {
        name: "custom",
        executors: [],
      };
      for (const { name, description, actions = [] } of customExecutors) {
        const executor: Executor = {
          name,
          description,
          icon: CustomExecutorSVG,
          actions: [],
        };
        customExtension!.executors!.push(executor);
        if (actions.length) {
          for (const action of actions) {
            const executorAction: any = {
              name: action.name,
              description: action.description,
              outputs: outputsFn(action),
              icon: CustomActionSVG,
              operator: action.operator!,
              components: {
                Config: configFn(action),
                FormattedInput: customExecutorInput(action),
              },
            };

            executor.actions.push(executorAction);
            executors[executorAction.operator] = [
              executorAction,
              executor,
              customExtension,
            ];
          }
        }
      }
    }

    return {
      extensions: [
        ...extensions,
        ...(operatorExtension ? [operatorExtension] : []),
        ...(customExtension ? [customExtension] : []),
      ],
      types,
      triggers,
      executors,
      comparators,
      dataSources,
      customExecutors,
      operatorDataSource,
    };
  }, [extensions, customExecutors]);

  const intl = useIntl();

  const messages = useMemo(() => {
    const mixedMessages = { ...intl.messages };

    let extensions = [...value.extensions];

    // datastudio使用到Cron组件
    if (isDataStudio) {
      extensions = [...extensions, Cron];
    }

    extensions.forEach(({ translations, name }) => {
      if (translations) {
        let translation: Record<string, string> = {};
        if (intl.locale === "en-us") {
          translation = translations?.enUS;
        } else if (intl.locale === "zh-tw") {
          translation = translations?.zhTW;
        } else if (intl.locale === "vi-vn") {
          translation = translations?.viVN;
        } else {
          translation = translations?.zhCN;
        }

        Object.entries(translation || {}).forEach(([key, value]) => {
          mixedMessages[`${ExtensionTranslatePrefix}/${name}/${key}`] = value;
        });
      }
    });
    return mixedMessages;
  }, [intl.locale, intl.messages, value.extensions]);

  return (
    <ExtensionContext.Provider
      value={{
        ...value,
        globalConfig,
        reloadAccessableExecutors,
        reloadOperatorDataSource,
        isDataStudio,
      }}
    >
      <IntlProvider
        locale={intl.locale}
        messages={messages}
        onError={(e) => {
          if (
            process.env.NODE_ENV === "development" &&
            e.code === "MISSING_TRANSLATION" &&
            e.descriptor?.id
          ) {
            const missingMessages =
              (Error as any)[`__${APP_NAME}_MISSING_MESSAGES`] ||
              ((Error as any)[`__${APP_NAME}_MISSING_MESSAGES`] = {});
            const messages =
              missingMessages[intl.locale] ||
              (missingMessages[intl.locale] = {});
            messages[e.descriptor.id!] =
              typeof e.descriptor.defaultMessage === "string"
                ? e.descriptor.defaultMessage
                : "";
          }
        }}
      >
        {children}
      </IntlProvider>
    </ExtensionContext.Provider>
  );
};
