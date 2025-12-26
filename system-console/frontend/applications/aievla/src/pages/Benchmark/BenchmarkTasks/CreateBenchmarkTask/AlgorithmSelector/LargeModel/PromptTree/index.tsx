import { useState } from 'react';

import _ from 'lodash';
import { Select } from 'antd';
import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';
import ErrorTip from '@/components/ErrorTip';

import AddPromptModal from '../AddPromptModal';
import './style.less';

const PromptTree = (props: any) => {
  const { childError, onChildChange, node, disabled, prompt_name } = props;

  const [promptModal, setPromptModal] = useState(false); // 提示词弹框

  /**
   * 取消弹窗
   */
  const onCancel = () => {
    setPromptModal(false);
  };

  /**
   * 确认
   */
  const onAddPrompt = (selectedPrompt: any) => {
    onChildChange({ prompt_id: selectedPrompt?.prompt_id, prompt_name: selectedPrompt?.prompt_name });
    setPromptModal(false);
  };

  return (
    <div className='benchmark-task-large-model-prompt-select-root'>
      <ErrorTip errorText={childError}>
        <Select
          placeholder={intl.get('benchmarkTask.selectPrompt')}
          style={{ width: 273 }}
          disabled={disabled}
          suffixIcon={<IconFont type='icon-xuanze1' style={{ color: '#000000d9' }} onClick={() => setPromptModal(true)} />}
          onClick={() => setPromptModal(true)}
          value={prompt_name || undefined}
          open={false}
        />
      </ErrorTip>
      <AddPromptModal treeNode={node} open={promptModal} onAddPrompt={onAddPrompt} onClose={onCancel} disabled={disabled} />
    </div>
  );
};

export default PromptTree;
