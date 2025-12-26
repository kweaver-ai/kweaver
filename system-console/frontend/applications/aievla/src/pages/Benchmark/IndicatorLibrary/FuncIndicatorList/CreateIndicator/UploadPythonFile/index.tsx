import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import './style.less';
import intl from 'react-intl-universal';
import AdBadge from '@/components/AdBadge';
import { UploadFile } from 'antd/lib/upload/interface';
import { Form, message } from 'antd';
import classNames from 'classnames';
import ParamCodeEditor from '@/components/ParamCodeEditor';
import AdUpload from '@/components/AdUpload';
import { adCookie } from '@/utils/handleFunction';

const FormItem = Form.Item;
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
  const [previewData, setPreviewData] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    if (previewFile && value.length > 0 && !error) {
      const file: File = value[0].originFileObj!;
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target) {
          setPreviewData(e.target.result as string);
        }
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

  const formItemLayout =
    adCookie.get('anyDataLang') === 'zh-CN'
      ? {
          labelCol: { span: 3 },
          wrapperCol: { span: 14 },
        }
      : {
          labelCol: { span: 7 },
          wrapperCol: { span: 14 },
        };
  return (
    <div className={classNames('CreateIndicator-upload ad-flex-column', className)}>
      <Form {...formItemLayout} labelAlign='left'>
        <FormItem label={intl.get('benchmarkTask.selectFile')}>
          <AdUpload
            layout='horizontal'
            maxCount={1}
            accept='.py'
            onChange={onChange}
            disabled={disabled}
            fileList={value}
            onFileStartUpload={onStartToUploadFile}
            beforeUpload={beforeUpload}
            ref={ref}
          />
        </FormItem>
        <FormItem label={intl.get(`${prefixLocale}.fileRequireDesc`)}>
          <div className='ad-flex-column'>
            <AdBadge dotSize={4} color='rgba(0, 0, 0, 0.45)' text={<span className='ad-c-subtext'>{intl.get(`${prefixLocale}.uploadFileTip1`)}</span>} />
            <AdBadge
              dotSize={4}
              color='rgba(0, 0, 0, 0.45)'
              text={
                <>
                  <span className='ad-c-subtext'>{createTip[0]}</span>
                  <span
                    onClick={() => {
                      onTemplateDownload?.();
                    }}
                    className='ad-c-primary ad-pointer'
                  >
                    {createTip[1]}
                  </span>
                  <span className='ad-c-subtext'>{createTip[2]}</span>
                </>
              }
            />
          </div>
        </FormItem>
      </Form>

      {previewFile && (
        <div className='UploadPythonFile-preview ad-flex-item-full-height ad-mt-5'>
          {previewData && <ParamCodeEditor height='100%' value={previewData} readonly />}
        </div>
      )}

      {value.length > 0 && (
        <div className='CreateIndicator-upload-divider ad-border-b'>
          <span className='CreateIndicator-upload-divider-text'>{intl.get(`global.preview`)}</span>
        </div>
      )}
    </div>
  );
});

export default UploadPythonFile;
