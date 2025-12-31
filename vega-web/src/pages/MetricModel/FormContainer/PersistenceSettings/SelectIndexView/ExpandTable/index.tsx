/** 折叠表格 */
import { ReactNode, useState } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import _ from 'lodash';
import { IconFont } from '@/web-library/common';

interface ExpandDataItem {
  name?: string;
  content: string | ReactNode;
  width?: string;
  ellipsis?: boolean;
}

export type ExpandData = ExpandDataItem[];

const ARExpandTable = (props: any) => {
  const { rowKey, columns, dataSource, pagination, expandData, selectedRowKeys, noSelection = false, onSelectChange, onChange } = props;
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isExpandAll, setIsExpandAll] = useState(false);

  /** 展开的行变化时触发 */
  const onExpandedRowsChange = (expandedRows: any): void => {
    setExpandedRowKeys(expandedRows);
  };

  /** 全部展开 */
  const handleExpandAll = (): void => {
    setExpandedRowKeys(_.map(dataSource, (i: any) => i[rowKey]));
    setIsExpandAll(true);
  };
  /** 全部收起 */
  const handleCollapseAll = (): void => {
    setExpandedRowKeys([]);
    setIsExpandAll(false);
  };

  const expandedRowRender = (record: any): ReactNode => {
    const data = expandData(record);
    return (
      <div className="g-p-2">
        {_.map(data, (item: any, index: any) => {
          const { name, content } = item;
          return (
            <div key={index} className="g-p-1 g-ellipsis-1" style={{ flexBasis: '100%' }} title={content}>
              {!!name && <span>{name}：</span>}
              <span>{content || '--'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Table
      size="small"
      rowKey={rowKey}
      bordered={false}
      columns={[Table.SELECTION_COLUMN, Table.EXPAND_COLUMN, ...columns]}
      dataSource={dataSource}
      pagination={pagination}
      rowSelection={noSelection ? undefined : { type: 'radio', selectedRowKeys, onSelect: onSelectChange }}
      expandable={{
        expandRowByClick: true,
        expandedRowKeys,
        expandedRowRender,
        onExpandedRowsChange,
        columnTitle: (
          <IconFont
            className="g-ml-2"
            type={isExpandAll ? 'icon-caidanzhankaibeifen' : 'icon-caidanzhankai'}
            onClick={isExpandAll ? handleCollapseAll : handleExpandAll}
          />
        ),
        expandIcon: (props) => (
          <CaretRightOutlined
            style={{ color: 'rgba(0, 0, 0, .45)', transform: props.expanded ? 'rotate(90deg)' : 'rotate(0)' }}
            onClick={(e) => props.onExpand(props.record, e)}
          />
        ),
      }}
      onChange={onChange}
    />
  );
};

export default ARExpandTable;
