import React, { useEffect, useState, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Checkbox, Divider, Button } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import downFile from '@/utils/down-file';
import api from '@/services/customDataView/index';
import HOOKS from '@/hooks';
import { Input, IconFont } from '@/web-library/common';
import styles from './index.module.less';
import { useCustomDataViewContext } from '../context';
import { GroupItem } from './GroupItem';
import { GroupModal } from './GroupModal';
import { type GroupType } from '../type';

export const SideBar: React.FC = () => {
  const { modal } = HOOKS.useGlobalContext();
  const { currentSelectGroup, setCurrentSelectGroup, reloadGroup } = useCustomDataViewContext();
  const [allGroupList, setAllGroupList] = useState<GroupType[]>([]);
  const [showGroupList, setShowGroupList] = useState<GroupType[]>([]);
  const [currentOperationGroup, setCurrentOperationGroup] = useState<GroupType>({} as GroupType);
  const [isGroupModalShow, setIsGroupModalShow] = useState(false);
  const [groupModalType, setGroupModalType] = useState<'create' | 'rename'>('create');
  const [allCount, setAllCount] = useState<number>(0);

  /** 获取分组列表 */
  const getGroupList = async (): Promise<void> => {
    const res = await api.getGroupList();
    setAllGroupList(res.entries);
    setShowGroupList(res.entries);

    let count = 0;
    res.entries.forEach((item: any) => {
      count += item.data_view_count;
    });
    setAllCount(count);
  };

  useEffect(() => {
    getGroupList();
  }, [reloadGroup]);

  const { noGroupDataList, groupDataList } = useMemo(() => {
    let noGroupDataList: GroupType = {} as GroupType;
    const groupDataList: GroupType[] = [];

    _.forEach(showGroupList, (item) => {
      if (!item.id) noGroupDataList = item;
      if (!item.builtin && item.id) groupDataList.push(item);
    });
    return { noGroupDataList, groupDataList: groupDataList };
  }, [JSON.stringify(showGroupList)]);

  /** 筛选过滤  */
  const handleSearchGroup = (data: React.ChangeEvent<HTMLInputElement>) => {
    const value = data.target.value;
    const newShowGroupList = allGroupList.filter((item) => item.id === '' || item.name.includes(value));
    setShowGroupList(newShowGroupList);
  };

  /** 点击分组 */
  const handleGroupClick = (group: GroupType): void => {
    setCurrentSelectGroup(group);
  };

  /** 新建分组 */
  const handleCreateGroupClick = (): void => {
    setGroupModalType('create');
    setIsGroupModalShow(true);
  };

  /** 新建分组 - 确定 */
  const handleCreateGroupSubmit = async (values: { name: string }): Promise<void> => {
    await api.createGroup(values.name);
    setIsGroupModalShow(false);
    getGroupList();
  };

  /** 分组重命名 */
  const handleRenameGroupClick = (item: GroupType) => {
    setCurrentOperationGroup(item);
    setGroupModalType('rename');
    setIsGroupModalShow(true);
  };

  /** 分组重命名 - 确定 */
  const handleRenameGroupSubmit = async (values: { name: string }): Promise<void> => {
    await api.updateGroup(currentOperationGroup.id, values.name);
    setIsGroupModalShow(false);
    getGroupList();
  };

  /** 删除分组 */
  const handleDeleteGroupClick = (item: GroupType) => {
    let isGroupDeleteForce = false;
    modal.confirm({
      title: `${intl.get('Global.confirmDeleteGroup')}${item.name}？`,
      content: (
        <div>
          <Checkbox onChange={(e) => (isGroupDeleteForce = e.target.checked)}></Checkbox>
          <span style={{ marginLeft: 5 }}>{intl.get('CustomDataView.confirmDeleteGroupDescription')}</span>
        </div>
      ),
      okButtonProps: {
        style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' },
      },
      footer: (_: any, { OkBtn, CancelBtn }: { OkBtn: React.ElementType; CancelBtn: React.ElementType }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      onOk: async () => {
        const res = await api.deleteGroup(item.id, isGroupDeleteForce);
        getGroupList();
        if (item.id === currentSelectGroup?.id && !res.code) setCurrentSelectGroup(undefined);
      },
    });
  };

  /** 导出分组 */
  const handleExportGroupClick = async (item: GroupType): Promise<void> => {
    // 获取分组中所有指标模型数据
    const res = await api.exportGroup(item.id);
    Promise.resolve(res).then((res) => {
      if (!res.error_code) {
        downFile(JSON.stringify(res, null, 2), item.name, 'json');
        arNotification.success(intl.get('Global.exportSuccess'));
      }
    });
  };

  /** 操作菜单点击 */
  const handleOperationMenuClick = (data: any, item: GroupType) => {
    const operationMap = {
      rename: handleRenameGroupClick,
      delete: handleDeleteGroupClick,
      export: handleExportGroupClick,
    };
    const operation = operationMap[data.key as keyof typeof operationMap];
    if (operation) {
      operation(item);
    }
  };

  const dropdownItems = [
    { key: 'rename', label: intl.get('Global.rename') },
    { key: 'delete', label: intl.get('Global.delete') },
    { key: 'export', label: intl.get('Global.export') },
  ];

  return (
    <div className={styles['metric-model-side-bar']}>
      <div style={{ padding: '0 10px' }}>
        <div className="g-pt-2 g-pb-1 g-border-b g-flex-space-between">
          <div>{intl.get('CustomDataView.title')}</div>
          <Button
            color="default"
            variant="text"
            icon={<IconFont style={{ color: 'rgba(0, 0, 0, 0.45)' }} type="icon-tianjiafenzu" />}
            onClick={handleCreateGroupClick}
          />
        </div>
        <Input.Search className="g-mt-3 g-mb-3" allowClear placeholder={intl.get('Global.pleaseInputGroupName')} onChange={handleSearchGroup} />
      </div>

      <div className={styles['group-container-list']}>
        {/* 所有分组 */}
        <div
          className={classNames(styles['group-item'], { [styles['group-item-active']]: currentSelectGroup?.id === undefined })}
          onClick={() => setCurrentSelectGroup(undefined)}
        >
          {`${intl.get('CustomDataView.allGroup')} (${allCount})`}
        </div>
        {/* 未分组 */}
        <div
          className={classNames(styles['group-item'], { [styles['group-item-active']]: currentSelectGroup?.id === noGroupDataList?.id })}
          onClick={() => handleGroupClick(noGroupDataList)}
        >
          {`${intl.get('Global.ungrouped')} (${noGroupDataList?.data_view_count || 0})`}
        </div>
        <Divider style={{ margin: '8px 0' }} />
        {/* 分组列表 */}
        {_.map(groupDataList, (item, index) => (
          <GroupItem
            currentId={currentSelectGroup?.id}
            key={index}
            item={item}
            disabled={false}
            dropdownItems={dropdownItems}
            handleGroupClick={handleGroupClick}
            handleOperationMenuClick={handleOperationMenuClick}
          />
        ))}
      </div>

      {/* 分组Modal */}
      <GroupModal
        visible={isGroupModalShow}
        title={groupModalType === 'create' ? intl.get('Global.createGroup') : intl.get('Global.renameGroup')}
        onOk={groupModalType === 'create' ? handleCreateGroupSubmit : handleRenameGroupSubmit}
        onCancel={() => setIsGroupModalShow(false)}
        initialValue={groupModalType === 'rename' ? currentOperationGroup.name : ''}
      />
    </div>
  );
};
