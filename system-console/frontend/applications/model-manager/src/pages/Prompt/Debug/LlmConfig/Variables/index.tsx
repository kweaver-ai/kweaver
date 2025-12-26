import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import axios from 'axios';
import intl from 'react-intl-universal';
import { Space, Upload, Divider, Select } from 'antd';
import { ContainerOutlined, LoadingOutlined, FileImageOutlined, VideoCameraOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Title, Text, Input, IconFont, Button } from '@/common';

import styles from './index.module.less';

const modifyUrl = (originalUrl: string) => {
  const url = new URL(originalUrl);
  url.protocol = 'http:'; // 替换协议
  url.port = ''; // 移除端口
  return url.href; // 自动省略默认端口
};

export const fileSize1K = 1024;
export const fileSize1M = 1024 * 1024;
export const fileSize1G = 1024 * 1024 * 1024;
const videoTypes = ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv'];
const imageTypes = ['jpg', 'jpeg', 'apng', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'ico', 'dib', 'icns', 'sgi', 'j2c', 'j2k', 'jp2', 'jpc', 'jpf', 'jpx'];

const getMediaNameAndType = (url: string) => {
  try {
    const { pathname } = new URL(url);
    // 处理无路径的特殊URL（如：https://example.com）
    if (!pathname || pathname === '/') return ['', ''];

    // 2. 提取文件名（兼容路径末尾带斜杠的情况）
    const pathSegments = pathname.split('/').filter(segment => segment);
    const fileName = pathSegments.pop() || '';

    // 3. 提取扩展名（考虑多扩展名如.tar.gz）
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : '';

    let mediaType = '';
    if (imageTypes.includes(extension)) mediaType = 'image';
    else if (videoTypes.includes(extension)) mediaType = 'video';

    return [fileName, mediaType];
  } catch (_error) {
    return ['', ''];
  }
};

const UploadItem = React.memo((props: any) => {
  const { data, message, fetching, tempUploadDir } = props;
  const { onDelete, onUpdateFile } = props;
  const file = data.originFileObj;
  const previewContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onUpload();
  }, []);

  const onPreview = () => {
    if (!previewContainer.current) return;

    previewContainer.current.innerHTML = '';

    if (data.__fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img: any = document.createElement('img');
        img.src = e.target.result; // 设置 Data URL
        img.style.width = '56px'; // 限制预览尺寸
        img.style.height = '56px';
        img.style['border-radius'] = '8px';
        if (previewContainer.current) previewContainer.current.appendChild(img);
      };
      reader.readAsDataURL(file); // 读取为 Base64
    }

    if (data.__fileType === 'video') {
      const video = document.createElement('video');
      video.muted = true; // 静音避免自动播放限制
      video.crossOrigin = 'anonymous'; // 解决跨域问题
      video.src = URL.createObjectURL(file);

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        const ctx: any = canvas.getContext('2d');
        canvas.width = 56; // 限制分辨率
        canvas.height = 56;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const img: any = document.createElement('img');
        img.src = canvas.toDataURL('image/jpeg');
        img.style.width = '56px'; // 限制预览尺寸
        img.style.height = '56px';
        img.style['border-radius'] = '8px';
        if (previewContainer.current) previewContainer.current.appendChild(img);

        URL.revokeObjectURL(video.src); // 释放内存
        video.remove();
      });
      video.currentTime = 0.01;
    }
  };

  const onUpload = async () => {
    try {
      const postData = { docid: tempUploadDir?.docid, length: file.size, name: file?.name, client_mtime: Date.now(), ondup: 2, reqmethod: 'POST' };
      const { docid, rev, authrequest } = await SERVICE.dataLake.osbeginupload(postData);
      const [method, url, ...meta] = authrequest || [];

      if (docid) {
        const formData = new FormData();
        _.forEach(meta, item => {
          const keyValue = item.split(': ');
          formData.append(keyValue[0], keyValue[1]);
        });
        formData.append('file', file);
        await axios({ url, method, headers: {}, data: formData });
        const postData = { docid, rev, csflevel: 0 };
        const { name = '' } = await SERVICE.dataLake.osendupload(postData);
        const { authrequest = '' } = await SERVICE.dataLake.osdownload({ docid, name, authtype: 'QUERY_STRING' });
        const fileUrl = modifyUrl(authrequest[1]);
        onUpdateFile({ ...data, __fileUrl: fileUrl });
        onPreview();
      }
    } catch (_error) {
      onDelete(data?.uid);
      message.error(intl.get('Prompt.debug.uploadFailedPleaseTryAgain'));
    }
  };

  return (
    <div className={styles['page-prompt-content-debug-preview-item-root']}>
      <div ref={previewContainer} className='g-w-100 g-h-100 g-flex-center'>
        <LoadingOutlined />
      </div>
      {!fetching.current && (
        <div className={styles['debug-preview-item-delete-button']} onClick={() => onDelete(file?.uid)}>
          <IconFont type='icon-dip-trash' style={{ fontSize: 12, color: 'red' }} />
        </div>
      )}
    </div>
  );
});
const UrlItem = React.memo((props: any) => {
  const { data, onDelete } = props;
  return (
    <div className={styles['page-prompt-content-debug-preview-item-root']}>
      <div className='g-p-1 g-h-100 g-flex-column-center g-flex-space-between'>
        {data?.__fileType === 'image' && <FileImageOutlined style={{ fontSize: 24 }} />}
        {data?.__fileType === 'video' && <VideoCameraOutlined style={{ fontSize: 24 }} />}
        <div className='g-ellipsis-1' title={data?.name} style={{ fontSize: 10 }}>
          {data?.name}
        </div>
      </div>

      <div className={styles['debug-preview-item-delete-button']} onClick={() => onDelete(data?.uid)}>
        <IconFont type='icon-dip-trash' style={{ fontSize: 12, color: 'red' }} />
      </div>
    </div>
  );
});

/** 这个组件渲染多次，需要优化 */
const Variables = (props: any) => {
  const { message } = HOOKS.useGlobalContext();
  const { fileData, showConfig, variables, variablesData, selectedModel, fetching } = props;
  const { onRun, onClear, onChangeFile, onChangeVariables } = props;

  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('image');
  const [tempUploadDir, setTempUploadDir] = useState<any>();

  useEffect(() => {
    if (selectedModel?.model_type !== 'vu') return;
    getUserTempUploadDir();
  }, [selectedModel?.model_type]);

  /** 获取当前登录用户临时上传目录 */
  const getUserTempUploadDir = async () => {
    try {
      const result = await SERVICE.dataLake.getEntryDocLibs('user_doc_lib');
      if (result) {
        const [userDocLib] = result;
        if (userDocLib) {
          console.log('上传准备：开始', { userDocLib });
          let tempDir: any;
          try {
            tempDir = await SERVICE.dataLake.getDocInfoByPath(`${userDocLib?.name}/临时区文件夹`);
          } catch (error: any) {
            if (error.code === 404002006) {
              try {
                tempDir = await SERVICE.dataLake.createDir({ name: '临时区文件夹', docid: userDocLib?.id });
              } catch (error) {
                console.log('error: 操作失败请重试 1', error);
              }
            } else {
              console.log('error: 操作失败请重试 2', error);
            }
          }
          setTempUploadDir(tempDir);
          console.log('上传准备：结束', tempDir);
        }
      }
    } catch (_error) {}
  };

  const verifyFiles = (files: any) => {
    if (files.length > 5) return intl.get('Prompt.debug.cannotExceed5');

    let type: string = '';
    let hasTowType = false;
    let exceedingMaximumLimit = false;
    _.forEach(files, item => {
      if (item?.size > fileSize1M * 50) exceedingMaximumLimit = true;
      if (!type) {
        type = item.__fileType;
      } else {
        hasTowType = item.__fileType !== type;
      }
    });

    if (hasTowType) return intl.get('Prompt.debug.cannotBothVideosAndImages');

    if (exceedingMaximumLimit) return intl.get('Prompt.debug.singleFileCannotThan50M');

    if (files[0]?.__fileType === 'video' && files.length > 1) return intl.get('Prompt.debug.videosCannotExceedOne');

    return '';
  };

  const onChangeUpload = _.debounce(async (_file, fileList) => {
    const _fileList = _.map(fileList, item => {
      const names = item?.name?.split('.') || [];
      const suffix = names?.[names.length - 1];
      const __fileType = _.includes(videoTypes, suffix) ? 'video' : 'image';
      item.__fileType = __fileType;
      return item;
    });
    const files = [...fileData, ..._fileList];
    const intercept = verifyFiles(files);
    if (intercept) return message.error(intercept);
    onChangeFile(files);
  }, 300);

  const onDelete = (uid: string) => {
    const newData = _.filter(fileData, item => item.uid !== uid);
    onChangeFile(newData);
  };

  const onUpdateFile = (data: any) => {
    const newData = _.map(fileData, item => {
      if (item.uid === data.uid) item.__fileUrl = data.__fileUrl;
      return item;
    });
    onChangeFile(newData);
  };

  const acceptVideos = _.map(videoTypes, item => `.${item}`).join(', ');
  const acceptImages = _.map(imageTypes, item => `.${item}`).join(', ');

  const addUrlToFileData = () => {
    const uid = _.uniqueId('file_uid');
    const [name] = getMediaNameAndType(fileUrl);

    const data = { uid, name: name || intl.get('Prompt.debug.unnamed'), __fileType: fileType, __fileUrl: fileUrl };
    const files = [...fileData, data];
    const intercept = verifyFiles(files);
    if (intercept) return message.error(intercept);
    onChangeFile(files);
    setFileUrl('');
  };

  return (
    <div>
      <div style={showConfig ? { overflowY: 'hidden' } : { height: 0, overflowY: 'hidden' }}>
        {selectedModel?.model_type === 'vu' && (
          <div className='g-mt-3'>
            <div className='g-mb-1 g-flex-align-center'>
              {_.map(fileData, (item, index) => {
                if (!item.originFileObj) return <UrlItem key={index} data={item} onDelete={onDelete} />;
                return (
                  <UploadItem
                    key={index}
                    data={item}
                    message={message}
                    fetching={fetching}
                    tempUploadDir={tempUploadDir}
                    onDelete={onDelete}
                    onUpdateFile={onUpdateFile}
                  />
                );
              })}
            </div>
            <div className='g-mt-1 g-mb-3'>
              <div className='g-flex-align-center'>
                <span className='g-c-error'>*</span>
                <span>{intl.get('Prompt.debug.attachment')}</span>
              </div>
              <Space.Compact className='g-mt-1 g-w-100'>
                <Select
                  value={fileType}
                  options={[
                    { value: 'image', label: intl.get('Prompt.debug.image') },
                    { value: 'video', label: intl.get('Prompt.debug.video') },
                  ]}
                  onChange={value => setFileType(value)}
                />
                <Input
                  allowClear
                  placeholder={intl.get('Prompt.debug.pleaseFillAttachmentURL')}
                  value={fileUrl}
                  onChange={event => setFileUrl(event.target.value)}
                />
                <Button type='primary' onClick={addUrlToFileData}>
                  {intl.get('Prompt.debug.ok')}
                </Button>
              </Space.Compact>
            </div>
            <Upload.Dragger
              name='file'
              accept={`${acceptVideos}, ${acceptImages}`}
              multiple={true}
              fileList={[]}
              disabled={fetching.current}
              beforeUpload={() => false}
              customRequest={() => false}
              onChange={({ file, fileList }) => onChangeUpload(file, fileList)}
            >
              <div>
                <ContainerOutlined className='g-c-primary' style={{ fontSize: 40 }} />
              </div>
              <Title className='g-mt-2'>{intl.get('Prompt.debug.clickOrDrag')}</Title>
              <div className='g-mt-2 g-c-text-sub' style={{ fontSize: 12 }}>
                {intl.get('Prompt.debug.imageSupportFormats')}：jpg、jpeg、png、gif、webp、bmp、ico
              </div>
              <div className='g-c-text-sub' style={{ fontSize: 12 }}>
                {intl.get('Prompt.debug.videoSupportFormats')}：mp4、avi、mkv、mov、flv、wmv
              </div>
            </Upload.Dragger>
          </div>
        )}
        <div className='g-mt-4'>
          <Text className='g-c-text-sub' level={1}>
            {intl.get('Prompt.debug.fillVariable')}
          </Text>
        </div>
        {_.map(variables, (item: any) => {
          return (
            <div className='g-mt-1' key={item.var_name}>
              <div className='g-flex-align-center'>
                <span className='g-c-error'>*</span>
                <span>{item.var_name}</span>
              </div>
              <Input className='g-mt-1 g-w-100' value={variablesData[item.var_name]} onChange={event => onChangeVariables(item.var_name, event.target.value)} />
            </div>
          );
        })}
      </div>
      <Divider className='g-mt-3 g-mb-3' />

      <Button className='g-mr-2' type='primary' disabled={fetching.current} loading={fetching.current} onClick={onRun}>
        {intl.get('Prompt.debug.run')}
      </Button>
      {(!_.isEmpty(variables) || selectedModel?.model_type === 'vu') && (
        <Button
          disabled={fetching.current}
          onClick={() => {
            setFileUrl('');
            onClear();
          }}
        >
          {intl.get('Prompt.debug.clean')}
        </Button>
      )}
    </div>
  );
};

export default Variables;
