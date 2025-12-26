import API from '@/services/api';
import Request from '@/services/request';

import type ModelStatisticsType from './type';

/** 大模型模型统计 */
const modelOverview: any = async (data: ModelStatisticsType.modelOverview) => await Request.get(API.modelOverview, data);

export default {
  modelOverview,
};
