import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { Modal, Radio } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import FuncIcon from '@/assets/icons/func.svg';
import FlowIcon from '@/assets/icons/flow.svg';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import styles from './CreateOperatorModal.module.less';

interface CreateToolBoxModalProps {
  onOpenFlowEditor: () => void; // 打开流程编辑器事件回调

  onOpenCreateOperatorPage: () => void; // 打开ide新建算子页面事件回调
  onCancel: () => void;
}

enum CreateMetadataTypeEnum {
  Function = MetadataTypeEnum.Function,
  Flow = 'flow',
}

const CreateOperatorModal: React.FC<CreateToolBoxModalProps> = ({
  onCancel,
  onOpenFlowEditor,
  onOpenCreateOperatorPage,
}) => {
  const [metadataType, setMetadataType] = useState<CreateMetadataTypeEnum | undefined>(undefined);
  const options = useMemo(
    () => [
      {
        key: CreateMetadataTypeEnum.Function,
        icon: FuncIcon,
        title: '函数计算',
        desc: '在线编写自定义代码逻辑，无需管理服务器，由平台托管运行',
      },
      {
        key: CreateMetadataTypeEnum.Flow,
        icon: FlowIcon,
        title: '算子编排',
        desc: '通过画布编排已有算子，实现复制的业务逻辑处理',
      },
    ],
    []
  );

  const handleConfirm = () => {
    switch (metadataType) {
      case CreateMetadataTypeEnum.Function:
        onOpenCreateOperatorPage();
        break;
      case CreateMetadataTypeEnum.Flow:
        onOpenFlowEditor();
        break;
      default:
        break;
    }
  };

  return (
    <Modal
      open
      centered
      maskClosable={false}
      title="新建算子"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={640}
      okButtonProps={{
        className: 'dip-w-74',
        disabled: !metadataType,
      }}
      cancelButtonProps={{
        className: 'dip-w-74',
      }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <div className="dip-flex-space-between dip-mb-10 dip-pt-8">
        <span className="dip-text-color-85">请选择新建方式</span>
        <span className="dip-text-color-45 dip-font-12">
          <InfoCircleOutlined className="dip-mr-8" />
          选择后不支持修改
        </span>
      </div>
      <Radio.Group className={styles['card-radio-group']} onChange={e => setMetadataType(e.target.value)}>
        {options.map(({ key, title, desc, icon: Icon }) => (
          <Radio.Button
            key={key}
            value={key}
            className={classNames(styles['card-radio-item'], {
              [styles['card-radio-item-checked']]: metadataType === key,
            })}
          >
            <div className={styles['card-content']}>
              <div className={styles['card-title']}>
                <Icon className="dip-font-20 dip-mr-8" />
                {title}
              </div>
              <div className={styles['card-desc']}>{desc}</div>
            </div>
          </Radio.Button>
        ))}
      </Radio.Group>
    </Modal>
  );
};

export default CreateOperatorModal;
