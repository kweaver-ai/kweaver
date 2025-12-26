import { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { UploadFile } from 'antd/lib/upload/interface';

import {
  createIndicator,
  deleteFile,
  downloadFile,
  downloadIndicatorFileTemplate,
  downloadInlineIndicatorFile,
  getIndicatorFileAnalysisResult,
  uploadFile,
} from '@/services/benchmark';
import { downloadFileByBlob } from '@/utils/handleFunction';
import NoDataBox from '@/components/NoDataBox';
import LoadingMask from '@/components/LoadingMask';
import UniversalModal from '@/components/UniversalModal';
import { AdUploadRefType } from '@/components/AdUpload';

import { IndicatorType } from '@/pages/Benchmark/BenchmarkConfig/types';
import MetricContent from '../MetricContent';

import UploadPythonFile from './UploadPythonFile';

import empty from '@/assets/images/empty.svg';
import ImportError from '@/assets/images/ImportError.svg';
import './style.less';

const CreateIndicator = ({ onClose, refresh, readOnly, editData }: any) => {
  const uploadRef = useRef<AdUploadRefType>();
  const prefixLocale = 'benchmark.indicator';
  const [file, setFile] = useState<UploadFile[]>([]);
  const [fileError, setFileError] = useState<any>(null);
  const [fileAnalysisResult, setFileAnalysisResult] = useState<IndicatorType>();
  const filePath = useRef<string>('');
  const [previewData, setPreviewData] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (editData) {
      getFileByPath();
      setFileAnalysisResult(editData);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (filePath.current) deleteFile(filePath.current);
    };
  }, []);

  const getFileByPath = async () => {
    if (editData.type === 0) {
      const path = editData.path;
      const data = await downloadFile(path);
      if (data) {
        // 将后端返回的文件六转化为ANTD组件需要的File
        const file = new File([data.blob], data.name, {}) as any;
        updateFilePreview(file);
      }
    }
    if (editData.type === 1) {
      const data = await downloadInlineIndicatorFile(editData.id);
      updateFilePreview(data);
    }
  };

  const updateFilePreview = (file: any) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target) setPreviewData(e.target.result as string);
    };
    reader.readAsText(file as unknown as Blob);
  };

  /**
   * 文件上传变化
   */
  const onFileChange = (status: string, info: any) => {
    if (!status) return;
    if (status === 'error') info.file.response = info.file?.error;
    if (status === 'removed') {
      onRemove();
      return;
    }
    setFile([info.file]);
  };

  /**
   * 调上传接口的回调
   */
  const onStartToUploadFile = async (file: any, config: any, onError: any, onSuccess: any) => {
    const data = await uploadFile({ type: 'metric', name: file.name, file_suffix: 'py', size: Math.floor(file.size! / 1024) }, file, config);
    if (data) {
      updateFilePreview(file);
      if (filePath.current) {
        await deleteFile(filePath.current);
      }
      filePath.current = data.path;
      setLoading(true);
      const res = await getIndicatorFileAnalysisResult(filePath.current);
      setLoading(false);
      if (res?.code) {
        setFileAnalysisResult(undefined);
        let errorInfo = `${res.detail}`;
        if (res.code.includes('FileEmpty')) {
          errorInfo = intl.get(`${prefixLocale}.fileEmptyTip`);
        }
        if (res.code.includes('NameFormatError')) {
          errorInfo = intl.get(`${prefixLocale}.onlyKeyboard`);
        }
        if (res.code.includes('NameTooLong')) {
          errorInfo = intl.get(`${prefixLocale}.lenErr`);
        }
        if (res.code.includes('NameEmpty')) {
          errorInfo = intl.get(`${prefixLocale}.noNull`);
        }
        setFileError({
          code: res.code,
          text: errorInfo,
        });
        onError(errorInfo);
      } else {
        onSuccess(file);
        setFileAnalysisResult(res);
        setFileError(null);
      }
    } else {
      setLoading(false);
    }
  };

  const formFinish = async () => {
    const data = await createIndicator({ ...fileAnalysisResult, path: filePath.current });
    if (data) {
      filePath.current = '';
      message.success(intl.get('global.saveSuccess'));
      onClose?.();
      refresh?.();
    }
  };

  const onTemplateDownload = async () => {
    const data = await downloadIndicatorFileTemplate();
    if (data) {
      downloadFileByBlob(data, `${intl.get('global.commonTemplateName')}.py`);
    }
  };

  const tipData = useMemo(() => {
    if (file.length > 0) {
      if (fileError) {
        if (fileError.code.includes('FileEmpty')) {
          return { image: empty, desc: fileError.text };
        }
        return { image: ImportError, desc: fileError.text };
      }
    }
    return;
  }, [file, fileError]);

  const onRemove = async () => {
    if (filePath.current) {
      const data = await deleteFile(filePath.current);
      if (data) {
        setFile([]);
        setFileAnalysisResult(undefined);
        filePath.current = '';
      }
    } else {
      setFile([]);
      setFileAnalysisResult(undefined);
      filePath.current = '';
    }
  };

  const renderRightContent = () => {
    if (loading) {
      return <LoadingMask loading text={intl.get('benchmark.indicator.fileAnalysing')} />;
    }
    if (fileAnalysisResult && !fileError) {
      return (
        <MetricContent
          className={classNames('ad-flex-item-full-height ad-flex', { 'ad-pt-6': !editData })}
          data={fileAnalysisResult}
          previewData={previewData}
        />
      );
    }
    return (
      tipData && (
        <div className='ad-flex-item-full-height ad-center'>
          <NoDataBox desc={tipData.desc} imgSrc={tipData.image} />
        </div>
      )
    );
  };

  return (
    <UniversalModal
      centered
      adaptive
      fullScreen
      className='CreateIndicator-modal'
      width={1000}
      title={intl.get(`${prefixLocale}.${readOnly ? 'viewIndicator' : 'createIndicator'}`)}
      open
      onCancel={() => onClose()}
      footerData={
        !readOnly &&
        file.length > 0 && [
          {
            label: intl.get('global.cancel'),
            onHandle: () => onClose(),
          },
          {
            label: intl.get('global.save'),
            type: 'primary',
            onHandle: () => {
              if (file.length === 0) {
                message.error(intl.get(`${prefixLocale}.noFileTip`));
                return;
              }
              if (fileError) {
                if (fileError.code.includes('FileEmpty')) {
                  message.error(intl.get(`${prefixLocale}.fileErrorTip3`));
                } else {
                  message.error(fileError.text);
                }
                return;
              }
              formFinish();
            },
          },
        ]
      }
    >
      <div className={classNames('CreateIndicator ad-flex-column')}>
        {!readOnly && (
          <UploadPythonFile
            ref={uploadRef}
            value={file}
            onChange={onFileChange}
            onTemplateDownload={onTemplateDownload}
            previewFile={false}
            onStartToUploadFile={onStartToUploadFile}
          />
        )}

        {renderRightContent()}
      </div>
    </UniversalModal>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <CreateIndicator {...restProps} />;
};
