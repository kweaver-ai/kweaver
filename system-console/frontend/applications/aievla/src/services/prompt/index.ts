import { API } from '../api';
import apiService from '@/utils/axios-http/studioAxios';

/**
 * 获取提示词列表
 */
export const promptList = async (body: any) => await apiService.axiosGet(API.promptList, body);

/**
 * 获取提示词项目列表
 */
export const promptProjectList = async (body: any) => await apiService.axiosGet(API.promptProjectList, body);
