import { useState, useEffect } from 'react';
import _ from 'lodash';
import { Breadcrumb, Dropdown } from 'antd';
import { ArrowUpOutlined, SettingOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import { Button } from '@/common';

import AnalysisRules from './AnalysisRules';
import UploadFileButton from './UploadFileButton';
import FilesTable from './FilesTable';

const DIR_SOURCE_DATA = [
  {
    doc_id: '1907633509531389952/1911651596450664448',
    name: 'upload_file',
    size: 0,
    type: 1,
    create_user: 'test',
    create_time: '2025-04-14 13:23:47',
    update_user: 'test',
    update_time: '2025-04-14 13:23:47',
  },
];
const FILE_SOURCE_DATA = [
  {
    doc_id: '1907633509531389952/1907633627131285504',
    name: 'test.jsonl',
    size: 2663,
    type: 0,
    create_user: 'test',
    create_time: '2025-04-03 11:17:54',
    update_user: 'test',
    update_time: '2025-04-03 11:17:54',
  },
];

const FoldersAndFiles = (props: any) => {
  const { modal, currentVersion } = props;

  const [directoryStack, setDirectoryStack] = useState([{ label: '文件夹1', value: 'file1' }]);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]); // 选中行

  useEffect(() => {
    getList();
  }, []);
  const getList = async (data?: any) => {
    // const postData = {
    //   doc_id: '1907633509531389952/1911651596450664448',
    //   version_id: '1907633509543972864',
    //   order: 'desc',
    //   rule: 'name',
    //   ...data,
    // };
    console.log('postData', data);
    setDataSource([...DIR_SOURCE_DATA, ...FILE_SOURCE_DATA]);
  };

  /** 返回上一级 */
  const goParentDirectory = () => {
    console.log('goParentDirectory');
  };
  /** 进入文件夹 */
  const goDirectory = (doc_id: string) => {
    const versionId = currentVersion.versions_id;
    console.log('goDirectory', doc_id, versionId);
  };

  /** 面包屑 */
  const breadcrumbItems: any = [];
  const length = directoryStack.length - 1;
  _.forEach(directoryStack, (item, index) => {
    breadcrumbItems.push({ type: 'separator', separator: '>' });
    const breadcrumb: any = { title: index === length ? item.label : <a>{item.label}</a> };
    if (index !== length) breadcrumb.onClick = () => goDirectory(item.value);
    breadcrumbItems.push(breadcrumb);
  });

  /** 删除数据 */
  const onDeleteData = (items: any) => {
    const names = items.map((item: any) => `「${item?.name}」`).join('、');
    modal.confirm({
      title: '确认删除评测数据吗？',
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: `${names}一旦删除数据集将无法找回，请谨慎操作。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => console.log('确定'),
    });
  };

  /** 上传文件 */
  const onChangeFiles = (type: string, data: any) => {
    console.log('onChangeFiles', type, data);
  };

  /** 进入文件夹 */
  const onToDirectory = async (record: any) => {
    await getList({ doc_id: record.doc_id });
    setDirectoryStack([...directoryStack, { label: record.name, value: record.doc_id }]);
  };

  return (
    <div className='g-w-100 g-h-100'>
      <div className='g-mb-4 g-flex-space-between' style={{ height: 32 }}>
        <Breadcrumb
          separator=''
          items={[
            {
              title: (
                <a style={{ marginRight: 8 }}>
                  <ArrowUpOutlined />
                </a>
              ),
              onClick: goParentDirectory,
            },
            { title: <a>{currentVersion.version}</a>, onClick: () => goDirectory('1907633509531389952') },
            ...breadcrumbItems,
          ]}
        />
        <div>
          {selectedRowKeys.length > 0 && (
            <Button.Delete
              className='g-mr-2'
              onClick={() => {
                const items = _.filter(dataSource, item => _.includes(selectedRowKeys, item.doc_id));
                onDeleteData(items);
              }}
            >
              删除
            </Button.Delete>
          )}

          <Dropdown destroyOnHidden popupRender={() => <AnalysisRules value='\t' />} trigger={['click']}>
            <Button className='g-mr-2' iconPosition='end' icon={<SettingOutlined />}>
              CSV解析规则
            </Button>
          </Dropdown>
          <UploadFileButton modal={modal} onChange={onChangeFiles} />
        </div>
      </div>
      <div style={{ height: 'calc(100% - 48px)' }}>
        <FilesTable
          dataSource={dataSource}
          rowSelection={{ selectedRowKeys, onChange: (selectedRowKeys: any) => setSelectedRowKeys(selectedRowKeys) }}
          getList={getList}
          onDeleteData={onDeleteData}
          onToDirectory={onToDirectory}
        />
      </div>
    </div>
  );
};

export default FoldersAndFiles;
