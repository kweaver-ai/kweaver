import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { UploadFile } from 'antd/lib/upload/interface';

import AdBadge from '@/components/AdBadge';
import AdUpload from '@/components/AdUpload';
import ParamCodeEditor, { ParamEditorRef } from '@/components/ParamCodeEditor';

import './style.less';

type UploadPythonFileProps = {
  value?: UploadFile[];
  onChange?: any;
  className?: string;
  onTemplateDownload?: () => void;
  previewFile?: boolean; // 是否预览文件内容  默认true
  onRemove?: any;
  disabled?: boolean;
  onStartToUploadFile?: any;
};
const UploadPythonFile = forwardRef<any, UploadPythonFileProps>((props, ref) => {
  const { value = [], onChange, className, onTemplateDownload, previewFile = true, disabled = false, onStartToUploadFile } = props;
  const prefixLocale = 'benchmark.indicator';

  const editorRef = useRef<ParamEditorRef>(null);
  const [previewData, setPreviewData] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (previewFile && value.length > 0 && !error) {
      const file: File = value[0].originFileObj!;
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target) setPreviewData(e.target.result as string);
      };
      reader.readAsText(file as unknown as Blob);
    } else {
      setPreviewData('');
    }
  }, [value, previewFile]);

  const beforeUpload = (file: any) => {
    const isSizeValid = file.size <= 2 * 1024 * 1024; // 2MB
    const ext = file.name.split('.').slice(-1)[0];
    if (ext !== 'py') {
      setError(true);
      message.warning(intl.get('benchmark.indicator.fileFormatErrorTip'));
      return false;
    }
    if (!isSizeValid) {
      setError(true);
      message.warning(intl.get('benchmarkTask.fileSizeError'));
      return false;
    }
    setError(false);
    return true;
  };

  const createTip = useMemo(() => {
    return intl.get(`${prefixLocale}.uploadFileTip2`).split('|');
  }, []);

  return (
    <div className={classNames('UploadPythonFile ad-flex-column ad-h-100', className)}>
      <AdUpload
        maxCount={1}
        accept='.py'
        onChange={onChange}
        disabled={disabled}
        fileList={value}
        onFileStartUpload={onStartToUploadFile}
        beforeUpload={beforeUpload}
        ref={ref}
        itemRender={originNode => {
          return (
            <>
              <div className='ad-mt-3 ad-mb-8 ad-flex-column'>
                <AdBadge dotSize={4} color='rgba(0, 0, 0, 0.45)' text={<span>{intl.get(`${prefixLocale}.uploadFileTip1`)}</span>} />
                <AdBadge
                  dotSize={4}
                  color='rgba(0, 0, 0, 0.45)'
                  text={
                    <div>
                      <span>{createTip[0]}</span>
                      <span onClick={() => onTemplateDownload?.()} className='ad-c-primary ad-pointer'>
                        {createTip[1]}
                      </span>
                    </div>
                  }
                />
              </div>
              {originNode}
            </>
          );
        }}
      />
      {value.length === 0 && (
        <div className='ad-mt-4 ad-flex-column'>
          <AdBadge dotSize={4} color='rgba(0, 0, 0, 0.45)' text={<span>{intl.get(`${prefixLocale}.uploadFileTip1`)}</span>} />
          <AdBadge
            dotSize={4}
            color='rgba(0, 0, 0, 0.45)'
            text={
              <div>
                <span>{createTip[0]}</span>
                <span onClick={() => onTemplateDownload?.()} className='ad-c-primary ad-pointer'>
                  {createTip[1]}
                </span>
              </div>
            }
          />
        </div>
      )}
      {previewFile && (
        <div className='UploadPythonFile-preview ad-flex-item-full-height ad-mt-3'>
          {previewData && <ParamCodeEditor copy height='100%' ref={editorRef} value={previewData} readonly />}
        </div>
      )}
    </div>
  );
});

export default UploadPythonFile;
