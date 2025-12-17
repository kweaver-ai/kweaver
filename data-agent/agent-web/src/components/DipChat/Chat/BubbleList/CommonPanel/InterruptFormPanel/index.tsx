import { useDipChatStore } from '@/components/DipChat/store';
import { Button, Form, Input } from 'antd';
import { useDeepCompareMemo } from '@/hooks';
import _ from 'lodash';
import { AdMonacoEditor } from '@/components/Editor/AdMonacoEditor';
import React from 'react';

const FormItem = Form.Item;
type FieldType = {
  key: string;
  value: string;
  type: string;
};
const InterruptFormPanel = ({ chatItemIndex }: any) => {
  const {
    dipChatStore: { chatList },
    sendChat,
    getDipChatStore,
  } = useDipChatStore();
  const chatItem = chatList[chatItemIndex];
  const { interrupt } = chatItem;
  const [form] = Form.useForm();

  const fields: FieldType[] = useDeepCompareMemo(() => {
    let tempArr: any = [];
    const loop = (tool_args: any[]) => {
      // 先判断传进来的数组要不要执行深度递归
      // 如果元素的key: 'tool’并且 value.tool_args有值 则忽略其他元素，直接深度递归
      const targetArg = tool_args.find(
        (arg: any) => arg.key === 'tool' && Array.isArray(_.get(arg, 'value.tool_args'))
      );
      if (targetArg) {
        const args = _.get(targetArg, 'value.tool_args');
        if (args.length > 0) {
          loop(args);
        }
      } else {
        // 此时说明不需要深度递归，那么直接渲染即可
        tempArr = [...tempArr, ...tool_args];
      }
    };
    loop(interrupt!.tool_args);
    return tempArr;
  }, [interrupt]);

  const renderInput = (item: FieldType) => {
    if (item.type === 'string') {
      return <Input.TextArea autoSize={{ minRows: 1, maxRows: 5 }} placeholder={`请输入${item.key}`} />;
    }
    if (item.type === 'object') {
      return (
        <AdMonacoEditor
          placeholder={`请输入${item.key}`}
          bordered
          height="auto"
          minHeight={66}
          maxHeight={260}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            tabSize: 2,
            insertSpaces: true,
            readOnly: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false, // 禁用Monaco的默认滚轮事件
            },
            lineNumbersMinChars: 4,
            unicodeHighlight: {
              ambiguousCharacters: false, // 关闭中文符号高亮报警
            },
            // 关闭智能提示
            suggestOnTriggerCharacters: false, // 禁用触发字符的建议
            quickSuggestions: false, // 禁用快速建议
            parameterHints: { enabled: false }, // 禁用参数提示
            hover: { enabled: false }, // 禁用悬停提示
            wordBasedSuggestions: false, // 禁用基于单词的建议
            snippetSuggestions: 'none', // 禁用代码片段建议
          }}
        />
      );
    }
    return <Input.TextArea autoSize={{ minRows: 1, maxRows: 5 }} placeholder={`请输入${item.key}`} />;
  };

  const updateInterrupt = () => {
    const formValues = form.getFieldsValue();
    const newInterrupt = _.cloneDeep(interrupt);
    const loop = (tool_args: any[]) => {
      // 先判断传进来的数组要不要执行深度递归
      // 如果元素的key: 'tool’并且 value.tool_args有值 则忽略其他元素，直接深度递归
      const targetArg = tool_args.find(
        (arg: any) => arg.key === 'tool' && Array.isArray(_.get(arg, 'value.tool_args'))
      );
      if (targetArg) {
        const args = _.get(targetArg, 'value.tool_args');
        if (args.length > 0) {
          loop(args);
        }
      } else {
        // 此时说明不需要深度递归，找到了目标元素，直接修改
        tool_args.forEach((arg: any) => {
          arg.value = formValues[arg.key] ?? arg.value;
        });
      }
    };
    loop(newInterrupt!.tool_args);
    // console.log(newInterrupt, 'newInterrupt');
    const userChatItem = chatList[chatItemIndex - 1];
    // console.log(userChatItem, 'userChatItem');
    // newChatList.push({
    //   key: nanoid(),
    //   role: getChatItemRoleByMode(aiInputValue.mode, agentAppType),
    //   content: '',
    //   loading: true,
    // });
    const reqBody: any = {
      query: chatList[chatItemIndex - 1].content,
      tool: newInterrupt,
      interrupted_assistant_message_id: chatItem.key,
    };
    if (userChatItem.fileList) {
      reqBody.temp_files = userChatItem.fileList.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
      }));
    }
    sendChat({
      // chatList: newChatList,
      body: reqBody,
    });
  };

  return (
    <Form colon form={form} layout="vertical" onFinish={updateInterrupt}>
      {fields.map((item: FieldType) => (
        <FormItem key={item.key} label={item.key} name={item.key} initialValue={item.value}>
          {renderInput(item)}
        </FormItem>
      ))}
      <div className="dip-flex-space-between">
        <span />
        <Button
          type="primary"
          onClick={() => {
            form.submit();
          }}
        >
          确认
        </Button>
      </div>
    </Form>
  );
};

export default InterruptFormPanel;
