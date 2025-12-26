import { useEffect, useState } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import intl from 'react-intl-universal';

import AdSpin from '@/components/AdSpin';
import emptyImg from '@/assets/images/empty.svg';
import { getParam } from '@/utils/handleFunction';

import { onViewLog } from '@/services/benchmarkTask';

import './style.less';

const ViewLog = () => {
  const [logData, setLogData] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onGetLog();
  }, []);

  const onGetLog = async () => {
    setLoading(true);
    const { id, algorithm_id, config_task_id } = getParam(['id', 'algorithm_id', 'config_task_id']);
    try {
      const { res } = await onViewLog({ id, algorithm_id, config_task_id });
      setLogData(res);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const { Description } = err?.data || err?.response || err || {};
      Description && message.error(Description);
    }
  };

  return (
    <div className='benchmarkTask-view-log-root'>
      {loading ? (
        <div className='loading-mask ad-h-100 ad-center'>
          <AdSpin />
        </div>
      ) : _.isEmpty(logData) ? (
        <div className='ad-flex noData ad-w-100'>
          <img src={emptyImg} alt='no data' />
          <p>{intl.get('benchmarkTask.noLog')}</p>
        </div>
      ) : (
        <pre>{logData}</pre>
      )}
    </div>
  );
};

export default ViewLog;
