import _ from 'lodash';

import { API } from '../api';
import HELPER from '@/utils/helper';
import studioAxios from '@/utils/axios-http/studioAxios';

/**
 * 新建任务
 */
type createBenchmarkTaskProps = {
  name: string;
  config_id: number;
  algorithm_type: number;
  algorithm: any[];
  adapter?: string;
  description?: string;
  color?: string;
};
export const createBenchmarkTask = async (body: createBenchmarkTaskProps) => {
  return await studioAxios.axiosPost(API.createBenchmarkTask, body, { isHideMessage: true });
};

/**
 * 编辑任务
 */
type editBenchmarkTaskProps = {
  task_id: number | string;
  name: string;
  config_id: number;
  algorithm_type: number;
  algorithm: any[];
  adapter?: string;
  description?: string;
  color?: string;
};
export const editBenchmarkTask = async (body: editBenchmarkTaskProps) => {
  return await studioAxios.axiosPost(API.editBenchmarkTask(body?.task_id), body, { isHideMessage: true });
};

/**
 * 获取任务配置
 */

export const getBenchTaskById = async (body: { id: number | string }) => {
  return await studioAxios.axiosGet(API.getBenchTaskById(body?.id));
};

/**
 * 获取任务列表
 */
export const benchmarkTaskList = async (body: {
  page?: number;
  size?: number;
  name: string;
  config_id?: string;
  algorithm_type?: number;
  status?: number;
  rule: string;
  order: string;
  object?: string;
}) => {
  return await studioAxios.axiosGet(API.benchmarkTaskList, body);
};

/**
 * 运行任务
 */
export const runBenchmarkTask = async (body: { id: string | number; published?: 0 | 1 }) => {
  const headers: any = HELPER.headerAddBusinessId();
  return await studioAxios.axiosPost(API.runBenchmarkTask(body?.id), body, headers);
};

/**
 * 查看子任务运行状态
 */
export const getTaskStatus = async (body: { id: number | string }) => {
  return await studioAxios.axiosGet(API.getTaskStatus(body?.id), body);
};

/**
 * 查看榜单
 */
export const getLeaderboard = async (body: any) => {
  return await studioAxios.axiosGet(API.getLeaderboard, body);
};

/**
 * 查看任务结果
 */
export const benchmarkTaskResult = async (body: { id: number | string; order?: string; rule?: string }) => {
  return await studioAxios.axiosGet(API.benchmarkTaskResult(body?.id), body);
};

/**
 * 删除任务配置
 */
export const deleteBenchmarkTask = async (body: { id: number | string }) => {
  return await studioAxios.axiosPost(API.deleteBenchmarkTask(body?.id), body);
};

/**
 * 终止任务
 */
export const stopBenchmarkTask = async (body: { id: number | string }) => {
  return await studioAxios.axiosPost(API.stopBenchmarkTask(body?.id), { task_id: body?.id });
};

/**
 * adapter文件上传结束
 */
export const adapterUploadEnd = async (body: { key: string; file_name: string }) => {
  return await studioAxios.axiosPost(API.adapterUploadEnd, body);
};

/**
 * 删除文件
 */
export const deleteBenchmarkFile = async (body: { key: string }) => {
  return await studioAxios.axiosPost(API.deleteBenchmarkFile(body?.key), body);
};

export const dataSetFilesDownLoad = async (body: { upload_type: number; key: string; name: string }) => {
  return await studioAxios.axiosGet(API.dataSetFilesDownLoad, body);
};

/**
 * 查看日志
 */
export const onViewLog = async (body: { id: string; algorithm_id: string; config_task_id: string }) => {
  return await studioAxios.axiosGet(API.onViewLog(body?.id), { ..._.omit(body, 'id') });
};

/**
 * 查看被任务使用的榜单
 */
export const leaderBoardConfigList = async () => await studioAxios.axiosGet(API.leaderBoardConfigList);
