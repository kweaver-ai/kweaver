import { useRef, useState, useEffect, memo } from 'react';
import _ from 'lodash';
import axios from 'axios';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Tooltip } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import UTILS from '@/utils';
import { IconFont } from '@/common';

const PENDING = 'pending';
const UPLOADING = 'uploading';
const SUCCESS = 'success';
const FAIL = 'fail';

import ControllerUploadFile, { fileSize1M, fileSize1G } from '../ControllerUploadFile';

import type { FileType } from '../index';

import './style.less';
const FILE_ICON: any = {
  json: 'icon-dip-color-json',
  jsonl: 'icon-dip-color-json',
  csv: 'icon-dip-color-csv',
  txt: 'icon-dip-color-txt',
  parquet: 'icon-dip-color-parquet',
};

const STATUS: any = {
  pending: { label: 'modelLibrary.uploading', icon: '', operation: '', tip: '' },
  uploading: {
    label: 'modelLibrary.uploading',
    icon: '',
    operation: 'icon-dip-close',
    tip: 'modelLibrary.cancel',
  },
  success: { label: '', icon: <CheckCircleFilled style={{ color: '#52C41A' }} />, operation: '', tip: '' },
  fail: {
    label: 'global.importFailed',
    icon: '',
    operation: 'icon-dip-refresh',
    tip: 'modelLibrary.reImport',
  },
};

const UploadLine = (props: any) => {
  const { store, dispatch } = HOOKS.useGlobalContext();
  const { source, uploadStatus, networkStatus } = props;

  const { onCancel, onChangeFileStatus, onTriggerDrawerSize, onChangeUploadStatus, setUploadedSize } = props;
  const partInfos = useRef<any>({});
  const cancelList = useRef<any>({});
  const uploadController = useRef<any>(null);
  const { status: fileStatus = 'uploading' } = source?.file || {};
  const { label = '', icon = '', operation = '', tip = '' } = STATUS?.[fileStatus] || {};

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initUploadFile(source.file);
    return () => {
      if (!uploadController.current) return;
      // 取消继续上传
      uploadController.current.cancel = true;
      onHandelCancel();
    };
  }, []);
  useEffect(() => {
    if (networkStatus === 'OFFLINE' && uploadController.current) {
      uploadController.current.cancel = true;
      dispatch({ key: 'update', payload: { 'uploadDrawer.status': FAIL } });
      onHandelCancel();
      if (source?.file?.uid && fileStatus === 'uploading') {
        onChangeFileStatus(source?.file?.uid, 'fail');
      }
    }
  }, [networkStatus]);

  /** 取消请求 */
  const onHandelCancel = () => {
    if (_.isEmpty(cancelList.current)) return;
    _.forEach(_.entries(cancelList.current), ([key, cancel]: any) => {
      cancel(intl.get('modelLibrary.cancelRequest'));
      delete cancelList.current[key];
    });
  };

  /** 初始化文件上传管理器 */
  const initUploadFile = (file: FileType) => {
    // uploadController.current = new ControllerUploadFile({
    // 	file,
    // 	limitSize: fileSize1G * 2,
    // 	chunkSize: fileSize1M * 5, // 20
    // 	concurrency: 1,
    // 	fetch: async (fileData: any) => {
    // 		return new Promise((resolve, reject) => {
    // 			if (uploadStatus !== UPLOADING) {
    // 				dispatch({ key: 'update', payload: { [`uploadDrawer.status`]: UPLOADING } });
    // 			}

    // 			const postData: any = {
    // 				parts: fileData?.key,
    // 				upload_type: source?.upload_type,
    // 				key: source?.osData?.key,
    // 				upload_id: source?.osData?.upload_id,
    // 			};
    // 			try {
    // 				// 获取需要上传的oss的url、method、header
    // 				dataSetFilesUpload(postData)
    // 					.then((result: any) => {
    // 						const osData = result?.authrequest?.[fileData?.key];
    // 						if (!osData) return reject('fail');

    // 						const { url, method, headers } = osData || {};
    // 						const reader = new FileReader();

    // 						reader.readAsArrayBuffer(fileData.file);
    // 						reader.onload = async (e: Event) => {
    // 							const bytes = (e.target as any).result;

    // 							// 上传到 oss
    // 							axios({
    // 								url,
    // 								method,
    // 								headers,
    // 								data: bytes,
    // 								cancelToken: new axios.CancelToken((cancel) => {
    // 									cancelList.current[JSON.stringify(url)] = cancel;
    // 								}),
    // 							}).then((data: any) => {
    // 								resolve('success');
    // 								const etag = data?.headers.etag.replace(/"/g, '');
    // 								partInfos.current[fileData?.key] = etag;
    // 							});
    // 						};
    // 					})
    // 					.catch((error: any) => {
    // 						reject(error);
    // 					});
    // 			} catch (error) {
    // 				reject(error);
    // 			}
    // 		});
    // 	},
    // 	onFail: () => {
    // 		onChangeFileStatus(file.uid, 'fail');
    //     dispatch({ key: 'update', payload: { [`uploadDrawer.status`]: FAIL } });
    // 	},
    // 	onSuccess: async () => {
    // 		try {
    // 			/** oss上传结束 */
    // 			const postDataComplete: any = {
    // 				upload_type: 1,
    // 				key: source?.osData?.key,
    // 				part_infos: partInfos.current,
    // 				upload_id: source?.osData?.upload_id,
    // 			};
    // 			// 获取oss上传完成的 url, method, body, headers
    // 			const resultComplete: any = await dataSetFilesUploadFinish(postDataComplete);

    // 			const { url, method, request_body = {}, headers } = resultComplete || {};
    // 			if (url && method && headers) {
    // 				const config: any = { url, method, headers };
    // 				if (method.toUpperCase === 'GET') config.params = request_body;
    // 				if (method.toUpperCase !== 'GET') config.data = request_body;
    // 				// 调用oss上传完成接口
    // 				await axios(config);
    // 			}
    // 			/** 写入数据库上传结束 */
    // 			const postDataEnd: any = {
    // 				name: source.name,
    // 				size: source.file.size,
    // 				key: source?.osData?.key,
    // 				upload_type: 1,
    // 				file_suffix: source?.file_suffix,
    // 				doc_id: source.osData.doc_id,
    // 				version_id: source?.version_id,
    // 			};

    // 			if (source?.tags) postDataEnd.tags = source?.tags;
    // 			if (source?.model_id) postDataEnd.model_id = source?.model_id;
    // 			if (source?.description) postDataEnd.description = source?.description;
    // 			const res = await dataSetSingleFilesUploadFinish(postDataEnd);
    // 			if (res) {
    // 				// 弹窗最小化
    // 				// onTriggerDrawerSize(true);

    // 				onChangeFileStatus(file.uid, 'success');
    //         dispatch({ key: 'update', payload: { [`uploadDrawer.status`]: SUCCESS + _.uniqueId() } });
    // 			} else {
    // 				onChangeFileStatus(file.uid, 'fail');
    //         dispatch({ key: 'update', payload: { [`uploadDrawer.status`]: FAIL } });
    // 			}
    // 		} catch (error) {
    // 			onChangeFileStatus(file.uid, 'fail');
    //       dispatch({ key: 'update', payload: { [`uploadDrawer.status`]: FAIL } });
    // 		}
    // 	},

    // 	onProgress: (progress: number) => {
    // 		setProgress(progress);
    // 		setUploadedSize((pre: any) => pre + progress);
    // 		progress === 100 && onChangeFileStatus(file.uid, 'success');
    // 	},
    // });
    onChangeFileStatus(file.uid, 'uploading');
    dispatch({ key: 'update', payload: { 'uploadDrawer.status': PENDING } });
    uploadController.current.onEmit();
  };

  const disabled = fileStatus === 'fail' && uploadStatus === UPLOADING;

  const curFileExt = source.file?.name.split('.').pop();

  return (
    <div className='uploadLineRoot'>
      <div className={classNames('progress', { isShow: fileStatus === 'uploading' })} style={{ width: `${progress}%` }} />
      <div className={classNames('progressBack', { isShow: fileStatus === 'uploading' })} />
      <div className='ad-align-center'>
        <IconFont className='ad-mr-2' type={FILE_ICON[curFileExt] || 'icon-dip-color-folder'} style={{ fontSize: 32 }} />
        <Tooltip title={source?.name}>
          <div className='ad-ellipsis' style={{ maxWidth: 270 }}>
            {source?.name}
          </div>
        </Tooltip>
      </div>
      <div className='info'>
        <div style={{ width: 100, textAlign: 'center' }}>{UTILS.formatFileSize(source?.file?.size)}</div>
        <div style={{ width: 100, textAlign: 'center' }}>{fileStatus === 'uploading' ? `${progress}%` : icon || intl.get(label)}</div>
        <div style={{ width: 50, textAlign: 'center' }}>
          {operation && (
            <Tooltip title={intl.get(tip) || ''}>
              <Button
                type='link'
                style={{ margin: 0, padding: 0, minWidth: 0, ...(disabled ? {} : { color: '#000' }) }}
                disabled={disabled}
                onClick={() => {
                  if (fileStatus === 'fail') {
                    onChangeFileStatus(source.file.uid, 'uploading');
                    dispatch({ key: 'update', payload: { 'uploadDrawer.status': PENDING } });
                    uploadController.current.onReUpload();
                  } else {
                    onCancel(source.file.uid);
                    dispatch({ key: 'update', payload: { 'uploadDrawer.status': PENDING + new Date() } });
                  }
                }}
              >
                <IconFont type={operation} />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(UploadLine);
