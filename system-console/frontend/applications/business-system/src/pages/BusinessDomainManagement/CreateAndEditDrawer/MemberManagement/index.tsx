import { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
// import classNames from 'classnames';
import intl from 'react-intl-universal';
import { apis, components } from '@aishu-tech/components/dist/dip-components.min.js';
// import { Dropdown } from 'antd';
import {
  MinusCircleOutlined,
  // ExclamationCircleFilled, UserOutlined
} from '@ant-design/icons';

import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Text, Table, Button, IconFont } from '@/common';

// import styles from './index.module.less';

// const MEMBER_ROLE_LIST_KV: any = _.keyBy(ENUMS.MEMBER_ROLE.MEMBER_ROLE_LIST, 'value');

const MemberManagement = (props: any) => {
  //   const { modal } = HOOKS.useGlobalContext();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState({ size: 50 }); // 分页信息
  const { type, memberValue, domainData } = props;
  const containerRef = useRef<HTMLDivElement>(null); // 表格容器
  const { height } = HOOKS.useSize(containerRef.current);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [newMember, setNewMember] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]); // 选中行
  const isEdit = type === 'edit';

  /** 编辑和查看的时候获取用户列表 */
  useEffect(() => {
    if (isEdit) getMember();
  }, [type]);

  /** 通过用户选择框添加用的时候调用 */
  useEffect(() => {
    if (newMember?.length <= 0) return;
    const dataSource_kv = _.keyBy(dataSource, 'id');
    const newMember_kv = _.keyBy(newMember, 'id');

    const _newMember = _.filter(newMember, (item: any) => !dataSource_kv[item.id]);
    const _dataSource = _.map(_.cloneDeep(dataSource), (item: any) => {
      if (newMember_kv[item.id] && item.__type === 'remove') delete item.__type;
      return item;
    });

    const newDataSource: any = [..._dataSource, ..._newMember];
    setDataSource(newDataSource);
    onUpdateState({ ...pageState, page: Math.ceil(newDataSource?.length / pageState.size) });
    memberValue.current = newDataSource;
  }, [JSON.stringify(newMember)]);

  /** 获取用户列表 */
  const getMember = async () => {
    try {
      setLoading(true);
      const result = await SERVICE.businessDomain.businessDomainMembersGet(domainData?.current?.id, { limit: 1000, offset: 0 });
      setDataSource(result?.items || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('error', error);
    }
  };

  /** 添加用户 */
  const onAddMember = () => {
    const unmount = apis.mountComponent(
      components.AccessorPicker,
      {
        // 不传时默认可选择的范围为用户、部门、用户组       range: ['user', 'department', 'group', 'role', 'app'],
        // 不传时默认展示组织架构和用户组                  tabs: ['organization', 'group', 'role', 'app'],
        range: ['user', 'department', 'group', 'role', 'app'],
        tabs: ['organization', 'group', 'role', 'app'],
        title: intl.get('businessDomain.drawer.addMember'),
        isAdmin: true,
        role: 'super_admin',
        // 资源信息(根据资源类型获取可配置的角色，不传默认不展示角色)
        resource: { id: domainData?.current?.id, name: '业务域', type: 'business_domain' },
        onCancel: () => unmount(),
        onSelect: (selections: any) => {
          const selected: any = _.map(selections, item => ({
            id: item.id,
            name: item?.user?.displayName || item?.name,
            type: item.type,
            role: ENUMS.MEMBER_ROLE.DEVELOPER,
            parent_deps: _.map(item.user?.departmentNames, item => [{ name: item }]),
            __type: 'add',
          }));
          setNewMember(selected);
          unmount();
        },
      },
      document.getElementById('business-domain-management-container'),
    );
  };

  /** 变更用户权限 */
  // const onChangeRole = (member: any, data: any) => {
  //   const newDataSource: any = _.map(_.cloneDeep(dataSource), (item: any) => {
  //     if (item.id === member.id) {
  //       if (!item.old_role) item.old_role = item.role;
  //       item.role = data.value;
  //       if (item.__type !== 'add') item.__type = 'update';
  //     }
  //     return item;
  //   });
  //   setDataSource(newDataSource);
  //   memberValue.current = newDataSource;
  // };

  /** 批量移除成员 */
  const onRemoveBatch = (data?: any[]) => {
    const ids = data || selectedRowKeys;
    let newDataSource: any = _.map(_.cloneDeep(dataSource), (item: any) => {
      if (_.includes(ids, item.id)) {
        if (item.__type === 'add') return false;
        item.__type = 'remove';
      }
      return item;
    });
    newDataSource = _.filter(newDataSource, Boolean);
    setDataSource(newDataSource);
    setSelectedRowKeys([]);
    memberValue.current = newDataSource;
    // const fn = () => {
    //     const ids = data || selectedRowKeys;
    //     let newDataSource: any = _.map(_.cloneDeep(dataSource), (item: any) => {
    //         if (_.includes(ids, item.id)) {
    //             if (item.__type === 'add') return false;
    //             item.__type = 'remove';
    //         }
    //         return item;
    //     });
    //     newDataSource = _.filter(newDataSource, Boolean);
    //     setDataSource(newDataSource);
    //     setSelectedRowKeys([]);
    //     memberValue.current = newDataSource;
    // };
    // const modalConfirm = modal.confirm({
    //     title: intl.get('businessDomain.drawer.removeMembers'),
    //     icon: <ExclamationCircleFilled />,
    //     content: intl.get('businessDomain.drawer.areYouSureRemove'),
    //     closable: true,
    //     footer: (
    //         <div className="g-mt-4 g-flex-align-center" style={{ justifyContent: 'flex-end' }}>
    //             <Button
    //                 className="g-mr-2"
    //                 type="primary"
    //                 danger
    //                 onClick={() => {
    //                     fn();
    //                     modalConfirm.destroy();
    //                 }}
    //             >
    //                 {intl.get('global.remove')}
    //             </Button>
    //             <Button onClick={() => modalConfirm.destroy()}>{intl.get('global.cancel')}</Button>
    //         </div>
    //     )
    // });
  };

  /** 移除成员 */
  const onRemoveMember = (member: any) => {
    onRemoveBatch([member.id]);
  };

  const ICON: any = {
    user: <IconFont className='g-mr-2' type='icon-dip-User' />,
    department: <IconFont className='g-mr-2' type='icon-dip-Department' />,
    group: <IconFont className='g-mr-2' type='icon-dip-a-UserGroup' />,
    role: <IconFont className='g-mr-2' type='icon-dip-Role' />,
    app: <IconFont className='g-mr-2' type='icon-dip-a-ApplicationAccount' />,
  };
  const FROM_TITLE: any = {
    group: intl.get('businessDomain.drawer.group'),
    role: intl.get('businessDomain.drawer.role'),
    app: intl.get('businessDomain.drawer.app'),
  };
  const columns: any = [
    {
      title: intl.get('businessDomain.drawer.name'),
      dataIndex: 'name',
      width: 300,
      render: (value: string, data: any) => {
        const text = value === '00000000-0000-0000-0000-000000000000' ? intl.get('businessDomain.drawer.allOrganizationalUsers') : value;
        return (
          <div className='g-ellipsis-1' style={{ maxWidth: 300 }} title={text}>
            {ICON[data?.type]}
            <Text>{text}</Text>
          </div>
        );
      },
    },
    // {
    //     title: intl.get('businessDomain.drawer.permission'),
    //     dataIndex: 'role',
    //     width: 120,
    //     render: (value: any, data: any) => {
    //         return <Text>{MEMBER_ROLE_LIST_KV?.[value]?.label || value}</Text>;
    //         // return (
    //         //     <Dropdown
    //         //         destroyOnHidden
    //         //         popupRender={() => (
    //         //             <div className="g-dropdown-menu-root" style={{ padding: 8 }}>
    //         //                 <div style={{ overflowY: 'auto', maxHeight: 200, paddingRight: 8 }}>
    //         //                     {_.map(ENUMS.MEMBER_ROLE.MEMBER_ROLE_LIST, (item: any, index) => {
    //         //                         const isCurrent = value === item.value;
    //         //                         return (
    //         //                             <div
    //         //                                 key={index}
    //         //                                 className={classNames(styles['member-role-item'], { [styles['member-role-item-selected']]: isCurrent })}
    //         //                                 onClick={() => {
    //         //                                     if (isCurrent) return;
    //         //                                     onChangeRole(data, item);
    //         //                                 }}
    //         //                             >
    //         //                                 {item?.label}
    //         //                             </div>
    //         //                         );
    //         //                     })}
    //         //                 </div>
    //         //             </div>
    //         //         )}
    //         //         trigger={['click']}
    //         //     >
    //         //         <div className={classNames('g-pointer g-flex-align-center')}>
    //         //             <Text className="g-mr-2">{MEMBER_ROLE_LIST_KV?.[value]?.label || value}</Text>
    //         //             <IconFont className="g-rotate-90" type="icon-dip-right" />
    //         //         </div>
    //         //     </Dropdown>
    //         // );
    //     }
    // },
    {
      title: intl.get('businessDomain.drawer.department'),
      dataIndex: 'parent_deps',
      render: (value: any, data: any) => {
        const department: any = [];
        const parent_department: any = [];
        _.forEach(value, item => {
          const length = item?.length - 1;
          const temp: any = [];
          _.forEach(item, (d, i: number) => {
            if (i === length) department.push(d.name);
            temp.push(d.name);
          });
          parent_department.push(temp?.join('/'));
        });
        const text = FROM_TITLE[data.type];
        return (
          <div className='g-ellipsis-1' title={text || parent_department?.join('\n')} style={{ maxWidth: 300 }}>
            {text || `${department?.join('、')}` || '--'}
          </div>
        );
      },
    },
    {
      title: intl.get('businessDomain.drawer.operation'),
      dataIndex: 'operation',
      width: 80,
      render: (_value: any, data: any) => {
        return <Button.Icon icon={<MinusCircleOutlined />} onClick={() => onRemoveMember(data)} />;
      },
    },
  ];
  const _dataSource = _.filter(dataSource, (item: any) => item.__type !== 'remove');

  return (
    <div className='g-h-100' ref={containerRef}>
      <Text className='g-mb-3 g-c-text-sub'>{intl.get('businessDomain.drawer.membersTip')}</Text>
      <div className='g-mb-3'>
        <Button.Create className='g-mr-2' onClick={onAddMember}>
          {intl.get('businessDomain.drawer.addMember')}
        </Button.Create>
        <Button icon={<MinusCircleOutlined />} disabled={selectedRowKeys?.length === 0} onClick={() => onRemoveBatch()}>
          {intl.get('global.remove')}
        </Button>
      </div>
      <Table
        rowKey='id'
        size='small'
        loading={loading}
        columns={columns}
        dataSource={_dataSource}
        pagination={pagination}
        scroll={{ x: 'max-content', y: height - 170 }}
        {...(_dataSource?.length === 0 ? {} : { rowSelection: { selectedRowKeys, onChange: (selectedRowKeys: any) => setSelectedRowKeys(selectedRowKeys) } })}
        onChange={(pagination: any) => {
          const { current, pageSize } = pagination;
          const state = { page: current, size: pageSize };
          onUpdateState(state);
        }}
      />
    </div>
  );
};

export default MemberManagement;
