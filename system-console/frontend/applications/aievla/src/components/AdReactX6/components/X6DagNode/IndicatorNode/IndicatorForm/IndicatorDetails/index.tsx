import { useEffect, useState } from 'react';
import _ from 'lodash';

import { downloadFile, downloadInlineIndicatorFile } from '@/services/benchmark';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import FuncMetricContent from '@/pages/Benchmark/IndicatorLibrary/FuncIndicatorList/MetricContent';

import './style.less';

const IndicatorDetails = ({ indicatorData, onClose }: any) => {
  const [previewData, setPreviewData] = useState('');

  useEffect(() => {
    if (indicatorData) {
      getFileByPath();
    }
  }, [indicatorData]);

  const getFileByPath = async () => {
    if (indicatorData.type === 0) {
      const path = indicatorData.path;
      const data = await downloadFile(path);
      if (data) {
        // 将后端返回的文件六转化为ANTD组件需要的File
        const file = new File([data.blob], data.name, {}) as any;
        updateFilePreview(file);
      }
    } else if (indicatorData.type === 1) {
      const data = await downloadInlineIndicatorFile(indicatorData.id);
      updateFilePreview(data);
    } else {
      setPreviewData('');
    }
  };

  const updateFilePreview = (file: any) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target) {
        setPreviewData(e.target.result as string);
      }
    };
    reader.readAsText(file as unknown as Blob);
  };

  return (
    <div className='ad-h-100 IndicatorDetails' style={{ overflow: 'auto' }}>
      <FuncMetricContent anchor={false} data={indicatorData} previewData={previewData} />
      <span className='IndicatorDetails-close'>
        <Format.Button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          type='icon'
          size='small'
          className='ad-x6-dag-indicator-item-delete'
        >
          <IconFont type='icon-guanbiquxiao' />
        </Format.Button>
      </span>
    </div>
  );
};

export default IndicatorDetails;
