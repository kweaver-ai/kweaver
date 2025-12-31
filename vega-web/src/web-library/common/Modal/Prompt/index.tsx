import intl from 'react-intl-universal';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Title } from '../../Text';
import { CustomModal, type ModalProps } from '../index';

const Prompt = (props: ModalProps) => {
  const { title, ...otherProps } = props;
  return (
    <CustomModal okText={intl.get('Global.saveAndClose')} cancelText={intl.get('Global.abandonSaving')} {...otherProps}>
      <div style={{ padding: '16px 8px' }}>
        <div className="g-mb-3 g-flex-align-center">
          <ExclamationCircleFilled style={{ color: '#f5222d', fontSize: 22, marginRight: 16 }} />
          <Title level={4}>{title}</Title>
        </div>
        <div style={{ paddingLeft: 38 }}>{props.children}</div>
      </div>
    </CustomModal>
  );
};

export default Prompt;
