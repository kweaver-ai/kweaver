import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Input } from 'antd';

import UniversalModal from '@/components/UniversalModal';
import TipModal from '@/components/TipModal';

export interface CreateVersionModalProps {
  className?: string;
  versionValue: string;
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const CreateVersionModal = (props: CreateVersionModalProps) => {
  const { versionValue, visible, onOk, onCancel } = props;

  return (
    <TipModal
      title={intl.get('dataSet.operate')}
      width={424}
      onOk={onOk}
      onCancel={onCancel}
      visible={visible}
      className='dataSet-createversion-modal'
      content={intl.get('dataSet.operateAddVerTip')}
      closable={true}
      // title={intl.get('dataSet.manage.createVersionTip').split('\n')[0]}
      // footerData={[
      //   { label: intl.get('global.cancel'), onHandle: onCancel },
      //   { label: intl.get('global.ok'), type: 'primary', onHandle: onOk }
      // ]}
    >
      {/* <Form layout="vertical" autoComplete="off" initialValues={{ version: versionValue }}>
        <Form.Item
          name="version"
          label={intl.get('dataSet.manage.createVersionTip').split('\n')[1]}
          required
          className="ad-mb-0"
        >
          <Input disabled />
        </Form.Item>
      </Form> */}
    </TipModal>
  );
};

export default CreateVersionModal;
