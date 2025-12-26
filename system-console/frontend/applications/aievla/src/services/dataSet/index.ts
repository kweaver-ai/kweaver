import React from 'react';
import { message } from 'antd';

import { API } from '../api';
import studioAxios from '@/utils/axios-http/studioAxios';

/**
 * 获取数据集配置列表数据
 */
export const dataSetList = async (data: { page: number; size?: number; query: string; order: string; rule: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetList}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 新建数据集
 */
export const dataSetCreate = async (data: { name: string; delimiter: string; description: string; color: string; exp_permission: 0 | 1 }) => {
  const res: any = (await studioAxios.axiosPost(`${API.dataSetCreate}`, data, { isHideMessage: true })) || {};
  return res;
};

/**
 * 编辑数据集
 */
export const dataSetEdit = async (
  ds_id: string,
  data: {
    name: string;
    description: string;
    color: string;
    exp_permission: 0 | 1;
  },
) => {
  const res: any = (await studioAxios.axiosPost(`${API.dataSetEdit(ds_id)}`, data, { isHideMessage: true })) || {};
  return res;
};

/**
 * 删除数据集-所有版本
 */
export const dataSetDeleteById = async (
  ds_id: string,
  data?: {
    reset: boolean;
  },
) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetDeleteById(ds_id)}`, data)) || {};
    return res || true;
  } catch (err: any) {
    // 400 错误码
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 获取数据集信息
 */
export const dataSetGetById = async (ds_id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetGetById(ds_id)}`)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 上传文件开始
 */
export const dataSetFilesInitUpload = async (data: {
  upload_type: 0 | 1;
  doc_id?: string;
  name?: string;
  size?: number;
  version_id?: string;
  file_suffix?: string;
  unique_id?: string;
}) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesInitUpload}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 上传文件完成
 */
export const dataSetFilesEndUpload = async (data: {
  upload_type: number;
  doc_id: string;
  name: string;
  size: number;
  version_id: string;
  key: string;
  file_suffix: string;
}) => {
  const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesEndUpload}`, data, { isHideMessage: true })) || {};
  return res || true;
};

/**
 * 分块上传文件开始
 */
export const dataSetFilesInitUploadPart = async (data: {
  upload_type: number;
  doc_id: string;
  name: string;
  size: number;
  version_id: string;
  file_suffix: string;
}) => {
  const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesInitUploadPart}`, data)) || {};
  return res || true;
};

/**
 * 分块上传文件
 */
export const dataSetFilesUploadPart = async (data: { upload_type: number; upload_id: string; parts: string; key: string }) => {
  const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesUploadPart}`, data, { isHideMessage: true })) || {};
  return res || true;
};

/**
 * 分块上传文件完成
 */
export const dataSetFilesEndUploadPart = async (data: { upload_type: 0 | 1; part_infos: Record<any, any>; upload_id: string; key: string }) => {
  const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesEndUploadPart}`, data, { isHideMessage: true })) || {};
  return res;
};

/**
 * 创建数据集文件目录
 * @param data doc_id // 目录id
 */
export const dataSetFilesCreateDirs = async (data: { doc_id: string; version_id: string; name: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesCreateDirs}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 下载数据集文件
 */
export const dataSetFilesDownLoad = async (data: { upload_type: number; doc_id: string; version_id: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetFilesDownLoad}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

export const dataSetFilesBatchDownLoadId = async (id: string, data?: any) => {
  try {
    const res: any =
      (await studioAxios.axiosGet(`${API.dataSetFilesBatchDownLoadId(id)}`, data, {
        responseType: 'blob',
        timeout: 300000,
      })) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

export const dataSetFilesBatchDownLoad = async (data: { upload_type: number; doc_ids: string[]; version_id: string; name: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesBatchDownLoad}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 增加数据集文件版本
 */
export const dataSetFilesAddVersions = async (id: string, data: { version: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesAddVersions(id)}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 删除数据集-指定版本
 */
export const dataSetFilesDeleteVersions = async (id: string, data: { version_ids: string[] }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesDeleteVersions(id)}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 删除数据集-指定版本的文件
 */
export const dataSetFilesDelete = async (data: { doc_ids: string[] | React.Key[]; version_id: string; delete_type: number }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetFilesDelete}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 获取指定路径和版本下的数据集文件
 */
export const dataSetFilesList = async (data: { doc_id: string; version_id: string; order: string; rule: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetFilesList}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 预览文件
 */
export const dataSetFilesPreview = async (data: { version_id: string; doc_id: string }, config?: any) => {
  const { res }: any = (await studioAxios.axiosGet(`${API.dataSetFilesPreview}`, data, config)) || {};
  return res || true;
};

/**
 * 查看oss状态
 * @param data
 * @returns
 */
export const dataSetCheckOssStatus = async (data?: any) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetCheckOssStatus}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 获取版本信息
 * @param data
 * @returns
 */

export const versionsInfo = async (ds_id: string, data?: any) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.versionsInfo(ds_id)}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 更新版本的信息
 * @param data
 * @returns
 */
export const updateVersionsInfo = async (ds_id: string, version_id: string, data: { description: string }) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.updateVersionsInfo(ds_id, version_id)}`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};

/**
 * 根据数据集版本id获取数据集版本的名称
 * @param version_ids
 */
export const dataSetVersionListById = async (version_ids: string[]) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.dataSetVersionListById}`, { version_ids })) || {};
    return res || true;
  } catch (err: any) {
    const { description } = err?.response || err?.data || err || {};
    description && message.error(description);
    return false;
  }
};
