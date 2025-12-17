import { Bubble } from '@ant-design/x';
import styles from './index.module.less';
import PlanPanel from './PlanPanel';
import UserPanel from './UserPanel';
import PlanReportPanel from './PlanReportPanel';
import ErrorPanel from './ErrorPanel';
import CommonPanel from './CommonPanel';
import { useDipChatStore } from '@/components/DipChat/store';
import { DipChatItem } from '@/components/DipChat/interface';
type BubbleListProps = {
  readOnly?: boolean;
};
const BubbleList = ({ readOnly = false }: BubbleListProps) => {
  const {
    dipChatStore: { chatList },
  } = useDipChatStore();
  const roles: any = (chatItem: DipChatItem, chatItemIndex: number) => {
    if (chatItem.error) {
      return {
        placement: 'start',
        variant: 'borderless',
        messageRender: () => {
          return <ErrorPanel chatItemIndex={chatItemIndex} />;
        },
      };
    }
    if (chatItem.role === 'user') {
      return {
        placement: 'end',
        variant: 'borderless',
        messageRender: () => {
          return <UserPanel chatItemIndex={chatItemIndex} readOnly={readOnly} />;
        },
      };
    }
    if (chatItem.role === 'plan') {
      return {
        placement: 'start',
        variant: 'borderless',
        messageRender: () => {
          return <PlanPanel type="chat" chatItemIndex={chatItemIndex} />;
        },
      };
    }
    if (chatItem.role === 'plan-report') {
      return {
        placement: 'start',
        variant: 'borderless',
        messageRender: () => {
          return <PlanReportPanel chatItemIndex={chatItemIndex} />;
        },
      };
    }
    if (chatItem.role === 'wenshu' || chatItem.role === 'common' || chatItem.role === 'net') {
      return {
        placement: 'start',
        variant: 'borderless',
        messageRender: () => {
          return <CommonPanel chatItemIndex={chatItemIndex} readOnly={readOnly} />;
        },
      };
    }
  };
  return (
    <div className={styles.bubbleList}>
      <Bubble.List items={chatList} roles={roles} />
    </div>
  );
};

export default BubbleList;
