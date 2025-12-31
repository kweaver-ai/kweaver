/** 导出文件 */
import React, { memo } from 'react';
import { message, Tooltip } from 'antd';
import { IconFont } from '../../common';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import downFile from '../../utils/down-file';
import getLocaleValue from '../../utils/get-locale-value';

const ExportFile = memo(
  ({ customRequest, children, name }: { name: string; customRequest: () => Promise<any>; children?: React.ReactElement; [key: string]: any }) => {
    const exportData = async (e: any): Promise<void> => {
      e.stopPropagation();

      customRequest().then((res) => {
        if (res.code || res.error_code) return;
        downFile(JSON.stringify(res, null, 2), name, 'json');
        message.success(getLocaleValue('exportSuccess', { localeZh }, { localeEn }));
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
