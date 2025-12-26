import { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Dropdown, type RadioChangeEvent } from 'antd';
import { Divider, Radio, Table, InputNumber, Select, Button } from 'antd';

import HOOKS from '@/hooks';
import ENUMS from '@/enums';
import UTILS from '@/utils';
import SERVICE from '@/services';
import { Modal, IconFont } from '@/common';
import { CURRENCY_UNIT_KEY_CHANGE } from '@/enums/amount_currency';

import { limitDecimals, onHandleInt } from '../assistFunction';
import { onIsError, onHandleIsNull, onHandleTableData, onCalculateForecast, onHandleBlurTableData, onHandleInputOutputData } from './assistFunction';

import styles from './index.module.less';

const PRICE_UNIT: Record<string, string> = { thousand: intl.get('modelQuota.thousand'), million: intl.get('modelQuota.million') };
const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

const LimitModal = (props: any) => {
  const { message } = HOOKS.useGlobalContext();
  const { visible, onHandleCancel, tableRecord, operateAction } = props;

  const isBlurUpdateRef = useRef(false); // 失焦后再更新表格，此时是否更新预估总金额
  const tableDataRef = useRef<any>([]); // 先调失焦函数后调用更新表格函数，但此时获取的表格数据还是旧的，所以使用useRef保存
  const language = UTILS.SessionStorage.get('language') || 'zh-cn';
  const [valueBillingType, setBillingType] = useState<any>('1'); // 计费类型 0-统一计费 1-单独计费
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [calculate, setCalculate] = useState<string | number>(''); // 总金额
  const [selectSingle, setSelectSingle] = useState('¥'); // 单价 美元||元
  const [singleTokens, setSingleTokens] = useState('thousand'); // 单价token单位
  const [isSave, setIsSave] = useState(false);

  const isNoDistinction = tableRecord?.billing_type === 1; // 为true-区分输入输出

  useEffect(() => {
    if (visible) {
      onHandleValue();
      onGetInfo(tableRecord?.conf_id);
    }
  }, [visible]);

  /** 获取某一具体配额数据 */
  const onGetInfo = async (conf_id: string) => {
    if (operateAction === 'create') return;
    try {
      const { res } = await SERVICE.llm.llmQuotaGetDetail(conf_id);
      if (res) {
        setBillingType(`${res?.billing_type}`);
        onChangeQuoteSetting(res?.billing_type === 0, res);
      }
    } catch (_error) {
      //
    }
  };

  const onHandleValue = () => {
    if (operateAction !== 'create') return;
    onChangeQuoteSetting(!onHandleQuotaType());
  };

  /** 额度分配类型处理 统一输入输出/分别输入输出 */
  const onHandleQuotaType = () => {
    const modelSelect = _.includes(['OpenAI', 'openai'], tableRecord?.model_series);
    setBillingType(modelSelect ? '1' : '0');
    return modelSelect;
  };

  /** 配额设置展示形式 (输入、输出 || 输入和输出) */
  const onChangeQuoteSetting = (modelSelect: boolean, data?: any) => {
    const { tokensSingleUnit, inputTotal, outputTotal } = onHandleInputOutputData(data);
    const tableDataSource = onHandleTableData(modelSelect, data);
    onUpdateTableDataSource(tableDataSource);
    const calculatorInputTotal = onHandleInt(inputTotal);
    const calculatorOutputTotal = onHandleInt(outputTotal);
    if (data) {
      setBillingType(`${data?.billing_type}`);
      setSingleTokens(tokensSingleUnit);
      setSelectSingle(data?.currency_type === 0 ? '￥' : '$');
      setCalculate(data?.billing_type === 0 ? calculatorInputTotal : calculatorInputTotal + calculatorOutputTotal);
    } else {
      console.log('zzz', _.cloneDeep({ calculatorInputTotal, calculatorOutputTotal }));
      setCalculate(modelSelect ? calculatorInputTotal : calculatorInputTotal + calculatorOutputTotal);
      setSelectSingle('¥');
      setCalculate(0);
    }
  };

  /** 共同恢复 */
  const onCommonDefault = () => {
    setCalculate('');
    setSelectSingle('¥');
    setSingleTokens('thousand');
  };

  /** 表格更新 */
  const onUpdateData = (value: any, record: any, type: string) => {
    const inputValue: any = value;

    // 此处使用tableDataRef.current，因为数字框先失焦，但此时的数据还未更新
    const updateTable: any = _.map(_.cloneDeep(tableDataRef.current), (item: any) => {
      if (item?.id === record?.id) {
        item[type] = inputValue;
        if (inputValue !== 0 && !inputValue) {
          item.error = { ...item.error, [type]: true };
        } else {
          item.error = { ...item.error, [type]: false };
        }
      }
      return item;
    });

    // 切换金额单位 | 先失焦后拿到的数据未必是最新，但失焦后会再执行一次更新函数，此时再重新计算预估总金额
    if (type === 'num_type' || isBlurUpdateRef.current) {
      // 分别
      if ((operateAction === 'edit' && isNoDistinction) || (operateAction === 'create' && valueBillingType === '1')) {
        // // 输出tokens单位随输入一起变化
        // if (type === 'num_type') updateTable[1].num_type = inputValue;
        // 总金额根据单位重新计算
        updateTable[0].forecast = onCalculateForecast(updateTable, 'in', singleTokens)?.in;
        updateTable[1].forecast = onCalculateForecast(updateTable, 'out', singleTokens)?.out;
        const allCalculate = onHandleIsNull([updateTable[0].forecast, updateTable[1].forecast]);
        setCalculate(allCalculate);
      } else {
        updateTable[0].forecast = onCalculateForecast(updateTable, 'in', singleTokens)?.in;
        setCalculate(_.isNull(updateTable[0].forecast) ? '' : onHandleInt(updateTable[0].forecast));
      }
    }
    onUpdateTableDataSource(updateTable);
    isBlurUpdateRef.current = false;
  };

  /** 配额类型选择 */
  const onRadioChange = (e: RadioChangeEvent) => {
    const valueRadio = e?.target?.value;
    setBillingType(valueRadio);
    onChangeQuoteSetting(valueRadio === '0');
  };

  const quoteTitle = (text: string, extra?: any) => (
    <div className={styles.quoteLimit}>
      <Divider type='vertical' style={{ width: 2 }} className='g-mr-2 g-bg-primary' />
      {text}
      {extra ? (
        <div className='g-c-text-sub' style={{ paddingLeft: 10 }}>
          {extra}
        </div>
      ) : null}
    </div>
  );

  const selectBefore = (
    <Select
      defaultValue='CNY'
      value={selectSingle === '$' ? 'USD' : 'CNY'}
      style={{ width: 44 }}
      options={[
        { value: 'USD', label: '$' },
        { value: 'CNY', label: '¥' },
      ]}
      onChange={(value: string) => setSelectSingle(value === 'USD' ? '$' : '¥')}
    />
  );

  /** 失去焦点 */
  const onBlur = (record: any) => {
    const newBlurTableData = onHandleBlurTableData(tableDataRef.current, record, singleTokens);
    onUpdateTableDataSource(newBlurTableData);
    isBlurUpdateRef.current = true;

    const inputForeCat = onHandleInt(newBlurTableData?.[0]?.forecast);
    if (valueBillingType === '0') {
      setCalculate(inputForeCat);
    } else if (!inputForeCat && !_.includes([0, '0'], inputForeCat)) {
      setCalculate('');
    } else {
      const outputForeCat = onHandleInt(newBlurTableData?.[1]?.forecast);
      const allCalculate = onHandleIsNull([inputForeCat, outputForeCat]);
      setCalculate(allCalculate);
    }
  };

  /** 更新表格数据 */
  const onUpdateTableDataSource = (data: any) => {
    setDataSource(data);
    tableDataRef.current = data;
  };

  /** 千/百万tokens切换 */
  const onChangeThousandMillion = (value: string) => {
    setSingleTokens(value);

    const isType = (operateAction === 'edit' && isNoDistinction) || (operateAction === 'create' && valueBillingType === '1');
    const paramType = isType ? 'noDistinction' : 'in';
    const newCalculate = onCalculateForecast(tableDataRef.current, paramType, value);

    // 表格中预估总金额更新
    const newUpdateTableData = _.map(_.cloneDeep(tableDataRef.current), (item: any, index: number) => {
      item.forecast = onHandleInt(newCalculate?.[index === 0 ? 'in' : 'out']);
      return item;
    });
    onUpdateTableDataSource(newUpdateTableData);

    // 更新预估总金额
    const allCalculate = onHandleIsNull([onHandleInt(newCalculate?.in), onHandleInt(newCalculate?.out)]);
    setCalculate(allCalculate);
  };

  const items: any = _.map(PRICE_UNIT, (item: any, index: string) => ({
    label: (
      <div onClick={() => onChangeThousandMillion(index)} title={`${item} tokens`}>
        {item} tokens
      </div>
    ),
    key: index,
  }));

  const columns = [
    {
      title: '',
      dataIndex: 'inputOutput',
      width: language === 'zh-cn' ? 100 : 150,
    },
    {
      title: language === 'zh-cn' ? `tokens ${intl.get('modelQuota.tokensCountTwo')}` : intl.get('modelQuota.tokensCount'),
      dataIndex: 'tokens',
      width: 235,
      render: (text: any, record: any) => (
        <div className='g-flex-column g-h-100' style={{ alignItems: 'flex-start' }}>
          <div className='g-flex-center'>
            <InputNumber
              size='middle'
              min={1}
              max={9999}
              value={text}
              defaultValue={text}
              placeholder={intl.get('global.pleaseEnter')}
              formatter={(value: any) => limitDecimals(value, 3, true)}
              parser={(value: any) => (!value?.includes('.') ? value?.replace(/\$\s?|(,*)/g, '') : value?.replace(/^(-)*(\d+)\.(\d\d\d).*$/, '$1$2.$3'))}
              controls={false}
              stringMode
              addonAfter={
                <Select
                  defaultValue={'6'}
                  value={record?.num_type === '3' ? '6' : record?.num_type}
                  style={{ minWidth: 58 }}
                  popupMatchSelectWidth={100}
                  options={_.map(CURRENCY_UNIT_KEY_CHANGE, (item: any, key: string) => ({ value: key, label: item }))}
                  onChange={(value: string) => onUpdateData(value === '6' ? '3' : value, record, 'num_type')}
                />
              }
              onBlur={() => onBlur(record)}
              onFocus={() => {
                isBlurUpdateRef.current = false;
              }}
              onChange={value => onUpdateData(value, record, 'tokens')}
            />
            <div className='g-ml-2'>/{intl.get('modelQuota.month')}</div>
          </div>
          {(record?.error?.tokens || record?.error?.referprice) && isSave ? (
            <div className='g-c-error g-ellipsis-1' style={{ height: 22, minWidth: 1, maxWidth: 224 }}>
              {record?.error?.tokens ? intl.get('global.noNull') : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: intl.get('modelQuota.priceTwo'),
      dataIndex: 'referprice',
      width: language === 'en-us' ? 250 : 260,
      render: (text: any, record: any) => (
        <div className='g-flex-column g-h-100' style={{ alignItems: 'flex-start' }}>
          <div className='g-flex-center'>
            <InputNumber
              size='middle'
              min={0}
              max={1000}
              value={text}
              defaultValue={text}
              placeholder={intl.get('global.pleaseEnter')}
              formatter={(value: any) => limitDecimals(value)}
              parser={(value: any) => (!value?.includes('.') ? value?.replace(/\$\s?|(,*)/g, '') : value?.replace(/^(-)*(\d+)\.(\d\d\d\d).*$/, '$1$2.$3'))}
              controls={false}
              onFocus={() => {
                isBlurUpdateRef.current = false;
              }}
              stringMode
              addonBefore={selectBefore}
              onBlur={() => {
                onBlur(record);
              }}
              onChange={(value: any) => {
                onUpdateData(value, record, 'referprice');
              }}
            />
            <Dropdown trigger={['click']} menu={{ items }}>
              <div className='g-ml-2 g-pointer g-flex-align-center' title={`${singleTokens} tokens`} style={{ minWidth: language === 'en-us' ? 55 : 84 }}>
                <div className='g-ellipsis-1' style={{ maxWidth: language === 'en-us' ? 45 : 'calc(100% - 16px)' }}>
                  /{PRICE_UNIT[singleTokens]} tokens
                </div>
                <IconFont className='g-ml-2 g-rotate-90 g-c-text-sub' type='icon-dip-right' style={{ fontSize: 10 }} />
              </div>
            </Dropdown>
          </div>
          {(record?.error?.tokens || record?.error?.referprice) && isSave ? (
            <div className='g-c-error g-ellipsis-1' style={{ height: 22, minWidth: 1, maxWidth: 224 }}>
              {record?.error?.referprice ? intl.get('global.noNull') : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: intl.get('modelQuota.allTwo'),
      dataIndex: 'forecast',
      render: (text: any) => (
        <div
          className={classNames('g-flex-column g-ellipsis-1', { 'g-c-text-sub': !text && text !== 0 })}
          style={{ alignItems: 'flex-start', height: '100%', maxWidth: 145 }}
          title={text || text === 0 ? `${selectSingle}${limitDecimals(text, 2)}` : '--'}
        >
          {text || text === 0 ? `${selectSingle}${limitDecimals(text, 2)}` : '--'}
        </div>
      ),
    },
  ];

  /** 确定 */
  const onHandleOk = async () => {
    setIsSave(true);
    const isError = onIsError(dataSource);
    if (isError) return;
    try {
      let body: any = {
        model_id: tableRecord?.model_id,
        billing_type: Number(valueBillingType),
        currency_type: selectSingle === '$' ? 1 : 0,
        input_tokens: onHandleInt(dataSource?.[0]?.tokens),
        referprice_in: Number(dataSource?.[0]?.referprice),
        num_type: [
          Number(dataSource?.[0]?.num_type === '6' ? '3' : dataSource?.[0]?.num_type),
          Number(dataSource?.[1]?.num_type === '6' ? '3' : dataSource?.[1]?.num_type) || 0,
        ],
        price_type: [singleTokens, singleTokens],
      };
      // 单独计费
      if (valueBillingType === '1') {
        body = {
          ...body,
          output_tokens: onHandleInt(dataSource?.[1]?.tokens),
          referprice_out: Number(dataSource?.[1]?.referprice),
        };
      }
      const serviceFun = await (operateAction === 'create' ? SERVICE.llm.llmQuotaCreate(body) : SERVICE.llm.llmQuotaEdit(body, tableRecord?.conf_id));
      const { res } = serviceFun;
      if (res) {
        message.success(intl.get('modelQuota.quotaSuccess'));
        onHandleCancel(true);
        setIsSave(false);
      }
    } catch (error) {
      console.log('onHandleOk error: ', error);
    }
  };

  /** 关闭后恢复默认 */
  const onDefault = () => {
    setDataSource([]);
    tableDataRef.current = [];
    isBlurUpdateRef.current = false;
    setBillingType('');
    setIsSave(false);
    onCommonDefault();
  };

  /** 点击按钮恢复默认 */
  const onDefaultClick = () => {
    setIsSave(false);
    if (operateAction === 'create') onHandleQuotaType();
    onChangeQuoteSetting(tableRecord?.billing_type === -1 ? true : tableRecord?.billing_type === 0);
  };

  return (
    <Modal
      open={visible}
      title={intl.get('modelQuota.quotaSet')}
      className={styles.limitModelRoot}
      width={language === 'zh-cn' ? 810 : 850}
      destroyOnHidden={true}
      maskClosable={false}
      afterClose={() => onDefault()}
      footer={null}
      onCancel={onHandleCancel}
    >
      <div className={styles['model-box']}>
        <div className='g-flex'>
          <img src={MODEL_ICON_KV[tableRecord?.model_series]?.icon} className='g-mr-2' style={{ height: 24, width: 24 }} />
          <div className='g-ellipsis-1' title={tableRecord?.model_name} style={{ maxWidth: 400 }}>
            {tableRecord?.model_name}
          </div>
        </div>

        <div className='g-ellipsis-1' style={{ maxWidth: 200 }} title={tableRecord?.model}>
          <Divider type='vertical' className='g-mr-2' />
          {intl.get('modelQuota.model')}：{tableRecord?.model}
        </div>
      </div>
      <div className='g-mt-5'>
        <div className='g-mb-6'>
          {quoteTitle(intl.get('modelQuota.quotaType'))}
          <div style={{ paddingLeft: 10 }}>
            <Radio.Group onChange={onRadioChange} value={valueBillingType}>
              <Radio value='1' className='g-mr-8' disabled={operateAction === 'edit'}>
                <span className='g-c-text'>{intl.get('modelQuota.quotaTypeOne')}</span>
              </Radio>
              <Radio value='0' disabled={operateAction === 'edit'}>
                <span className='g-c-text'>{intl.get('modelQuota.quotaTypeTwo')}</span>
              </Radio>
            </Radio.Group>
          </div>
        </div>

        <div className='g-mb-7'>
          {quoteTitle(intl.get('modelQuota.quotaSet'), intl.get('modelQuota.quotaSetTip'))}
          <div>
            <Table rowKey='id' bordered columns={columns} dataSource={dataSource} pagination={false}></Table>
          </div>
        </div>

        <div className={styles.footerBtn}>
          <div>
            {intl.get('modelQuota.all')}：
            <span className={styles.allNumber}>
              {_.includes([0, '0'], calculate) ? 0 : !calculate ? '--' : `${selectSingle}${limitDecimals(calculate, 2, false, true)}`}
            </span>
          </div>
          <div className='g-flex'>
            <div className={classNames(styles['cancel-btn'], 'g-pointer', 'g-flex-center')} onClick={onDefaultClick}>
              <IconFont className='g-mr-1' type='icon-dip-refresh' />
              {intl.get('modelQuota.defaultStart')}
            </div>
            <Button onClick={onHandleCancel} className={styles['cancel-btn']} type='default'>
              {intl.get('global.cancel')}
            </Button>
            <Button onClick={onHandleOk} type='primary'>
              {intl.get('global.save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LimitModal;
