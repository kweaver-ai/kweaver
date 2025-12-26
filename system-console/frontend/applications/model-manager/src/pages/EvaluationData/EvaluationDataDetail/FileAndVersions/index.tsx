import { useState, useMemo } from 'react';
import _ from 'lodash';
import { Menu, Dropdown, type MenuProps } from 'antd';
import { PlusOutlined, ExclamationCircleFilled, UnorderedListOutlined, EllipsisOutlined } from '@ant-design/icons';

import { Text, Button, Modal } from '@/common';
import FoldersAndFiles from './FoldersAndFiles';
import CreateVersionModal from './CreateVersionModal';
import VersioningModal from './VersioningModal';

const VERSION_LIST = [
  { version: 'v1.0', versions_id: '111', description: '描述 v1.0' },
  { version: 'v2.0', versions_id: '222', description: '描述 v2.0' },
  { version: 'v3.0', versions_id: '333', description: '描述 v3.0' },
];
type CVTypeType = 'create' | 'edit';
type CVType = { open: boolean; type: CVTypeType; sourceData: any };
type VMType = { open: boolean; sourceData: any };
const FileAndVersions = (props: any) => {
  const [modal, contextHolder] = Modal.useModal();
  const { versions = VERSION_LIST } = props;

  const [CVModalData, setCVModalData] = useState<CVType>({ open: false, type: 'create', sourceData: null }); // 创建和编辑弹窗数据
  const [VMModalData, setVMModalData] = useState<VMType>({ open: false, sourceData: null }); // 版本管理
  const [currentVersion, setCurrentVersion] = useState(versions[0]); // 当前版本
  const versionsKV = useMemo(() => _.keyBy(versions, 'versions_id'), [versions]);

  /** 删除版本 */
  const onDeleteVersion = (version: any) => {
    modal.confirm({
      title: '确认删除版本？',
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: `[${version.version}]版本一旦删除，版本及版本下文件将无法找回，请谨慎操作。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => console.log('确定'),
    });
  };

  const items: MenuProps['items'] = [
    ..._.map(versions, version => ({
      key: version.versions_id,
      label: (
        <div className='g-h-100 g-flex-space-between'>
          <Text>{version.version}</Text>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: '编辑' },
                { key: 'delete', label: '删除' },
              ],
              onClick: (e: any) => {
                e.domEvent.stopPropagation();
                if (e.key === 'delete') onDeleteVersion(version);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined />} style={{ width: 26, height: 26 }} onClick={event => event.stopPropagation()} />
          </Dropdown>
        </div>
      ),
    })),
    { type: 'divider', style: { margin: '0 6px', backgroundColor: 'rgba(0, 0, 0, .10)' } },
    { key: 'createVersions', label: '新建版本', icon: <PlusOutlined style={{ fontSize: 16, marginRight: -4 }} /> },
    { key: 'versioning', label: '版本管理', icon: <UnorderedListOutlined style={{ fontSize: 16, marginRight: -4 }} /> },
  ];

  /** 版本列表的点击事件 */
  const onClick = (data: any) => {
    if (data.key === 'createVersions') return onOpenCVModal('create');
    if (data.key === 'versioning') return onOpenVMModal(versions);
    setCurrentVersion(versionsKV[data.key]);
  };

  /** 创建和编辑弹窗相关操作 */
  const onOpenCVModal = (type: CVTypeType, sourceData = null) => setCVModalData({ open: true, type, sourceData });
  const onCloseCVModal = () => setCVModalData({ open: false, type: 'create', sourceData: null });
  const onOkCVModal = async (type: string, values: any) => {
    console.log('onOk', type, values);
  };

  /** 版本管理弹窗相关操作 */
  const onOpenVMModal = (sourceData: any) => setVMModalData({ open: true, sourceData });
  const onCloseVMModal = () => setVMModalData({ open: false, sourceData: null });
  const onOkVMModal = async (values: any) => {
    console.log('onOk', values);
  };

  return (
    <div className='g-w-100 g-h-100 g-flex-center'>
      {contextHolder}
      <div className='g-border-r' style={{ width: 168, height: '100%' }}>
        <Menu items={items} mode='vertical' selectedKeys={[currentVersion.versions_id]} onClick={onClick} />
      </div>
      <div style={{ width: '100%', height: '100%', flex: 1, padding: '0 24px' }}>
        <FoldersAndFiles modal={modal} currentVersion={currentVersion} />
      </div>
      <CreateVersionModal type='create' open={CVModalData.open} sourceData={CVModalData.sourceData} onOk={onOkCVModal} onCancel={onCloseCVModal} />
      <VersioningModal open={VMModalData.open} sourceData={VMModalData.sourceData} onOk={onOkVMModal} onCancel={onCloseVMModal} />
    </div>
  );
};

export default FileAndVersions;
