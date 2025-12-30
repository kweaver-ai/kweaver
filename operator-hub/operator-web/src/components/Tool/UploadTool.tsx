import { message, Upload, Dropdown, Menu } from 'antd';
import { postTool } from '@/apis/agent-operator-integration';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OperatorImport from './OperatorImport';
import ImportFailed from './ImportFailed';

export default function UploadTool({ getFetchTool, toolBoxInfo, children, placement }: any) {
  const [searchParams] = useSearchParams();
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const box_id = searchParams.get('box_id') || '';
  const [dataSourceError, setDataSourceError] = useState([]);

  const customRequest = async ({ file }: any) => {
    const formData = new FormData();
    formData.append('data', file);
    formData.append('metadata_type', 'openapi');
    try {
      const { failures, success_count } = await postTool(box_id, formData);
      if (success_count > 0) message.success(`导入成功${success_count}个工具`);
      setDataSourceError(failures || []);
      getFetchTool();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };
  const closeModal = () => {
    setIsImportOpen(false);
  };

  return (
    <>
      <Dropdown
        placement={placement || 'bottom'}
        overlay={
          <Menu>
            <Menu.Item>
              <Upload
                customRequest={customRequest}
                accept=".yaml,.yml,.json"
                maxCount={1}
                showUploadList={false}
                beforeUpload={file => {
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.info('上传的文件大小不能超过5MB');
                    return false;
                  }
                  const fileExtension = file?.name?.split('.')?.pop()?.toLowerCase() || '';
                  const isSupportedFormat = ['json', 'yaml', 'yml'].includes(fileExtension);
                  if (!isSupportedFormat) {
                    message.info('上传格式不正确，只能是yaml或json格式的文件');
                    return false;
                  }
                  return true;
                }}
              >
                选择OpeanAPI格式的文件导入
              </Upload>
            </Menu.Item>

            <Menu.Item onClick={() => setIsImportOpen(true)}>从已有算子导入</Menu.Item>
          </Menu>
        }
      >
        {children}
      </Dropdown>
      {isImportOpen && <OperatorImport closeModal={closeModal} toolBoxInfo={toolBoxInfo} getFetchTool={getFetchTool} />}
      {Boolean(dataSourceError?.length) && (
        <ImportFailed
          dataSource={dataSourceError}
          closeModal={() => {
            setDataSourceError([]);
          }}
        />
      )}
    </>
  );
}
