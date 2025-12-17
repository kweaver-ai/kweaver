import { Button, message, Upload, Dropdown, Space, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { postTool } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OperatorImport from './OperatorImport';
import ImportFailed from './ImportFailed';

export default function UploadTool({ getFetchTool, toolBoxInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
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
      message.error(error?.description);
    }
  };
  const closeModal = () => {
    setIsImportOpen(false);
  };

  return (
    <>
      <Dropdown
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
                从本地导入
              </Upload>
            </Menu.Item>

            <Menu.Item onClick={() => setIsImportOpen(true)}>从算子导入</Menu.Item>
          </Menu>
        }
      >
        <a onClick={e => e.preventDefault()}>
          <Space>
            导入
            <DownOutlined />
          </Space>
        </a>
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
