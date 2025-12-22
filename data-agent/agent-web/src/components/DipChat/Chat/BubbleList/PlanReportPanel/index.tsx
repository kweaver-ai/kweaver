import styles from './index.module.less';
import React, { useRef, useState } from 'react';
import { useDipChatStore } from '@/components/DipChat/store';
import ShinyText from '@/components/animation/ShinyText';
import Markdown from '@/components/Markdown';
import classNames from 'classnames';
import PanelFooter from '../PanelFooter';

// @ts-expect-error
import html3pdf from 'html3pdf';
import dayjs from 'dayjs';
import { Progress } from 'antd';

const AiPanel = ({ chatItemIndex }: any) => {
  const {
    dipChatStore: { chatList },
  } = useDipChatStore();
  const chatItem = chatList[chatItemIndex];
  const { generating, content } = chatItem;
  const domRef = useRef<HTMLDivElement | null>(null);
  const [process, setProcess] = useState(0);

  const onExport = () => {
    if (domRef.current) {
      setProcess(0.35);
      const opt = {
        margin: 8,
        filename: `报告${dayjs().format('YYYYMMDDHHmmss')}.pdf`,
        html2canvas: {
          scale: 3,
          useCORS: true,
        },
        pagesPerCanvas: navigator.userAgent.includes('Chrome') ? 19 : 9,
        pagebreak: { mode: 'avoid-all' },
      };
      const pdf = html3pdf().set(opt).from(domRef.current);
      pdf.then(() => {
        pdf.save().listen(({ ratio }: any) => {
          console.log(ratio, 'progress');
          setProcess(ratio);
        });
      });
    }
  };

  const renderTitle = () => {
    if (generating) {
      return <ShinyText className="dip-ml-8 dip-flex-item-full-width dip-ellipsis" text="报告正在生成中，请稍候..." />;
    }
    return <div className="dip-ml-8 dip-flex-item-full-width dip-ellipsis">报告已生成</div>;
  };

  const renderFooter = () => {
    if (process > 0 && process < 1) {
      return (
        <div className="dip-w-100 dip-flex">
          <div className="dip-mt-8 dip-flex-align-center">
            <Progress
              size={20}
              strokeWidth={16}
              type="circle"
              format={number => `进行中，已完成${number}%`}
              percent={process * 100}
            />
            <span className="dip-ml-8 dip-font-12 dip-text-color-65">导出中，请稍候...</span>
          </div>
        </div>
      );
    }
    if (!generating) {
      return <PanelFooter className="dip-mt-8" chatItemIndex={chatItemIndex} onExport={onExport} />;
    }
  };
  const renderContent = () => {
    if (chatItem.cancel) {
      return <div className="dip-text-color-45">已停止输出</div>;
    }
    return (
      <div>
        {/* <div className="dip-flex-align-center">*/}
        {/*  <Logo loading={generating} />*/}
        {/*  {renderTitle()}*/}
        {/* </div>*/}
        <div className={classNames(styles.reportContainer)}>
          <div className={classNames(styles.report)}>
            <div ref={domRef}>
              <Markdown value={content.markdownText} readOnly />
            </div>
          </div>
          {renderFooter()}
        </div>
      </div>
    );
  };
  return renderContent();
};

export default AiPanel;
