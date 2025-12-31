import { useMemo, useRef } from 'react';
import intl from 'react-intl-universal';
import { Table, Empty } from 'antd';
import HOOKS from '@/hooks';
import FormHeader from '../FormHeader';
import styles from './index.module.less';
import { useDataViewContext } from '../../../context';

// 定义类型接口
interface ColumnField {
  name: string;
  display_name: string;
  data_type?: string;
  width?: number;
}

interface DataItem {
  id: string | number;
  [key: string]: any;
}

const FieldPreview = () => {
  const { previewNode, setPreviewNode } = useDataViewContext();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerSize = HOOKS.useSize(tableContainerRef);
  const tableScrollY = tableContainerSize?.height ? tableContainerSize.height - 110 : 500;

  const columns = useMemo(() => {
    if (!previewNode?.columns || !Array.isArray(previewNode.columns)) {
      return [];
    }

    return previewNode.columns.map((field: ColumnField) => ({
      title: field.display_name || field.name,
      dataIndex: field.name,
      key: field.name,
      ellipsis: true,
      width: 200,
      render: (text: any) => {
        // 不是字符串类型的，都用 JSON.stringify 处理
        if (typeof text !== 'string') {
          text = JSON.stringify(text);
        }
        return text;
      },
    }));
  }, [previewNode?.columns]);

  // 优化 dataSource 的 useMemo，添加类型检查
  const dataSource = useMemo(() => {
    if (!previewNode?.dataSource || !Array.isArray(previewNode.dataSource)) {
      return [];
    }

    return previewNode.dataSource.map((item: DataItem) => ({
      key: item.display_name,
      ...item,
    }));
  }, [previewNode?.dataSource]);

  // 处理取消操作
  const handleCancel = () => {
    setPreviewNode({});
  };

  return (
    <div className={styles.fieldPreview}>
      <FormHeader
        title={`${intl.get('CustomDataView.FieldPreview.title')}(${previewNode?.title || ''})`}
        showSubmitButton={false}
        onCancel={handleCancel}
        cancelText={intl.get('Global.close')}
      />
      <div className={styles.tableContainer} ref={tableContainerRef}>
        {columns.length > 0 ? (
          <Table columns={columns} dataSource={dataSource} scroll={{ y: tableScrollY }} bordered size="small" />
        ) : (
          <Empty description={intl.get('Global.noDataToPreview')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default FieldPreview;
