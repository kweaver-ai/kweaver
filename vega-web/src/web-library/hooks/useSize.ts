import { useState, useEffect } from 'react';
import UTILS from '../../utils';

type SizeType = {
  width?: number;
  height?: number;
};

const useSize = (target: any, { width, height }: SizeType = { width: 0, height: 0 }) => {
  const [state, setState] = useState({ width: width, height: height });

  useEffect(() => {
    const targetElement = UTILS.getTargetElement(target);
    if (!targetElement) return;

    const observer = new ResizeObserver((entries: any[]) => {
      // 每次被观测的元素尺寸发生改变这里都会执行
      entries.forEach((entry) => {
        const { width, height } = entry.target.getBoundingClientRect();
        setState({ width, height });
      });
    });
    observer.observe(targetElement); // 观测DOM元素

    return () => {
      observer.unobserve(targetElement);
      observer.disconnect();
    };
  }, [target]);

  return {
    width: state.width || 0,
    height: state.height || 0,
  };
};

export default useSize;
