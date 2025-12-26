import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import ENUMS from '@/enums';
import SERVICE from '@/services';
import { Button, Table, Select } from '@/common';
import { CURRENCY_TYPE, CURRENCY_UNIT } from '@/enums/amount_currency';

import LimitModal from './LimitModal';
import AllCoatUserQuotaModal from './AllCoatUserQuotaModal';
import { onHandleSingle, onTotalAmount } from './assistFunction';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

const ModelQuota = () => {
  const { message } = HOOKS.useGlobalContext();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState(); // 分页信息
  const [filterValues, setFilterValues] = useState<any>({ name: '', api_model: 'all' }); // 筛选条件

  const [loading, setLoading] = useState(false);
  const [tableRecord, setTableRecord] = useState<any>({}); // 表格行数据
  const [dataSource, setDataSource] = useState<any[]>([]); // 配额管理列表
  const [configOptions, setConfigOptions] = useState<any[]>([]); // 使用的模型列表

  const { width: screenWidth } = HOOKS.useWindowSize();
  const [limitVisible, setLimitVisible] = useState(false); // 限额设置弹窗
  const [distributionVisible, setDistributionVisible] = useState(false); // 分配额度弹窗

  const { page, size, order, rule } = pageState || {};
  const { name, api_model } = filterValues || {};

  const MENU_SORT_ITEMS = [
    { key: 'model_name', label: intl.get('modelQuota.sortByName') },
    { key: 'total_price', label: intl.get('modelQuota.sortByCount') },
    { key: 'update_time', label: intl.get('modelQuota.finalOperatorTime') },
  ];

  useEffect(() => {
    getList({});
  }, []);

  /** 获取模型配额列表 */
  const getList = async (data?: any) => {
    try {
      const postData = { page, size, order, rule, name, api_model, ...data };
      if (!postData.api_model || postData.api_model === 'all') delete postData.api_model;

      setLoading(true);
      const result = await SERVICE.llm.llmQuotaGetList(postData);
      setLoading(false);
      onUpdateState({ ...postData, count: result?.total });
      setConfigOptions(_.map(result?.model_list, (item: string) => ({ value: item, label: item })));
      if (result?.res) setDataSource(result?.res || []);
    } catch (_error) {
      setLoading(false);
    }
  };

  /** 排序 */
  const onSortChange = (data: any) => {
    const state = {
      rule: data.key,
      order: data.key !== rule ? 'desc' : order === 'desc' ? 'asc' : 'desc',
    };
    getList(state);
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    console.log('values', values);
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

  /** 取消弹窗 */
  const onHandleCancel = (isUpdate = false) => {
    setLimitVisible(false);
    setDistributionVisible(false);
    if (isUpdate) getList();
  };

  /** dropdown下拉变化 */
  const onOperate = (key: string, record: any) => {
    if (record?.input_tokens === -1 && key === 'distribution') return message.warning(intl.get('modelQuota.quotaModalTip'));

    setTableRecord(record);
    if (key === 'limit') setLimitVisible(true);
    if (key === 'distribution') setDistributionVisible(true);
  };

  const columns: any = [
    {
      title: intl.get('modelQuota.name'),
      dataIndex: 'model_name',
      width: 296,
      __fixed: true,
      __selected: true,
      render: (text: any, record: any) => (
        <>
          <img src={MODEL_ICON_KV[record?.model_series]?.icon} className='g-mr-3' style={{ width: 24, height: 24 }} />
          <span title={text}>{text}</span>
        </>
      ),
    },
    {
      title: intl.get('modelQuota.operate'),
      dataIndex: 'operate',
      width: 72,
      __fixed: true,
      __selected: true,
      render: (_: any, record: any) => {
        const dropdownMenu: any = [
          { key: 'limit', label: intl.get('modelQuota.quotaSet') },
          { key: 'distribution', label: intl.get('modelQuota.userQuota') },
        ];
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu,
              onClick: (event: any) => {
                event.domEvent.stopPropagation();
                onOperate(event.key, record);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event: any) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('modelQuota.model'),
      dataIndex: 'model',
      ellipsis: true,
      width: 224,
      __selected: true,
      render: (text: any) => (
        <div className='g-ellipsis-1' title={text}>
          {text}
        </div>
      ),
    },
    {
      title: intl.get('modelQuota.tokensCount'),
      dataIndex: 'input_tokens',
      width: screenWidth < 1806 ? 276 : undefined,
      __selected: true,
      render: (text: any, record: any) => (
        <React.Fragment>
          {/* 1:单独收费  0：统一计费 */}
          {text === -1 ? (
            '--'
          ) : record?.billing_type === 1 ? (
            <React.Fragment>
              <div>
                {intl.get('modelQuota.in')}：
                {record?.input_tokens || record?.input_tokens === 0
                  ? `${record?.input_tokens}${CURRENCY_UNIT[record?.num_type?.[0]]}/${intl.get('modelQuota.month')}`
                  : '--'}
              </div>
              <div>
                {intl.get('modelQuota.out')}：
                {record?.output_tokens || record?.output_tokens === 0
                  ? `${record?.output_tokens}${CURRENCY_UNIT[record?.num_type?.[1]]}/${intl.get('modelQuota.month')}`
                  : '--'}
              </div>
            </React.Fragment>
          ) : record?.input_tokens || record?.input_tokens === 0 ? (
            `${record?.input_tokens}${CURRENCY_UNIT[record?.num_type?.[0]]}/${intl.get('modelQuota.month')}`
          ) : (
            '--'
          )}
        </React.Fragment>
      ),
    },
    {
      title: intl.get('modelQuota.price'),
      dataIndex: 'referprice_in',
      width: screenWidth < 1806 ? 306 : undefined,
      __selected: true,
      render: (text: any, record: any) => {
        const { inSingle, outSingle } = onHandleSingle(record);
        return (
          <React.Fragment>
            {text === -1 ? (
              '--'
            ) : record?.billing_type === 1 ? (
              <React.Fragment>
                <div>{inSingle}</div>
                <div>{outSingle}</div>
              </React.Fragment>
            ) : (
              inSingle
            )}
          </React.Fragment>
        );
      },
    },
    {
      title: intl.get('modelQuota.totalPrice'),
      dataIndex: 'total_price',
      sorter: true,
      width: screenWidth < 1806 ? 276 : undefined,
      __selected: true,
      render: (_: any, record: any) => <>{record?.billing_type === -1 ? '--' : `${CURRENCY_TYPE[record?.currency_type]}${onTotalAmount(record)}` || '--'}</>,
    },
    {
      title: intl.get('modelQuota.update_time'),
      dataIndex: 'update_time',
      sorter: true,
      showSorterTooltip: false,
      __selected: true,
      render: (text: any) => <>{text || '--'}</>,
    },
  ];

  return (
    <div className='g-h-100 g-pl-6 g-pr-6 g-pt-4'>
      <Table.PageTable
        name='large-model-quota'
        rowKey='model_id'
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        onChange={onChange}
      >
        <Table.Operation
          nameConfig={{ key: 'name', placeholder: intl.get('modelQuota.pleaseEnterTheModelName') }}
          sortConfig={{ items: MENU_SORT_ITEMS, order, rule, onChange: onSortChange }}
          initialFilter={filterValues}
          onChange={onChangeFilter}
          onRefresh={getList}
        >
          <Select.LabelSelect
            key='api_model'
            label={intl.get('modelQuota.model')}
            defaultValue='all'
            style={{ width: 190 }}
            options={[{ value: 'all', label: intl.get('modelQuota.all') }, ...configOptions]}
          />
        </Table.Operation>
      </Table.PageTable>
      <LimitModal
        operateAction={tableRecord?.input_tokens !== -1 ? 'edit' : 'create'}
        visible={limitVisible}
        tableRecord={tableRecord}
        onHandleCancel={onHandleCancel}
      />
      <AllCoatUserQuotaModal
        visible={distributionVisible}
        onHandleCancel={onHandleCancel}
        tableRecord={tableRecord}
        isSingle={tableRecord?.billing_type === 1}
      />
    </div>
  );
};

export default ModelQuota;
