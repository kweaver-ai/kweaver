import { useState, useEffect } from 'react';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import { Button, Title, Table, Select, Modal, EmptyContent } from '@/common';

import Card from './Card';
import CreateAndEditModal from './CreateAndEditModal';

import styles from './index.module.less';

const DATA_SOURCE = [
  {
    id: 1,
    name: 'CHID (Chinese IDiom Dataset for Test)',
    description: '这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是',
    tags: ['内置', '内置2', '内置3'],
    create_user: 'abcdefg',
    create_time: '2025-03-21 01:22:47',
    update_user: 'ltesl',
    update_time: '2025-03-31 22:12:35',
  },
];
for (let i = 2; i <= 50; i++) {
  DATA_SOURCE.push({
    ...DATA_SOURCE[0],
    id: i,
    name: `表格测试${i}`,
    tags: i % 2 === 0 ? [] : ['内置', '内置2', '内置3'],
    create_user: i % 2 === 0 ? 'abcdefg' : '韩坤',
    description:
      i % 2 === 0 ? '这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是一个测试数据这是' : '一个测试数据这是',
  });
}

const MENU_SORT_ITEMS: MenuProps['items'] = [
  { key: 'name', label: '按评测数据名称排序' },
  { key: 'size', label: '按大小排序' },
  { key: 'create_time', label: '按创建时间排序' },
];
const EVALUATION_TYPE_OPTIONS = [
  { value: 'inner', label: '内置' },
  { value: 'custom', label: '自定义' },
];

const EmptyContentDescription = (props: { isFirstSearch: boolean; onCreate: () => void }) => {
  const { isFirstSearch, onCreate } = props;
  if (isFirstSearch) {
    return (
      <div className='g-flex-center'>
        点击<Button.Link onClick={onCreate}>【新建】</Button.Link>按钮添加数据集
      </div>
    );
  } else {
    return <div className='g-flex-center'>抱歉，没有找到相关内容</div>;
  }
};

type CAETypeType = 'create' | 'edit';
type CAEType = { open: boolean; type: CAETypeType; sourceData: any };
const EvaluationData = () => {
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState();
  const [filterValues, setFilterValues] = useState<any>({ name: '', tag: 'all' }); // 筛选条件

  const [dataSource, setDataSource] = useState<any[]>(DATA_SOURCE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]); // 选中行
  const [CAEModalData, setCAEModalData] = useState<CAEType>({ open: false, type: 'create', sourceData: null }); // 创建和编辑弹窗数据

  const { page, size, order, rule } = pageState || {};
  const { name, tag } = filterValues || {};

  const [isFirstSearch, setIsFirstSearch] = useState(true); // 是否是第一次搜索，用于判断EmptyContent展示的图片内容：create-新建、notFound-暂无数据
  useEffect(() => {
    getList({}, true);
  }, []);

  /** 获取模型管理列表 */
  const getList = async (data?: any, isFirstSearch?: boolean) => {
    const length = dataSource.length;
    onUpdateState({ count: length });
    // if (isFirstSearch !== undefined) setIsFirstSearch(isFirstSearch);
    // else setIsFirstSearch(false);
    // setDataSource([]);

    try {
      const postData = { page, size, order, rule, name, tag, ...data };
      if (!postData.tag || postData.tag === 'all') delete postData.tag;

      // const result = await SERVICE.llm.llmGetList(postData);
      // if (!result) return;
      // onUpdateState({ ...postData, count: result.count });
      // setDataSource(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    getList({ page: 1, ...values });
    setFilterValues(values);
  };

  /** 排序 */
  const onSortChange = (data: any) => {
    const state = {
      rule: data.key,
      order: data.key !== rule ? 'desc' : order === 'desc' ? 'asc' : 'desc',
    };
    getList(state);
  };

  /** 打开创建和编辑弹窗 */
  const onOpenCAEModal = (type: CAETypeType, sourceData = null) => setCAEModalData({ open: true, type, sourceData });
  /** 关闭创建和编辑弹窗 */
  const onCloseCAEModal = () => setCAEModalData({ open: false, type: 'create', sourceData: null });

  /** 删除 */
  const onDeleteConfirm = (items: any) => {
    const names = _.map(items, item => `「${item?.name}」`).join('、');
    modal.confirm({
      title: '删除提示',
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: `确定删除 ${names} 吗？删除后不能恢复，请谨慎操作。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        console.log('onOk');
      },
    });
  };

  /** 跳转详情页 */
  const toPageDetail = (record: any) => {
    navigate(`/evaluation-data/detail?id=${record.id}`);
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: any) => {
    if (key === 'edit') toPageDetail(record);
    if (key === 'rename') onOpenCAEModal('edit', record);
    if (key === 'delete') onDeleteConfirm([record]);
  };

  /** 创建和编辑弹窗-保存 */
  const onOk = async (values: any) => {
    console.log('values', values);
  };

  return (
    <div className={styles['page-evaluation-data']}>
      {contextHolder}
      <Title>测评数据</Title>
      <div style={{ height: 'calc(100% - 20px)' }}>
        <Table.PageCard
          colKey='id'
          dataSource={dataSource}
          component={(props: any) => <Card {...props} onOperate={onOperate} toPageDetail={toPageDetail} />}
          pagination={pagination}
          rowSelection={{ selectedRowKeys, onChange: (selectedRowKeys: any) => setSelectedRowKeys(selectedRowKeys) }}
          onChange={(page: number, size: number) => onUpdateState({ page, size })}
          emptyContent={
            <EmptyContent
              type={isFirstSearch ? 'create' : 'notFound'}
              styles={{ container: { marginTop: '-30%' } }}
              description={<EmptyContentDescription isFirstSearch={isFirstSearch} onCreate={() => onOpenCAEModal('create')} />}
            />
          }
        >
          <Table.Operation
            nameConfig={{ key: 'name', placeholder: '请输入评测数据集名称' }}
            sortConfig={{
              items: MENU_SORT_ITEMS,
              order: pageState.order,
              rule: pageState.rule,
              onChange: onSortChange,
            }}
            initialFilter={filterValues}
            onChange={onChangeFilter}
            onRefresh={() => {
              if (isFirstSearch) getList({}, true);
              else getList();
            }}
          >
            <Button.Create onClick={() => onOpenCAEModal('create')} />
            <Button.Delete
              disabled={selectedRowKeys.length <= 0}
              onClick={() => {
                const items = _.filter(DATA_SOURCE, item => _.includes(selectedRowKeys, item.id));
                onDeleteConfirm(items);
              }}
            />
            <Select.LabelSelect
              key='tag'
              label='标签'
              defaultValue='all'
              style={{ width: 190 }}
              options={[{ value: 'all', label: '全部' }, ...EVALUATION_TYPE_OPTIONS]}
            />
          </Table.Operation>
        </Table.PageCard>
      </div>
      <CreateAndEditModal open={CAEModalData.open} type={CAEModalData.type} sourceData={CAEModalData.sourceData} onOk={onOk} onCancel={onCloseCAEModal} />
    </div>
  );
};

export default EvaluationData;
