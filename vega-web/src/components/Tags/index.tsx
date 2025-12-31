import { Popover, Tag } from 'antd';
import styles from './index.module.less';

interface TProps {
  value: string[];
}

const Tags = (props: TProps) => {
  const { value } = props;
  return (
    <div className="g-flex-align-center">
      {value.length ? (
        <>
          {value.slice(0, 2).map((tag) => (
            <Tag key={tag} className={styles['tag']} title={tag}>
              {tag}
            </Tag>
          ))}
          {value.length > 2 && (
            <Popover
              arrow={false}
              content={
                <div className={styles['popover-tags']}>
                  {value.slice(2).map((tag) => (
                    <Tag key={tag} className={styles['tag']} title={tag}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              }
            >
              <Tag>+{value.length - 2}</Tag>
            </Popover>
          )}
        </>
      ) : (
        '--'
      )}
    </div>
  );
};

export default Tags;
