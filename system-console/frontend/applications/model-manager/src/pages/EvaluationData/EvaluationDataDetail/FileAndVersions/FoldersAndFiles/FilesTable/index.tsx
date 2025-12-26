import dayjs from 'dayjs';

import UTILS from '@/utils';
import ENUMS from '@/enums';
import { IconFont, Button, Table } from '@/common';

const FILE_ICON: any = {
  json: 'icon-dip-color-json',
  jsonl: 'icon-dip-color-json',
  csv: 'icon-dip-color-csv',
  txt: 'icon-dip-color-txt',
  parquet: 'icon-dip-color-parquet',
};

const FilesTable = (props: any) => {
  const { dataSource, rowSelection, getList, onDeleteData, onToDirectory } = props;

  /** 表格-排序 */
  const onChange = (_pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { rule: field || 'create_time', order: stateOrder };
    getList(state);
  };

  const columns: any = [
    {
      title: '名称',
      dataIndex: 'name',
      sorter: true,
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => {
        const dirIcon = 'icon-dip-color-folder';
        const fileIcon = FILE_ICON[value.split('.').pop() as string] || 'icon-dip-color-folder';
        return (
          <div className='g-pointer g-flex-align-center' onClick={() => onToDirectory(record)}>
            <IconFont type={record.type === 1 ? dirIcon : fileIcon} style={{ fontSize: 20, marginTop: 2, marginRight: 8 }} />
            <span>{value}</span>
          </div>
        );
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      sorter: true,
      width: 120,
      __selected: true,
      render: (value: number) => UTILS.formatFileSize(value) || '--',
    },
    {
      title: '上传者',
      dataIndex: 'create_user',
      __selected: true,
    },
    {
      title: '上传时间',
      dataIndex: 'create_time',
      sorter: true,
      __selected: true,
      render: (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm:ss') : '--'),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => {
        return (
          <div>
            <Button.Link className='g-mr-2'>下载</Button.Link>
            <Button.Link onClick={() => onDeleteData([record])}>删除</Button.Link>
          </div>
        );
      },
    },
  ];

  return (
    <Table.PageTable
      name='evaluation-data-detail-version'
      rowKey='doc_id'
      columns={columns}
      pagination={false}
      dataSource={dataSource}
      rowSelection={rowSelection}
      onChange={onChange}
    />
  );
};

export default FilesTable;
