import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExecutorAction,
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { Form, Input, Select } from "antd";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { DefaultOptionType } from "antd/lib/select";
import { API } from "@applet/common";
import { FormItem } from "../../components/editor/form-item";
import AgentSVG from "./assets/agent.svg";
import { debounce, last, sum, unionBy } from "lodash";
import EditorWithMentions from "./editor-with-mentions";

export interface CallAgentParameters {
  agent_id: string;
  inputs: Record<string, any>;
}

export interface InputField {
  name: string;
  type: string;
}

export interface OutputAnswer {
  name: string;
  type: string;
  from: string;
}

export const CallAgentConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<CallAgentParameters>
>(
  (
    {
      t,
      parameters = {
        agent_id: undefined,
        inputs: {},
      },
      onChange,
    },
    ref
  ) => {
    const [form] = Form.useForm<CallAgentParameters>();
    const agentVersion = useRef<string>('');
    const currentAgentIdRef = useRef(parameters.agent_id);
    const [selectedAgentInfo, setSelectedAgentInfo] = useState<any>(null);

    useImperativeHandle(ref, () => {
      return {
        validate() {
          return form.validateFields().then(
            () => true,
            () => false
          );
        },
      };
    });

    // 修复：使用稳定的selectedAgentInfo作为依赖，避免重复调用
    const { data: current } = useSWR<any>(
      selectedAgentInfo ? 
        `/api/agent-factory/v3/agent-market/agent/${selectedAgentInfo.id}/version/${selectedAgentInfo.version}` 
        : null,
      async (url) => {
        if (!selectedAgentInfo) return;
        const { data } = await API.axios.get(url);
        return data;
      },
      {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnMount: true,
      }
    );

    const isLastPage = useRef<Boolean>(false);
    const [query, setQuery] = useState("");
    const paginationMarkerStr = useRef<string>('');

    const { data, size, setSize, isValidating, error } = useSWRInfinite<
      DefaultOptionType[]
    >(
      (index) => [`/api/agent-factory/v3/published/agent`, index + 1, query],
      async (url: string, page: number, query: string) => {
        const { data } = await API.axios.post(url, {
            size: 30,
            name: query,
            pagination_marker_str: paginationMarkerStr.current,
        });

        const options: DefaultOptionType[] = [];
        if (data.entries?.length) {
          for (const skill of data.entries) {
            options.push({
              value: skill.id,
              label: skill.name,
              version: skill.version,
            });
          }
        }

        isLastPage.current = data?.is_last_page;
        paginationMarkerStr.current = data?.pagination_marker_str;
        return options;
      }
    );

    const agentOptions = useMemo(() => {
      return unionBy(data?.flat() || [], "value");
    }, [data]);

    useLayoutEffect(() => {
      // 检查当前 agent_id 是否存在于选项列表中
      const isValidAgent = agentOptions.some(
        (option) => option.value === parameters.agent_id
      );
      
      if (isValidAgent && parameters.agent_id) {
        const result = agentOptions.find(
          (item) => item.value === parameters.agent_id
        );
        
        // 只有当agent_id或version真正变化时才更新selectedAgentInfo
        if (result && (selectedAgentInfo?.id !== result.value || selectedAgentInfo?.version !== result.version)) {
          setSelectedAgentInfo({
            id: result.value,
            version: result.version
          });
          agentVersion.current = result.version;
        }
        
        form.setFieldsValue(parameters);
      } else {
        // 无效的agent_id，清空
        const valuesToSet = { ...parameters, agent_id: undefined, inputs: undefined };
        form.setFieldsValue(valuesToSet);
        setSelectedAgentInfo(null);
        agentVersion.current = '';
      }
      
      currentAgentIdRef.current = parameters.agent_id;
    }, [form, parameters, agentOptions]);

    // 修复：在表单变化时同步更新selectedAgentInfo
    const handleFormChange = useCallback((changedFields: any[], allFields: any[]) => {
      const values = form.getFieldsValue();
      
      if (values.agent_id !== currentAgentIdRef.current) {
        // 找到新选择的agent信息
        const newAgent = agentOptions.find(option => option.value === values.agent_id);
        if (newAgent) {
          setSelectedAgentInfo({
            id: newAgent.value,
            version: newAgent.version
          });
          agentVersion.current = newAgent.version;
        }
        
        onChange({ agent_id: values.agent_id, inputs: {} });
        form.setFieldValue("inputs", {});
        currentAgentIdRef.current = values.agent_id;
      } else {
        onChange(values);
      }
    }, [form, agentOptions, onChange]);

    const handleScroll = useCallback(
      (e: any) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        const isBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (
          isBottom &&
          !isValidating &&
          !error &&
          !isLastPage.current
        ) {
          setSize((size) => size + 1);
        }
      },
      [isValidating, error, setSize]
    );

    const [searchValue, setSearchValue] = useState("");
    const onSearch = useMemo(
      () =>
        debounce((value) => {
          isLastPage.current = false;
          paginationMarkerStr.current = '';
          setQuery(value);
        }, 500),
      []
    );

    const textAreaContent = (data: any, itemName: any) => {
     form.setFieldValue(itemName, data);
    };

    return (
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={parameters}
        onFieldsChange={handleFormChange} // 使用修复后的处理函数
      >
        <FormItem
          label={t("agent", "Agent")}
          name="agent_id"
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}
        >
          <Select
            loading={isValidating}
            allowClear
            showSearch
            filterOption={false}
            searchValue={searchValue}
            onSearch={(value) => {
              setSearchValue(value);
              onSearch(value);
            }}
            options={agentOptions}
            onPopupScroll={handleScroll}
            placeholder={t("modelPlaceholder", "请选择")}
          />
        </FormItem>
        {current?.config?.input?.fields?.map((field: any) => {
          if (["history", "tool", "header", "self_config"].includes(field.name))
            return null;
          const fieldName = field.name as string;
          return (
            <FormItem
              key={field.name}
              label={field.name}
              name={["inputs", field.name]}
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
            >
               <EditorWithMentions 
                 onChange={textAreaContent} 
                 parameters={(parameters?.inputs as Record<string, string> | undefined)?.[fieldName] || ''} 
                 itemName={["inputs", field.name]} 
               />
            </FormItem>
          );
        })}
      </Form>
    );
  }
);

export const CallAgentAction: ExecutorAction = {
  name: "EACallAgent",
  description: "EACallAgentDescription",
  operator: "@anydata/call-agent",
  icon: AgentSVG,
  outputs: [
    {
      key: ".answer",
      type: "string",
      name: "EACallAgentOutputAnswer",
    },
    {
      key: ".think",
      type: "string",
      name: "EACallAgentOutputThink",
    },
    {
      key: ".block_answer",
      type: "string",
      name: "EACallAgentOutputBlockAnswer",
    },
    {
      key: ".json",
      type: "any",
      name: "EACallAgentOutputAnswerJson",
    },
  ],
  components: {
    Config: CallAgentConfig,
  },
};
