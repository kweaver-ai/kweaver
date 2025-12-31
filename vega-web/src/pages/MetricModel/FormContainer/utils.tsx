import intl from 'react-intl-universal';
import { fieldToCamel } from '@/utils/format-objectkey-structure';

// 固定步长集
export const stepList = ['5m', '10m', '15m', '20m', '30m', '1h', '2h', '3h', '6h', '12h', '1d'];

/**
 * 选取步长集取最小的步长，追溯的数据点 = 指标追溯时长/持久化步长 <= 10000
 * @param stepList 选取步长集
 * @param retraceDuration 追溯时长
 * @returns minStep 最小步长, dataPoint 数据时间点
 */
export const getDataPoint = (stepList: string[], retraceDuration: string): { minStep: string; dataPoint: number } => {
  let minStep = '';
  let dataPoint = 0;

  if (!stepList || stepList.length === 0) {
    return {
      minStep,
      dataPoint,
    };
  }
  let curRetraceDuration = 0;

  if (retraceDuration.includes('h')) {
    curRetraceDuration = Number(retraceDuration.split('h')[0]) * 60;
  }

  if (retraceDuration.includes('d')) {
    curRetraceDuration = Number(retraceDuration.split('d')[0]) * 60 * 24;
  }
  const curStepM = stepList.filter((val) => val.includes('m'));
  const curStepH = stepList.filter((val) => val.includes('h'));
  const curStepD = stepList.filter((val) => val.includes('d'));

  if (curStepM.length > 0) {
    const minStepNumList = curStepM.map((val) => Number(val.split('m')[0]));
    const minStepNum = Math.min(...minStepNumList);

    minStep = `${minStepNum}m`;
    dataPoint = Math.floor(curRetraceDuration / minStepNum);
  } else if (curStepH.length > 0) {
    const minStepNumList = curStepH.map((val) => Number(val.split('h')[0]));
    const minStepNum = Math.min(...minStepNumList);

    minStep = `${minStepNum}h`;
    dataPoint = Math.floor(curRetraceDuration / minStepNum / 60);
  } else if (curStepD.length > 0) {
    const minStepNumList = curStepD.map((val) => Number(val.split('d')[0]));
    const minStepNum = Math.min(...minStepNumList);

    minStep = `${minStepNum}d`;
    dataPoint = Math.floor(curRetraceDuration / minStepNum / 60 / 24);
  }

  // 返回
  return {
    minStep,
    dataPoint,
  };
};

export interface TNumFix {
  num?: number;
  fix: 'm' | 'h' | 'd';
}
export const initNumFix: TNumFix = {
  num: undefined,
  fix: 'm',
};

export const getNewStr = (oldStr: any): string =>
  oldStr
    ? oldStr.replace(/previous_hour|previous_day|previous_week|m|h|d/, (match: any) => {
        if (match === 'previous_hour' || match === 'previous_day' || match === 'previous_week') {
          return intl.get(`MetricModel.${fieldToCamel(match)}`);
        } else if (match === 'm') {
          return intl.get('Global.unitMinute');
        } else if (match === 'h') {
          return intl.get('Global.unitHour');
        } else if (match === 'd') {
          return intl.get('Global.unitDay');
        }
      })
    : '';

export const getNewStrAry = (oldStrAry: any): string => {
  return oldStrAry?.map((val: any) => getNewStr(val)).join(',') ?? '';
};

// 国际化动态添加值
export const getIntlValues = (msg: string, values: { [key: string]: any }, connector?: string): string => {
  let message = msg;

  if (!values) return message;
  const keys = Object.keys(values);

  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    let curVal = values[key];

    if (key === 'name') {
      curVal = `"${values[key] ?? ''}"`;
    }
    if (key === 'step' && curVal) {
      curVal = curVal?.map((val: any) => `step="${val}"`).join(` ${connector} `) ?? '';
    }
    if (key === 'step' && !curVal) {
      curVal = 'step=""';
    }
    // if(key === 'measureName'){
    //   curVal = `"${values[key] ?? ''}"`
    // }
    if (key === 'timeWindows' && curVal) {
      curVal = curVal?.map((val: any) => `time_window="${val}"`).join(` ${connector} `) ?? '';
    }
    if (key === 'timeWindows' && !curVal) {
      curVal = 'time_window=""';
    }
    message = message.replace(new RegExp(`{${key}}`, 'g'), curVal);
  }

  return message;
};
