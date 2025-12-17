import React, { useState } from 'react';
// import styles from './index.module.less';
import DipModal from '@/components/DipModal';
import Markdown from '@/components/Markdown';
const MarkdownEditorModal = ({ onClose, markdownText, onOk }: any) => {
  const [value, setValue] = useState(markdownText);

  return (
    <DipModal
      title="编辑结果"
      onCancel={onClose}
      open
      fullScreen
      onOk={() => {
        onOk?.(value);
      }}
    >
      <Markdown
        value={value}
        onChange={v => {
          setValue(v);
        }}
        className="dip-full"
      />
    </DipModal>
  );
};

export default function MarkdownEditorModalWrapper({ open, ...restProps }: any) {
  return open && <MarkdownEditorModal {...restProps} />;
}
