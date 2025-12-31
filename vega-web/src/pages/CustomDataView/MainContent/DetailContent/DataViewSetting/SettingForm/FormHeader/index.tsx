import intl from 'react-intl-universal';
import { Button } from 'antd';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

const FormHeader = ({
  title,
  icon,
  showSubmitButton = true,
  onSubmit,
  onCancel,
  loading = false,
  cancelText = intl.get('Global.cancel'),
}: {
  title: string;
  icon?: string;
  showSubmitButton?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  cancelText?: string;
}) => {
  return (
    <div className={styles['title-box']}>
      <div className={styles['title-box-left']}>
        {icon && <IconFont type={icon} style={{ fontSize: '20px' }} />}
        <div>{title}</div>
      </div>
      <div className={styles['button-box']}>
        {showSubmitButton && (
          <Button type="primary" onClick={() => onSubmit?.()} loading={loading}>
            {intl.get('Global.ok')}
          </Button>
        )}
        <Button type="default" onClick={() => onCancel?.()}>
          {cancelText}
        </Button>
      </div>
    </div>
  );
};

export default FormHeader;
