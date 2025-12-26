import React from 'react';
import intl from 'react-intl-universal';
import ParamCodeEditor from '@/components/ParamCode';
import './style.less';

export interface DatasetExampleProps {
  value?: any;
  onChange?: any;
}

const DatasetExample: React.FC<DatasetExampleProps> = props => {
  const { value } = props;
  const prefixLocale = 'benchmark.config';
  return (
    <div className='DatasetExample'>
      <div className='DatasetExample-form-item' style={{ padding: '4px 11px', borderBottom: 0 }}>
        {intl.get(`${prefixLocale}.datasetExampleTitle`)}
      </div>
      {value && (
        <ParamCodeEditor
          height='auto'
          value={value}
          readonly
          options={{
            mode: 'text/plain',
            foldGutter: true, // 启用折叠效果
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'], // 配置折叠参数
          }}
        />
      )}
    </div>
  );
};

export default DatasetExample;
