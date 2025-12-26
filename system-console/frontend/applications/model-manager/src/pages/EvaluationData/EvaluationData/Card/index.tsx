import dayjs from 'dayjs';
import { Tag, Divider, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import { Button } from '@/common';

import evaluation_name from '@/assets/images/file-icon/evaluation_name.png';
import styles from './index.module.less';

type CardProps = {
  source: any;
  onOperate: (key: string, source: any) => void;
  toPageDetail: (source: any) => void;
  onSelect: () => void;
};

const Card = (props: CardProps) => {
  const { source, onOperate, toPageDetail, onSelect } = props;
  const { name, tags, description, create_user, update_time } = source;

  return (
    <div className={styles['evaluation-data-card']} onClick={() => toPageDetail(source)}>
      <div
        className={styles['evaluation-data-card-title']}
        onClick={event => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <img className={styles['evaluation-data-card-title-img']} src={evaluation_name} />
        {name}
      </div>
      <div className='g-mt-3 g-c-text g-ellipsis-2' style={{ fontSize: 13, lineHeight: '20px', minHeight: 40 }}>
        {description}
      </div>
      <div className='g-mt-2' style={{ height: 22 }}>
        {tags.map((tag: string, index: number) => (
          <Tag key={index}>{tag}</Tag>
        ))}
      </div>

      <div className='g-c-text-sub g-flex-space-between' style={{ marginTop: 14 }}>
        <div className='g-flex-align-center'>
          <div style={{ fontSize: 13 }}>{create_user}</div>
          <Divider className='g-mt-1' type='vertical' style={{ borderColor: 'rgba(0,0,0,.15)' }} />
          <div style={{ fontSize: 12 }}>{dayjs(update_time).format('YYYY/MM/DD')}</div>
        </div>
        <div>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: '编辑' },
                { key: 'rename', label: '重命名' },
                { key: 'delete', label: '删除' },
              ],
              onClick: data => {
                data.domEvent.stopPropagation();
                onOperate(data?.key, source);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined />} onClick={event => event.stopPropagation()} />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Card;
