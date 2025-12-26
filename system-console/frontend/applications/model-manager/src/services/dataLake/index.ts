import API from '../api';
import Request from '../request';

/** 获取当前登录用户临时上传目录 */
const getEntryDocLibs: any = async (type?: any) => {
  return await Request.get(API.getEntryDocLibs, { sort: 'doc_lib_name', direction: 'asc', type });
};

/* 由名字获取对象信息 */
const getDocInfoByPath: any = async (namepath: string) => {
  return await Request.post(API.getDocInfoByPath, { namepath });
};

/* 创建文件夹 */
const createDir = async (data: { docid: string; name: string }) => {
  return await Request.post(API.createDir, data);
};

/** 秒传校验码协议 */
const predupload: any = async (data: { length: number; slice_md5: string }) => {
  return await Request.post(API.predupload, data);
};

/** 秒传文件协议 */
export type DuploadType = {
  docid: string;
  length: number;
  md5: string;
  ondup: 1 | 2 | 3;
};
const dupload: any = async (data: DuploadType) => {
  return await Request.post(API.dupload, data);
};

/** 开始上传文件协议 */
export type OsbeginuploadType = {
  docid: string;
  length: number;
  name: string;
  client_mtime: number;
  ondup: 1 | 2 | 3;
  reqmethod: 'PUT' | 'POST';
};
const osbeginupload: any = async (data: OsbeginuploadType) => {
  return await Request.post(API.osbeginupload, data);
};

/** 上传文件完成协议 */
export type OsenduploadType = {
  docid: string;
  rev: string;
  csflevel: number;
};
const osendupload: any = async (data: OsenduploadType) => {
  return await Request.post(API.osendupload, data);
};

/** 下载文件协议 */
export type OsdownloadType = {
  docid: string;
  savename: string;
  authtype: string;
};
const osdownload: any = async (data: OsenduploadType) => {
  return await Request.post(API.osdownload, data);
};

export default {
  getEntryDocLibs,
  getDocInfoByPath,
  createDir,
  predupload,
  dupload,
  osbeginupload,
  osendupload,
  osdownload,
};
