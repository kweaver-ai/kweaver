import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { Button, InputRef, Spin } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { Input } from 'antd';
import DipIcon from '@/components/DipIcon';
import { PlanItemType } from '../';
import { useDipChatStore } from '@/components/DipChat/store';
type PlanItemProps = {
  editable: boolean;
  disabledDelete: boolean;
  deleteItem: () => void;
  onClick: () => void;
  onChange: (planText: string) => void;
  planItem: PlanItemType;
  isLastChatItem: boolean;
};
const PlanItem = ({
  editable,
  deleteItem,
  onClick,
  onChange,
  planItem,
  disabledDelete,
  isLastChatItem,
}: PlanItemProps) => {
  const {
    dipChatStore: { streamGenerating, scrollIntoViewPlanId },
  } = useDipChatStore();
  const [editPlan, setEditPlan] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: planItem.id });
  const inputRef = useRef<InputRef>(null);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (editPlan) {
      inputRef.current!.focus({
        cursor: 'end',
      });
    }
  }, [editPlan]);

  const renderIcon = () => {
    if (editable) {
      return <Button type="text" {...listeners} icon={<DipIcon style={{ color: '#BAC2D6' }} type="icon-dip-move" />} />;
    }
    if (streamGenerating && planItem.loading && isLastChatItem) {
      return <Spin size="small" />;
    }
    if (planItem.finished) {
      return <DipIcon style={{ fontSize: 20 }} type="icon-dip-color-success" />;
    }
  };
  const planItemClick = () => {
    if (editable) {
      setEditPlan(true);
    } else {
      if (planItem.finished || planItem.loading) {
        onClick?.();
      }
    }
  };
  return (
    <div className="dip-flex dip-mb-12" ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={planItemClick}
        className={classNames(styles.container, 'plan-item dip-flex-item-full-width dip-flex-align-center', {
          [styles.active]: scrollIntoViewPlanId === planItem.id,
        })}
      >
        {renderIcon()}
        <div className="dip-flex-item-full-width">
          {editPlan ? (
            <Input.TextArea
              ref={inputRef}
              style={{ padding: 0, marginLeft: 8 }}
              variant="borderless"
              value={planItem.text}
              onChange={e => {
                onChange?.(e.target.value);
              }}
              onBlur={() => {
                setEditPlan(false);
                if (!planItem.text && !disabledDelete) {
                  deleteItem();
                }
              }}
              autoSize
              placeholder="请输入计划"
            />
          ) : (
            <div className="dip-ellipsis dip-ml-8 dip-w-100" title={planItem.text}>
              {planItem.text}
            </div>
          )}
        </div>
      </div>
      {editable && !disabledDelete && (
        <div className={classNames(styles.deleteBtn, 'dip-flex-center dip-ml-8')}>
          <Button
            type="text"
            onClick={() => {
              deleteItem?.();
            }}
            icon={<DipIcon type="icon-dip-trash" />}
          />
        </div>
      )}
    </div>
  );
};

export default PlanItem;
