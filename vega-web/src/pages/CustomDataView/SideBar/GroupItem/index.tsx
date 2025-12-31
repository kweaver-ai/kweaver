import intl from 'react-intl-universal';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps } from 'antd';
import classnames from 'classnames';
import { GroupType } from '../../type';
import styles from '../index.module.less';

export const GroupItem: React.FC<{
  item: GroupType;
  currentId: string | undefined;
  disabled: boolean;
  dropdownItems: MenuProps['items'];
  handleGroupClick: (item: GroupType) => void;
  handleOperationMenuClick: (data: any, item: GroupType) => void;
}> = ({ item, currentId, disabled, dropdownItems, handleGroupClick, handleOperationMenuClick }) => {
  return (
    <div
      className={classnames(styles['group-item'], {
        [styles['group-item-active']]: currentId === item.id,
      })}
      title={item.name}
      onClick={() => handleGroupClick(item)}
    >
      <div className="g-ellipsis-1" style={{ maxWidth: 140 }}>
        {item.name} ({item.data_view_count})
      </div>
      {disabled ? (
        <Button
          className={styles['group-item-operator']}
          title={intl.get('CustomDataView.disabledBuiltInGroupTip')}
          color="default"
          variant="text"
          disabled
          style={{ width: 26, height: 26 }}
          icon={<EllipsisOutlined />}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Dropdown menu={{ items: dropdownItems, onClick: (data) => handleOperationMenuClick(data, item) }}>
          <Button
            className={styles['group-item-operator']}
            color="default"
            variant="text"
            title=""
            style={{ width: 26, height: 26 }}
            icon={<EllipsisOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      )}
    </div>
  );
};
