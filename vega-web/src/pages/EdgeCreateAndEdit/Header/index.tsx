import intl from 'react-intl-universal';
import { LeftOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import { Text, Title, Steps } from '@/web-library/common';
import styles from './index.module.less';

const Header = (props: any) => {
  const { title, stepsCurrent, goBack } = props;

  return (
    <div className={styles['edge-create-and-edit-header-root']}>
      <div className={styles['edge-create-and-edit-header-go-back']}>
        <div className="g-pointer g-flex-align-center" onClick={goBack}>
          <LeftOutlined style={{ marginTop: 2, marginRight: 6 }} />
          <Text>{intl.get('Global.exit')}</Text>
        </div>
        <Divider type="vertical" style={{ margin: '0 12px' }} />
        <Title>{title}</Title>
      </div>
      <div style={{ width: 800 }}>
        <Steps.GapIcon size="small" current={stepsCurrent} items={[{ title: intl.get('Global.basicInfo') }, { title: intl.get('Edge.mappingStep') }]} />
      </div>
    </div>
  );
};

export default Header;
