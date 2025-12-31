import React, { useEffect, useState, useMemo } from 'react';
import intl from 'react-intl-universal';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Checkbox, Select, Form, Divider, Button } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import { FORM_LAYOUT } from '@/hooks/useConstants';
import downFile from '@/utils/down-file';
import api from '@/services/data-analysis/metric-model';
import HOOKS from '@/hooks';
import { Input, Modal, IconFont } from '@/web-library/common';
import styles from './index.module.less';

type GroupType = {
  id: string;
  name: string;
  metric_model_count: number;
  comment: string;
  update_time: string;
  builtin: boolean; // false 非内置，true 内置
};

type GroupListType = Array<GroupType>;

type SideBarProps = {
  selectedRowKeys: any;
  getMetricModelData: () => Promise<void>;
  currentSelectGroup: GroupType;
  setCurrentSelectGroup: (arg0: any) => void;
  isMoveToGroupModalShow: boolean;
  setIsMoveToGroupModalShow: (arg0: any) => void;
  reloadGroup: boolean;
};

const GroupItem = (props: any) => {
  const { item, currentId, disabled, dropdownItems } = props;
  const { handleGroupClick, handleOperationMenuClick } = props;
  return (
    <div
      className={classNames(styles['group-item'], {
        [styles['group-item-active']]: currentId === item.id,
      })}
      title={item.comment || item.name}
      onClick={() => handleGroupClick(item)}
    >
      <div className="g-ellipsis-1" style={{ maxWidth: 140 }}>
        {item.name} ({item.metric_model_count})
      </div>
      {disabled ? (
        <Button
          className={styles['group-item-operator']}
          title={intl.get('MetricModel.disabledBuiltGroupTip')}
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

const SideBar: React.FC<SideBarProps> = (props) => {
  const [form] = Form.useForm();
  const { modal } = HOOKS.useGlobalContext();
  const { getMetricModelData, currentSelectGroup, setCurrentSelectGroup } = props;

  const [allGroupList, setAllGroupList] = useState<GroupListType>([]); // 后端返回的所有分组
  const [showGroupList, setShowGroupList] = useState<GroupListType>([]); // 页面展示的分组（因为前端处理分组搜索逻辑）
  const [currentOperationGroup, setCurrentOperationGroup] = useState<GroupType>({} as GroupType); // 当前操作的分组（重命名、导出等操作）
  const [isGroupRenameModalShow, setIsGroupRenameModalShow] = useState(false); // 重命名弹窗
  const [isGroupCreateModalShow, setIsGroupCreateModalShow] = useState(false); // 新建指标模型分组弹窗
  const [allMetricModelCount, setAllMetricModelCount] = useState<number>(0); // 所有指标模型数量

  // 获取分组列表
  const getGroupList = async (): Promise<void> => {
    const res = await api.getGroupList();
    setAllGroupList(res.entries);
    setShowGroupList(res.entries);

    let count = 0;
    res.entries.forEach((item: any) => {
      count += item.metric_model_count;
    });
    setAllMetricModelCount(count);
  };

  useEffect(() => {
    getGroupList();
  }, [props.reloadGroup]);

  /** 筛选过滤  */
  const handleSearchGroup = (data: any) => {
    const value = data.target.value;
    const newShowGroupList = allGroupList.filter((item) => item.id === '' || item.name.includes(value));
    setShowGroupList(newShowGroupList);
  };

  /** 点击分组 */
  const handleGroupClick = (group: any): void => {
    setCurrentSelectGroup(group);
  };

  /** 新建分组 */
  const handleCreateGroupClick = (): void => {
    setIsGroupCreateModalShow(true);
  };

  /** 新建分组 - 确定 */
  const handleCreateGroupSubmit = (e: any): void => {
    e.preventDefault();
    form.validateFields().then(async (values: any) => {
      const { groupName, comment } = values;
      await api.createGroup(groupName, comment);
      setIsGroupCreateModalShow(false);
      getGroupList();
    });
  };

  /** 分组重命名 */
  const handleRenameGroupClick = (item: any) => {
    setCurrentOperationGroup(item);
    form.setFieldValue('newGroupName', item.name);
    form.setFieldValue('newComment', item.comment);
    setIsGroupRenameModalShow(true);
  };
  /** 分组重命名 - 确定 */
  const onCloseRenameModal = () => {
    setCurrentOperationGroup({} as GroupType);
    setIsGroupRenameModalShow(false);
  };
  const handleRenameGroupSubmit = (e: any): void => {
    e.preventDefault();
    form.validateFields().then(async (values: any) => {
      const { newGroupName, newComment } = values;
      await api.updateGroup(currentOperationGroup.id, newGroupName, newComment);
      onCloseRenameModal();
      getGroupList();
    });
  };

  /** 移动分组 - 确定 */
  const handleMoveToGroupSubmit = (e: any): void => {
    e.preventDefault();
    form.validateFields().then(async (values: any) => {
      const { moveToGroup } = values;
      await api.batchChangeMetricModelGroup(props.selectedRowKeys as any, moveToGroup);
      getGroupList();
      getMetricModelData();
      props.setIsMoveToGroupModalShow(false);
    });
  };

  /** 删除分组 */
  const handleDeleteGroupClick = (item: any) => {
    let isGroupDeleteForce = false;
    modal.confirm({
      title: `${intl.get('Global.confirmDeleteGroup')}${item.name}？`,
      content: <Checkbox onChange={(e) => (isGroupDeleteForce = e.target.checked)}>{intl.get('MetricModel.isGroupDeleteForceDescription')}</Checkbox>,
      onOk: async () => {
        const res = await api.deleteGroup(item.id, isGroupDeleteForce);
        getGroupList();
        getMetricModelData();
        // 如果删除的分组是当前展示的分组，且删除成功（res===''），跳转到“所有指标模型”
        if (item.id === currentSelectGroup.id && !res.code) setCurrentSelectGroup({});
      },
    });
  };

  /** 导出分组 */
  const handleExportGroupClick = async (item: any): Promise<void> => {
    // 获取分组中所有指标模型数据
    const res = await api.getMetricModelExportGroup(item.id);
    Promise.resolve(res).then((res) => {
      if (!res.totalCount) return;
      downFile(JSON.stringify(res, null, 2), item.name, 'json');
      arNotification.success(intl.get('Global.exportSuccess'));
    });
  };

  const handleOperationMenuClick = (data: any, item: any) => {
    if (data.key === 'rename') handleRenameGroupClick(item);
    if (data.key === 'delete') handleDeleteGroupClick(item);
    if (data.key === 'export') handleExportGroupClick(item);
  };

  const dropdownItems = [
    { key: 'rename', label: intl.get('Global.rename') },
    { key: 'delete', label: intl.get('Global.delete') },
    { key: 'export', label: intl.get('Global.export') },
  ];

  const { defaultList, buildInList, buildInAndNameList, notBuildInList } = useMemo(() => {
    const defaultList: any = []; // 默认分组
    const buildInList: any = []; // 内置分组 除了默认分组之外的其他分组
    const buildInAndNameList: any = [];
    const notBuildInList: any = []; // 除了默认分组之外的非内置分组 除了默认分组之外的其他分组

    _.forEach(showGroupList, (item) => {
      if (!item.id) defaultList.push(item);
      if (item.builtin && !item.id) buildInList.push(item);
      if (item.builtin && item.name) buildInAndNameList.push(item);
      if (!item.builtin && item.id) notBuildInList.push(item);
    });
    return { defaultList, buildInList, buildInAndNameList, notBuildInList };
  }, [JSON.stringify(showGroupList)]);

  const currentId = currentSelectGroup?.id;

  return (
    <div className={styles['metric-model-side-bar']}>
      <div style={{ padding: '0 10px' }}>
        <div className="g-pt-2 g-pb-1 g-border-b g-flex-space-between">
          <div>{intl.get('Global.group')}</div>
          <Button color="default" variant="text" icon={<IconFont type="icon-tianjiafenzu" />} onClick={handleCreateGroupClick} />
        </div>
        <Input.Search className="g-mt-3 g-mb-3" allowClear placeholder={intl.get('Global.groupName')} onChange={handleSearchGroup} />
      </div>
      {/* 所有指标模型分组 */}
      <div className={styles['group-container-list']}>
        <div className={classNames(styles['group-item'], { [styles['group-item-active']]: currentId === undefined })} onClick={() => setCurrentSelectGroup({})}>
          {`${intl.get('MetricModel.allMetricModel')} (${allMetricModelCount})`}
        </div>
        {_.map(defaultList, (item, index) => (
          <div
            key={index}
            className={classNames(styles['group-item'], { [styles['group-item-active']]: currentId === item.id })}
            onClick={() => handleGroupClick(item)}
          >
            {`${intl.get('Global.ungrouped')} (${item.metric_model_count})`}
          </div>
        ))}
        <Divider style={{ margin: '8px 0' }} />
        {_.map(buildInList, (item, index) => (
          <GroupItem
            key={index}
            item={item}
            disabled={true}
            dropdownItems={dropdownItems}
            handleGroupClick={handleGroupClick}
            handleOperationMenuClick={handleOperationMenuClick}
          />
        ))}
        {buildInAndNameList.length > 0 && <Divider style={{ margin: '8px 0' }} />}
        {_.map(notBuildInList, (item, index) => (
          <GroupItem
            key={index}
            item={item}
            disabled={false}
            dropdownItems={dropdownItems}
            handleGroupClick={handleGroupClick}
            handleOperationMenuClick={handleOperationMenuClick}
          />
        ))}
      </div>
      {/* 新建指标模型分组Modal */}
      {isGroupCreateModalShow && (
        <Modal
          title={intl.get('Global.createGroup')}
          width={600}
          open={isGroupCreateModalShow}
          onOk={handleCreateGroupSubmit}
          onCancel={() => setIsGroupCreateModalShow(false)}
        >
          <Form form={form} {...FORM_LAYOUT}>
            <Form.Item name="groupName" label={intl.get('Global.groupName')} rules={[{ required: true, message: intl.get('Global.pleaseInputGroupName') }]}>
              <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('Global.pleaseInputGroupName')} />
            </Form.Item>
            <Form.Item name="comment" label={intl.get('Global.comment')}>
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      )}
      {/* 重命名分组modal */}
      {isGroupRenameModalShow && (
        <Modal title={intl.get('Global.renameGroup')} open={isGroupRenameModalShow} onOk={handleRenameGroupSubmit} onCancel={onCloseRenameModal}>
          <Form form={form} {...FORM_LAYOUT}>
            <Form.Item
              name="newGroupName"
              label={intl.get('MetricModel.newGroupName')}
              rules={[{ required: true, message: intl.get('Global.pleaseInputGroupName') }]}
            >
              <Input autoComplete="off" aria-autocomplete="none" />
            </Form.Item>
            <Form.Item name="newComment" label={intl.get('Global.comment')}>
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      )}
      {/* 移动指标模型至分组modal */}
      {props.isMoveToGroupModalShow && (
        <Modal
          title={intl.get('MetricModel.moveToGroup')}
          open={props.isMoveToGroupModalShow}
          onOk={handleMoveToGroupSubmit}
          onCancel={(): void => props.setIsMoveToGroupModalShow(false)}
        >
          <Form form={form} {...FORM_LAYOUT} initialValues={{ initialValue: '' }}>
            <Form.Item name="moveToGroup" label={intl.get('Global.targetGroupName')}>
              <Select showSearch optionFilterProp="children">
                {allGroupList
                  .filter((v) => v.name && !v.builtin)
                  .map((item) => {
                    return (
                      <Select.Option key={item.name} value={item.name}>
                        {item.name === '' ? intl.get('Global.ungrouped') : item.name}
                      </Select.Option>
                    );
                  })}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default SideBar;
