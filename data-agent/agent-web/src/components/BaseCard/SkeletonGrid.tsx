import { useMemo, memo } from 'react';
import classNames from 'classnames';
import { Col, Card, Skeleton, Row } from 'antd';
import styles from './SkeletonGrid.module.less';
import { gap } from './utils';

const getCount = ({ width, cardWidth }: { width?: number; cardWidth?: number } = {}) => {
  let count = 4;
  try {
    if (width && cardWidth) {
      count = Math.floor(width / cardWidth);
    }
  } catch {}

  return count;
};

// 渲染骨架屏
const SkeletonGrid = ({
  width,
  cardWidth,
  avatarShape = 'circle',
}: {
  width?: number;
  cardWidth?: number;
  avatarShape?: 'square' | 'circle';
}) => {
  const count = useMemo(() => getCount({ width, cardWidth }), [width, cardWidth]);

  return (
    <Row gutter={[gap, gap]}>
      {Array(count)
        .fill(null)
        .map((_, index) => (
          <Col style={{ width: cardWidth }} key={`skeleton-${index}`}>
            <Card className={styles['card']} variant="borderless">
              <div className={styles['content']}>
                <div className={classNames(styles['main'], 'dip-mb-10')}>
                  <Skeleton.Avatar active size={48} shape={avatarShape} className="dip-mr-12" />
                  <div className={styles['info']}>
                    <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
                  </div>
                </div>
                <div className={styles['bottom']}>
                  <Skeleton.Button active size="small" style={{ width: 120 }} />
                  <Skeleton.Input active size="small" className="dip-w-100" />
                </div>
              </div>
            </Card>
          </Col>
        ))}
    </Row>
  );
};

export default memo(SkeletonGrid);
