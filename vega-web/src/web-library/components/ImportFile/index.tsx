/** 文件上传 */

import React from 'react';
import { Upload, Tooltip, Modal, message } from 'antd';
import { IconFont } from '../../common';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import getLocaleValue from '../../utils/get-locale-value';

enum File {
  Json = 'json',
}

const ImportFile = ({
  children,
  accept = File.Json,
  customRequest, // 导入数据的请求
  getData, // 导入成功之后获取数据
  confirm, // 导入时，提示框
  ...props
}: {
  children?: React.ReactElement;
  accept?: string;
  getData: () => Promise<void>;
  confirm?: {
    checkedRenameRequest: (data: any) => Promise<string | boolean>;
  };
  customRequest: (param: any, name: any) => Promise<unknown | void>;
  [key: string]: any;
}): JSX.Element => {
  const uploadFile = (e: any): void => {
    const strArr = e.file.name.split('.');
    const name = strArr[0];
    const fileType = strArr[strArr.length - 1];

    if (fileType !== accept) {
      message.error(getLocaleValue('fileAccept', { localeZh, value: { accept } }, { localeEn, value: { accept } }));
      return;
    }

    const reader = new FileReader();

    reader.readAsText(e.file);

    const resolve = (): void => {
      getData();
      message.success(getLocaleValue('importSuccess', { localeZh }, { localeEn }));
    };

    const reject = () => {};

    reader.onload = (e): void => {
      const { result = '' } = e.target || {};

      const importData = async (): Promise<void> => {
        try {
          if (accept === File.Json) {
            if (confirm) {
              const error = await confirm.checkedRenameRequest(JSON.parse(result as string));

              if (error) {
                Modal.confirm({
                  getContainer: () => document.getElementById('vega-root') as HTMLElement, // 指定挂载节点
                  onOk: () => customRequest(JSON.parse(result as string), name).then(resolve, reject),
                  title: error,
                });

                return;
              }
            }
            customRequest(JSON.parse(result as string), name).then(resolve, reject);
          } else {
            customRequest(e.target?.result, name).then(resolve, reject);
          }
        } catch (e) {
          message.error(getLocaleValue('fileError', { localeZh }, { localeEn }));
        }
      };

      importData();
    };
  };

  return (
    <Upload accept={accept} showUploadList={false} customRequest={uploadFile} {...props}>
      {children || (
        <Tooltip title={getLocaleValue('import', { localeZh }, { localeEn })}>
          <IconFont type="icon-upload"></IconFont>
        </Tooltip>
      )}
    </Upload>
  );
};

export default ImportFile;
