import { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Input, Table } from 'antd';
import { arNotification } from '@/components/ARNotification';
import { REQUIRED_META_FIELDS } from '@/hooks/useConstants';
import HOOKS from '@/hooks';
import FormHeader from '../FormHeader';
import styles from './index.module.less';
import { useDataViewContext } from '../../../context';
import EmptyForm from '../EmptyForm';

const OutputDataView = () => {
  const { dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView } = useDataViewContext();
  const [editingKey, setEditingKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [outputFields, setOutputFields] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const mainBoxRef = useRef<HTMLDivElement>(null);
  const mainBoxSize = HOOKS.useSize(mainBoxRef);
  const tableScrollY = mainBoxSize?.height ? mainBoxSize.height - 160 : 500;

  const filteredDataSource = useMemo(() => {
    if (!searchKeyword) return outputFields;

    const keyword = searchKeyword.toLowerCase();
    return outputFields.filter((item) => item.display_name?.toLowerCase().includes(keyword) || item.name?.toLowerCase().includes(keyword));
  }, [outputFields, searchKeyword]);

  const { updateDataViewNode } = HOOKS.useDataView({
    dataViewTotalInfo,
    setDataViewTotalInfo,
    setSelectedDataView,
  });

  useEffect(() => {
    // 前序节点
    if (selectedDataView?.input_nodes?.length > 0) {
      const nodeList = dataViewTotalInfo?.data_scope || [];
      const outputFields = selectedDataView?.output_fields || [];
      const preNodes = nodeList?.find((item: any) => selectedDataView?.input_nodes?.includes(item.id)) || {};
      setOutputFields([
        ...(outputFields || []).map((item: any) => ({
          ...item,
          selected: true,
        })),
        ...(preNodes?.output_fields || [])
          .filter((item: any) => !outputFields.some((field: any) => field.original_name === item.original_name))
          .map((item: any) => ({
            ...item,
            selected: REQUIRED_META_FIELDS.includes(item.name),
          })),
      ]);
    } else {
      setOutputFields([]);
    }
  }, [selectedDataView, dataViewTotalInfo]);

  const handleInputSave = (record: any, field: string) => {
    if (!editValue) {
      setEditingKey('');
      return;
    }
    // 字段名重复校验
    if (selectedDataView?.output_fields?.some((item: any) => item.original_name !== record.original_name && item[field] === editValue)) {
      arNotification.error(intl.get('Global.fieldNameCannotRepeat'));
      setEditingKey('');
      return;
    }
    record[field] = editValue;
    setOutputFields(outputFields.map((item: any) => (item.original_name === record.original_name ? record : item)) || []);
    setEditingKey('');
  };

  const handleSubmit = () => {
    const selectedFields = outputFields.filter((item: any) => item.selected);

    if (!selectedFields?.length) {
      arNotification.error(intl.get('Global.pleaseSelectAtLeastOneField'));
      return;
    }
    const newNodeData = {
      ...selectedDataView,
      output_fields: selectedFields,
      node_status: 'success',
    };
    setLoading(true);
    updateDataViewNode(newNodeData, selectedDataView.id).finally(() => {
      setLoading(false);
    });
  };

  const columns = [
    {
      title: intl.get('Global.fieldBusinessName'),
      dataIndex: 'display_name',
      key: 'display_name',
      width: 200,
      ellipsis: true,
      render: (_: any, record: any) => {
        if (editingKey === record.original_name + 'display_name') {
          return (
            <Input
              defaultValue={record.display_name}
              onBlur={() => {
                handleInputSave(record, 'display_name');
              }}
              autoFocus
              onChange={(value) => {
                setEditValue(value.target.value);
              }}
            />
          );
        }
        return <span onClick={() => setEditingKey(record.original_name + 'display_name')}>{record.display_name}</span>;
      },
    },
    {
      title: intl.get('Global.fieldTechnicalName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (_: any, record: any) => {
        if (editingKey === record.original_name + 'name') {
          return (
            <Input
              defaultValue={record.name}
              onBlur={() => {
                handleInputSave(record, 'name');
              }}
              autoFocus
              onChange={(value) => {
                setEditValue(value.target.value);
              }}
            />
          );
        }
        return <span onClick={() => setEditingKey(record.original_name + 'name')}>{record.name}</span>;
      },
    },
    {
      title: intl.get('Global.fieldType'),
      dataIndex: 'type',
      key: 'type',
      width: 200,
    },
  ];

  const rowSelection: any = {
    selectedRowKeys: outputFields?.filter((item: any) => item.selected).map((item: any) => item.original_name),
    getCheckboxProps: (record: any) => ({
      disabled: REQUIRED_META_FIELDS.includes(record.name),
    }),
    onChange: (selectedRowKeys: React.Key[]) => {
      setOutputFields(
        outputFields?.map((item: any) => ({
          ...item,
          selected: selectedRowKeys.includes(item.original_name),
        })) || []
      );
    },
  };

  return (
    <div className={styles.mainBox} ref={mainBoxRef}>
      <FormHeader
        title={intl.get('CustomDataView.GraphBox.outputView')}
        icon="icon-dip-color-shuchushitu"
        showSubmitButton={outputFields?.length > 0}
        onSubmit={handleSubmit}
        onCancel={() => setSelectedDataView(null)}
        loading={loading}
      />
      <div className={styles.contentBox}>
        <div className={styles.headerBox}>
          <div className={styles.titleBox}>
            <span>{intl.get('CustomDataView.FieldJoin.fieldList')}</span>
          </div>
          <Input.Search
            style={{ width: '272px' }}
            placeholder={intl.get('Global.searchFieldPlaceholder')}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={setSearchKeyword}
            allowClear
          />
        </div>
        {outputFields?.length ? (
          <Table
            rowKey={(record) => `${record.original_name}`}
            rowSelection={rowSelection}
            dataSource={filteredDataSource || []}
            columns={columns}
            pagination={false}
            scroll={{ y: tableScrollY }}
          />
        ) : (
          <EmptyForm />
        )}
      </div>
    </div>
  );
};

export default OutputDataView;
