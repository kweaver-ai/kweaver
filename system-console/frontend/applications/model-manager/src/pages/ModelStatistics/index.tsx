import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';

import SERVICE from '@/services';
import { Title } from '@/common';

import HeaderFilter from './HeaderFilter';
import Summary from './Summary';
import TimeConsuming from './TimeConsuming';
import RateAndQps from './RateAndQps';

import styles from './index.module.less';

const ModelStatistics = () => {
  const [source, setSource] = useState<any>({});
  const [filter, setFilter] = useState<any>({ model_id: 'all', date: [dayjs().subtract(1, 'day'), dayjs()] });

  useEffect(() => {
    getStatistics();
  }, []);

  /** 获取统计数据 */
  const getStatistics = async (data?: any) => {
    try {
      const { model_id, date } = data || filter;
      const postData = { model_id, start_time: dayjs(date[0]).format('YYYY-MM-DD'), end_time: dayjs(date[1]).format('YYYY-MM-DD') };
      if (postData?.model_id === 'all') delete postData.model_id;
      const result = await SERVICE.modelStatistics.modelOverview(postData);
      setSource(result);
    } catch (_error) {}
  };

  /** 筛选条件变更 */
  const onChangeFilter = (data: any) => {
    setFilter(data);
    getStatistics(data);
  };

  return (
    <div className={styles['page-model-statistics']}>
      <Title className='g-mb-2'>{intl.get('modelStatistics.title')}</Title>
      <HeaderFilter filter={filter} onChange={onChangeFilter} />
      <Summary source={source} />
      <TimeConsuming source={source} />
      <RateAndQps source={source} />
    </div>
  );
};

export default ModelStatistics;
