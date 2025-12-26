import { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { CheckCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Title, Text, Table, Button } from '@/common';

import { MODEL_TYPE_OPTIONS } from '@/pages/ModelManagement/LargeModel/enums';

import styles from './index.module.less';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');
const MODEL_TAGS_KV = _.keyBy(MODEL_TYPE_OPTIONS, 'value');

const ModelDefault = () => {
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState({ order: 'desc', rule: 'default' }); // 分页信息
  const [filterValues, setFilterValues] = useState<any>({ name: '' }); // 筛选条件

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>([]); // 列表数据

  const { page, size, order, rule } = pageState || {};
  const { name } = filterValues || {};

  useEffect(() => {
    // getRolePermission();
    getList();
  }, []);

  /** 获取模型管理列表 */
  const getList = async (data?: any) => {
    try {
      const postData = { page, size, order, rule, name, ...data };

      const result = await SERVICE.llm.llmGetList(postData);
      if (!result) return;
      onUpdateState({ ...postData, count: result.count });
      setDataSource(result.data);
      // getItemsPermission(result.data);
      return result.data;
    } catch (error) {
      console.log(error);
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    getList({ page: 1, ...values });
    setFilterValues(values);
  };

  /** 表格-分页 */
  const onChange = (pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, size: pageSize, rule: field || 'create_time', order: stateOrder };
    onUpdateState(state);
    getList(state);
  };

  /** 切换当前默认 */
  const onChangeDefault = async (data: any) => {
    const { model_id } = data;
    try {
      setLoading(true);
      const result = await SERVICE.llm.llmDefaultEdit({ model_id, default: true });
      if (result?.status === 'ok') getList({ page: 1 });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('onChangeDefault error: ', error);
    }
  };

  const columns: any = [
    {
      title: intl.get('modelDefault.modelName'),
      dataIndex: 'model_name',
      fixed: 'left',
      sorter: true,
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div className='g-flex' title={value}>
          <img src={MODEL_ICON_KV[record?.model_series]?.icon} className='g-mr-2' style={{ width: 24, height: 24 }} />
          <div className=' g-ellipsis-1'>{value}</div>
        </div>
      ),
    },
    {
      title: intl.get('modelDefault.modelType'),
      dataIndex: 'model_type',
      __selected: true,
      render: (value: string) => MODEL_TAGS_KV[value]?.label || '--',
    },
    {
      title: intl.get('modelDefault.baseModel'),
      dataIndex: 'model_series',
      __selected: true,
    },
    {
      title: intl.get('modelDefault.setting'),
      dataIndex: 'default',
      __selected: true,
      render: (value: boolean, data: any) => {
        if (value) {
          return (
            <div className='g-flex-align-center-'>
              <CheckCircleFilled className='g-mr-2 g-c-success' />
              {intl.get('modelDefault.currentDefault')}
            </div>
          );
        } else {
          return (
            <Button size='small' onClick={() => onChangeDefault(data)}>
              {intl.get('modelDefault.setAsDefault')}
            </Button>
          );
        }
      },
    },
  ];

  return (
    <div className={styles['page-model-default']}>
      <Title>{intl.get('modelDefault.title')}</Title>
      <Text block>{intl.get('modelDefault.subTitle')}</Text>
      <div style={{ height: 'calc(100% - 44px)' }}>
        <Table.PageTable
          name='default-model'
          rowKey='model_id'
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          onChange={onChange}
        >
          <Table.Operation
            nameConfig={{ key: 'name', placeholder: intl.get('modelDefault.pleaseEnterTheModelName') }}
            initialFilter={filterValues}
            onChange={onChangeFilter}
          ></Table.Operation>
        </Table.PageTable>
      </div>
    </div>
  );
};

export default ModelDefault;
