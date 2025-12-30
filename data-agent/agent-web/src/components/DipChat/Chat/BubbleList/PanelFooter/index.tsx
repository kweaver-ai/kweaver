import { type CSSProperties } from 'react';
import { Button, message, Statistic, Tooltip } from 'antd';
import DipIcon from '@/components/DipIcon';
import { useDipChatStore } from '@/components/DipChat/store';
import { copyToBoard } from '@/utils/handle-function';
import classNames from 'classnames';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import '@vavt/rt-extension/lib/asset/ExportPDF.css';
import { getChatItemRoleByMode } from '@/components/DipChat/utils';
import { getConversationDetailsById } from '@/apis/super-assistant';
import dayjs from 'dayjs';

type PanelFooterProps = {
  chatItemIndex: number;
  className?: string;
  onExport?: () => void;
  onEdit?: () => void;
  style?: CSSProperties;
};
const PanelFooter = ({ chatItemIndex, className, onExport, onEdit }: PanelFooterProps) => {
  const {
    dipChatStore: { chatList, aiInputValue, streamGenerating, agentAppType, debug, agentAppKey, activeConversationKey },
    sendChat,
    closeSideBar,
  } = useDipChatStore();
  const [messageApi, contextHolder] = message.useMessage();
  const chatItem = chatList[chatItemIndex];

  const reStart = async () => {
    const newChatList = _.cloneDeep(chatList);
    let regenerate_assistant_message_id;
    if (chatItem.error) {
      // 报错的会话，regenerate_assistant_message_id需要调用详情接口去查
      const res: any = await getConversationDetailsById(agentAppKey, activeConversationKey);
      if (res && res.Messages) {
        const data = res.Messages[chatItemIndex];
        if (data) {
          regenerate_assistant_message_id = data.id;
        }
      }
    } else {
      regenerate_assistant_message_id = chatItem.key;
    }
    if (!regenerate_assistant_message_id) {
      return;
    }
    const lastChatItem = chatList[chatItemIndex - 1];
    const query = lastChatItem.content;
    const fileList: any = lastChatItem.fileList ?? [];
    newChatList.splice(chatItemIndex - 1);
    newChatList.push({
      key: nanoid(),
      role: 'user',
      content: query,
      loading: false,
      fileList,
      updateTime: dayjs().valueOf(),
    });
    newChatList.push({
      key: nanoid(),
      role: getChatItemRoleByMode(aiInputValue.mode, agentAppType),
      content: '',
      loading: true,
    });
    const body: any = {
      query,
      regenerate_assistant_message_id,
    };
    if (fileList.length > 0) {
      // 说明有文件
      body.temp_files = fileList.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
      }));
    }
    closeSideBar();
    sendChat({
      chatList: newChatList,
      body,
    });
  };

  const copy = async (text: string) => {
    const res = await copyToBoard(text);
    if (res) {
      messageApi.success('复制成功');
    }
  };

  const exportBtn = async () => {
    // const markdownContent = chatItem.content;
    // console.log(markdownContent, 'markdownContent');
    onExport?.();
  };

  const renderRestartBtn = () => {
    if (!['plan-report', 'user'].includes(chatItem.role) && chatItemIndex === chatList.length - 1) {
      return (
        <Tooltip title="重新生成">
          <Button
            onClick={reStart}
            size="small"
            type="text"
            icon={<DipIcon className="dip-text-color-45" type="icon-dip-refresh" />}
          />
        </Tooltip>
      );
    }
  };

  const renderEditBtn = () => {
    const lastUserChatItemIndex = chatList.findLastIndex(item => item.role === 'user');
    if (['user'].includes(chatItem.role) && chatItemIndex === lastUserChatItemIndex) {
      return (
        <Tooltip title="编辑">
          <Button
            onClick={onEdit}
            size="small"
            type="text"
            icon={<DipIcon className="dip-text-color-45" type="icon-dip-bianji" />}
          />
        </Tooltip>
      );
    }
  };

  const renderCopyBtn = () => {
    if (chatItem.role !== 'plan' && !chatItem.error) {
      let text = '';
      if (chatItem.role === 'net') {
        text = chatItem.content.result;
      }
      if (chatItem.role === 'common') {
        chatItem.content?.progress?.forEach((item: any) => {
          if (item.type === 'llm' && item.llmResult?.text) {
            text += `${text ? '\n' : ''}${item.llmResult?.text}`;
          }
        });
      }
      if (chatItem.role === 'plan-report') {
        text = chatItem.content;
      }
      if (chatItem.role === 'user') {
        text = chatItem.content;
      }
      if (text) {
        return (
          <Tooltip title="复制">
            <Button
              onClick={() => copy(text)}
              size="small"
              type="text"
              icon={<DipIcon className="dip-text-color-45" type="icon-dip-copy" />}
            />
          </Tooltip>
        );
      }
    }
  };

  const renderExportBtn = () => {
    if (chatItem.role === 'plan-report') {
      return (
        <Tooltip title="导出">
          {/* <ExportPDF value={chatItem.content} />*/}
          <Button
            onClick={exportBtn}
            size="small"
            type="text"
            icon={<DipIcon className="dip-text-color-65" type="icon-dip-daochu" />}
          />
        </Tooltip>
      );
    }
  };

  const renderTimeTokens = () => {
    if (chatItem.role !== 'user' && chatItemIndex === chatList.length - 1) {
      const content = [];
      if (chatItem.content?.totalTime) {
        content.push(<span>耗时：{chatItem.content?.totalTime}s</span>);
      }
      if (chatItem.content?.totalTime) {
        content.push(
          <span className="dip-ml-8 dip-flex-align-center">
            Token：
            <Statistic valueStyle={{ color: 'rgba(0,0,0,.45)', fontSize: 12 }} value={chatItem.content?.totalTokens} />
          </span>
        );
      }
      if (content.length > 0) {
        return (
          <Tooltip title={`首Token延迟 ${chatItem.content?.ttftTime} ms`}>
            <span className="dip-flex-align-center dip-text-color-45 dip-font-12">{content}</span>
          </Tooltip>
        );
      }
      return null;
    }
  };

  return (
    !streamGenerating && (
      <div className={classNames(className, 'dip-flex-space-between')}>
        <span className="dip-flex-align-center">
          {!debug && renderRestartBtn()}

          {!debug && renderEditBtn()}

          {renderCopyBtn()}

          {renderExportBtn()}
        </span>
        {renderTimeTokens()}
        {contextHolder}
      </div>
    )
  );
};

export default PanelFooter;
