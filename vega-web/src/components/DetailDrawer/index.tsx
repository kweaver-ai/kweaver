import { ReactNode } from 'react';
import { DrawerProps } from 'antd/lib/drawer';
import { Drawer } from '@/web-library/common';
import styles from './index.module.less';

interface ContentItem {
  name?: string | JSX.Element;
  value?: string | JSX.Element | number;
  title?: string | JSX.Element;
  isOneLine?: boolean;
  isNoFlex?: boolean;
  content?: ContentItem[];
}

export interface DataItem {
  title: string | JSX.Element;
  isOpen?: boolean;
  style?: object;
  content: ContentItem[];
}

// 包含抽屉的属性
export interface PropsType extends DrawerProps {
  data: DataItem[] | null;
}

const DetailDrawer = (props: PropsType): JSX.Element => {
  if (!props.data) {
    return <></>;
  }
  const { data = [], ...otherProps } = props;

  const renderCard = (item: ContentItem | DataItem, content: ReactNode, isSec = 0): ReactNode => {
    return (
      <div className={`${styles['one-line']} ${isSec ? styles['sec-container'] : ''}`}>
        {item.title && (
          <div className={styles['title']}>
            <span className={styles['title-span']}></span>
            {item.title}
          </div>
        )}
        {content}
      </div>
    );
  };

  return (
    <Drawer open={true} width={540} {...otherProps}>
      <div style={{ height: 'calc(100vh - 106px)', overflowY: 'auto' }}>
        {data.map((item) =>
          renderCard(
            item,
            <div className={styles['content-wrapper']}>
              {item.content.map((contentItem, index) => (
                <div
                  key={index.toString()}
                  className={`${styles['config-item']} ${contentItem.isOneLine ? styles['one-line'] : ''} ${
                    contentItem.isNoFlex ? styles['config-item-block'] : ''
                  }`}
                >
                  {!!contentItem.name && (
                    <div className={styles['text-name']}>
                      <span className="text-title">{contentItem.name}：</span>
                    </div>
                  )}
                  <div className={styles['text-content']} style={{ width: 700 }}>
                    <span className="content-text">{contentItem.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Drawer>
  );
};

export default DetailDrawer;
