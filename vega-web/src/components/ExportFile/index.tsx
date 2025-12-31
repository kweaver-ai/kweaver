/** 导出文件 */
import React, { memo } from 'react';
import { Tooltip } from 'antd';
import { arNotification } from '@/components/ARNotification';
import downFile from '@/utils/down-file';
import getLocaleValue from '@/utils/get-locale-value';
import { IconFont } from '@/web-library/common';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';

const ExportFile = memo(
  ({ customRequest, children, name }: { name: string; customRequest: () => Promise<any>; children?: React.ReactElement; [key: string]: any }) => {
    const exportData = async (e: any): Promise<void> => {
      e.stopPropagation();

      customRequest().then((res) => {
        if (res.code) return;
        downFile(JSON.stringify(res, null, 2), name, 'json');
        arNotification.success(getLocaleValue('exportSuccess', { localeZh }, { localeEn }));
      });
    };

    return (
      <span onClick={exportData}>
        {children || (
          <Tooltip title={getLocaleValue('export', { localeZh }, { localeEn })}>
            <IconFont type="icon-download"></IconFont>
          </Tooltip>
        )}
      </span>
    );
  }
);

export default ExportFile;
