/**
 * 顶部步骤条
 */
import { memo } from 'react';

import AdExitBar from '@/components/AdExitBar/AdExitBar';

import './style.less';

export interface TopStepsProps {
  step?: number;
  title?: string;
  isHideStep?: boolean;
  exitText?: string;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { title = '', exitText, onExit } = props;

  return (
    <div className='dataSet-config-top-exit-root'>
      <AdExitBar style={{ height: 48, border: 0 }} exitText={exitText} onExit={onExit} title={title} />
    </div>
  );
};

export default memo(TopSteps);
