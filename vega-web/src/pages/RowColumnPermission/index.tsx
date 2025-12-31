import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { EllipsisOutlined, LeftOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Tag } from 'antd';
import { TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import useAuthorization from '@/hooks/useAuthorization';
import { DATE_FORMAT } from '@/hooks/useConstants';
import { formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import SERVICE from '@/services/index';
import RowColumnPermissionType from '@/services/rowColumnPermission/type';
import HOOKS from '@/hooks';
import { Button, Table, IconFont } from '@/web-library/common';
import CreateRuleDrawer from './CreateRuleDrawer';
import styles from './index.module.less';

type RowColumnRule = RowColumnPermissionType.Rule;

interface RouteParams {
  id?: string;
}

const RowColumnPermission: React.FC = (): JSX.Element => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState();
  const { message, modal } = HOOKS.useGlobalContext();

  const [tableData, setTableData] = useState<RowColumnRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterValues, setFilterValues] = useState<{ name_pattern: string }>({ name_pattern: '' });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [copyRule, setCopyRule] = useState<any>(null);
  const [fieldList, setFieldList] = useState<any[]>([]);

  const { openModal: openAuthorizationModal } = useAuthorization({
    title: intl.get('Global.rowColumnPermissionConfig'),
    resourceName: intl.get('Global.rowColumnPermissionConfig'),
    resourceType: 'data_view_row_column_rule',
    mountNodeId: 'row-column-rule-container',
  });

  useEffect(() => {
    if (id) {
      getData();
      getFieldList();
    }
  }, [id]);

  /** 获取列表数据 */
  const getData = async (filters?: { name_pattern: string }): Promise<void> => {
    if (!id) {
      message.error(intl.get('RowColumnPermission.missingViewId'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await SERVICE.rowColumnPermission.getRowColumnRulesByViewId({
        view_id: id,
        ...pageState,
        ...(filters || filterValues),
      });

      const { total_count, entries } = res;

      setTableData(entries);
      onUpdateState({ ...pagination, total: total_count });
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error(intl.get('RowColumnPermission.fetchRulesFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  /** 获取视图字段列表 */
  const getFieldList = async () => {
    if (!id) {
      message.error(intl.get('RowColumnPermission.missingViewId'));
      return;
    }
    const res = await SERVICE.customDataView.getCustomDataViewDetails([id]);
    const views = res?.[0] || {};
    const { fields = [] } = views;
    setFieldList(fields);
  };

  /** table 页面切换 */
  const handleTableChange = async (pagination: TablePaginationConfig): Promise<void> => {
    // const { current = 1, pageSize = 20 } = pagination;
    await getData();
  };

  /** 搜索 */
  const handleSearch = async (values: { name_pattern: string }): Promise<void> => {
    setFilterValues(values);
    await getData(values);
  };

  /** 新建规则 */
  const handleCreateRule = (): void => {
    setEditingRule(null);
    setCopyRule(null);
    setDrawerVisible(true);
  };

  /** 编辑规则 */
  const handleEditRule = (record: RowColumnRule): void => {
    setEditingRule(record);
    setDrawerVisible(true);
  };

  /** 复制规则 */
  const handleCopyRule = async (record: RowColumnRule): Promise<void> => {
    setEditingRule(null);
    setCopyRule(Object.assign({}, record, { id: '' }));
    setDrawerVisible(true);
  };

  /** 删除规则 */
  const handleDeleteRule = (record: RowColumnRule): void => {
    modal.confirm({
      title: intl.get('RowColumnPermission.deleteConfirm'),
      onOk: async () => {
        try {
          await SERVICE.rowColumnPermission.deleteRowColumnRule(record.id);
          message.success(intl.get('Global.deleteSuccess'));
          await getData();
        } catch (error) {
          console.error('Error deleting rule:', error);
        }
      },
    });
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: RowColumnRule) => {
    if (key === 'edit') handleEditRule(record);
    if (key === 'copy') handleCopyRule(record);
    if (key === 'permission') openAuthorizationModal(record?.id);
    if (key === 'delete') handleDeleteRule(record);
  };

  /** 返回 */
  const handleGoBack = (): void => {
    history.goBack();
  };

  /** 抽屉确认 */
  const handleDrawerConfirm = async (data: RowColumnPermissionType.CreateRuleParams): Promise<void> => {
    try {
      if (editingRule) {
        // 更新规则
        await SERVICE.rowColumnPermission.updateRowColumnRule(editingRule.id, {
          name: data.name,
          view_id: id!,
          tags: data.tags,
          comment: data.comment,
          fields: data.fields,
          row_filters: data?.row_filters ? formatKeyOfObjectToLine(data.row_filters) : undefined,
        });
        message.success(intl.get('Global.updateSuccess'));
      } else {
        // 创建规则
        await SERVICE.rowColumnPermission.createRowColumnRule([
          {
            name: data.name,
            view_id: id!,
            tags: data.tags,
            comment: data.comment,
            fields: data.fields,
            row_filters: formatKeyOfObjectToLine(data.row_filters),
          },
        ]);
        message.success(intl.get('Global.createSuccess'));
      }
      setDrawerVisible(false);
      await getData();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const columns: any = [
    {
      title: intl.get('Global.ruleName'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      width: 220,
      minWidth: 220,
      __fixed: true,
      __selected: true,
      render: (text: string) => (
        <div className={styles.nameCell}>
          <IconFont type="icon-dip-color-hangliequanxian" style={{ fontSize: 20 }} />
          <span className="g-ellipsis-1">{text}</span>
        </div>
      ),
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      width: 72,
      minWidth: 72,
      __fixed: true,
      __selected: true,
      render: (_value: unknown, record: RowColumnRule) => {
        const dropdownMenu: MenuProps['items'] = [
          { key: 'edit', label: intl.get('Global.editRule') },
          { key: 'copy', label: intl.get('RowColumnPermission.copyRule') },
          { key: 'permission', label: intl.get('RowColumnPermission.permissionConfig') },
          { key: 'delete', label: intl.get('RowColumnPermission.deleteRule') },
        ];

        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu,
              onClick: (event) => {
                event.domEvent.stopPropagation();
                onOperate(event?.key, record);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event: any) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      minWidth: 200,
      __fixed: true,
      __selected: true,
      render: (text: any): React.ReactNode => {
        return Array.isArray(text) && text.length ? _.map(text, (i) => <Tag key={i}>{i}</Tag>) : '--';
      },
    },
    // {
    //   title: intl.get('RowColumnPermission.visitor'),
    //   dataIndex: 'visitor',
    //   width: 160,
    //   minWidth: 160,
    //   __fixed: true,
    //   __selected: true,
    //   render: (text: string) => <span className={text ? '' : styles.notConfigured}>{text || intl.get('RowColumnPermission.notConfigured')}</span>,
    // },
    // {
    //   title: intl.get('RowColumnPermission.from'),
    //   dataIndex: 'from',
    //   width: 200,
    //   minWidth: 200,
    //   __fixed: true,
    //   __selected: true,
    //   render: (text: string) => <span className={text ? '' : styles.notConfigured}>{text || intl.get('RowColumnPermission.notConfigured')}</span>,
    // },
    // {
    //   title: intl.get('RowColumnPermission.permission'),
    //   dataIndex: 'permission',
    //   width: 154,
    //   minWidth: 154,
    //   __fixed: true,
    //   __selected: true,
    //   render: (text: string) => <span className={text ? '' : styles.notConfigured}>{text || intl.get('RowColumnPermission.notConfigured')}</span>,
    // },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      width: 160,
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string) => <span className={text ? '' : styles.notConfigured}>{text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <div id="row-column-rule-container" />
      {/* 顶部导航栏 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.backButton} onClick={handleGoBack}>
            <LeftOutlined />
            <span className={styles.backText}>{intl.get('Global.back')}</span>
          </div>
          <div className={styles.divider} />
          <h1 className={styles.pageTitle}>{intl.get('Global.rowColumnPermissionConfig')}</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        <h2 className={styles.listTitle}>{intl.get('RowColumnPermission.listTitle')}</h2>

        <div className={styles.tableWrapper}>
          <Table.PageTable
            name="row-column-permission"
            rowKey="id"
            columns={columns}
            loading={isLoading}
            dataSource={tableData}
            pagination={pagination}
            onChange={handleTableChange}
          >
            <Table.Operation
              nameConfig={{
                key: 'name_pattern',
                placeholder: intl.get('RowColumnPermission.searchPlaceholder'),
              }}
              onChange={handleSearch}
              onRefresh={getData}
            >
              <Button.Create onClick={handleCreateRule}>{intl.get('Global.createRule')}</Button.Create>
            </Table.Operation>
          </Table.PageTable>
        </div>
      </div>

      {/* 新建/编辑抽屉 */}
      <CreateRuleDrawer
        dataViewId={id || ''}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onConfirm={handleDrawerConfirm}
        initialData={editingRule ? editingRule : copyRule ? copyRule : undefined}
        availableFields={fieldList}
      />
    </div>
  );
};

export default RowColumnPermission;
