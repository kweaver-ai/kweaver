import _ from 'lodash';
import { Steps as AntdSteps, type StepsProps as AntdStepsProps } from 'antd';
import { DoubleRightOutlined } from '@ant-design/icons';

import styles from './index.module.less';

export type StepsProps = AntdStepsProps & {
  icon?: any;
};

const GapIcon: React.FC<StepsProps> = props => {
  const { icon, items, ...otherProps } = props;

  const length = items?.length ? items?.length - 1 : 0;
  const STEPS_ITEMS = _.map(items, (item, index) => {
    return {
      ...item,
      title: (
        <div>
          <span>{item.title}</span>
          {index !== length ? icon || <DoubleRightOutlined className='g-c-text-sub' style={{ marginLeft: 24 }} /> : null}
        </div>
      ),
    };
  });

  return <AntdSteps className={styles['common-steps-gap-icon']} items={STEPS_ITEMS} {...otherProps} />;
};

export default GapIcon;
