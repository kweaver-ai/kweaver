import { useState, useEffect } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Table, Tooltip, Popover, Button, Popconfirm } from 'antd';

import IconFont from '@/components/IconFont';
import emptyImg from '@/assets/images/empty.svg';

import { STATUS_COLOR } from '../../enums';

import './style.less';

const TYPE: Record<number, string> = {
  1: 'model_name',
  2: 'model_name',
  3: 'customised_app_name',
  4: 'name',
  6: 'name',
};
const DetailsContent = (props: any) => {
  const { detailData, setErrorInfo, setName, onCancel, runTask } = props;

  const [column, setColumn] = useState<any[]>(); // 表头数据
  const [dataSource, setDataSource] = useState<any[]>([]); // 表格数据

  useEffect(() => {
    if (!_.isEmpty(detailData?.data?.columns)) {
      onHandleColumns();
    }
  }, []);

  /**
   * 查看日志
   */
  const onViewLog = (data: any, dataIndex: any) => {
    onCancel();
    const prefix = (window as any).__POWERED_BY_QIANKUN__ ? '/studio/aievla' : '';
    window.open(`${prefix}/effect-evaluation/log?id=${detailData?.record?.id}&algorithm_id=${data?.algorithm_id}&config_task_id=${dataIndex}`);
  };

  const COLUMN = [
    {
      title: intl.get('benchmarkTask.evalObj'),
      dataIndex: 'algorithm_name',
      width: 195,
      ellipsis: true,
      render: (text: any) => {
        const alg = _.isArray(text) ? text?.[0] : text;
        return (
          <div className='ad-w-100'>
            <div className='ad-w-100 ad-ellipsis' title={alg}>
              {alg}
            </div>
            {detailData?.record?.algorithm_type === 1 && (
              <div className='ad-c-subtext ad-ellipsis' style={{ fontSize: 12 }} title={text?.[1]}>
                {text?.[1]}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  /**
   * 重新运行
   */
  const onResetRun = async (tableRecord: any, dataIndex: any, isStopRestart = false) => {
    const algorithmData = detailData?.record?.algorithm;
    const newAlgorithmData = _.map(_.cloneDeep(algorithmData), (item: any) => {
      const algorithmName = typeof tableRecord?.algorithm_name === 'string' ? tableRecord?.algorithm_name : tableRecord?.algorithm_name?.[0];
      if (item.task_id === dataIndex && algorithmName === item?.[TYPE[detailData?.record?.algorithm_type]]) {
        item.is_run = true;
      } else {
        item.is_run = false;
      }
      return item;
    });
    detailData.record.algorithm = newAlgorithmData;
    runTask(detailData?.record, '', isStopRestart);
  };

  /**
   * 获取状态详情
   */
  const onHandleColumns = () => {
    const children = _.map(detailData?.data?.columns, item => {
      return {
        ...item,
        width: 150,
        ellipsis: true,
        render: (text: any, tableRecord: any) => {
          return (
            <div className='ad-align-center'>
              <div
                className={classNames({ 'ad-mr-2': STATUS_COLOR?.[text?.status]?.color })}
                style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR?.[text?.status]?.color }}
              ></div>
              <div
                onClick={() => {
                  if (text?.status !== 4) return;
                  setName(tableRecord?.algorithm_name);
                  setErrorInfo(text?.result);
                }}
              >
                {STATUS_COLOR?.[text?.status]?.text || '--'}
              </div>

              {!_.includes([1], text?.status) && text?.status ? (
                <Tooltip placement='top' title={intl.get('global.log')}>
                  <IconFont
                    onClick={() => {
                      onViewLog(tableRecord, item?.dataIndex);
                    }}
                    className='ad-ml-2 ad-pointer'
                    type='icon-rizhi1'
                  />
                </Tooltip>
              ) : null}

              {text?.status === 4 ? (
                <Popover placement='bottom' trigger='click' content={<div>{text?.result}</div>}>
                  <Tooltip title={intl.get('benchmarkTask.failDetail')} placement='top'>
                    <InfoCircleOutlined className='ad-ml-2 ad-c-error' />
                  </Tooltip>
                </Popover>
              ) : null}
              {_.includes([4, 5], text?.status) ? (
                detailData?.record?.status === 2 ? (
                  <Popconfirm
                    placement='bottom'
                    title={intl.get('benchmarkTask.restartRunTip')}
                    okText={intl.get('global.ok')}
                    cancelText={intl.get('global.cancel')}
                    onConfirm={() => onResetRun(tableRecord, item.dataIndex, true)}
                  >
                    <Button type='default' style={{ marginLeft: 10 }}>
                      <IconFont type='icon-qiehuan' />
                      {intl.get('benchmarkTask.rerun')}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button type='default' style={{ marginLeft: 10 }} onClick={() => onResetRun(tableRecord, item.dataIndex)}>
                    <IconFont type='icon-qiehuan' />
                    {intl.get('benchmarkTask.rerun')}
                  </Button>
                )
              ) : null}
            </div>
          );
        },
      };
    });
    const col = [...COLUMN, { title: intl.get('benchmarkTask.runDetail'), children }];
    setColumn(col);
    setDataSource(detailData?.data?.data);
  };

  return (
    <div className='ad-w-100 detailBoxRoot'>
      <div className='ad-h-100'>
        <div className='ad-h-100'>
          {_.isEmpty(dataSource) ? (
            <div className='ad-flex noData'>
              <img src={emptyImg} alt='no data' />
              <p>{intl.get('global.noData')}</p>
            </div>
          ) : (
            <Table columns={column} scroll={{ x: 1000 }} dataSource={dataSource} pagination={false} bordered />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsContent;
