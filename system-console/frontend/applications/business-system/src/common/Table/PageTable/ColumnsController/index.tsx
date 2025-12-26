import { useState, useEffect } from 'react';
import _ from 'lodash';
import { Dropdown, Checkbox, type MenuProps } from 'antd';

import UTILS from '@/utils';

const ColumnsController = (props: any) => {
  const { open, position, sessionColumns, onCloseMenu, onResetWidth, onAdapterWidth, onControllerChange } = props;

  useEffect(() => {
    // 监听点击事件，关闭菜单
    const closeMenu = () => onCloseMenu();
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // 初始化选中列，如果有复选框列，则默认选中复选框列
  const [status, setStatus] = useState<any>({});
  useEffect(() => {
    if (!_.isEmpty(sessionColumns)) setStatus(sessionColumns);
  }, [JSON.stringify(sessionColumns)]);

  const sortedMenuItems = _.sortBy(sessionColumns, (column: any) => column.index);
  const checkedItems = _.filter(status, (column: any) => column?.checked);
  const allChecked = checkedItems.length === sortedMenuItems.length;
  const indeterminate = !allChecked && checkedItems.length > 1;

  const items: MenuProps['items'] = [
    { key: 'reset', label: '重置列宽' },
    { key: 'adapter', label: '适配所有列宽' },
    { type: 'divider' },
    {
      key: 'all',
      label: (
        <Checkbox indeterminate={indeterminate} checked={allChecked}>
          全选
        </Checkbox>
      ),
    },
    ..._.map(sortedMenuItems, (column: any) => {
      const key = column.dataIndex;
      return {
        key: key,
        label: (
          <Checkbox checked={status?.[key]?.checked} disabled={status?.[key]?.disabled}>
            {column.title}
          </Checkbox>
        ),
      };
    }),
  ];
  const onChangeDropdown = (e: any) => {
    e.domEvent.stopPropagation();
    const key = e.key;
    if (key === 'reset') {
      onResetWidth();
    } else if (key === 'adapter') {
      onAdapterWidth();
    } else if (key === 'all') {
      const newStatus = _.cloneDeep(status);
      _.forEach(newStatus, (column: any) => {
        if (allChecked) {
          if (!column.disabled) column.checked = false;
        } else {
          column.checked = true;
        }
      });
      setStatus(newStatus);
      onControllerChange(newStatus);
    } else {
      const newStatus = { ...status };
      if (newStatus[key].disabled) return;
      newStatus[key].checked = !newStatus[key].checked;
      setStatus(newStatus);
      onControllerChange(newStatus);
    }
  };

  return (
    <Dropdown
      open={open}
      menu={{ items, onClick: onChangeDropdown }}
      trigger={['contextMenu']}
      overlayStyle={{ position: 'fixed', left: position.x || 0, top: position.y || 0 }}
    />
  );
};

export default (props: any) => {
  const sessionColumns = UTILS.SessionStorage.get(props.SESSION_COLUMNS_CONTROLLER_KEY) || {};
  if (_.isEmpty(sessionColumns)) return null;
  return <ColumnsController {...props} sessionColumns={sessionColumns} />;
};
