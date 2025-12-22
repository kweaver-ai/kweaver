import { useEffect } from 'react';
import { useLatestState } from '@/hooks';

const DownTimer = ({ onFinish }: any) => {
  const [data, setData, getData] = useLatestState(5);
  useEffect(() => {
    const timer = setInterval(() => {
      if (getData() <= 1) {
        clearInterval(timer);
      } else {
        setData(getData() - 1);
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (getData() <= 1) {
      onFinish?.();
    }
  }, [data]);

  return <div>{data}秒</div>;
};

export default DownTimer;
