import { API } from '../api';
import apiService from '@/utils/axios-http/studioAxios';

export type LlmGetListType = {
  page: number;
  size: number;
  order: string;
  rule: string;
  name: string;
  model_type?: string;
};
export const llmGetList: any = async (data: LlmGetListType) => {
  return await apiService.axiosGet(API.llmGetList, data);
};
