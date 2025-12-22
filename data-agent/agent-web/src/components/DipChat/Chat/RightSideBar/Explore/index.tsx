import React, { useEffect, useRef } from 'react';
import styles from './index.module.less';
import classNames from 'classnames';
import { CloseOutlined } from '@ant-design/icons';
import { useDipChatStore } from '../../../store';
import ExploreItem from './ExploreItem';
import ScrollBarContainer from '@/components/ScrollBarContainer';
import PlanPanel, { PlanItemType } from '../../BubbleList/PlanPanel';
import { useDeepCompareMemo } from '@/hooks';
import { scrollIntoViewForContainer } from '@/utils/handle-function';
import DipButton from '@/components/DipButton';
import ResizeObserver from '@/components/ResizeObserver';
const Explore = () => {
  const {
    dipChatStore: { chatList, activeChatItemIndex, executePlanItemIndex, scrollIntoViewPlanId, streamGenerating },
    closeSideBar,
    getDipChatStore,
  } = useDipChatStore();
  const chatItem = chatList[activeChatItemIndex];
  const planList: PlanItemType[] = chatItem?.content ?? [];

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const exploreData: PlanItemType[] = useDeepCompareMemo(() => {
    if (Array.isArray(planList)) {
      if (executePlanItemIndex !== -1 && planList.length > 0) {
        const planItem: PlanItemType = planList[executePlanItemIndex];
        return [planItem];
      }
      return planList?.filter(item => item.finished);
    }
    return [];
  }, [planList, executePlanItemIndex]);

  useEffect(() => {
    if (scrollIntoViewPlanId && scrollContainerRef.current) {
      const ele = document.getElementById(scrollIntoViewPlanId);
      scrollIntoViewForContainer(scrollContainerRef.current!, ele!);
    }
  }, [scrollIntoViewPlanId]);

  const isRenderConfirmPlan = () => {
    if (!streamGenerating && executePlanItemIndex === -1 && chatItem.confirm && !chatItem.cancel) {
      const unFinishPlanIndex = planList.findIndex(plan => !plan.finished);
      if (unFinishPlanIndex !== -1) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className={classNames(styles.container, 'dip-full dip-pt-20 dip-flex-column')}>
      <div className="dip-flex-space-between dip-pl-24 dip-pr-24">
        <span className="dip-font-16 dip-text-color dip-font-weight-700">探索中</span>
        <DipButton
          size="small"
          type="text"
          onClick={() => {
            closeSideBar();
          }}
        >
          <CloseOutlined className="dip-text-color-45 dip-font-16" />
        </DipButton>
      </div>
      <ScrollBarContainer
        ref={scrollContainerRef}
        className={classNames('dip-pt-16 dip-pl-24 dip-pr-24 dip-flex-item-full-height', {
          'dip-flex-column': exploreData.length > 1,
        })}
      >
        <ResizeObserver
          onResize={() => {
            const { executePlanItemIndex } = getDipChatStore();
            if (executePlanItemIndex === -1) {
              scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
            }
          }}
        >
          <div
            className={classNames('dip-pb-24', {
              'dip-h-100 dip-flex-column': exploreData.length === 1 && !isRenderConfirmPlan(),
            })}
          >
            {exploreData.map((item, index) => (
              <>
                <div
                  id={item.id}
                  key={item.id}
                  className={classNames(styles.item, {
                    'dip-flex-item-full-height': exploreData.length === 1,
                  })}
                >
                  <ExploreItem planItem={item} />
                </div>
                {index !== exploreData.length - 1 && (
                  <div key={index} className={styles.lineWrapper}>
                    <div className={styles.line} />
                  </div>
                )}
              </>
            ))}
            {isRenderConfirmPlan() && (
              <div className={classNames(styles.item, 'dip-mt-24')}>
                <PlanPanel type="explore" chatItemIndex={activeChatItemIndex} />
              </div>
            )}
          </div>
        </ResizeObserver>
      </ScrollBarContainer>
    </div>
  );
};

export default Explore;
