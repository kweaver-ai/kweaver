import intl from 'react-intl-universal';
import styles from './index.module.less';

const emptyForm = () => {
  return <div className={styles.emptyForm}>{intl.get('CustomDataView.EmptyForm.noPreviousDataInput')}</div>;
};

export default emptyForm;
