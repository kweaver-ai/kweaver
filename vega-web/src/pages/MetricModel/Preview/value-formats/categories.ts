/** 单位转换目录 */
import { toFixedUnit, toPercentUnit, customUnits, toSeconds, dateTimeAsIso } from './valueFormats';

type Categories = { id: string; fn: any }[];

export const getCategories = (): Categories => [
  {
    id: 'none',
    fn: toFixedUnit(''),
  },
  {
    id: 'numUnit',
    fn: customUnits([1, 1000, 1000, 1000, 1000], ['  ', ' K', ' Mil', ' Bil', ' Tri']),
  },
  {
    id: 'storeUnit',
    fn: customUnits([1, 8, 1024, 1024, 1024, 1024, 1024], [' bit', ' Byte', ' KiB', ' MiB', ' GiB', ' TiB', ' PiB']),
  },
  {
    id: 'percent',
    fn: toPercentUnit,
  },
  {
    id: 'transmissionRate',
    fn: customUnits([1, 1024, 1024], [' B/s', ' KiB/s', ' MiB/s']),
  },
  {
    id: 'timeUnit',
    fn: customUnits([1, 1000, 1000, 60, 60, 24, 7, 30 / 7, 12], [' μs', ' ms', ' s', ' m', ' h', ' day', ' week', ' month', ' year']),
  },
  {
    id: 's',
    fn: toSeconds,
  },
  {
    id: 'dateTimeAsIso',
    fn: dateTimeAsIso,
  },
];
