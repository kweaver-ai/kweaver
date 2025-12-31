export const POINT_COUNT = 30; // 30个点
const POINT_SIZE = 8; // 指标趋势图每8像素一个点

const s = 1000;
const m = 60 * s;
const h = 60 * m;
const d = 24 * h;
const w = 7 * d;
const M = 30 * d;
const q = 3 * M;
const y = 12 * M;

// 系统步长集
const fixdStepsList: [string, number][] = [
  ['15s', 15 * s],
  ['30s', 30 * s],
  ['1m', m],
  ['2m', 2 * m],
  ['5m', 5 * m],
  ['10m', 10 * m],
  ['15m', 15 * m],
  ['20m', 20 * m],
  ['30m', 30 * m],
  ['1h', h],
  ['2h', 2 * h],
  ['3h', 3 * h],
  ['6h', 6 * h],
  ['12h', 12 * h],
  ['1d', d],
];

const calendarStepsList: [string, number][] = [
  // ['minute', m],
  // ['hour,', h],
  ['day', d],
  ['week', w],
  ['month', M],
  ['quarter', q],
  ['year', y],
];

/**
 * @description 修正步长
 * @param stepTimes 步长对应的毫秒数
 * @param isCalendarInterval 是否是日历步长
 * @returns 修正后的步长
 */
const correctionStep = (stepTimes: number, isCalendarInterval: boolean): string => {
  let preStep = '';
  let preIndex = -1;
  const stepsList = isCalendarInterval ? calendarStepsList : fixdStepsList;

  for (const [step, systemStepTimes] of stepsList) {
    if (stepTimes < systemStepTimes) {
      if (!preStep && preIndex === -1) return stepsList[0][0];

      const preTimes = stepsList[preIndex][1];

      /**
       * 判断实际点数与修正后的点数的比例关系
       */
      if (preTimes * systemStepTimes < stepTimes ** 2) return step;

      return preStep;
    }
    if (stepTimes > systemStepTimes) {
      preStep = step;
      preIndex++;
    }

    if (stepTimes === systemStepTimes) return step;
  }

  return stepsList[stepsList.length - 1][0];
};

/**
 * 获取步长
 * @param times TimeFilter的时间戳差值
 * @param width 图表容器的宽度
 * @returns string 返回对应步长 4s 4m 4h 4d
 */
export const getStep = (times: any, width: any, isCalendarInterval: any = false): string => {
  let pointCount = POINT_COUNT;

  if (width) {
    const plotWidth = parseInt(width, 10) - 60;

    pointCount = plotWidth / POINT_SIZE;
  }

  const steps = Math.floor(times / pointCount);

  return correctionStep(steps, isCalendarInterval);
};
