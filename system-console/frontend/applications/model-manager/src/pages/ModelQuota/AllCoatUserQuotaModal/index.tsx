import { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { InputNumber, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import UTILS from '@/utils';
import SERVICE from '@/services';
import { Button, IconFont, Modal, Table, Select } from '@/common';
import ErrorTip from '@/components/ErrorTip';
import { PRICE_UNIT, CURRENCY_UNIT_KEY_CHANGE } from '@/enums/amount_currency';

import { limitDecimals } from '../assistFunction';
import {
  onDelete,
  onCalculateOperate,
  onHandleIsEmpty,
  onHandleIDS,
  onHandleCheckQuota,
  onHandleUpdateEmpty,
  onHandleIsAllCalculate,
  onUpdateTableDataBeyondError,
} from './assistFunction';

import './style.less';

const AllCoatUserQuotaModal = (props: any) => {
  const { visible, onHandleCancel, tableRecord, isSingle } = props;

  const modelRef = useRef<any>();
  const tableDataRef = useRef<any>();
  const updateDataRef = useRef<any>([]);

  const language = UTILS.SessionStorage.get('language') || 'zh-cn';

  const saveUserQuotaListRef = useRef<any>([]); // 点击保存后和编辑进入的用户
  const disCountRef = useRef<any>({ input_tokens: 0, output_tokens: 0, input_tokens_remain: 0, output_tokens_remain: 0 }); // 可分配数量

  const [tableLoading, setTableLoading] = useState(false);
  const [isAddUSer, setIsAddUSer] = useState(false); // 是否添加用户操作

  const [allUsers, setAllUsers] = useState<any[]>([]); // 可搜索到的用户
  const [dataSource, setDataSource] = useState<any>([]); // 表格数据
  const [updateData, setUpdateData] = useState<any>([]); // 更改的数据
  const [isChange, setIsChange] = useState(UTILS.SessionStorage.get('quotaTip'));

  useEffect(() => {
    if (visible) {
      onGetUserQuotaInfo();
      getUser();
    }
  }, [visible]);

  /** 获取分配用户配额信息 */
  const onGetUserQuotaInfo = async () => {
    try {
      setTableLoading(true);
      const res = await SERVICE.llm.llmQuotaUserList({ page: 1, size: 5000, order: 'desc', rule: 'update_time', conf_id: tableRecord?.conf_id });
      let result: any = [];
      setTableLoading(false);

      _.map(_.cloneDeep(res?.res), (item: any) => {
        const { user_id, user_name, input_tokens, output_tokens, conf_id, num_type, user_quota_id } = item;
        result = [
          ...result,
          { user_id, user_name, input_tokens, output_tokens, num_type, user_quota_id, model_quota_id: conf_id, input_status: '', output_status: '' },
        ];
      });

      // 总的输入输出额度(加上已被分配给用户的额度)
      let allInputQuota: any = res?.input_tokens_remain;
      let allOutputQuota: any = res?.output_tokens_remain;
      if (tableRecord?.billing_type === 0) {
        _.map(_.cloneDeep(res?.res), (item: any) => {
          allInputQuota += (item?.input_tokens || 0) * PRICE_UNIT[item?.num_type?.[0]];
        });
      } else {
        _.map(_.cloneDeep(res?.res), (item: any) => {
          allInputQuota += (item?.input_tokens || 0) * PRICE_UNIT[item?.num_type?.[0]];
          allOutputQuota += (item?.output_tokens || 0) * PRICE_UNIT[item?.num_type?.[1]];
        });
      }

      const inputTokensAndRemain = { input_tokens: res?.input_tokens_remain || 0, input_tokens_remain: allInputQuota };
      disCountRef.current = isSingle
        ? { ...inputTokensAndRemain, output_tokens: res?.output_tokens_remain || 0, output_tokens_remain: allOutputQuota }
        : inputTokensAndRemain;

      setDataSource(result);
      tableDataRef.current = result;
      saveUserQuotaListRef.current = result;
    } catch (err) {
      setTableLoading(false);
      onError(err);
    }
  };

  /** 获取所有用户 */
  const getUser = async () => {
    try {
      const userResult = await SERVICE.authorization.getUsers([0, 10000]);
      const allUser = _.map(userResult, item => ({ value: item.id, label: item?.user?.displayName || item?.user?.loginName })) || [];
      const appAccountResult = await SERVICE.authorization.getAppAccounts({ limit: 1000, offset: 0, direction: 'desc', sort: 'date_created' });
      const appAccounts = _.map(appAccountResult?.entries, item => ({ value: item.id, label: item?.name })) || [];
      setAllUsers([...appAccounts, ...allUser]);
    } catch (_error) {}
  };

  /** 选择用户 */
  const onSelectChange = (value: string, data: any) => {
    if (!value) return;
    onUpdateData('', { user_id: value }, '', data?.label);
    setIsAddUSer(true);
  };

  /** 删除 */
  const onDeleteData = (record: any) => {
    const { result, newDisCount } = onDelete(record, tableDataRef?.current, isSingle, disCountRef?.current);
    setDataSource(result);
    tableDataRef.current = result;
    disCountRef.current = newDisCount;
    onUpdateAddChange(record, {}, 'delete');
    setIsAddUSer(true);
  };

  /** 取消温馨提示 */
  const onCancelTip = () => {
    UTILS.SessionStorage.remove('quotaTip');
    setIsChange(false);
  };

  /** 更新表格数据 */
  const onUpdateData = (value: any, record: any, type: string, name = '', inputStatus?: any) => {
    setIsAddUSer(true);

    // name存在说明此时的状态是添加
    if (name) {
      onHandleAddUerToTable(record, name);
      return;
    }

    onUpdateAddChange(record, { [type]: value }, 'change');

    const handleTableSource: any = _.map(_.cloneDeep(tableDataRef?.current), (item: any) => {
      if (item?.user_id === record?.user_id) {
        item[type] = value;
        item = { ...item };
      }
      return item;
    });
    const { inputQuota, outputQuota } = onCalculateOperate(handleTableSource, tableRecord?.billing_type, disCountRef?.current);

    let changeInputNumber: any = {};
    if (!name) {
      const operateType = inputStatus ? inputStatus : type === 'input_tokens' ? 'in' : 'out';
      changeInputNumber = onHandleInputStatus(inputQuota, outputQuota, operateType);
    }

    /** 输入输出数字框变化 */
    const handleDataSource: any = _.map(_.cloneDeep(tableDataRef?.current), (item: any) => {
      if (item?.user_id === record?.user_id) {
        item[type] = value;
        item = { ...item, ...changeInputNumber };
      }
      return item;
    });

    const updateTableDataStatus = onHandleAllCalculate(handleDataSource);

    tableDataRef.current = updateTableDataStatus;
    setDataSource([...updateTableDataStatus]);
  };

  /** 分配总金额是否超出范围（更新表格） */
  const onHandleAllCalculate = (tableData: any) => {
    const { inputTotalDistribution, outputTotalDistribution } = onHandleIsAllCalculate(tableData, tableRecord);

    const inputStatus = disCountRef.current?.input_tokens_remain >= inputTotalDistribution;
    const outputStatus = disCountRef.current?.output_tokens_remain >= outputTotalDistribution;

    // 只去除超出范围的报错
    const updateTableDataStatus = onUpdateTableDataBeyondError(tableData, inputStatus, outputStatus, tableRecord);
    const updateTableDataRef = onUpdateTableDataBeyondError(updateDataRef.current, inputStatus, outputStatus, tableRecord);
    updateDataRef.current = updateTableDataRef;
    return updateTableDataStatus;
  };

  /** 添加用户显示到表格中 */
  const onHandleAddUerToTable = (record: any, name: any) => {
    const addList: any = {
      user_id: record?.user_id,
      user_name: name,
      num_type: [3, tableRecord?.billing_type === 0 ? 0 : 3],
      model_quota_id: tableRecord?.conf_id,
    };
    const allIds = onHandleIDS(tableDataRef?.current);

    let result: any = [];
    // 重复添加 数据放到最前面
    if (_.includes(allIds, record?.user_id)) {
      let repeatAddUser: any = {}; // 重复添加的用户
      let filterNoAddedUser: any = []; // 表格中已存在的用户
      _.map(_.cloneDeep(tableDataRef?.current), (item: any) => {
        if (item?.user_id === record?.user_id) {
          item.added = true;
          repeatAddUser = item;
        } else {
          item.added = false;
          filterNoAddedUser = [...filterNoAddedUser, item];
        }
      });
      result = [repeatAddUser, ...filterNoAddedUser];
      onUpdateAddChange({ ...repeatAddUser, ...record }, {}, 'repeat');
    } else {
      // 新添加
      const tokensInputOutput = tableRecord?.billing_type === 0 ? { input_tokens: 20 } : { input_tokens: 20, output_tokens: 20 };
      const tableData = [{ ...addList, ...tokensInputOutput }, ...dataSource];
      const { inputQuota, outputQuota } = onCalculateOperate(tableData, tableRecord?.billing_type, disCountRef?.current);
      const operateType = tableRecord?.billing_type === 0 ? 'in' : 'all';
      const changeInputNumber = onHandleInputStatus(inputQuota, outputQuota, operateType);
      result = [{ ...addList, ...tokensInputOutput, ...changeInputNumber }, ...dataSource];
      onUpdateAddChange({ ...addList, ...tokensInputOutput, ...changeInputNumber }, {}, 'add');
    }
    setDataSource(result);
    tableDataRef.current = result;
  };

  /** 输入数量超出额度输入框爆红 */
  const onHandleInputStatus = (inputQuota: any, outputQuota: any, type: string) => {
    switch (type) {
      case 'in':
        disCountRef.current.input_tokens = inputQuota;
        break;
      case 'out':
        disCountRef.current.output_tokens = outputQuota;
        break;
      case 'all':
        disCountRef.current.input_tokens = inputQuota;
        disCountRef.current.output_tokens = outputQuota;
        break;
      default:
        break;
    }

    const inputResult = {
      input_status:
        disCountRef.current?.input_tokens < 0 ? (tableRecord?.billing_type === 0 ? intl.get('modelQuota.beyondAll') : intl.get('modelQuota.beyondInput')) : '',
    };
    const outResult = { output_status: disCountRef.current?.output_tokens < 0 ? intl.get('modelQuota.beyondOutput') : '' };
    return type === 'in' ? inputResult : type === 'all' ? { ...inputResult, ...outResult } : outResult;
  };

  /** 被更改|新添加|删除的数据 */
  const onUpdateAddChange = (record: any, changeValue: any, type: string) => {
    const userIds = _.map(_.cloneDeep(updateDataRef.current), (item: any) => item?.user_id);
    if (type === 'change') {
      if (_.includes(userIds, record?.user_id)) {
        const newUpdateData = _.map(_.cloneDeep(updateDataRef.current), (item: any) => {
          if (item?.user_id === record?.user_id) item = { ...item, ...changeValue };
          return item;
        });
        setUpdateData(newUpdateData);
        updateDataRef.current = newUpdateData;
      } else {
        const newRecord: any = {
          model_quota_id: tableRecord?.conf_id,
          input_tokens: parseFloat(record?.input_tokens),
          user_id: record?.user_id,
          num_type: record?.num_type,
        };
        if (tableRecord?.billing_type === 1) {
          newRecord.output_tokens = parseFloat(record?.output_tokens);
        }
        const newUpdateData = _.isEmpty(updateDataRef.current)
          ? [{ ...newRecord, ...changeValue }]
          : [...updateDataRef.current, { ...newRecord, ...changeValue }];
        updateDataRef.current = newUpdateData;
        setUpdateData(newUpdateData);
      }
    }
    if (type === 'delete') {
      const filterData = _.filter(_.cloneDeep(updateDataRef.current), (item: any) => item?.user_id !== record?.user_id);
      updateDataRef.current = filterData;
      setUpdateData(filterData);
    }
    if (type === 'add') {
      setUpdateData(_.isEmpty(updateDataRef.current) ? [record] : [record, ...updateData]);
      updateDataRef.current = _.isEmpty(updateDataRef.current) ? [record] : [record, ...updateData];
    }
    if (type === 'repeat') {
      if (!_.includes(userIds, record?.user_id)) {
        const updateRecord = {
          input_tokens: record?.input_tokens || undefined,
          output_tokens: record?.output_tokens || undefined,
          user_id: record?.user_id,
          num_type: record?.num_type,
          model_quota_id: record?.model_quota_id || tableRecord?.conf_id,
        };
        const newUpdateData = _.isEmpty(updateDataRef.current) ? [updateRecord] : [updateRecord, ...updateDataRef.current];
        updateDataRef.current = newUpdateData;
        setUpdateData(newUpdateData);
      }
    }
  };

  /** 保存前-数据填入校验 */
  const onHandleCheckToSave = () => {
    const { isEmpty, result } = onHandleIsEmpty(tableDataRef?.current, tableRecord?.billing_type);
    if (isEmpty) {
      setDataSource([...result]);
      tableDataRef.current = result;

      return false;
    }
    if (
      tableRecord?.billing_type === 0
        ? disCountRef?.current?.input_tokens < 0
        : disCountRef?.current?.input_tokens < 0 || disCountRef?.current?.output_tokens < 0
    )
      return false;
    return true;
  };

  /** 保存 */
  const onSave = () => {
    if (!onHandleCheckToSave()) return;
    if (onHandleCheckQuota(tableRecord, disCountRef)) {
      message.warning(intl.get('modelQuota.quotaEmpty'));
      return;
    }

    setIsAddUSer(false);
    const currentTableIds = _.map(_.cloneDeep(tableDataRef?.current), (item: any) => item?.user_id);
    const deleteData = _.filter(_.cloneDeep(saveUserQuotaListRef?.current), (item: any) => !_.includes(currentTableIds, item?.user_id));
    if (!_.isEmpty(deleteData)) {
      onDeleteTableData(deleteData);
    } else {
      onCreateUser();
    }
  };

  /** 删除 */
  const onDeleteTableData = async (deleteData: any) => {
    try {
      const body = _.map(_.cloneDeep(deleteData), (item: any) => item?.user_quota_id);
      const { res } = await SERVICE.llm.llmQuotaUserDelete({ conf_id_list: body });
      if (res) {
        if (!_.isEmpty(updateDataRef.current)) {
          onCreateUser();
        } else {
          onResetData();
        }
      }
    } catch (_error) {}
  };

  /** 添加 */
  const onCreateUser = async () => {
    try {
      const { res } = await SERVICE.llm.llmQuotaUserAdd({
        list: _.isEmpty(updateDataRef.current) ? onHandleUpdateEmpty(dataSource, tableRecord) : updateDataRef.current,
      });
      if (res) {
        onResetData();
        message.success(intl.get('modelQuota.success'));
      }
    } catch (err) {
      onError(err);
    }
  };

  /** 错误提示 */
  const onError = (err: any) => {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
  };

  /** 添加|删除后数据更新 */
  const onResetData = () => {
    onReset();
    setIsAddUSer(false);
    onGetUserQuotaInfo();
  };

  /** 取消（恢复默认） */
  const onReset = () => {
    setUpdateData([]);
    updateDataRef.current = [];
    onGetUserQuotaInfo();
    setIsAddUSer(false);
  };

  /** 温馨提示(关闭后不再显示，重新登陆后再显示) */
  const boardTip = (
    <div className='boardTip g-w-100 g-mb-4 g-flex'>
      <div className='boardTip-left'>
        <ExclamationCircleFilled className='g-mr-2' style={{ color: '#1677FF' }} />
        {intl.get('modelQuota.userTip')}
      </div>
      <div className='boardTip-right g-flex-center'>
        <Button.Icon icon={<IconFont type='icon-dip-close' style={{ opacity: 0.25 }} />} size='small' onClick={onCancelTip} />
      </div>
    </div>
  );

  const afterClose = () => {
    setDataSource([]);
    setAllUsers([]);
    tableDataRef.current = [];
    setIsAddUSer(false);
  };

  /** 选择单位 */
  const selectAfter = (record: any, type: string) => {
    return (
      <Select
        defaultValue='2'
        value={type === 'in' ? `${record?.num_type?.[0] === 3 ? 6 : record?.num_type?.[0]}` : `${record?.num_type?.[1] === 3 ? 6 : record?.num_type?.[1]}`}
        style={{ minWidth: 58 }}
        popupMatchSelectWidth={100}
        options={_.map(CURRENCY_UNIT_KEY_CHANGE, (item, key) => ({ value: key, label: item }))}
        onChange={(value: string) => {
          const newValue = value === '6' ? 3 : parseInt(value, 10);
          const OneIndex = record?.num_type?.[0] === 6 ? 3 : record?.num_type?.[0];
          const TwoIndex = record?.num_type?.[1] === 6 ? 3 : record?.num_type?.[1];
          onUpdateData(type === 'in' ? [newValue, TwoIndex] : [OneIndex, newValue], record, 'num_type', '', type);
        }}
      />
    );
  };

  const inputProps = (text: any): any => {
    return {
      min: 1,
      max: 9999,
      stringMode: true,
      size: 'middle',
      value: text,
      controls: false,
      placeholder: intl.get('global.pleaseEnter'),
      formatter: (value: any) => limitDecimals(value, 3, true),
      parser: (value: any) => (!value?.includes('.') ? value?.replace(/\$\s?|(,*)/g, '') : value?.replace(/^(-)*(\d+)\.(\d\d\d).*$/, '$1$2.$3')),
    };
  };
  const respectivelyColumns = [
    {
      title: intl.get('modelQuota.input'),
      dataIndex: 'input_tokens',
      render: (text: any, record: any) => {
        return (
          <div className='g-flex-space-between'>
            <ErrorTip errorText={record?.input_status}>
              <InputNumber
                {...inputProps(text)}
                addonAfter={selectAfter(record, 'in')}
                status={record?.input_status ? 'error' : ''}
                onChange={(value: any) => {
                  let _value = parseFloat(value);
                  _value = Number.isNaN(_value) ? 1 : _value;
                  onUpdateData(_value, record, 'input_tokens');
                }}
              />
            </ErrorTip>
            <div className='g-ml-2' style={{ minWidth: 40, textAlign: 'right' }}>
              / {intl.get('modelQuota.month')}
            </div>
          </div>
        );
      },
    },
    {
      title: intl.get('modelQuota.outCount'),
      dataIndex: 'output_tokens',
      render: (text: any, record: any) => (
        <div className='g-flex-space-between'>
          <ErrorTip errorText={record?.output_status}>
            <InputNumber
              {...inputProps(text)}
              addonAfter={selectAfter(record, 'out')}
              status={record?.output_status ? 'error' : ''}
              onChange={(value: any) => {
                let _value = parseFloat(value);
                _value = Number.isNaN(_value) ? 1 : _value;
                onUpdateData(_value, record, 'output_tokens');
              }}
            />
          </ErrorTip>
          <div className='g-ml-2' style={{ minWidth: 40, textAlign: 'right' }}>
            / {intl.get('modelQuota.month')}
          </div>
        </div>
      ),
    },
  ];

  const allCountColumns = [
    {
      title: intl.get('modelQuota.inOutCounts'),
      dataIndex: 'input_tokens',
      width: 322,
      render: (text: any, record: any) => {
        return (
          <div className='g-flex-space-between'>
            <ErrorTip errorText={record?.input_status}>
              <InputNumber
                {...inputProps(text)}
                style={{ width: 270 }}
                addonAfter={selectAfter(record, 'in')}
                status={record?.input_status ? 'error' : ''}
                onChange={(value: any) => {
                  let _value = parseFloat(value);
                  _value = Number.isNaN(_value) ? 1 : _value;
                  onUpdateData(_value, record, 'input_tokens');
                }}
              />
            </ErrorTip>
            <div className='g-ml-2' style={{ minWidth: 40, textAlign: 'right' }}>
              / {intl.get('modelQuota.month')}
            </div>
          </div>
        );
      },
    },
  ];

  /** 默认表头 */
  const columns: any = [
    { title: intl.get('modelQuota.userName'), dataIndex: 'user_name', width: tableRecord?.billing_type === 0 ? 299 : 200, ellipsis: true },
    ...(isSingle ? respectivelyColumns : allCountColumns),
    {
      title: intl.get('modelQuota.operate'),
      dataIndex: 'operate',
      width: 80,
      align: 'center',
      render: (_: any, record: any) => (
        <div className='g-pointer g-c-primary' onClick={() => onDeleteData(record)}>
          {intl.get('global.delete')}
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      destroyOnHidden={true}
      className='allCoatUserQuotaModalRoot'
      title={intl.get('modelQuota.userQuota')}
      width={language === 'zh-cn' ? 800 : 850}
      maskClosable={false}
      afterClose={afterClose}
      footer={null}
      onCancel={onHandleCancel}
    >
      <div className='g-mb-7 content-box' ref={modelRef} style={{ minHeight: 417 }}>
        {isChange ? boardTip : null}
        <div className='g-mb-5'>
          <span className='g-mr-3'>{intl.get('modelQuota.addUser')}</span>
          <Select
            style={{ width: 296 }}
            showSearch
            value={null}
            allowClear={true}
            suffixIcon={null}
            prefix={<IconFont type='icon-dip-search' />}
            placeholder={intl.get('modelQuota.inputPlaceholder')}
            options={allUsers}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={onSelectChange}
          />
        </div>
        <div className='g-mb-3'>
          <span>{isSingle ? intl.get('modelQuota.remaining') : intl.get('modelQuota.remainingAll')}</span>
          <span className={disCountRef?.current?.input_tokens >= 0 ? 'g-c-primary' : 'g-c-error'}>{limitDecimals(disCountRef?.current?.input_tokens)}</span>
          {isSingle ? (
            <>
              <span>、{intl.get('modelQuota.outCount')}：</span>
              <span className={disCountRef?.current?.output_tokens >= 0 ? 'g-c-primary' : 'g-c-error'}>
                {limitDecimals(disCountRef?.current?.output_tokens)}
              </span>
            </>
          ) : null}
        </div>
        <Table
          rowKey='user_id'
          size='small'
          loading={tableLoading}
          columns={columns}
          dataSource={dataSource}
          bordered
          pagination={false}
          rowClassName={(record: any) => classNames({ 'text-font-weight': record?.added })}
        />
      </div>
      {isAddUSer ? (
        <div className='footer-btn-box g-flex'>
          <Button className='cancel-btn' type='default' onClick={onReset}>
            {intl.get('global.cancel')}
          </Button>
          <Button type='primary' onClick={onSave}>
            {intl.get('global.save')}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
};

export default AllCoatUserQuotaModal;
