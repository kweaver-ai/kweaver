import React, { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Checkbox, Form, Input, Radio, Space } from 'antd';

import UniversalModal from '@/components/UniversalModal';

import './style.less';

const uploadFilesInitData = {};

export interface UploadFilesTipModalProps {
  className?: string;
  value: any;
  type: any;
  // onSetUploadFileOperationType: any;
  isAll: any;
  setIsAll: any;
}

export const existSourceOperation = {
  retain: 'retain',
  replace: 'replace',
  cancel: 'cancel',
  consistent: 'consistent',
};

const existSourceTip = [
  {
    title: '目标位置已存在同名文件',
    tip: '您可以将当前文件“xxxx.json”做如下处理：',
    operationList: [
      { value: existSourceOperation.retain, label: '同时保留两个文档，当前文件重命名为“xxxx(2).json”' },
      { value: existSourceOperation.replace, label: '上传并替换，使用当前文件覆盖同名文件' },
      { value: existSourceOperation.cancel, label: '取消当前文件的上传' },
    ],
  },
  {
    title: '目标位置已存在同名文件夹',
    tip: '您可以将当前文件夹“xxxx”做如下处理：',
    operationList: [
      { value: existSourceOperation.retain, label: '同时保留两个文档，当前文件夹重命名为“xxxx(2)”' },
      { value: existSourceOperation.replace, label: '上传并替换，使用当前文件夹覆盖同名文件夹' },
      { value: existSourceOperation.cancel, label: '取消当前文件夹的上传' },
    ],
  },
];

const UploadFilesTipModal = (props: UploadFilesTipModalProps) => {
  const { value, type = 'file', isAll, setIsAll } = props;
  const curTip = type === 'file' ? existSourceTip[0] : existSourceTip[1];

  useEffect(() => {
    return () => {
      value.current = 'retain';
    };
  }, []);

  return (
    <div className='uploadFilesTipModal-content'>
      <div className='modal-title ad-format-text-no-height-3 ad-format-strong-6 ad-c-header'>{'提示'}</div>
      <div>
        <div className='title'>{curTip.title}</div>
        <div className='sub-title'>{curTip.tip}</div>

        <Radio.Group
          onChange={e => {
            console.log('eeeeeeeee', e.target.value);
            value.current = e.target.value;
          }}
          defaultValue={value.current}
          className='ad-mt-3'
        >
          <Space direction='vertical' size={[0, 12]}>
            {curTip.operationList?.map(item => {
              return (
                <Radio key={item.value} value={item.value} className='item'>
                  {item.label}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </div>

      {type === 'file' ? (
        <Checkbox
          onChange={e => {
            setIsAll(() => e.target.checked);
          }}
          className='checkbox'
        >
          {'为之后所有的相同冲突执行此操作'}
        </Checkbox>
      ) : null}
    </div>
  );
};

export default UploadFilesTipModal;
