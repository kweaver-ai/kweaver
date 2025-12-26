/**
 * @description 弹窗组件，对 Antd 的 Modal 组件进行拓展
 * 1、统一调整 header、body、footer 边距和样式
 * 2、增加了 footerData 属性，用以自定义底部按钮
 */
import type React from 'react';
import intl from 'react-intl-universal';
import { Button, Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import styles from './index.module.less';

import Prompt from './Prompt';

export type ModalProps = AntdModalProps & { onCancelIcon?: (event: React.MouseEvent<HTMLButtonElement>) => void };
export const CustomModal: React.FC<ModalProps> = props => {
  return (
    <AntdModal
      className={styles['common-modal']}
      maskClosable={false}
      destroyOnHidden={true}
      okText={intl.get('components.modal.footer.ok')}
      cancelText={intl.get('components.modal.footer.cancel')}
      footer={[
        <Button key='save' type='primary' loading={props.confirmLoading} onClick={props.onOk} {...props.okButtonProps}>
          {props.okText || intl.get('components.modal.footer.ok')}
        </Button>,
        <Button key='cancel' onClick={props.onCancel} {...props.cancelButtonProps}>
          {props.cancelText || intl.get('components.modal.footer.cancel')}
        </Button>,
      ]}
      {...props}
      closable={false}
    >
      {(props.closable ?? true) && (
        <Button
          className={styles['common-modal-close-button']}
          color='default'
          variant='text'
          icon={<CloseOutlined />}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            if (props?.onCancelIcon) {
              props.onCancelIcon(event);
              return;
            }
            if (props.onCancel) props.onCancel(event);
          }}
        />
      )}
      {props.children}
    </AntdModal>
  );
};

type CustomModalProps = typeof CustomModal & {
  Prompt: typeof Prompt;
  info: typeof AntdModal.info;
  success: typeof AntdModal.success;
  error: typeof AntdModal.error;
  warning: typeof AntdModal.warning;
  confirm: typeof AntdModal.confirm;
  useModal: typeof AntdModal.useModal;
};

const Modal = Object.assign(CustomModal, {
  Prompt,
  info: AntdModal.info,
  success: AntdModal.success,
  error: AntdModal.error,
  warning: AntdModal.warning,
  confirm: AntdModal.confirm,
  useModal: AntdModal.useModal,
}) as CustomModalProps;

export default Modal;
