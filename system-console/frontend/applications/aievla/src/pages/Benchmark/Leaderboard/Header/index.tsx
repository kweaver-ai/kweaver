import { memo, useEffect, useState } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Radio, Select } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { fuzzyMatch, sessionStore } from '@/utils/handleFunction';

import './style.less';

const ALGORITHM_TYPE = [
  { key: 0, value: intl.get('global.all') },
  { key: 6, value: 'Agent' },
  { key: 1, value: intl.get('benchmarkTask.LModel') },
  // { key: 2, value: intl.get('benchmarkTask.SModel') },
  // { key: 3, value: intl.get('benchmarkTask.customApp') },
  { key: 4, value: intl.get('benchmarkTask.external') },
];

const Header = (props: any) => {
  const { onHeaderChangeToTable, benConfigList, originData, setDataSource, saveColumns, tableState } = props;

  const [isChange, setIsChange] = useState(sessionStore.get('boardCloseTip'));

  useEffect(() => {
    const data = _.filter(originData, item => {
      return (
        fuzzyMatch(tableState?.name, _.isArray(item?.algorithm) ? item?.algorithm[0] : item?.algorithm) ||
        fuzzyMatch(tableState?.name, item?.publish_user || '')
      );
    });
    setDataSource(data);
  }, [originData]);

  /**
   * 搜索，前端搜索
   */
  const onSearch = (e: any) => {
    const searValue = e?.target?.value;
    const data = _.filter(originData, item => {
      return fuzzyMatch(searValue, _.isArray(item?.algorithm) ? item?.algorithm[0] : item?.algorithm) || fuzzyMatch(searValue, item?.publish_user || '');
    });
    onHeaderChangeToTable({ name: searValue, algorithm_type: tableState.algorithm_type });
    setDataSource(data);
  };

  /**
   * 刷新
   */
  const onRefresh = () => {
    onHeaderChangeToTable({ algorithm_type: tableState.algorithm_type });
  };

  /**
   * 算法类型
   */
  const onChangeType = (e: any) => {
    onHeaderChangeToTable({ algorithm_type: e });
  };

  /**
   * benchmark配置改变
   */
  const onChangeConfig = (e: any) => {
    let id: any = '';
    _.map(benConfigList, (item: any) => {
      if (item?.name === e) {
        id = item?.id;
      }
    });
    const params: any = { config_id: id, rule: 'average', page: 1, name: '', algorithm_type: 0 };
    onHeaderChangeToTable(params, true);
  };

  /**
   * 算法类型
   */
  const optionsType = () => _.map(ALGORITHM_TYPE, (item: any) => ({ label: item?.value, value: item?.key }));

  /**
   * Benchmark配置
   */
  const benchmarkConfig = () => _.map(benConfigList, (item: any) => ({ label: item?.name, value: item?.name }));

  /**
   * 取消温馨提示
   */
  const onCancelTip = () => {
    sessionStore.remove('boardCloseTip');
    setIsChange(false);
  };

  /**
   * 榜单的温馨提示(关闭后不再显示，重新登陆后再显示)
   */
  const boardTip = (
    <div className='boardTip ad-w-100 ad-mb-4 ad-flex'>
      <div className='boardTip-left ad-align-center'>
        <IconFont type='icon-Warning' className='ad-mr-2' style={{ color: '#1677FF' }} />
        {intl.get('benchmarkTask.boardTip')}
      </div>
      <div className='boardTip-right ad-center'>
        <Format.Button type='icon' className='ad-mr-4' size='small' onClick={onCancelTip}>
          <IconFont type='icon-guanbiquxiao' style={{ opacity: 0.25 }} />
        </Format.Button>
      </div>
    </div>
  );

  return (
    <div className='ad-pb-4 benchmark-Laederboard-root ad-mb-2' style={{ paddingTop: 11 }}>
      <div className='ad-mb-4'>
        <Format.Title style={{ minWidth: 28 }} className='ad-mr-2'>
          {intl.get('benchmarkTask.leaderboard')}
        </Format.Title>
        <Select
          style={{ width: 200, minWidth: 110 }}
          defaultValue={benConfigList?.[0]?.name}
          onChange={onChangeConfig}
          options={benchmarkConfig()}
          showSearch
        />
      </div>

      {isChange ? boardTip : null}

      <div className='ad-space-between'>
        <div className='ad-flex'>
          <Radio.Group
            onChange={(e: any) => {
              const body: any = {
                task_id: e?.target?.value,
                page: 1,
                rule: 'average',
                algorithm_type: tableState.algorithm_type,
              };
              onHeaderChangeToTable(body);
            }}
            value={tableState.task_id}
          >
            {_.map(
              _.filter(_.cloneDeep([{ title: intl.get('benchmarkTask.comprehensive'), task_id: -1 }, ...saveColumns]), (i: any) => i.title !== 'average'),
              (item: any, index) => {
                return (
                  <Radio.Button
                    key={index}
                    style={{ background: tableState.task_id === item.task_id ? 'rgba(18,110,227,0.06)' : 'white' }}
                    value={item?.task_id}
                  >
                    {item.title}
                  </Radio.Button>
                );
              },
            )}
          </Radio.Group>
        </div>
        <div className='ad-align-center'>
          <Input
            value={tableState?.name}
            defaultValue={''}
            style={{ width: 272 }}
            placeholder={intl.get('benchmarkTask.searchLeaderboard')}
            onChange={onSearch}
            allowClear
            className={'ad-search-input input-w-272'}
            prefix={<IconFont type='icon-sousuo' className='s-input-icon' />}
          />

          <Format.Text className='ad-mr-2 ad-pl-2'>{intl.get('benchmarkTask.evalObjType')}</Format.Text>
          <Select style={{ width: 200 }} defaultValue={0} value={tableState?.algorithm_type} onChange={onChangeType} options={optionsType()} />
          <Format.Button type='icon' onClick={onRefresh}>
            <IconFont type='icon-tongyishuaxin' />
          </Format.Button>
        </div>
      </div>
    </div>
  );
};

export default memo(Header);
