/**
 * @description 弹窗组件，对 Antd 的 Modal 组件进行拓展
 * 1、统一调整 header、body、footer 边距和样式
 * 2、增加了 footerData 属性，用以自定义底部按钮
 */

import { CloseOutlined } from '@ant-design/icons';
import { Modal as AntdModal, type ModalProps as AntdModalProps, Button } from 'antd';
import intl from 'react-intl-universal';

import styles from './index.module.less';

import Prompt from './Prompt';

export type ModalProps = AntdModalProps & { onCancelIcon?: (event: React.MouseEvent<HTMLButtonElement>) => void };
export const CustomModal: React.FC<ModalProps> = props => {
  return (
    <AntdModal
      cancelText={intl.get('common.modal.footer.cancel')}
      className={styles['common-modal']}
      destroyOnHidden={true}
      footer={[
        <Button key='save' loading={props.confirmLoading} onClick={props.onOk} type='primary' {...props.okButtonProps}>
          {props.okText || intl.get('common.modal.footer.ok')}
        </Button>,
        <Button key='cancel' onClick={props.onCancel} {...props.cancelButtonProps}>
          {props.cancelText || intl.get('common.modal.footer.cancel')}
        </Button>,
      ]}
      maskClosable={false}
      okText={intl.get('common.modal.footer.ok')}
      {...props}
      closable={false}
    >
      {(props.closable ?? true) && (
        <Button
          className={styles['common-modal-close-button']}
          color='default'
          icon={<CloseOutlined />}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            if (props?.onCancelIcon) {
              props.onCancelIcon(event);
              return;
            }
            if (props.onCancel) props.onCancel(event);
          }}
          variant='text'
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
  confirm: AntdModal.confirm,
  error: AntdModal.error,
  info: AntdModal.info,
  Prompt,
  success: AntdModal.success,
  useModal: AntdModal.useModal,
  warning: AntdModal.warning,
}) as CustomModalProps;

export default Modal;
