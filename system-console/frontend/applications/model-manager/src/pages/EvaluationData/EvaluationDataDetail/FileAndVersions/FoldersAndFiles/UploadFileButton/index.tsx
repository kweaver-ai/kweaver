import _ from 'lodash';
import { Dropdown, Upload, type MenuProps } from 'antd';
import { UploadOutlined, DownOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import { IconFont, Button } from '@/common';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
const FILE_MAX_SIZE = 5 * GB;
const FILE_TYPE = '.json,.jsonl,.csv,.txt,.parquet';

const UploadFileButton = (props: any) => {
  const { modal, onChange } = props;

  const onChangeFiles = _.debounce((e: any) => {
    const { fileList } = e;
    onChange('file', fileList);
  }, 10);
  const onChangeDir = _.debounce((data: any) => {
    const { fileList } = data;
    const notPrescribedTypeFiles = _.filter(fileList, file => {
      const fileName = file.name.split('.')[0];
      return !ENUMS.REGEXP.EXCLUDING_TYPE_AND_NOT_EXCEED_255.test(fileName);
    });
    if (notPrescribedTypeFiles.length > 0) {
      modal.confirm({
        title: '无法执行上传操作',
        closable: true,
        icon: <ExclamationCircleFilled />,
        content: '文件名不能包含下列字符 /：*？"＜＞|，且长度不能超过255个字符。',
        okText: '确定',
        cancelButtonProps: { style: { display: 'none' } },
        onOk: () => console.log('确定'),
      });
      return;
    }

    const totalSize = _.map(fileList, file => file.size).reduce((pre, cur) => pre + cur, 0);
    if (totalSize > FILE_MAX_SIZE) {
      modal.confirm({
        title: '无法执行上传操作',
        closable: true,
        icon: <ExclamationCircleFilled />,
        content: '当前文件大小超过网页上传限制5GB。',
        okText: '确定',
        cancelButtonProps: { style: { display: 'none' } },
        onOk: () => console.log('确定'),
      });
      return;
    }

    onChange('directory', fileList);
  }, 10);

  const items: MenuProps['items'] = [
    {
      key: 'file',
      style: { padding: 0 },
      label: (
        <Upload accept={FILE_TYPE} fileList={[]} beforeUpload={() => false} onChange={onChangeFiles} multiple>
          <div style={{ height: 32, padding: '5px 12px', display: 'flex', alignItems: 'center' }}>
            <IconFont type='icon-dip-color-table' style={{ fontSize: 16, marginRight: 8 }} />
            文件
          </div>
        </Upload>
      ),
    },
    {
      key: 'directory',
      style: { padding: 0 },
      label: (
        <Upload accept={FILE_TYPE} fileList={[]} beforeUpload={() => false} onChange={onChangeDir} directory>
          <div style={{ height: 32, padding: '5px 12px', display: 'flex', alignItems: 'center' }}>
            <IconFont type='icon-dip-color-folder' style={{ fontSize: 16, marginRight: 8 }} />
            文件夹
          </div>
        </Upload>
      ),
    },
    { type: 'divider', style: { backgroundColor: 'rgba(0, 0, 0, .10)' } },
    {
      key: 'description',
      disabled: true,
      style: { width: 190, cursor: 'default' },
      label: (
        <div className='g-c-title' style={{ fontSize: 12 }}>
          仅支持json、jsonl、csv、txt、parquet文件格式
        </div>
      ),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button type='primary' icon={<UploadOutlined />}>
        上传
        <DownOutlined style={{ fontSize: 12, marginTop: 2 }} />
      </Button>
    </Dropdown>
  );
};

export default UploadFileButton;
