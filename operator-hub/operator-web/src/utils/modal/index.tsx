import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd/es/modal/interface';
import { getConfig } from '@/utils/http';

const { confirm } = Modal;

export const confirmModal = (
  props: Omit<ModalFuncProps, 'footer' | 'okButtonProps' | 'cancelButtonProps' | 'centered' | 'getContainer'>
) => {
  const container = getConfig('container');
  return confirm({
    ...props,
    getContainer: container,
    centered: true,
    okButtonProps: {
      className: 'dip-w-74',
    },
    cancelButtonProps: {
      className: 'dip-w-74',
    },
    footer: (_, { OkBtn, CancelBtn }) => (
      <>
        <OkBtn />
        <CancelBtn />
      </>
    ),
  });
};
