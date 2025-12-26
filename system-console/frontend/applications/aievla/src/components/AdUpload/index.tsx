/**
 * antd组件Upload上传
 * 只做了单一文件的上传
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { UploadProps } from 'antd';
import { Button, Upload } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '../IconFont';
import './style.less';

export type AdUploadType = {
  layout?: 'horizontal' | 'vertical';
  className?: string;
  accept: string; // 上传文件的类型
  maxCount?: number; // 上传文件的个数
  fileList: any[]; // 上传的文件列表
  setFileList?: (file: any) => void;
  beforeUpload: (file: any) => boolean; // 上传文件前的钩子函数
  onChange: (status: string, info: any) => void; // 文件变化
  onFileStartUpload: any; // 开始调接口上传文件
  disabled?: boolean; // 是否禁止
  strokeColor?: any; // 进度条样式
  showUploadList?: any; // 是否展示文件列表，可单独设定 showPreviewIcon, showRemoveIcon, showDownloadIcon, removeIcon 和 downloadIcon
  otherUploadList?: any; // showUploadList 其他的补充数据,可在默认的showUploadList上添加，减少写入
  itemRender?: UploadProps['itemRender'];
  onRemove?: UploadProps['onRemove'];
};

export type AdUploadRefType = {
  upload: () => void;
};

const AdUpload = forwardRef<AdUploadRefType, AdUploadType>((props, ref) => {
  const {
    layout = 'vertical',
    className,
    accept,
    maxCount = 1,
    fileList = [],
    setFileList,
    beforeUpload,
    onChange,
    onFileStartUpload,
    disabled = false,
    strokeColor = { '0%': '#108ee9', '100%': '#108ee9' },
    showUploadList = { showRemoveIcon: true, removeIcon: <IconFont type='icon-lajitong' /> },
    otherUploadList = {},
    ...otherProps
  } = props;

  const btnRef = useRef<any>();

  useImperativeHandle(ref, () => ({
    upload: () => {
      btnRef.current?.click();
    },
  }));

  const uploadProps: UploadProps = {
    name: 'file',
    accept,
    maxCount,
    fileList,
    showUploadList: { ...showUploadList, ...otherUploadList },
    beforeUpload: (file: any) => {
      return new Promise((resolve, reject) => {
        // 在beforeUpload中return false或是Promise.reject时只会拦截上传行为，但并不会组织文件进入上传列表
        // 因此即便返回了false，但是仍会进入到onChnage里面，这就会出现文件在界面上显示的问题
        // 可以返回Upload.LIST_IGNORE阻止列表展现
        if (!beforeUpload(file)) return Upload.LIST_IGNORE || reject(false);
        return resolve(true);
      });
    },
    onChange(info) {
      if (info.file.status === 'error') {
        info.file.response = info.file?.error;
      }
      const status: any = info.file?.status;
      setFileList?.([info.file]);
      onChange(status, info);
    },
    progress: {
      format: percent => percent && `${parseFloat(percent.toFixed(2))}%`,
      strokeColor,
      strokeWidth: 2,
    },
  };

  /**
   * 自定义上传
   */
  const customRequest = (files: any) => {
    // 自定义上传时，成功或失败可返回给onSuccess|onError
    // 便于onChange里更新文件的状态，做其他相应的操作
    const { onSuccess, onError, file, onProgress } = files;
    const fmData = new FormData();
    const config = {
      onUploadProgress: (event: any) => {
        // 上传进度，用于进度条展示
        onProgress({ percent: (event.loaded / event.total) * 100 });
      },
    };
    setFileList?.([file]);
    fmData.append('image', file);
    onFileStartUpload(file, config, onError, onSuccess);
  };
  const prefixCls = 'ad-upload';
  return (
    <Upload
      className={classNames(prefixCls, `${prefixCls}-${layout}`, className)}
      disabled={disabled}
      {...uploadProps}
      fileList={fileList}
      customRequest={customRequest}
      {...otherProps}
    >
      <Button disabled={disabled} ref={btnRef} icon={<IconFont type='icon-shangchuan' />}>
        {intl.get('global.uploadFile')}
      </Button>
    </Upload>
  );
});

export default AdUpload;
