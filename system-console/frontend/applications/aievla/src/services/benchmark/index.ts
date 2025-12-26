import qs from 'qs';
import axios from 'axios';
import intl from 'react-intl-universal';
import { message } from 'antd';

import { downloadFileByBlob } from '@/utils/handleFunction';

import { API } from '@/services/api';
import studioAxios from '@/utils/axios-http/studioAxios';

/**
 * 通用错误处理
 * @param err
 */
const handleCommonError = (err: any) => {
  const { description } = err?.response || err?.data || err || {};
  description && message.error(description);
};

/**
 * 获取指标库列表数据
 */
export const getIndicatorLibraryList = async (data: any) => {
  try {
    const res: any = (await studioAxios.axiosGet(`${API.benchmark}/metric-list`, data)) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 新建指标
 */
export const createIndicator = async (data: any, hideMessage = false) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/add-metric`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description, code } = err?.response || err?.data || err || {};
    if (hideMessage) throw err;
    // 前端自行处理报错信息
    if (code.includes('RepeatedNames')) {
      message.error(intl.get('benchmark.indicator.repeatName'));
      return false;
    }
    description && message.error(description);
    return false;
  }
};

/**
 * 编辑指标
 */
export const editIndicator = async (data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/edit-metric`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description, code } = err?.response || err?.data || err || {};
    // 前端自行处理报错信息
    if (code.includes('RepeatedNames')) {
      return false;
    }
    description && message.error(description);
    return false;
  }
};

/**
 * 删除指标
 */
export const deleteIndicatorById = async (id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/delete-metric`, { id })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 获取指标详情
 */
export const getIndicatorById = async (id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/metric`, { id })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 上传文件开始
 */
export const benchmarkUploadFileStart = async (data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/upload-file-start`, data)) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 上传文件完成
 */
export const benchmarkUploadFileFinish = async (data: any) => {
  try {
    const res: any = (await studioAxios.axiosPost(`${API.benchmark}/upload-file-complete`, data)) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

export const uploadFile = async (data: any, file: any, config: any) => {
  const res: any = await benchmarkUploadFileStart(data);
  if (res) {
    const { authrequest, key } = res;
    const url = authrequest[1];
    const formData = new FormData();
    authrequest.forEach((item: any, index: number) => {
      if (index > 1) {
        const [key, value] = item.split(':');
        formData.set(key, value);
      }
    });
    formData.set('file', file);
    await axios.post(url, formData, config);

    const result = await benchmarkUploadFileFinish({ ...data, key });
    if (result) {
      return result;
    }
    return false;
  }
  return false;
};

/**
 * 下载指标文件模板
 */
export const downloadIndicatorFileTemplate = async () => {
  try {
    const res: any = (await studioAxios.axiosGet(`${API.benchmark}/metric-template`, {}, { responseType: 'blob' })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 下载adapter文件模板
 */
export const downloadAdapterFileTemplate = async (data: any) => {
  try {
    const param = qs.stringify(data, { arrayFormat: 'repeat' });
    const res: any = (await studioAxios.axiosGet(`${API.downloadAdapterFileTemplate}?${param}`, {}, { responseType: 'blob' })) || {};
    downloadFileByBlob(res, `${intl.get('global.commonTemplateName')}.py`);
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 下载文件
 */
export const downloadFile = async (path: string) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/download`, { doc: path })) || {};
    if (res) {
      const data = await axios.get(res.url, { responseType: 'blob' });
      const fileName = new URL(res.url).searchParams.get('response-content-disposition')!;
      const name = decodeURI(fileName.split(/''/).pop()!);
      if (data.data) {
        return {
          blob: data.data,
          name,
        };
      }
      return false;
    }
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 下载内置指标文件
 */
export const downloadInlineIndicatorFile = async (metric_id: string) => {
  try {
    const res: any = (await studioAxios.axiosGet(`${API.benchmark}/download-inline-metric`, { metric_id }, { responseType: 'blob' })) || {};
    if (res) {
      return res;
    }
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 判断配置是否被运行中的任务使用
 */
export const configIsUsedByTask = async (config_id_list: string[]) => {
  try {
    const { res }: any =
      (await studioAxios.axiosGet(`${API.benchmark}/config-used-by-running-task`, {
        config_id_list: JSON.stringify(config_id_list),
      })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 获取指标文件解析的结果
 */
export const getIndicatorFileAnalysisResult = async (data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/parse-metric`, { path: data })) || {};
    return res || true;
  } catch (err: any) {
    return err?.response || err?.data || err || {};
  }
};

/**
 * 获取benchmark配置列表数据
 */
export const getBenchmarkConfigList = async (data: any) => {
  try {
    const res: any =
      (await studioAxios.axiosGet(`${API.benchmark}/config-list`, {
        ...data,
        type: 1,
      })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 获取benchmark模板配置列表数据
 */
export const getBenchmarkTemplateConfigList = async () => {
  try {
    const res: any =
      (await studioAxios.axiosGet(`${API.benchmark}/config-list`, {
        type: 0,
        page: 1,
        size: 100,
      })) || {};
    return res?.res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 创建benchmark配置
 */
export const createBenchmarkConfig = async (data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/add-config`, data)) || {};
    return res || true;
  } catch (err: any) {
    const { description, code } = err?.response || err?.data || err || {};
    // 前端自行处理报错信息
    if (code.includes('RepeatedNames')) {
      return false;
    }
    description && message.error(description);
    return false;
  }
};

/**
 * 删除benchmark配置
 */
export const deleteBenchmarkConfig = async (id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/delete-config`, { id })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 编辑benchmark配置
 */
export const editBenchmarkConfig = async (id: string, data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/edit-config/${id}`, data)) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 获取benchmark配置
 */
export const getBenchmarkConfigById = async (id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/config`, { id })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 发布benchmark配置
 */
export const publishBenchmarkConfig = async (id: string) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/config-publish`, { id })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 复制benchmark配置
 */
export const copyBenchmarkConfigById = async (data: any) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/copy-config`, data)) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

export const getDatasetIndicatorOptions = async () => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/get-select-list`, {})) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

export const deleteFile = async (path: string, errorTip: boolean = true) => {
  try {
    const { res }: any = (await studioAxios.axiosPost(`${API.benchmark}/delete-file`, { path })) || {};
    return res || true;
  } catch (err) {
    if (errorTip) {
      handleCommonError(err);
    }
    return false;
  }
};

export const getOutputByIndicatorIds = async (ids: string[]) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/get-metric-output-map`, { metric_id_list: JSON.stringify(ids) })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 校验配置名称是否重复
 */
export const validatorConfigNameRepeat = async (name: string) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.benchmark}/config-name-used`, { name })) || {};
    return res;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 预览文件
 */
export const dataSetFilesPreview = async (data: { version_id: string; doc_id: string }, config?: any) => {
  try {
    const { res }: any = (await studioAxios.axiosGet(`${API.dataSetFilesPreview}`, data, config)) || {};
    return res || true;
  } catch (err: any) {
    const { description, ErrorCode } = err?.response || err?.data || err || {};
    return ErrorCode;
  }
};

/**
 * 通过配置ID获取配置名称
 */
export const getConfigNameById = async (config_id_list: string[]) => {
  try {
    const { res }: any =
      (await studioAxios.axiosGet(`${API.benchmark}/get-config-by-id-list`, {
        config_id_list: JSON.stringify(config_id_list),
      })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 通过配置ID获取配置名称
 */
export const getIndicatorNameById = async (metric_id_list: string[]) => {
  try {
    const res: any =
      (await studioAxios.axiosGet(`${API.benchmark}/get-metric-by-id-list`, {
        metric_id_list: JSON.stringify(metric_id_list),
      })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};

/**
 * 通过benchmark配置模板ID获取配置模板数据集示例
 */
export const getDatasetExampleByTemplateId = async (templateId: string) => {
  try {
    const res: any =
      (await studioAxios.axiosGet(`${API.benchmark}/template-dataset-file`, {
        config_id: templateId,
      })) || {};
    return res || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};
