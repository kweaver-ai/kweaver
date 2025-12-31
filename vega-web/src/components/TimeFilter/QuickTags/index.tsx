/** 快速选择标签组件 */
import intl from 'react-intl-universal';
import { Row, Col } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import styles from './index.module.less';
import quickRange from './quickRange';

const QuickTags = (props: any) => {
  const { timeRange, onFilterChange } = props;
  const lastindex = quickRange.length - 1;

  return (
    <Row>
      {_.map(quickRange, ({ section, span, list }, index) => {
        const isLast = index === lastindex;
        return (
          <Col className={styles['quick-tags-col']} key={section} span={span}>
            <ul className={classNames(styles['quick-tags-ul'], { [styles['quick-tags-ul-last']]: isLast })}>
              {list.map((item) => {
                const isActive = timeRange.label === item.label;
                return (
                  <li
                    key={item.label}
                    className={classNames(styles['quick-tags-li'], { [styles['quick-tags-li-active']]: isActive })}
                    onClick={() => onFilterChange(item)}
                  >
                    {intl.get(`Components.quickRangeTime.${item.label}`)}
                  </li>
                );
              })}
            </ul>
          </Col>
        );
      })}
    </Row>
  );
};

export default QuickTags;
