import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse, Descriptions, Drawer, Table } from 'antd';
import api from '@/services/customDataView/index';

const DataViewDetail: React.FC<{
  id: string;
  onClose: () => void;
  open: boolean;
}> = ({ id, onClose, open }) => {
  const { Panel } = Collapse;
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [baseInfoItems, setBaseInfoItems] = useState<any[]>([]);

  const getDetail = async () => {
    const res = await api.getCustomDataViewDetails([id]);
    const views = res?.[0] || {};
    setDataSource(views?.fields || []);
    setTitle(views?.name || '');
    setBaseInfoItems([
      {
        key: '1',
        label: intl.get('Global.name'),
        children: views?.name || '',
      },
      {
        key: '2',
        label: intl.get('Global.id'),
        children: views?.id || '',
      },
      {
        key: '3',
        label: intl.get('Global.group'),
        children: views?.group_name || '',
      },
      {
        key: '4',
        label: intl.get('Global.tag'),
        children: views?.tags?.join(',') || '',
      },
      {
        key: '5',
        label: intl.get('Global.comment'),
        children: views?.comment || '',
      },
    ]);
  };

  useEffect(() => {
    if (open) {
      getDetail();
    } else {
      setDataSource([]);
    }
  }, [open]);

  const columns = [
    {
      title: intl.get('Global.fieldName'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: intl.get('Global.fieldDisplayName'),
      dataIndex: 'display_name',
      key: 'display_name',
      ellipsis: true,
    },
    {
      title: intl.get('Global.fieldType'),
      dataIndex: 'type',
      key: 'type',
      ellipsis: true,
    },
  ];

  return (
    <Drawer size="large" title={title} width={1000} onClose={onClose} open={open}>
      <Collapse bordered={false} defaultActiveKey={['1', '2']} expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
        <Panel header={intl.get('Global.basicInfo')} key="1" style={{ background: '#fff' }}>
          <Descriptions labelStyle={{ width: '120px' }} contentStyle={{ width: '300px' }} items={baseInfoItems} />
        </Panel>
        <Panel header={intl.get('Global.fieldInfo')} key="2" style={{ background: '#fff' }}>
          <Table size="small" dataSource={dataSource} columns={columns} />
        </Panel>
      </Collapse>
    </Drawer>
  );
};

export default DataViewDetail;
